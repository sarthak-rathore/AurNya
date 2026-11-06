# Phase 6: Admin dashboard

Open `https://your-site/admin`. Everything in the shop that used to need code is now editable there.

## Set it up (5 minutes)
1. Add to your environment variables (Vercel: Settings, Environment Variables): `ADMIN_EMAIL`, `ADMIN_PASSWORD` (10+ characters, make it long), and make sure `DATABASE_URL` and `JWT_SECRET` (16+ random characters) are set.
2. Run `npm run db:migrate` once. This phase adds migration `0003` (new order columns and an activity log). It only adds things, so your existing data is safe.
3. Optional, for picture upload: create a free Cloudinary account and add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Without them you can paste picture links.
4. Optional: add `CRON_SECRET` (any long random text) so Vercel runs the daily clean-up in `vercel.json`.
5. Redeploy, open `/admin`, sign in.

Without `DATABASE_URL` the site runs on built-in demo data and the dashboard shows a "connect your database" page.

## The screens
- **Dashboard**: sales today and last 30 days, orders to pack / to ship, cash-on-delivery orders to confirm, low stock, best sellers, and a red warning if a customer paid for an order that got cancelled.
- **Orders**: search by number, name, email, phone or tracking number; filter by status; download CSV. Open an order to move it along: Paid, Packed, Shipped (needs a courier, tracking number optional), Delivered, Cancelled, Refunded. Impossible moves are not offered and are refused by the server. The customer is emailed on every change and sees the tracking details and your notes on their order page. There is a private note, a "fix tracking" box, a WhatsApp link and a print button for a packing slip.
- **Products**: create, edit, hide (Draft or Archived) or delete. Pictures (first one is the main one), sizes with their own stock, price and original price, badges, collections, search-engine title and description.
- **Inventory**: type the number you counted and Save, or use + and -. Orders take stock automatically; cancelling gives it back.
- **Coupons**: percent or fixed, minimum spend, start and end time (India time), total uses. A code cannot be renamed once created.
- **Banners & announcement**: the thin bar at the top of every page, and the seven pictures on the home page.
- **Activity log**: who changed what and when.

## Rules worth knowing
- **Stock**: an order holds its stock from the moment it is placed. Cancelling, or an online order left unpaid for an hour, gives it back once. Cash-on-delivery orders are never auto-cancelled. Refunds put stock back only if you tick the box.
- **Saving a product never overwrites stock** of something that already exists, so it cannot undo a sale made while you were editing. Change existing stock in Inventory.
- **Pictures** must be uploaded in the dashboard, be a Cloudinary link, or a file in `public/images` (for example `/images/ring.png`). Other websites are refused because they would break the shop pages.
- **Refunds**: tick "send the money back through Razorpay" and the full amount is refunded to the customer. Untick it if you refunded in the Razorpay dashboard yourself.
- Prices can have paise but the shop shows whole rupees, so use whole-rupee prices.

## Security
- Admin login is separate from customer accounts. The session is an HttpOnly, SameSite=Strict cookie; every change must come from your own site.
- A request for any `/admin` page without a valid session is redirected before anything is built (`src/proxy.ts`), and each page and API route checks again.
- Changing `ADMIN_PASSWORD` signs everyone out. Signing out clears the cookie but cannot recall a copied cookie before its 12 hours end.
- The login attempt limit lives in one server's memory, so on serverless hosting it is only a speed bump. Use a long password.

## Fixes to earlier phases (all required for the dashboard to be trustworthy)
- Removed `PATCH /api/orders/[id]`: any customer could mark their own order paid.
- Razorpay verify now checks the payment belongs to that order; the webhook no longer cancels an order on one failed attempt, refuses a wrong amount, and flags a payment that arrives after cancellation.
- Checkout now takes stock and counts coupon uses in one transaction, records the real SKU and size on each line, and survives a double click.
- Home page shows "(demo data)" only while sample products exist.

## Not included yet (Phase 7)
Newsletter sign-ups are still not stored. The home page loads fully only a first slice of products. Speed tuning, 3D views, browser tests and launch checklist are Phase 7.
