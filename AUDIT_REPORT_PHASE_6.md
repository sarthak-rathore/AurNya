# Phase 6 dashboard audit

Method: read every dashboard page, component and API route; ran typecheck, the unit tests, lint, a production build; signed in as owner, admin and manager and requested every dashboard URL (checking redirects, including the "soft" redirects Next.js hides behind HTTP 200); crawled every internal link on every dashboard page; then repeated the main flows against a real PostgreSQL 16.

## Found and FIXED

| # | Problem | Fix |
|---|---|---|
| 1 | **Admin → Orders bounced back to the login page.** The admin login set an older token type that role-checked pages did not accept. | One shared sign-in check (`lib/staff-session.ts`) used by proxy, pages and APIs |
| 2 | Manager page allow-list let every `/manager/...` URL through (`/manager` matched everything). | Exact matching, tested |
| 3 | Orders page showed **hard-coded fake orders** even with a database; real orders were unreachable. Order detail existed only under `/admin`. | Real orders list + detail page for owner, admin and manager; sample list only in demo mode |
| 4 | Customers page showed fake customers; the profile popup showed the same fake orders for everyone. | Real customers (orders, spend, city, WhatsApp status) |
| 5 | Dashboard top cards were fixed numbers (`isDemo` was ignored). | Real cards when a database has orders; otherwise a clear "Sample data" note |
| 6 | Orders, Customers, Coupons, Categories, Collections, Content, Marketing, Settings: Save buttons showed "saved ✓" but **saved nothing**. | Real saves (Coupons use the real coupon system; Content announcement uses the real announcement bar; the rest persist as dashboard data); all go through owner approval |
| 7 | Notification bell and sidebar badges were made-up ("12 low stock", fake alerts). | Real approval feed; real counts |
| 8 | Product form always redirected to `/owner/...` (admin creating a product was thrown to the owner login). | Stays in the user's own dashboard |
| 9 | Users page "Invite" created a **customer** row that could never log in; Edit/Revoke did nothing. | Truthful read-only screen (staff are set in `.env`) |
| 10 | Account page pre-filled a hard-coded phone number (+91 9525509617) for customers without one; saving would store it. | Empty field |
| 11 | Session expiry sent owner/manager to the admin login page. | Each goes to their own login |
| 12 | Owner/Manager Inventory were read-only copies of fixed data. | Real, editable stock (changes wait for owner) |
| 13 | Manager dashboard offered links the manager cannot open; stock table linked managers to `/admin`. | Role-aware links |
| 14 | `Ctrl+K` was advertised but did nothing; no Activity Log link anywhere. | Works; added for owner/admin |
| 15 | A real-PostgreSQL-only bug in the new customer query (ambiguous column) that PGlite tests missed. | Fixed + regression test |

Result: crawl of every dashboard link: owner 29 pages, admin 27, manager 10, 0 broken. Tests: 234 pass (was 209 + 1 environment failure). Production build passes.

## NOT changed (you should know)
- **Analytics, Payments, and the charts/widgets lower on the dashboard are still sample visuals** (now labelled "Sample data"). Needs real reporting queries (suggest Phase 8).
- **Categories and Collections** edits are saved and approval-gated, but the storefront still reads categories/collections from `src/config/site.ts`; they do not yet drive the shop.
- Pre-existing lint errors in storefront files (`announcement-bar`, `checkout-client`, `shop-context`, some `any` types) were left alone. No new ones were added.
- Customer login has no rate limiting (staff login does). Worth adding before launch.
- **Change the default passwords** in `.env` (`AurNya@Owner2026`, etc.) before going live.
- WhatsApp was tested against a mock WhatsApp server, not against live Meta/Twilio (I have no credentials). Template wording and approval at Meta are on you (see the Phase 7 README).
