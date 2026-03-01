# Headless Shopify Store — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a headless Shopify store replicating moumoujus.com's pattern — Next.js frontend consuming Shopify's Storefront API, with scroll-controlled video, custom cart drawer, and Vercel deployment.

**Architecture:** Next.js 15 App Router with React Server Components fetches product data from Shopify's Storefront API via GraphQL. Cart state is managed client-side in React Context, persisted via cookies, and synced with Shopify's cart API. Checkout hands off to Shopify's hosted checkout. A scroll-controlled video component maps scroll position to video playback for the hero section.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Shopify Storefront API (GraphQL), Vercel

**Security note:** `dangerouslySetInnerHTML` is used in two places — product descriptions (from Shopify's Storefront API, which is trusted first-party content) and hardcoded policy strings. For production with user-generated content, add DOMPurify sanitization.

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: entire project via `create-next-app`
- Modify: `tailwind.config.ts` (custom theme)
- Modify: `app/layout.tsx` (fonts, metadata)
- Create: `.env.local`

**Step 1: Create the Next.js app**

```bash
cd ~/Projects
npx create-next-app@latest headless-shopify-store \
  --typescript --tailwind --eslint --app --src=false \
  --import-alias "@/*" --turbopack
```

If the directory already exists (from the design doc), delete `node_modules`/`package.json` if present, or run inside the existing dir. The scaffold will create `app/`, `public/`, `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`.

**Step 2: Verify the scaffold runs**

```bash
cd ~/Projects/headless-shopify-store
npm run dev
```

Expected: Dev server starts on `http://localhost:3000`, shows Next.js welcome page.

**Step 3: Set up environment variables**

Create `.env.local`:

```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_API_TOKEN=your-storefront-access-token
```

These will be populated in Task 2 after Shopify dev store setup.

**Step 4: Add `.env.local` to `.gitignore`**

Verify `.gitignore` already includes `.env*.local` (create-next-app should add this). If not, add it.

**Step 5: Configure Tailwind custom theme**

Edit `tailwind.config.ts` to add the brand design tokens:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: "#FAF7F2",
          ice: "#E8F0F4",
          slate: "#2D3436",
          accent: "#6F9BB0",
          muted: "#8B9DA7",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

Note: Using Playfair Display as a free alternative to Cedrat Display.

**Step 6: Set up fonts in root layout**

Edit `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Headless Store",
  description: "A headless Shopify store built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfairDisplay.variable}`}>
      <body className="font-body bg-brand-cream text-brand-slate antialiased">
        {children}
      </body>
    </html>
  );
}
```

**Step 7: Clean up default page**

Replace `app/page.tsx` with a minimal placeholder:

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="font-display text-4xl">Headless Store</h1>
    </main>
  );
}
```

**Step 8: Verify fonts and theme work**

```bash
npm run dev
```

Expected: Page shows "Headless Store" in Playfair Display font, cream background.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind theme and custom fonts"
```

---

## Task 2: Shopify Dev Store Setup

**Prerequisite:** Shopify Partners account access.

**Files:**
- Modify: `.env.local` (add real credentials)

**Step 1: Create a development store**

Go to partners.shopify.com → Stores → Add store → Development store.
- Store name: `headless-learning-store` (or similar)
- Purpose: "Build a custom storefront"

Alternatively, if Shopify MCP is configured in Claude Code, use it:
```
"Create a new development store called headless-learning-store"
```

**Step 2: Add dummy products**

In the Shopify admin (or via Shopify MCP), create 2 products:

**Product 1: "The Mantle"**
- Price: $48.00
- Description: "A premium moisturizer for barrier repair and deep hydration."
- Add 2-3 product images (use placeholder images from unsplash or similar)
- Status: Active

**Product 2: "The Mantle Mini"**
- Price: $24.00
- Description: "Travel-size version of our signature moisturizer."
- Add 1-2 product images
- Status: Active

**Step 3: Create a Storefront API access token**

In Shopify admin: Settings → Apps and sales channels → Develop apps → Create an app.
- App name: "Headless Frontend"
- Configure Storefront API scopes:
  - `unauthenticated_read_product_listings`
  - `unauthenticated_read_product_inventory`
  - `unauthenticated_write_checkouts`
  - `unauthenticated_read_checkouts`
- Install the app and copy the Storefront API access token.

**Step 4: Update `.env.local`**

```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=headless-learning-store.myshopify.com
SHOPIFY_STOREFRONT_API_TOKEN=<paste-token-here>
```

**Step 5: Verify credentials**

Quick test from terminal:

```bash
curl -X POST \
  "https://headless-learning-store.myshopify.com/api/2025-01/graphql.json" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Storefront-Access-Token: <your-token>" \
  -d '{"query": "{ shop { name } }"}'
```

Expected: JSON response with `{ "data": { "shop": { "name": "headless-learning-store" } } }`

**Step 6: Commit (no secrets)**

`.env.local` is gitignored. Nothing to commit here unless you added a `.env.example`:

```bash
echo "NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=\nSHOPIFY_STOREFRONT_API_TOKEN=" > .env.example
git add .env.example
git commit -m "chore: add .env.example for Shopify credentials"
```

---

## Task 3: Shopify GraphQL Client

**Files:**
- Create: `lib/shopify/client.ts`
- Create: `lib/shopify/types.ts`
- Create: `lib/shopify/queries.ts`
- Create: `lib/shopify/mutations.ts`

**Step 1: Create the GraphQL client**

Create `lib/shopify/client.ts`:

```ts
const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const token = process.env.SHOPIFY_STOREFRONT_API_TOKEN!;
const apiVersion = "2025-01";

export async function shopifyFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const response = await fetch(
    `https://${domain}/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("\n"));
  }

  return json.data as T;
}
```

**Step 2: Define TypeScript types**

Create `lib/shopify/types.ts`:

```ts
export type Money = {
  amount: string;
  currencyCode: string;
};

export type Image = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  image: Image | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  featuredImage: Image | null;
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  variants: {
    edges: Array<{ node: ProductVariant }>;
  };
  images: {
    edges: Array<{ node: Image }>;
  };
};

export type CartLineItem = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
      handle: string;
      featuredImage: Image | null;
    };
    price: Money;
    image: Image | null;
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: Money;
    subtotalAmount: Money;
  };
  lines: {
    edges: Array<{ node: CartLineItem }>;
  };
};
```

**Step 3: Write product queries**

Create `lib/shopify/queries.ts`:

```ts
export const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      featuredImage {
        url
        altText
        width
        height
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
    }
  }
`;

export const CART_QUERY = `
  query Cart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      totalQuantity
      cost {
        totalAmount {
          amount
          currencyCode
        }
        subtotalAmount {
          amount
          currencyCode
        }
      }
      lines(first: 50) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                product {
                  title
                  handle
                  featuredImage {
                    url
                    altText
                    width
                    height
                  }
                }
                price {
                  amount
                  currencyCode
                }
                image {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      }
    }
  }
`;
```

**Step 4: Write cart mutations**

Create `lib/shopify/mutations.ts`:

```ts
const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      totalAmount {
        amount
        currencyCode
      }
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              product {
                title
                handle
                featuredImage {
                  url
                  altText
                  width
                  height
                }
              }
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`;

export const CREATE_CART_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const ADD_TO_CART_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const UPDATE_CART_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const REMOVE_FROM_CART_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;
```

**Step 5: Verify the client works**

Create a quick test in `app/page.tsx`:

```tsx
import { shopifyFetch } from "@/lib/shopify/client";
import { PRODUCTS_QUERY } from "@/lib/shopify/queries";

export default async function Home() {
  const data = await shopifyFetch<{ products: { edges: Array<{ node: { title: string } }> } }>({
    query: PRODUCTS_QUERY,
    variables: { first: 10 },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-display text-4xl">Products</h1>
      {data.products.edges.map(({ node }) => (
        <p key={node.title}>{node.title}</p>
      ))}
    </main>
  );
}
```

Run: `npm run dev` — Expected: Page lists "The Mantle" and "The Mantle Mini".

**Step 6: Commit**

```bash
git add lib/shopify/
git commit -m "feat: add Shopify Storefront API GraphQL client, queries, and mutations"
```

---

## Task 4: Cart Provider & Cart Drawer

**Files:**
- Create: `components/cart/cart-provider.tsx`
- Create: `components/cart/cart-drawer.tsx`
- Create: `components/cart/cart-line-item.tsx`
- Create: `lib/shopify/cart.ts` (cart action helpers)
- Modify: `app/layout.tsx` (wrap with CartProvider)

**Step 1: Create cart action helpers**

Create `lib/shopify/cart.ts`:

```ts
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
```

**Step 2: Create CartProvider**

Create `components/cart/cart-provider.tsx`:

```tsx
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
```

**Step 3: Create CartLineItem**

Create `components/cart/cart-line-item.tsx`:

```tsx
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
```

**Step 4: Create CartDrawer**

Create `components/cart/cart-drawer.tsx`:

```tsx
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
```

**Step 5: Wire CartProvider into root layout**

Modify `app/layout.tsx` — wrap `{children}` with `CartProvider` and add `CartDrawer`:

```tsx
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";

// ... in the return:
<body className="font-body bg-brand-cream text-brand-slate antialiased">
  <CartProvider>
    {children}
    <CartDrawer />
  </CartProvider>
</body>
```

**Step 6: Verify cart drawer opens/closes**

Run `npm run dev`. The cart drawer won't have items yet, but you can temporarily add a button to test `openCart()`.

**Step 7: Commit**

```bash
git add components/cart/ lib/shopify/cart.ts app/layout.tsx
git commit -m "feat: add cart provider, cart drawer, and Shopify cart API integration"
```

---

## Task 5: Header & Footer Components

**Files:**
- Create: `components/header.tsx`
- Create: `components/footer.tsx`
- Modify: `app/layout.tsx` (add header/footer)

**Step 1: Create Header**

Create `components/header.tsx`:

```tsx
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
```

**Step 2: Create Footer**

Create `components/footer.tsx`:

```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-brand-slate text-white/70 py-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h3 className="font-display text-white text-lg mb-4">Headless Store</h3>
          <p className="text-sm leading-relaxed">
            A learning build exploring headless Shopify with Next.js.
          </p>
        </div>
        <div>
          <h4 className="text-white text-sm font-medium mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products/the-mantle" className="hover:text-white transition-colors">The Mantle</Link></li>
            <li><Link href="/products/the-mantle-mini" className="hover:text-white transition-colors">The Mantle Mini</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-medium mb-4">Info</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link href="/policies/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            <li><Link href="/policies/shipping" className="hover:text-white transition-colors">Shipping</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
```

**Step 3: Add to layout**

Modify `app/layout.tsx` to include Header and Footer inside CartProvider:

```tsx
<CartProvider>
  <Header />
  <main className="pt-16">{children}</main>
  <Footer />
  <CartDrawer />
</CartProvider>
```

**Step 4: Verify**

```bash
npm run dev
```

Expected: Fixed header with nav links and cart button. Footer at bottom. Cart badge shows count.

**Step 5: Commit**

```bash
git add components/header.tsx components/footer.tsx app/layout.tsx
git commit -m "feat: add header with cart badge and footer with nav links"
```

---

## Task 6: Scroll-Controlled Video Component

**Files:**
- Create: `components/scroll-video.tsx`
- Create: `public/videos/` (placeholder video)

**Step 1: Get a placeholder video**

Download or create a short placeholder MP4. For the learning build, any short looping video works. Place it at `public/videos/hero.mp4`.

If you have ffmpeg and want to create a test gradient video:

```bash
mkdir -p public/videos
ffmpeg -f lavfi -i "color=c=0x6F9BB0:size=1920x1080:d=5,format=yuv420p" \
  -c:v libx264 -g 1 -t 5 public/videos/hero.mp4
```

The `-g 1` flag makes every frame a keyframe (critical for smooth scrubbing).

**Step 2: Create the scroll-video component**

Create `components/scroll-video.tsx`:

```tsx
"use client";

import { useRef, useEffect } from "react";

export function ScrollVideo({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    let ticking = false;

    function updateVideoTime() {
      if (!container || !video || !video.duration) return;

      const rect = container.getBoundingClientRect();
      const scrollableHeight = container.offsetHeight - window.innerHeight;

      if (scrollableHeight <= 0) return;

      const progress = Math.min(
        Math.max(-rect.top / scrollableHeight, 0),
        1
      );

      video.currentTime = progress * video.duration;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateVideoTime);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
```

**Step 3: Add to homepage for testing**

Temporarily update `app/page.tsx`:

```tsx
import { ScrollVideo } from "@/components/scroll-video";

export default function Home() {
  return (
    <main>
      <ScrollVideo src="/videos/hero.mp4" />
      <section className="py-24 px-6 text-center">
        <h2 className="font-display text-3xl">Content below the video</h2>
      </section>
    </main>
  );
}
```

**Step 4: Test the scroll interaction**

```bash
npm run dev
```

Expected: Video stays pinned in viewport. Scrolling through the 300vh container scrubs through the video. Content appears after.

**Step 5: Commit**

```bash
git add components/scroll-video.tsx public/videos/ app/page.tsx
git commit -m "feat: add scroll-controlled video component with RAF-throttled playback"
```

---

## Task 7: Homepage

**Files:**
- Modify: `app/page.tsx` (full homepage)

**Step 1: Build the full homepage**

Replace `app/page.tsx`:

```tsx
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
```

Note: This depends on `ScrollReveal` from Task 10. If building sequentially, either build Task 10 first or remove the `ScrollReveal` wrappers temporarily.

**Step 2: Verify**

```bash
npm run dev
```

Expected: Scroll video hero → tagline → product grid with images and prices from Shopify.

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: build homepage with scroll video hero and product grid from Storefront API"
```

---

## Task 8: Product Detail Page

**Files:**
- Create: `app/products/[handle]/page.tsx`
- Create: `components/product/product-gallery.tsx`
- Create: `components/product/product-info.tsx`
- Create: `components/product/sticky-buy-bar.tsx`

**Step 1: Create ProductGallery**

Create `components/product/product-gallery.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import type { Image as ImageType } from "@/lib/shopify/types";

export function ProductGallery({ images }: { images: ImageType[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = images[selectedIndex];

  if (images.length === 0) return null;

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-ice mb-4">
        <Image
          src={selected.url}
          alt={selected.altText || "Product image"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setSelectedIndex(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === selectedIndex ? "border-brand-accent" : "border-transparent"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText || `Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create ProductInfo**

Create `components/product/product-info.tsx`:

```tsx
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

      {/* Quantity selector */}
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

      {/* Add to cart */}
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
```

**Step 3: Create StickyBuyBar**

Create `components/product/sticky-buy-bar.tsx`:

```tsx
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
```

**Step 4: Create the product page**

Create `app/products/[handle]/page.tsx`:

```tsx
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
```

**Step 5: Verify end-to-end flow**

```bash
npm run dev
```

Test: Homepage → click product → product page loads → add to cart → cart drawer opens → quantity controls work → checkout link goes to Shopify.

**Step 6: Commit**

```bash
git add app/products/ components/product/
git commit -m "feat: add product detail page with gallery, add-to-cart, and sticky buy bar"
```

---

## Task 9: Static Pages (About, Policies)

**Files:**
- Create: `app/about/page.tsx`
- Create: `app/policies/[slug]/page.tsx`

**Step 1: Create About page**

Create `app/about/page.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About our brand and mission.",
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="font-display text-4xl mb-8">About</h1>
      <div className="space-y-4 text-lg text-brand-muted leading-relaxed">
        <p>
          We believe skincare should be simple, effective, and backed by science.
          Our formulations focus on barrier repair and deep hydration.
        </p>
        <p>
          This is a learning build exploring headless Shopify architecture with
          Next.js, inspired by moumoujus.com.
        </p>
      </div>
    </main>
  );
}
```

**Step 2: Create policies page**

Create `app/policies/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const policies: Record<string, { title: string; paragraphs: string[] }> = {
  faq: {
    title: "FAQ",
    paragraphs: [
      "How long does shipping take? Orders typically arrive within 5-7 business days worldwide.",
      "What is your return policy? We offer a 30-day money-back guarantee on all products.",
      "Are your products cruelty-free? Yes, all our products are cruelty-free and vegan.",
    ],
  },
  shipping: {
    title: "Shipping Policy",
    paragraphs: [
      "We offer free worldwide shipping on all orders. Orders are processed within 1-2 business days.",
    ],
  },
  refund: {
    title: "Refund Policy",
    paragraphs: [
      "If you're not satisfied, contact us within 30 days for a full refund.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    paragraphs: [
      "We collect minimal data necessary to process your orders. We never sell your personal information.",
    ],
  },
  terms: {
    title: "Terms of Service",
    paragraphs: [
      "By using this site, you agree to our terms of service. This is a demo store for educational purposes.",
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) return { title: "Not Found" };
  return { title: policy.title };
}

export async function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="font-display text-4xl mb-8">{policy.title}</h1>
      <div className="space-y-4 text-lg text-brand-muted leading-relaxed">
        {policy.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </main>
  );
}
```

**Step 3: Verify**

```bash
npm run dev
```

Navigate to `/about`, `/policies/faq`, `/policies/shipping`. All should render.

**Step 4: Commit**

```bash
git add app/about/ app/policies/
git commit -m "feat: add about page and policy pages (FAQ, shipping, refund, privacy, terms)"
```

---

## Task 10: Scroll Reveal Animations

**Files:**
- Create: `components/scroll-reveal.tsx`

**Step 1: Create scroll reveal component**

Create `components/scroll-reveal.tsx`:

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ScrollReveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-8");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-8 transition-all duration-700 ease-out ${className}`}
    >
      {children}
    </div>
  );
}
```

**Step 2: Verify**

The homepage from Task 7 already wraps sections with `<ScrollReveal>`. Run `npm run dev` and confirm sections fade in on scroll.

**Step 3: Commit**

```bash
git add components/scroll-reveal.tsx
git commit -m "feat: add scroll reveal animations using IntersectionObserver"
```

---

## Task 11: SEO & PWA

**Files:**
- Create: `app/sitemap.ts`
- Create: `public/site.webmanifest`
- Modify: `app/layout.tsx` (metadata, structured data)

**Step 1: Create sitemap**

Create `app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://your-domain.vercel.app";

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products/the-mantle`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.95 },
    { url: `${baseUrl}/products/the-mantle-mini`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/policies/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/policies/shipping`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/policies/refund`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/policies/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/policies/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}
```

**Step 2: Create PWA manifest**

Create `public/site.webmanifest`:

```json
{
  "name": "Headless Store",
  "short_name": "Store",
  "description": "A headless Shopify store built with Next.js",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAF7F2",
  "theme_color": "#6F9BB0",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Step 3: Update layout metadata**

In `app/layout.tsx`, update the metadata export:

```tsx
export const metadata: Metadata = {
  title: {
    default: "Headless Store",
    template: "%s | Headless Store",
  },
  description: "A headless Shopify store built with Next.js",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-icon.png",
  },
};
```

**Step 4: Commit**

```bash
git add app/sitemap.ts public/site.webmanifest app/layout.tsx
git commit -m "feat: add sitemap, PWA manifest, and SEO metadata"
```

---

## Task 12: Configure Shopify Image Domains & Final Config

**Files:**
- Modify: `next.config.ts`

**Step 1: Update Next.js config for Shopify images**

Edit `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
};

export default nextConfig;
```

**Step 2: Verify full build**

```bash
npm run build
```

Expected: Build succeeds with no errors. All pages pre-render correctly.

**Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: configure Shopify CDN image domain in Next.js config"
```

---

## Task 13: Deploy to Vercel

**Step 1: Install Vercel CLI (if not already)**

```bash
npm i -g vercel
```

**Step 2: Deploy**

```bash
cd ~/Projects/headless-shopify-store
vercel
```

Follow prompts: link to project, set environment variables when asked (`NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_API_TOKEN`).

Alternatively, set env vars in Vercel dashboard: Settings → Environment Variables.

**Step 3: Verify production**

Visit the Vercel URL. Test:
- Homepage loads with products from Shopify
- Scroll video works
- Product page renders
- Add to cart works
- Cart drawer opens
- Checkout redirects to Shopify

**Step 4: Commit any Vercel config**

```bash
git add -A
git commit -m "chore: add Vercel deployment config"
```

---

## Summary

| Task | What | Key Files |
|------|------|-----------|
| 1 | Scaffold Next.js | project setup, tailwind, fonts |
| 2 | Shopify dev store | Partners dashboard, .env |
| 3 | GraphQL client | lib/shopify/* |
| 4 | Cart provider + drawer | components/cart/* |
| 5 | Header + footer | components/header, footer |
| 6 | Scroll video | components/scroll-video |
| 7 | Homepage | app/page.tsx |
| 8 | Product detail page | app/products/*, components/product/* |
| 9 | Static pages | app/about, app/policies |
| 10 | Scroll reveal | components/scroll-reveal |
| 11 | SEO + PWA | sitemap, manifest |
| 12 | Image config | next.config.ts |
| 13 | Deploy to Vercel | vercel deploy |
