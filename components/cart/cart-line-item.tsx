"use client";

import Image from "next/image";
import { useCart } from "./cart-provider";
import type { CartLineItem as CartLineItemType } from "@/lib/shopify/types";

export function CartLineItem({ item }: { item: CartLineItemType }) {
  const { updateQuantity, removeItem } = useCart();
  const image = item.merchandise.image || item.merchandise.product.featuredImage;

  return (
    <div className="flex gap-4 py-4 border-b border-brand-muted/20">
      {image && (
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-brand-ice">
          <Image
            src={image.url}
            alt={image.altText || item.merchandise.product.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.merchandise.product.title}</p>
        {item.merchandise.title !== "Default Title" && (
          <p className="text-xs text-brand-muted">{item.merchandise.title}</p>
        )}
        <p className="text-sm mt-1">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: item.merchandise.price.currencyCode,
          }).format(parseFloat(item.merchandise.price.amount))}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-7 h-7 flex items-center justify-center border border-brand-muted/30 rounded text-sm hover:bg-brand-ice transition-colors"
          >
            -
          </button>
          <span className="text-sm w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-7 h-7 flex items-center justify-center border border-brand-muted/30 rounded text-sm hover:bg-brand-ice transition-colors"
          >
            +
          </button>
          <button
            onClick={() => removeItem(item.id)}
            className="ml-auto text-xs text-brand-muted hover:text-brand-slate transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
