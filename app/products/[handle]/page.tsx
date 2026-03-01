import { notFound } from "next/navigation";
import { shopifyFetch } from "@/lib/shopify/client";
import { PRODUCT_BY_HANDLE_QUERY } from "@/lib/shopify/queries";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
import { StickyBuyBar } from "@/components/product/sticky-buy-bar";
import type { Product } from "@/lib/shopify/types";
import type { Metadata } from "next";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const data = await shopifyFetch<{ productByHandle: Product | null }>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
  });

  if (!data.productByHandle) return { title: "Product Not Found" };

  return {
    title: data.productByHandle.title,
    description: data.productByHandle.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const data = await shopifyFetch<{ productByHandle: Product | null }>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
  });

  const product = data.productByHandle;
  if (!product) notFound();

  const images = product.images.edges.map(({ node }) => node);

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <ProductGallery images={images} />
        <ProductInfo product={product} />
      </div>

      <StickyBuyBar product={product} />
    </main>
  );
}
