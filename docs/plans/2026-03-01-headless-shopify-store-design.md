# Headless Shopify Store — Design Document

**Date:** 2026-03-01
**Reference:** [moumoujus.com](https://moumoujus.com/) — built by [@fffabs](https://x.com/fffabs/status/2028139078219186581)
**Purpose:** Learning build replicating the moumoujus headless Shopify pattern

---

## Stack

- **Next.js 15** — App Router, React Server Components, streaming SSR
- **React 19**
- **Tailwind CSS v4** — utility-first styling with custom design tokens
- **TypeScript**
- **Shopify Storefront API** (2025-01) — products, cart, checkout via GraphQL
- **Vercel** — hosting and deployment
- **Shopify MCP** — store management via Claude Code prompts

## Project Structure

```
~/Projects/headless-shopify-store/
├── app/
│   ├── layout.tsx                # Root layout (fonts, analytics, cart provider)
│   ├── page.tsx                  # Homepage (hero, scroll video, featured product)
│   ├── products/
│   │   └── [handle]/page.tsx     # Product detail page
│   ├── about/page.tsx
│   ├── journal/page.tsx
│   └── policies/
│       └── [slug]/page.tsx       # FAQ, shipping, returns, privacy, terms
├── components/
│   ├── cart/
│   │   ├── cart-drawer.tsx       # Slide-out cart drawer
│   │   ├── cart-provider.tsx     # React context for cart state
│   │   └── cart-line-item.tsx
│   ├── product/
│   │   ├── product-gallery.tsx   # Image carousel
│   │   ├── product-info.tsx      # Title, price, description, add-to-cart
│   │   └── sticky-buy-bar.tsx    # Persistent CTA on scroll
│   ├── scroll-video.tsx          # Apple-style scroll-controlled MP4
│   ├── header.tsx
│   └── footer.tsx
├── lib/
│   ├── shopify/
│   │   ├── client.ts             # Storefront API GraphQL client
│   │   ├── queries.ts            # Product, collection, cart queries
│   │   ├── mutations.ts          # Cart create, add, update, remove
│   │   └── types.ts              # TypeScript types from Storefront API
│   └── utils.ts
├── public/
│   ├── videos/                   # Scroll-controlled MP4s
│   └── fonts/                    # Custom WOFF2 fonts
├── tailwind.config.ts
├── .env.local                    # NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_API_TOKEN
└── next.config.ts
```

## Commerce Architecture

### Data Flow

1. User clicks "Add to Cart"
2. `CartProvider` dispatches `addToCart(variantId, quantity)`
3. Calls Shopify Storefront API `cartLinesAdd` mutation
4. Shopify returns updated cart object
5. CartProvider updates React context state
6. CartDrawer slides open with updated items
7. User clicks "Checkout" → redirects to `cart.checkoutUrl` (Shopify hosted checkout)

### CartProvider

- **State:** `cart` (ShopifyCart | null), `isOpen` (boolean), `isLoading` (boolean)
- **Actions:** `addToCart`, `updateQuantity`, `removeItem`, `openCart`, `closeCart`
- **Persistence:** Cart ID stored in cookie (7-day expiry). On page load, reads cookie and fetches existing cart. If expired/invalid, starts fresh.
- **Optimistic UI:** Cart drawer updates instantly, syncs with API response.

### Storefront API Operations

| Operation | GraphQL | Purpose |
|-----------|---------|---------|
| Fetch products | `products` query | Homepage product grid |
| Fetch single product | `productByHandle` query | Product detail page |
| Create cart | `cartCreate` mutation | First add-to-cart |
| Add item | `cartLinesAdd` mutation | Add variant to cart |
| Update quantity | `cartLinesUpdate` mutation | Change item quantity |
| Remove item | `cartLinesRemove` mutation | Remove from cart |

### Cart Drawer UI

- Slides in from right via CSS `transform: translateX()` + `transition`
- Background overlay with `backdrop-blur`, click-to-close
- Body scroll locked when open
- Each line item: product image, title, variant, price, quantity controls, remove button
- Subtotal + "Checkout" button (plain `<a href={cart.checkoutUrl}>`)

### Checkout

Shopify hosted checkout (shop.app). No custom checkout — that requires Shopify Plus ($2k/mo). This is what moumoujus and 99% of headless builds use.

## Scroll-Controlled Video

### Mechanism

1. Tall container div (`h-[300vh]`) creates scroll runway
2. `<video>` element inside is `sticky top-0 h-screen` — stays pinned in viewport
3. `IntersectionObserver` detects when container enters viewport
4. `requestAnimationFrame` loop maps scroll position to `video.currentTime`:
   ```
   scrollProgress = (scrollTop - containerTop) / (containerHeight - viewportHeight)
   video.currentTime = scrollProgress * video.duration
   ```
5. Video attributes: `muted`, `playsInline`, `preload="auto"` — no autoplay, no controls

### Technical Requirements

- **Video format:** MP4 (H.264), 1080p, 5-10 seconds, ~2-5MB
- **Keyframes:** Every frame must be a keyframe for smooth scrubbing (ffmpeg: `-g 1`)
- **Mobile:** Works on iOS/Android with `playsInline`. Fallback to image sequence if needed.
- **Performance:** `requestAnimationFrame` throttles updates. Video decode runs on GPU.
- **Placeholder:** Free stock 3D rotating object MP4 for the learning build.

## Other Animations

No animation libraries (GSAP, Framer Motion). All effects via:

- **Scroll reveal:** `IntersectionObserver` + CSS class toggle (fade/slide in)
- **Hover effects:** Tailwind transition utilities
- **Cart drawer:** CSS transform + transition
- **Page transitions:** None (standard Next.js route changes)

## Styling & Design System

- **Tailwind CSS v4** with custom theme config
- Custom color tokens (brand palette)
- Custom font stack: pick free alternatives to Cedrat Display (e.g., a serif display font from Google Fonts) + DM Sans for body
- Responsive: mobile-first, breakpoints at `md` and `lg`
- PWA manifest + icons

## SEO

- JSON-LD structured data: Organization, WebSite, Product, BreadcrumbList, FAQPage
- OpenGraph + Twitter Card meta tags
- Canonical URLs
- Custom sitemap via Next.js sitemap config

## MCP-Driven Workflow

### Phase 1: Store Setup
- Create dev store via Shopify Partners
- Add 2 dummy products via Shopify MCP
- Generate Storefront API access token
- Store credentials in `.env.local`

### Phase 2: Scaffold
- `create-next-app` with App Router + Tailwind + TypeScript
- Set up Shopify GraphQL client (`lib/shopify/client.ts`)
- Build component library (header, footer, cart)

### Phase 3: Pages
- Homepage with scroll video hero section
- Product detail page (gallery, info, add-to-cart, sticky buy bar)
- About, journal, policy pages

### Phase 4: Polish
- Custom fonts + Tailwind theme
- PWA manifest + icons
- JSON-LD structured data
- Scroll reveal animations

### Phase 5: Deploy
- `vercel deploy`
- Optional: connect custom domain

## Environment Variables

```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_API_TOKEN=shpat_xxxxx
```

The Storefront Access Token is a public token (safe client-side). Scoped to read-only product data + cart operations.
