"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";

export function Header() {
  const { cart, openCart } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-brand-cream/80 backdrop-blur-md border-b border-brand-muted/10">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl">
          Headless Store
        </Link>

        <div className="flex items-center gap-8">
          <Link href="/about" className="text-sm hover:text-brand-accent transition-colors">
            About
          </Link>
          <Link href="/products/the-mantle" className="text-sm hover:text-brand-accent transition-colors">
            Shop
          </Link>
          <button
            onClick={openCart}
            className="relative text-sm hover:text-brand-accent transition-colors"
          >
            Cart
            {cart && cart.totalQuantity > 0 && (
              <span className="absolute -top-2 -right-4 bg-brand-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.totalQuantity}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
