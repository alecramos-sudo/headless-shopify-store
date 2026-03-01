"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  createCart as apiCreateCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  getCart as apiGetCart,
} from "@/lib/shopify/cart";
import type { Cart } from "@/lib/shopify/types";

const CART_COOKIE_NAME = "shopify_cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

type CartContextType = {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function getCartIdFromCookie(): string | null {
  const match = document.cookie.match(new RegExp(`${CART_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

function setCartIdCookie(cartId: string) {
  document.cookie = `${CART_COOKIE_NAME}=${cartId};path=/;max-age=${CART_COOKIE_MAX_AGE};SameSite=Lax`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const cartId = getCartIdFromCookie();
    if (cartId) {
      apiGetCart(cartId)
        .then(setCart)
        .catch(() => {
          document.cookie = `${CART_COOKIE_NAME}=;path=/;max-age=0`;
        });
    }
  }, []);

  const addToCart = useCallback(async (variantId: string, quantity = 1) => {
    setIsLoading(true);
    try {
      let updatedCart: Cart;
      if (cart?.id) {
        updatedCart = await apiAddToCart(cart.id, variantId, quantity);
      } else {
        updatedCart = await apiCreateCart(variantId, quantity);
        setCartIdCookie(updatedCart.id);
      }
      setCart(updatedCart);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [cart?.id]);

  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    if (!cart?.id) return;
    setIsLoading(true);
    try {
      if (quantity <= 0) {
        const updatedCart = await apiRemoveFromCart(cart.id, [lineId]);
        setCart(updatedCart);
      } else {
        const updatedCart = await apiUpdateCartItem(cart.id, lineId, quantity);
        setCart(updatedCart);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cart?.id]);

  const removeItem = useCallback(async (lineId: string) => {
    if (!cart?.id) return;
    setIsLoading(true);
    try {
      const updatedCart = await apiRemoveFromCart(cart.id, [lineId]);
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  }, [cart?.id]);

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
