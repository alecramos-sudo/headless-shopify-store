import { shopifyFetch } from "./client";
import {
  CREATE_CART_MUTATION,
  ADD_TO_CART_MUTATION,
  UPDATE_CART_MUTATION,
  REMOVE_FROM_CART_MUTATION,
} from "./mutations";
import { CART_QUERY } from "./queries";
import type { Cart } from "./types";

type CartResponse<K extends string> = Record<K, { cart: Cart; userErrors: Array<{ field: string; message: string }> }>;

export async function createCart(variantId: string, quantity: number): Promise<Cart> {
  const data = await shopifyFetch<CartResponse<"cartCreate">>({
    query: CREATE_CART_MUTATION,
    variables: {
      input: {
        lines: [{ merchandiseId: variantId, quantity }],
      },
    },
  });
  return data.cartCreate.cart;
}

export async function addToCart(cartId: string, variantId: string, quantity: number): Promise<Cart> {
  const data = await shopifyFetch<CartResponse<"cartLinesAdd">>({
    query: ADD_TO_CART_MUTATION,
    variables: {
      cartId,
      lines: [{ merchandiseId: variantId, quantity }],
    },
  });
  return data.cartLinesAdd.cart;
}

export async function updateCartItem(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  const data = await shopifyFetch<CartResponse<"cartLinesUpdate">>({
    query: UPDATE_CART_MUTATION,
    variables: {
      cartId,
      lines: [{ id: lineId, quantity }],
    },
  });
  return data.cartLinesUpdate.cart;
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await shopifyFetch<CartResponse<"cartLinesRemove">>({
    query: REMOVE_FROM_CART_MUTATION,
    variables: { cartId, lineIds },
  });
  return data.cartLinesRemove.cart;
}

export async function getCart(cartId: string): Promise<Cart> {
  const data = await shopifyFetch<{ cart: Cart }>({
    query: CART_QUERY,
    variables: { cartId },
  });
  return data.cart;
}
