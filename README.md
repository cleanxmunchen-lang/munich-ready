# Munich Ready

Mobile-first Next.js MVP for practical travel and festival-day essentials delivered to Munich hotels. It includes configurable kits and products, a session cart, referral-aware hotel delivery, Stripe Checkout, webhook-confirmed orders, and password-protected internal admin pages.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and complete its values.
3. Run the SQL file in `supabase/migrations/001_initial_schema.sql` using the Supabase SQL editor or Supabase CLI.
4. Start development: `npm run dev`

## Environment variables

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required by the server-side Supabase admin client for protected order and hotel operations. Set both in Vercel for the same existing Supabase project. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` do not configure that client and are not substitutes for these server variables. `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only Stripe credentials. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is retained for future Stripe client additions. `SITE_URL` is the server-side site origin: set it to `https://munichready.store` in production, or `http://localhost:3000` for local development. `ADMIN_PASSWORD` protects the MVP admin pages.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or `ADMIN_PASSWORD` in browser code or source control.

## Supabase

Run `supabase/migrations/001_initial_schema.sql`. The migration enables RLS and intentionally defines no public policies: browser users cannot read orders, customer data, Stripe IDs, or write order status. Server routes use the service role. A development partner hotel (`hotel01`) is seeded.

Add hotel partners in the Supabase table with lower-case `ref_code` values. Their QR URL is `https://munichready.store/?ref=REF_CODE`; the admin Hotels view generates a local QR preview. Referral codes are normalized and resolved only against the database; URL hotel names are never trusted.

## Stripe

Create a Stripe account and use test keys locally. In Stripe CLI, forward events with:

`stripe listen --forward-to localhost:3000/api/stripe/webhook`

Copy the displayed webhook signing secret into `STRIPE_WEBHOOK_SECRET`. Configure a production webhook for `https://munichready.store/api/stripe/webhook` and subscribe to `checkout.session.completed` and `checkout.session.expired`. Test payment success, cancellation, and delayed webhook arrival. The success page queries the verified database status and does not rely on URL parameters alone.

## Catalog and operations

Products, kits, delivery choices, and prices live in `data/catalog.ts`; amounts are integer euro cents. The server recalculates all prices from this source before creating Stripe line items. WhatsApp and contact placeholders live in `data/site.ts`. Commission logic is isolated in `lib/commission.ts`.

Use `/admin/login`, then `/admin/orders` for fulfilment status and `/admin/hotels` for referral performance. Login is public; the other pages and order updates require an admin session. Set a strong, unique `ADMIN_PASSWORD`. Missing or blank configuration denies access. Sessions are HMAC-signed, expire after eight hours, and use an HTTP-only cookie (Secure in production, SameSite=Strict); the cookie does not contain the password. Changing the password invalidates existing sessions. Logout clears the browser cookie. This is a single-owner MVP session, without individual staff accounts or server-side session revocation.

The order table includes cable choice, special instructions, delivery service, referral code, commission, and subtotal/delivery/total. Status changes are confirmed after saving; cancellation affects fulfilment only and does not issue a refund. Hotel reporting remains read-only.

Run admin regression checks with `node --test tests/admin.test.cjs`. These exercise session validation, protected-page guards, API handlers with mocked storage, and status-control success/failure states without contacting Stripe or Supabase.

## Deployment

Deploy to Vercel, set every environment variable in the Vercel project, set `SITE_URL=https://munichready.store`, and configure the Stripe production webhook. Add real assets under `public/products/` when available; placeholder product art is shown until then.

## Before going live

- Insert legal business information and obtain a legal review for all legal pages.
- Add real product photos; verify prices, stock, delivery radius, and delivery times.
- Configure production Stripe keys and webhook; verify payment success, failure, and cancellation paths.
- Create hotel records and test every hotel QR code on mobile.
- Set a monitored WhatsApp/contact number and test the mobile checkout at 320px, 375px, and 430px widths.
- Replace the MVP admin password mechanism with staff authentication when operationally appropriate.


## Diagnosing admin hotel database errors

The Hotels page and create/edit API log one `[admin-hotels] supabase_error` JSON line on failure. It includes the operation (`hotels.select`, `hotels.insert`, or `hotels.update`), original Supabase code/message/details/hint with credentials redacted, and configuration-presence flags. Responses keep internal diagnostics server-side.

Check the **Production** Vercel environment for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the same project, then redeploy after any configuration change. The anon/publishable key does not replace the service-role key. A `CONFIG_MISSING` diagnostic means the client could not be configured; an HTTP 500 from the save path requires inspecting its logged database error instead.

The repository schema already contains `public.hotels.id`, `name`, `ref_code`, `address`, `commission_percent`, `active`, and `created_at`. Hotel reporting also reads the existing orders relationship. If a log indicates a schema mismatch, inspect the actual database with this **read-only** query before deciding whether a migration is needed:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'hotels'
order by ordinal_position;
```

Do not rerun the initial table-creation migration, reset tables, or disable RLS to troubleshoot an existing production database.
