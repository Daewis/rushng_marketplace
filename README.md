# Rush — Multi-Capability Marketplace

A real, working full-stack Next.js 16 app for shopping from local vendors, hiring service providers, and booking rides. One account, multiple capabilities.

> Built around the mental model: **Jiji's clarity for browsing and selling + Chowdeck's simplicity for ordering and fulfilment + Rush's multi-service ecosystem.**

## Quick start

```bash
# 1. Install dependencies
bun install

# 2. Set up the database (starts EMPTY — no sample data)
bun run db:push

# 3. (Optional) Create the first admin account
bun run db:admin
#    Prompts for email / name / password. Creates ONE admin user with
#    NO sample marketplace data. Sign in at /account → Admin Panel.

# 4. Run the dev server
bun run dev
```

Open `http://localhost:3000`.

> **Real data only — no mock fallback, no fixture data by default.**
>
> A fresh install shows honest empty states on the homepage
> ("Nothing here yet — Be the first to add products and stores to
> Rush."). If the API is unreachable, screens show a friendly "We
> couldn't load this — try again" error with a retry button. There
> is no automatic fallback to fake products, vendors, or orders.
>
> **Optional fixture seeding** for demos / automated tests:
>
> ```bash
> bun run db:seed   # adds 5 sample vendors, 14 products, 4 providers,
>                   # 2 orders, 1 ride, plus demo accounts
>                   # (jesu@rush.app / password123, admin@rush.app / admin123)
> ```
>
> This is for screenshots, demos, and tests only. The fixture data
> lives in `tests/fixtures/seed-data.ts` and is structurally isolated
> from the application code. To wipe:
>
> ```bash
> rm db/custom.db && bun run db:push   # clean slate
> ```

## Tech stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons
- **Database**: Prisma ORM with SQLite (default) — switch to MongoDB Atlas via `scripts/switch-to-mongodb.ts`
- **Auth**: Firebase (Google Sign-In) as primary, bcryptjs + jose (JWT) + HTTP-only cookies as fallback when Firebase isn't configured
- **Payments**: Paystack (NGN cards / bank transfer / USSD) with mock-payment mode for development when keys aren't set
- **Server state**: TanStack Query v5
- **Client state**: Zustand
- **PWA**: installable, offline-capable via @ducanh2912/next-pwa
- **Package manager**: Bun (recommended) — also works with npm/pnpm

## What's inside

### Multi-capability architecture

One `User` can hold any combination of:
- `CUSTOMER` — buy products, hire services, book rides
- `VENDOR` — run a store, sell products
- `SERVICE_PROVIDER` — offer services, quote on jobs
- `RIDER` — deliver products, transport passengers

Capabilities are stored as a JSON array on `User.capabilities` with per-capability status:
`ACTIVE` | `PENDING_VERIFICATION` | `SUSPENDED`.

The UI keeps the multi-capability system **invisible** until the user taps **Sell** in the bottom nav. From there they can onboard into any of the three earning capabilities.

### Project structure

```
prisma/
  schema.prisma              # Full database schema
src/
  app/
    api/                     # All REST API routes
      auth/{login,logout,me,register}/route.ts
      products/[id]/route.ts
      stores/[slug]/route.ts
      orders/[id]/route.ts
      providers/[slug]/route.ts
      onboarding/{vendor,provider,rider}/route.ts
      rides/[id]/route.ts
    globals.css              # Rush brand design system (orange, ink, warm surface)
    layout.tsx
    page.tsx                 # Client-side view router
  components/
    layout/                  # TopBar, BottomNav
    screens/                 # 18 screens (Home, Shop, Product, Cart, Checkout, etc.)
    onboarding/              # Vendor/Provider/Rider onboarding flows
    shared/                  # ProductCard, VendorCard, EmptyState
    ui/                      # shadcn/ui primitives
    AuthHydrator.tsx         # Syncs useMe() into Zustand
    QueryProvider.tsx
  lib/
    api-client.ts            # fetch wrapper with credentials + error handling
    auth.ts                  # bcrypt + JWT + cookie helpers
    db.ts                    # Prisma client
    hooks.ts                 # All TanStack Query hooks
    mock-data.ts             # Seed source + naira formatter + category constants
    store.ts                 # Zustand store (view router, cart, toasts)
    types.ts                 # All TypeScript domain types
scripts/
  seed.ts                    # Seeds DB from mock-data.ts
  capture-screens.py         # Captures screenshots for documentation
```

### The 18 screens

| Screen | Purpose |
|--------|---------|
| **Home** | 3 primary actions (Shop / Services / Rides) + Popular near you + Top stores + Service providers |
| **Explore** | Browse all categories + all stores |
| **Shop** | Jiji-style category chips + 2-col product grid with search |
| **Product Detail** | Image carousel + vendor link + quantity selector + Add to cart / Buy now |
| **Cart** | Grouped by vendor + quantity steppers |
| **Checkout** | Delivery/Pickup + 4 payment methods + order summary |
| **Order Tracking** | Live status banner + rider card + timeline (auto-refreshes every 5s) |
| **Vendor Storefront** | Mini-site with cover/logo/CTAs + Products/About/Reviews tabs |
| **Services** | Category chips + provider cards with cover, rating, starting price |
| **Provider Profile** | Cover + services list with Request buttons + portfolio |
| **Ride Booking** | Uber-style map + pickup/destination + 4 ride types (Bike/Car/Keke/Van) |
| **Ride Tracking** | Live map + rider card + trip details + share safety |
| **Sell / Earn Hub** | Active businesses + 3 capability cards (gateway to multi-capability) |
| **Vendor Dashboard** | Store banner + stats + recent orders + product list |
| **Provider Dashboard** | Verification status + open jobs + services list |
| **Rider Dashboard** | Pending verification gate + mobility capabilities + vehicle |
| **Account** | Consumer view + My Businesses + wallet/settings + sign out |
| **Activity** | Orders / Services / Rides tabs with history |
| **Search** | Trending + recent + live results across products/stores/providers |
| **Auth** | Combined login/register with brand header + demo shortcut |
| **Onboarding (×3)** | Vendor 3-step, Provider 3-step, Rider 4-step with document upload UI |

### Bottom navigation

```
Home | Explore | [+ Sell] | Activity | Account
```

The center **Sell** button is the prominent gateway to multi-capability onboarding.

## Database schema

11 models covering the full Rush domain:

- `User` — single account, holds capabilities JSON
- `VendorProfile` — store, slug, visibility (PUBLIC / LINK_ONLY / PRIVATE)
- `Product` — belongs to vendor
- `Provider` — service business, has many `Service`
- `ServiceJob` — customer-posted job (OPEN / QUOTED / ASSIGNED / etc.)
- `Order` — products order with timeline JSON
- `RiderProfile` — rider with PENDING_VERIFICATION / ACTIVE status
- `Vehicle` — registered to a rider
- `Ride` — passenger ride
- `Wallet` + `WalletLedgerEntry` — Rush Wallet for escrow / payouts

## API routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/register` | Create account, set session cookie |
| POST | `/api/auth/login` | Verify password, set session cookie |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Current authenticated user (or null) |
| GET | `/api/products` | List products (filter by category, q, vendorId) |
| GET | `/api/products/:id` | Single product with vendor |
| GET | `/api/stores` | List vendors (filter by visibility) |
| GET | `/api/stores/:slug` | Single vendor with products |
| GET | `/api/providers` | List providers (filter by category, q) |
| GET | `/api/providers/:slug` | Single provider with services |
| POST | `/api/orders` | Create order (requires auth) |
| GET | `/api/orders` | Current user's orders |
| GET | `/api/orders/:id` | Single order with vendor + rider |
| PATCH | `/api/orders/:id` | Update status, push timeline step |
| POST | `/api/onboarding/vendor` | Create VendorProfile + add VENDOR capability |
| POST | `/api/onboarding/provider` | Create Provider + add SERVICE_PROVIDER capability |
| POST | `/api/onboarding/rider` | Create RiderProfile + Vehicle + add RIDER capability |
| GET | `/api/rides` | Current user's rides |
| POST | `/api/rides` | Request a ride (requires auth) |
| GET | `/api/rides/:id` | Single ride with rider + vehicle |

## What's intentionally stubbed

These are operational flows that need business-logic decisions:

- **Order status progression** — orders start in `PLACED` but the timeline doesn't auto-advance (no vendor acceptance / rider assignment logic yet)
- **Rider auto-assignment** — orders don't get a rider assigned automatically
- **Wallet debit on order** — placing an order doesn't deduct from the wallet yet
- **Ride matching** — requested rides stay in `SEARCHING` until manually assigned
- **Image uploads** — currently using Unsplash URLs. Real product/logo uploads would need S3-compatible storage
- **Real-time updates** — order/ride tracking polls every 5s. WebSocket would be cleaner

## Demo data (after `bun run db:seed`)

- **1 demo user**: `jesu@rush.app` / `password123` (wallet: ₦12,500)
- **5 vendors**: Campus Gadgets, Aunty Bisi Kitchen, Sneaker Plug NG, Gracious Groceries, Tunde Phones
- **14 products** across Electronics, Fashion, Food, Groceries
- **4 service providers** across Cleaning, Electrical, Plumbing, Beauty
- **2 sample orders** (RSH-20394 ON_THE_WAY, RSH-20390 DELIVERED)
- **1 sample ride** (RSH-RIDE-5821)

The demo user already has `CUSTOMER` + `VENDOR` (Campus Gadgets) + `SERVICE_PROVIDER` (pending) capabilities. Walk through Rider onboarding to add the 4th.

## Migrating to PostgreSQL or MongoDB

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // or "mongodb"
  url      = env("DATABASE_URL")
}
```

Then `bun run db:push`. The rest of the codebase is DB-agnostic.

## License

MIT — build, fork, ship.
