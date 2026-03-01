"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { Product } from "@/lib/shopify/types";

export function StickyBuyBar({ product }: { product: Product }) {
  const { addToCart, isLoading } = useCart();
  const [isVisible, setIsVisible] = useState(false);

  const firstVariant = product.variants.edges[0]?.node;

  useEffect(() => {
    function onScroll() {
      setIsVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!firstVariant) return null;

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: firstVariant.price.currencyCode,
  }).format(parseFloat(firstVariant.price.amount));

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brand-muted/20 shadow-lg transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{product.title}</p>
          <p className="text-brand-accent text-sm">{price}</p>
        </div>
        <button
          onClick={() => addToCart(firstVariant.id)}
          disabled={isLoading}
          className="bg-brand-slate text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-slate/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
