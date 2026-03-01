import Link from "next/link";
import Image from "next/image";
import { shopifyFetch } from "@/lib/shopify/client";
import { PRODUCTS_QUERY } from "@/lib/shopify/queries";
import { ScrollVideo } from "@/components/scroll-video";
import { ScrollReveal } from "@/components/scroll-reveal";
import type { Product } from "@/lib/shopify/types";

type ProductsResponse = {
  products: {
    edges: Array<{ node: Product }>;
  };
};

export default async function Home() {
  const data = await shopifyFetch<ProductsResponse>({
    query: PRODUCTS_QUERY,
    variables: { first: 10 },
  });

  const products = data.products.edges.map(({ node }) => node);

  return (
    <main>
      {/* Hero — scroll-controlled video */}
      <ScrollVideo src="/videos/hero.mp4" />

      {/* Tagline section */}
      <ScrollReveal>
        <section className="py-24 px-6 text-center max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl mb-6">
            Science-backed skincare
          </h1>
          <p className="text-lg text-brand-muted leading-relaxed">
            Barrier repair and deep hydration, formulated with precision.
          </p>
        </section>
      </ScrollReveal>

      {/* Product grid */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product) => (
            <ScrollReveal key={product.id}>
              <Link
                href={`/products/${product.handle}`}
                className="group block"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-ice mb-4">
                  {product.featuredImage && (
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                </div>
                <h3 className="font-display text-xl mb-1">{product.title}</h3>
                <p className="text-brand-muted">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: product.priceRange.minVariantPrice.currencyCode,
                  }).format(parseFloat(product.priceRange.minVariantPrice.amount))}
                </p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </main>
  );
}
