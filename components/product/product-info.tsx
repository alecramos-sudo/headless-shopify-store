"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { Product } from "@/lib/shopify/types";

export function ProductInfo({ product }: { product: Product }) {
  const { addToCart, isLoading } = useCart();
  const [quantity, setQuantity] = useState(1);

  const firstVariant = product.variants.edges[0]?.node;
  if (!firstVariant) return null;

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: firstVariant.price.currencyCode,
  }).format(parseFloat(firstVariant.price.amount));

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl mb-2">{product.title}</h1>
      <p className="text-2xl text-brand-accent mb-6">{price}</p>

      <p className="text-brand-muted mb-8 leading-relaxed">{product.description}</p>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-brand-muted">Quantity</span>
        <div className="flex items-center border border-brand-muted/30 rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 text-sm hover:bg-brand-ice transition-colors"
          >
            -
          </button>
          <span className="px-3 py-2 text-sm min-w-[2rem] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2 text-sm hover:bg-brand-ice transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={() => addToCart(firstVariant.id, quantity)}
        disabled={isLoading || !firstVariant.availableForSale}
        className="w-full bg-brand-slate text-white py-4 rounded-lg font-medium hover:bg-brand-slate/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Adding..." : !firstVariant.availableForSale ? "Sold Out" : "Add to Cart"}
      </button>

      <p className="text-xs text-brand-muted text-center mt-3">
        Free worldwide shipping · 30-day money-back guarantee
      </p>
    </div>
  );
}
