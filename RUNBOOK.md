# Master Deployment & Restaurant Cloning Runbook

## Model
**Master Project → Clone → New Supabase Project → Configure Env Vars → Deploy New Vercel Project → Create Admin/Kitchen → Admin completes setup.**

Each restaurant gets its own Supabase project, Storage bucket, environment variables, Vercel deployment, admin and kitchen accounts. No restaurant can ever access another restaurant's data — isolation is architectural (separate projects), not just row-level.

---

## A. Provision the Master
1. Push this repo to GitHub.
2. Create a Supabase project (master).
3. Supabase → SQL Editor → run `supabase/migrations/0001_init.sql`, then optionally `supabase/seed.sql`.
4. Vercel → Import repo → set env vars (below) → Deploy.

## B. Environment Variables (per deployment)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        # Vercel: sensitive, server-only
NEXT_PUBLIC_SITE_URL             # https://restaurant-name.vercel.app
```

## C. Create Access Accounts
First admin (run locally — service key stays off the client):
```bash
npm run staff:create -- admin owner@restaurant.com 'Passw0rd!' 'Owner Name'
```
Additional admins/kitchen accounts: Admin Panel → **Kitchen Accounts** (kitchen) — admins via the same script with role `admin`.

## D. Restaurant Setup Checklist (Admin Panel)
1. **Settings**: name, logo, favicon, cover background, address/phone/WhatsApp, social links, headings/buttons/labels/messages, theme (6 presets or custom hex), currency, tax %, service charge %, delivery toggle.
2. **Menu**: categories → products (image, price, discount, availability, Eat Now/Pack) → variants, pack sizes (e.g. 250ml/500ml), add-ons.
3. **Tables & QR**: add tables, download/print QR per table.
4. **Gallery**: upload photos.

## E. Clone for a New Restaurant (repeat forever)
1. **Supabase**: create new project → run `supabase/migrations/0001_init.sql` (+ optional seed).
2. **Vercel**: "Add New Project" → same repo → new env vars (new project keys, new `NEXT_PUBLIC_SITE_URL`) → Deploy. *(No source changes.)*
3. **Staff**: run `staff:create` script against the new project.
4. **Admin** completes the setup checklist (D).

## F. Suspend / Reactivate a Restaurant (developer-controlled only)
Suspension is intentionally **not** exposed in the Admin Panel. In the restaurant's Supabase SQL Editor:
```sql
-- SUSPEND (ordering disabled, all data preserved)
update public.settings set service_status = 'suspended' where id = 1;
-- REACTIVATE (instant, zero data loss)
update public.settings set service_status = 'active' where id = 1;
```
While suspended: customers see a "Service Temporarily Unavailable" page; admin/kitchen logins keep working so the restaurant can keep managing content.

## G. Rotate / Replace Kitchen Staff
Admin Panel → **Kitchen Accounts** → delete the old account (immediate revocation) → create a new one. New QR codes are never needed — tables stay the same.

## H. Menu Change? 
Edit in Admin Panel. Prices load live from the database at order time (verified server-side). **No QR reprints, ever.**

## I. Payments
No payment gateway is required. Bill shows Unpaid/Paid; staff mark Paid (UPI/cash/card) after receiving payment at the counter or via a printed UPI QR. To add online payment later, add a gateway webhook that calls `update orders set payment_status='paid', payment_method='online'` — the RLS/trigger model already supports it.
