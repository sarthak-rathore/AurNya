# Phase 7: WhatsApp updates + owner approvals

Two features, both automatic. Your only job is the `.env` file (and, for WhatsApp, a one-time template setup at Meta).

After unzipping: `npm install`, then `npm run db:migrate` (adds 2 tables and 2 columns; nothing is deleted), then `npm run dev`.

---------------------------------------------------------------------------

## 1. Owner approval for every admin / manager change

**What happens**

| Who | What they do | Result |
|---|---|---|
| Owner | changes anything | applied immediately |
| Admin / Manager | saves, edits, deletes or sends anything | **not applied.** A request is created, a pop-up appears on the owner's dashboard within ~4 seconds (with Approve / Reject buttons), and the bell shows a red count |
| Owner | clicks **Approve** | exactly what the person asked for is applied now (activity log says "owner (approved a request from admin@...)") |
| Owner | clicks **Reject** | nothing changes; the admin/manager is told |

- Owner: **Approvals** page in the sidebar (full list, "Show exactly what will change", Retry for a change that failed).
- Admin / Manager: **My Requests** page, and a pop-up when the owner decides.
- It sits in one place (`src/lib/admin-route.ts`), so it covers **every** section of every dashboard, including pages you add later, as long as the API route uses `adminRoute(...)`.
- Mistakes are reported to the admin immediately (they do not wait in the owner's queue). A double click does not create two requests. Two clicks on Approve cannot apply a change twice.
- A manager can only reach Orders, Stock and My Requests (pages and API). Admin cannot open Users, Payments, Settings or WhatsApp.

No environment variables are needed for this feature.

---------------------------------------------------------------------------

## 2. WhatsApp updates to customers

**What customers get (all automatic)**

| Event | Message |
|---|---|
| First sign-in / sign-up with a mobile number (or adding one later in Account) | subscribed + one welcome message |
| COD order placed, online order paid, packed, shipped (with courier + tracking), delivered, cancelled, refunded | order update |
| A new coupon goes live (after the owner approves it), or a coupon is switched on | "exclusive offer" to every subscribed customer, once each |
| The announcement bar changes to a new live message (a sale, a launch) | "sale" message to every subscribed customer, once each |
| Marketing page → "WhatsApp message to customers" | your own text (admin's send needs owner approval) |

**Consent and unsubscribe (built in)**
- The sign-in and register screens say that signing in means getting WhatsApp updates; the Account page has an on/off switch; replying **STOP** on WhatsApp unsubscribes (needs the webhook below). Someone who said STOP is **never** re-subscribed automatically.
- Order messages go only to subscribed customers.

### Setup: Meta WhatsApp Cloud API (recommended)

1. developers.facebook.com → create an app → add **WhatsApp**. Note the **Phone number ID** and create a **permanent access token** (System User).
2. WhatsApp Manager → **Message templates**. Create these 4 templates (language **English**, names exactly as below, or change the names in `.env`):

   | Name | Category | Body |
   |---|---|---|
   | `aurnya_welcome` | Utility (or Marketing) | `Hi {{1}}, welcome to {{2}}! You will now get order updates, sale alerts and exclusive offers here on WhatsApp. Reply STOP anytime to unsubscribe.` |
   | `aurnya_order_update` | Utility | `Hi {{1}}, your AurNya order {{2}} {{3}}.` |
   | `aurnya_offer` | Marketing | `Hi {{1}}, an exclusive offer from AurNya: {{2}}. {{3}} Shop now: {{4}} Reply STOP to unsubscribe.` |
   | `aurnya_sale` | Marketing | `Hi {{1}}, AurNya update: {{2}}. {{3}} See it here: {{4}} Reply STOP to unsubscribe.` |

   Meta approves them in minutes to a few hours. (WhatsApp only allows approved templates for messages you start.)
3. Put in `.env` (or your host's Environment Variables) and redeploy:
   ```
   WHATSAPP_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_VERIFY_TOKEN=any-text-you-choose
   NEXT_PUBLIC_SITE_URL=https://your-domain.com      # used for the links in messages
   CRON_SECRET=a-long-random-text                    # lets the daily safety-net job run
   ```
4. For the STOP button: Meta app → WhatsApp → Configuration → Webhook: callback URL `https://your-domain.com/api/whatsapp/webhook`, verify token = your `WHATSAPP_VERIFY_TOKEN`, subscribe to **messages**.
5. Done. Check **Owner → WhatsApp Updates**: it shows whether it is switched on, how many customers are subscribed, and every message with its delivery result or error.

### Alternative: Twilio
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```
The Twilio sandbox works for testing. Twilio sends the plain text of each message (outside the 24-hour window, WhatsApp needs approved templates, which you configure in Twilio). Set "When a message comes in" to the same webhook URL for STOP.

### Testing safely
`WHATSAPP_MODE=text` sends plain text instead of templates (only reaches numbers that messaged you in the last 24 hours), so you can test before templates are approved.

### How sending works
Messages are written to an outbox and sent right after the page response, 5 at a time, with up to 3 tries for temporary errors. Nothing slows down checkout. A daily cron (`/api/cron/whatsapp`, see `vercel.json`) sends anything left over. If WhatsApp is not configured, nothing is queued and everything else works as before.

---------------------------------------------------------------------------

## Good to know
- "Instant" for the owner means the dashboard checks every ~4 seconds while the tab is open.
- Approving replays the saved request against your own site as the owner. If you protect preview deployments with Vercel Deployment Protection, approve on the production URL.
- In demo mode (no `DATABASE_URL`) approvals, section saves and WhatsApp queue work from memory and reset when the server restarts.
