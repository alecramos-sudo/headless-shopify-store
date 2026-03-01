"use client";

import { useEffect } from "react";
import { useCart } from "./cart-provider";
import { CartLineItem } from "./cart-line-item";

export function CartDrawer() {
  const { cart, isOpen, closeCart } = useCart();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const totalAmount = cart?.cost.totalAmount
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: cart.cost.totalAmount.currencyCode,
      }).format(parseFloat(cart.cost.totalAmount.amount))
    : "$0.00";

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/20">
            <h2 className="font-display text-lg">
              Your Cart ({cart?.totalQuantity || 0})
            </h2>
            <button
              onClick={closeCart}
              className="text-brand-muted hover:text-brand-slate transition-colors text-2xl leading-none"
              aria-label="Close cart"
            >
              &times;
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6">
            {!cart || cart.lines.edges.length === 0 ? (
              <p className="text-brand-muted text-center mt-12">Your cart is empty</p>
            ) : (
              cart.lines.edges.map(({ node }) => (
                <CartLineItem key={node.id} item={node} />
              ))
            )}
          </div>

          {/* Footer */}
          {cart && cart.lines.edges.length > 0 && (
            <div className="border-t border-brand-muted/20 px-6 py-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-brand-muted">Subtotal</span>
                <span className="font-medium">{totalAmount}</span>
              </div>
              <p className="text-xs text-brand-muted mb-4">Free worldwide shipping</p>
              <a
                href={cart.checkoutUrl}
                className="block w-full text-center bg-brand-slate text-white py-3 rounded-lg font-medium hover:bg-brand-slate/90 transition-colors"
              >
                Checkout
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
