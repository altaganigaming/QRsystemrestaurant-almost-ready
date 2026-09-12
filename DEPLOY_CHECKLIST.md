# Deploy Checklist

## 1. GitHub
- Push the project to GitHub.
- Do **not** commit `.env.local`, Supabase service-role keys, or passwords.

## 2. Supabase
1. Create a Supabase project for the restaurant.
2. Run `supabase/migrations/0001_init.sql` in SQL Editor.
3. Optionally run `supabase/seed.sql` for demo data.
4. Create the first admin with `npm run staff:create -- admin EMAIL PASSWORD "Owner Name"`.

## 3. Vercel Environment Variables
Set these for Production (and Preview if desired):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only secret
- `NEXT_PUBLIC_SITE_URL` — deployed site URL, e.g. `https://restaurant.vercel.app`

## 4. Deploy
- Import the GitHub repository into Vercel.
- Framework should be detected as Next.js.
- Build command: `npm run build`.
- Deploy.

## 5. First smoke test
- `/` homepage loads.
- `/menu` shows menu.
- Admin login works.
- Add one table and open/download its QR.
- Scan the QR and confirm it opens `/menu?table=...`.
- Place a dine-in test order.
- Confirm the order appears in Admin/Kitchen.
- Mark it paid and complete it.
- Test delivery only after enabling a customer account.

## Important
The source tree intentionally uses `app/`, `components/`, and `lib/` at the repository root. The `@/*` alias in `tsconfig.json` maps to that root.
