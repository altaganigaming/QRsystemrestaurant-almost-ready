# Restaurant Master — Multi-Restaurant QR Ordering System

Production-ready, reusable restaurant website + QR ordering system built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, and **Supabase** (Database, Auth, Storage, Realtime, RLS).

**Design-once, clone-forever:** zero restaurant-specific data exists in source code. Branding, menu, tables, QR codes, pricing, themes, gallery, and all website copy are configured from the Admin Panel. Each restaurant = one Supabase project + one Vercel deployment (see `RUNBOOK.md`).

## Roles & Access

| Role | Access |
|---|---|
| **Customer** | Browse menu, search, cart, dine-in (table QR) or delivery (login required), track orders, order history, address book |
| **Admin** | Dashboard + sales, orders & billing, open/closed toggle, menu (categories, products, variants, pack sizes 250ml/500ml, add-ons, discounts, availability), tables + QR generation/download/print, gallery, 6 themes + custom colors, all website content, tax/service charge, kitchen account management |
| **Kitchen** | Realtime order board only: New → Preparing → Ready → Completed with 5/10/15/20 min estimates. Cannot reach admin settings (enforced by middleware + RLS + DB trigger) |

## Key Security Properties

- **Prices are never trusted from the client.** `placeOrder` is a server action that re-reads every product/variant/pack/add-on price from the database and recomputes subtotal, discount, tax, service charge and grand total server-side.
- **Strict RLS** on every table. Role comes from `app_metadata.role` in the JWT (`is_admin()` / `is_staff()` SQL helpers). Anon can only read the public menu and settings.
- **Orders write-locked:** only staff can modify orders; a `BEFORE UPDATE` trigger restricts kitchen users to workflow status + prep estimate only — financial fields, payment status, and customer identity cannot be touched by kitchen.
- **Service role key is used only server-side** (order placement, staff management, guest order reads by access token). It is never exposed to the browser.
- **Guest order privacy:** anonymous dine-in orders are readable only via a random `access_token` checked server-side.
- **Suspension:** `settings.service_status` (toggle only via SQL/developer) disables all customer ordering while keeping data, menu, images and accounts fully intact. Middleware redirects the whole customer surface to `/suspended`; admin/kitchen remain accessible.

## QR Design

Each table QR encodes only `https://<restaurant-domain>/t/<table-qr-token>`. The landing route validates the table against the database and starts the dine-in flow. **Menu and prices always load from the database — a QR never needs reprinting when the menu or prices change.**

## Billing

Running bill and final bill with subtotal, item discounts, optional tax %, optional service charge %, grand total. Payment is **Unpaid/Paid** (UPI QR at counter, cash, card — no gateway required; online payment can be added later). Admin marks paid with method; orders can be completed/closed after payment. Bills are print-friendly (dedicated print stylesheet) and one click from a WhatsApp-formatted share.

## Realtime

Admin order list, kitchen board, and customer tracking stay synchronized via Supabase Realtime on `orders` / `order_items`. Guests get secure 4s polling; authenticated customers get live subscriptions.

## Local Development

```bash
cp .env.example .env.local   # fill in your Supabase project values
npm install
npm run dev
```

Then in Supabase SQL Editor run `supabase/migrations/0001_init.sql` (optionally `supabase/seed.sql`), create the first admin:

```bash
npm run staff:create -- admin you@email.com 'StrongPass123' 'Owner Name'
```

## Deployment

See **`RUNBOOK.md`** for the full master → clone → new Supabase project → env vars → Vercel deploy → admin setup checklist. See **`DEPLOY_CHECKLIST.md`** for the short pre-deploy smoke test. Repeating those steps provisions an unlimited number of fully isolated restaurants without editing any source code.
