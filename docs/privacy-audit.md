# Privacy implementation audit

Reviewed 25 September 2026 for `/impressum` and `/datenschutz`.

## Scope and evidence

This is a source-code audit, supplemented by the owner's confirmation that Telegram notifications are **disabled in production**. The owner has previously confirmed Vercel hosting, live Stripe Checkout, and Supabase order storage. Production dashboards, executed vendor agreements, database region, log/backup retention and the live browser's network traffic were not accessible for verification. A dependency or an example environment variable is not evidence that a service is active.

| Feature | Actual implementation | Evidence |
| --- | --- | --- |
| Hosting | Vercel serves Next.js pages and API functions. Technical requests/logs can include IP, access time, URL/query parameters, browser/device and errors. No code-defined log retention. | Owner's production reports; `app/api/checkout/route.ts`, `lib/admin-hotels.ts`, `next.config.ts` |
| Database | Server-side Supabase client; orders and partner hotels. No customer Supabase Auth session. | `lib/supabase.ts`, `supabase/migrations/001_initial_schema.sql` |
| Checkout | Name, phone, destination, optional room/instructions; items, cable, delivery, amounts, statuses, referral and commission. A pending order is inserted before Stripe redirects. Abandoned orders are not automatically removed. | `components/checkout-form.tsx`, `app/api/checkout/route.ts`, `app/api/stripe/webhook/route.ts` |
| Stripe | Hosted Checkout, not an embedded payment form. Session creation sends translated item names, quantities, prices, delivery fee, currency, locale, order ID/number. Database retains Stripe identifiers and payment status, not full card credentials. | `app/api/checkout/route.ts`, `app/api/stripe/webhook/route.ts` |
| Cart | `sessionStorage['munich-ready-cart']`: items (kind/ID/quantity/cableType), deliveryType, refCode. Read on mount; written after hydration, even for an empty cart. No name/phone/address/instructions in this store. No explicit TTL or clear-on-payment. | `components/cart-provider.tsx` |
| Language | `localStorage['munich-ready-language']`: `en`/`de`, written after explicit language selection, read on load. Otherwise browser language. No explicit expiry. | `components/i18n-provider.tsx` |
| Referral | URL `ref` automatically enters cart state, triggers same-origin hotel lookup and is persisted with cart. Checkout links it to an identifiable order; even unknown normalized codes can be stored. Commission is based on paid merchandise subtotal. | `app/page.tsx`, `components/referral-capture.tsx`, `components/cart-provider.tsx`, `lib/hotels.ts`, checkout/webhook routes |
| Cookie | `munich_ready_admin`, only after admin login; signed session, HttpOnly, production Secure, SameSite=Strict, path `/`, eight hours, cleared on logout. No other application-set cookie found. Third-party Stripe/hosting cookies must be checked in production separately. | `lib/admin-session.ts`, `app/api/admin/login/route.ts`, `app/api/admin/logout/route.ts` |
| Telegram | Implemented but disabled according to owner. If enabled, paid-order message includes name, phone, room, destination, items/cable, amounts, referral/commission and instructions. Excluded as an active recipient from public policy. | `lib/telegram.ts`, `app/api/stripe/webhook/route.ts` |
| WhatsApp | External `wa.me` link on success page, no SDK/widget or automatic transmission of order data. Current configured number is a placeholder. | `app/success/page.tsx`, `data/site.ts` |
| Email | No Resend/SendGrid or other automated email API detected. Supplied contact address is Gmail; ordinary incoming email uses Google, independent of an application API. | Source search; owner-supplied contact information |
| Assets / QR | Local product images with Next/Image; Arial/Helvetica/system fonts; local `qrcode` generation, no third-party QR endpoint. | `public/products`, `app/globals.css`, `lib/hotel-referral.ts`, admin hotel components |
| Analytics | No Google Analytics, Tag Manager, Meta pixel, Vercel Analytics/Speed Insights, advertising SDK or equivalent found in application code. Hotel commission attribution remains tracking for a separate purpose. Dashboard-injected scripts were not verified. | Search of app/components/lib/data and dependencies |

## Decisions needed before claiming the policy is production-ready

1. **Referral storage likely requires prior consent.** `ReferralCapture` automatically calls `setRefCode`; `CartProvider` automatically reads/writes that code in sessionStorage. A commission attribution purpose is not automatically indispensable to the customer's requested cart service. The exception in [§ 25(2) TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html) is narrower than a GDPR legitimate-interest basis. The code currently has no consent gate. Before further attribution storage/access, either implement prior opt-in specifically for this purpose (with refusal/withdrawal and no checkout penalty), or remove nonessential browser persistence and legally review any replacement. Separate the customer's requested hotel delivery selection from commission tracking; merely changing sessionStorage to a cookie/localStorage does not solve it. Also review reading an old stored referral before consent. No banner, storage or attribution changes were made in this task. The policy explicitly describes the current automatic behavior; disclosure alone does **not** cure it. Art. 6(1)(f) for subsequent partner accounting needs a documented balancing assessment and an objection process.
2. **Confirm vendor agreements and international transfers.** Check the actual Vercel/Supabase/Stripe contracts, processing roles, subprocessors, applicable transfer safeguards and any transfer assessment. Supabase's current August 2026 public DPA identifies **Supabase Pte. Ltd., Singapore**, whereas older DPAs identified Supabase, Inc.; confirm the entity applying to this account. The privacy page refers to current published terms rather than inventing a signed contract. Confirm the Supabase project/backup region and Vercel function/log configuration. An EU database region alone is not a guarantee against international support/access. The policy does not claim DPAs have been signed or that all data stays in the EU. Replace general safeguard descriptions with account-specific information once verified.
3. **Define and implement retention.** No automated database deletion or log-retention job was found. Establish separate periods/processes for paid accounting records, failed/abandoned checkout attempts, phone/room/instructions, referrals, technical logs, correspondence and backups. Statutory retention does not justify retaining all optional delivery information. The policy uses purpose/legal-obligation criteria, not invented deletion deadlines. Do not claim a deletion schedule is implemented until it is.
4. **Keep Telegram disabled pending review.** Before enabling it, assess necessity/minimization, recipient access, contractual basis, international transfers and message retention; update the policy. Current notification payload contains considerably more personal data than an order-number alert. No Telegram configuration or code was changed.
5. **Confirm real contact channels.** `data/site.ts` still contains placeholder email/phone and a placeholder WhatsApp number; `/contact` still uses those values. The new legal pages use the exact supplied contact information, without changing unrelated configuration. Confirm the business Gmail/WhatsApp setup and applicable contracts before relying on those channels for customer data.
6. **Review other legal pages separately.** Existing AGB, Widerruf, Versand and Contact pages retain their pre-launch placeholders/warnings. They were outside this task and remain unchanged. Have qualified German counsel review the new privacy policy, referral purpose/basis and operational details before treating the site as legally ready. Verify any additional legally required identifier actually assigned to the business; none was invented or published here.

No generic analytics consent banner was added: no such analytics integration was detected. The specific referral issue above prevents an unconditional conclusion that no consent mechanism is needed.

## Sources checked

- [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html): provider identification.
- [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html): end-device storage/access, including non-cookie storage.
- [GDPR, especially Articles 6, 13, 15–21, 28 and 44–49](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679): bases, disclosures, rights and safeguards.
- [Vercel privacy notice](https://vercel.com/legal/privacy-notice) and [DPA](https://vercel.com/legal/dpa).
- [Supabase privacy notice](https://supabase.com/privacy) and [current DPA](https://supabase.com/legal/customer-resources/data-processing-addendum).
- [Stripe agreement](https://stripe.com/legal/ssa), [privacy](https://stripe.com/de/privacy), [DPA](https://stripe.com/legal/dpa) and [cookie policy](https://stripe.com/legal/cookies-policy).
- [Google privacy](https://policies.google.com/privacy?hl=de), [WhatsApp EEA privacy](https://www.whatsapp.com/legal/privacy-policy-eea) and [BayLDA complaints](https://www.lda.bayern.de/de/beschwerde.html).

## Scope of changes

Only the two legal pages and their dedicated server-rendered presentation were changed/added, plus this internal audit. The existing shared placeholder legal component and all six footer links remain unchanged. No checkout, payment, database, authentication, referral, commission, product or translation logic changed. No secrets, personal tax identifier, invented VAT or registration number were included.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: no errors; one existing `import/no-anonymous-default-export` warning in `postcss.config.mjs`.
- `npm run build`: passed; both legal routes prerendered successfully.
- `node --test tests/*.test.cjs`: all 43 existing tests passed.
- Generated HTML checked for German content language, correct contact links, all six footer destinations, absence of placeholder warnings and exclusion of the supplied private tax identifier.
- Legal-page CSS is scoped, uses fluid sizing/wrapping, and overrides the global oversized mobile section-heading rule without affecting other pages. Browser visual/overflow verification remains outstanding: headless Chrome was blocked in the sandbox, and permission to launch it outside the sandbox was declined. No local server was started, and no live payment/database write was performed.
