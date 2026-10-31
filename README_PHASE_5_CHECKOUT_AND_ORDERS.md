# AurNya — Phase 5: Checkout & Orders + Tanishq Luxury Experience

Welcome to **AurNya Phase 5**. This milestone introduces production-grade checkout, order management, payment integration, and a complete UI overhaul matching the luxury design and layout of **Tanishq**.

---

## 💎 What's New in this Release

### 1. Tanishq-Style Luxury Account Section (`/account`)
- **Luxury 2-Column Layout**: Styled with rich royal maroon (`#832729`), warm gold (`#e5c158`), and clean borders (`#ecdcd5`).
- **Top Breadcrumbs**: `Home | My Account | [Active Tab]`
- **Sidebar Tabs with Badges**:
  - **Overview**: Personal Information card with inline edit modal, AurCoins / NeuCoins counter, and quick metrics.
  - **AurNya Digital Gold**: 24K 99.9% pure vault-backed gold savings balance, buy & sell gold calculator.
  - **Personal Information**: Edit contact details, shipping preferences, and security settings.
  - **Saved Payments Method**: Manage credit/debit cards, UPI VPA handles, and net banking accounts.
  - **Address Book**: Add, edit, remove, and set default shipping and billing addresses.
  - **Wishlist**: Real-time badge counter, instant add-to-bag, and item removal.
  - **Order History**: Real-time order count badge, status filters (*All, In Transit, Delivered, Cancelled*), and order cards.
    - **Empty State**: Custom hand-crafted delivery box illustration with flying motion trails, subtext *"No Order Details Yet! Add AurNya To Your Jewellery Wardrobe"*, and maroon *"Continue Shopping"* action button.
    - **Order Detail & Tracking**: 5-step interactive delivery progress stepper (*Order Placed → Inspected → Packed → In Transit → Delivered*).
  - **Gift Card Balance**: Check gift card voucher codes, reload balance, and redeem gift codes.
  - **AurPass VIP**: Tiered loyalty program (*Silver, Gold, Platinum*) with exclusive lounge perks.
  - **Ring Size Guide**: With *"New"* badge, interactive millimeter-to-Indian-ring-size chart and printable sizer.
- **24/7 Customer Care Helpline Box**: Dedicated support info box with email (`customercare@aurnya.com`) and toll-free helpline (`1800-266-0123`).

---

### 2. Tanishq-Style Deep Plum Luxury Footer
- **Deep Velvet Plum Background**: Styled in luxury `#250a0e` with gold gradient top border and warm cream typography.
- **Centered Golden Crest & Monogram**: Golden AurNya botanical crest and serif branding.
- **Column 1 — Download the AurNya App Now**:
  - High-resolution SVG QR code with central `AN` monogram.
  - Dual store badge buttons: **Download on the Play Store** & **Download on the App Store**.
- **Column 2 — Useful Links**: Delivery Information, International Shipping, Payment Options, Track your Order, Returns & Exchanges, Find a Boutique, Exercise Your Rights.
- **Column 3 — Information**: Blog & Stories, Offers & Contest Details, Help & FAQs, About AurNya, Cookie Policy, Cookie Settings.
- **Column 4 — Contact Us**:
  - Toll-free phone: `1800-266-0123` (9:00 AM – 9:00 PM IST)
  - WhatsApp chat: `+91 8147349242`
  - Circular direct communication buttons: **WhatsApp**, **Email Concierge**, and **Live Chat Specialist**.
- **Social Row**: Stylized circular buttons for **Instagram**, **X (Twitter)**, **Facebook**, and **YouTube**.
- **Monochrome Payment Gateway Badges**: Clean white badges for **VISA**, **Mastercard**, **Maestro**, **PayPal**, **Diners Club**, **American Express**, and **UPI / RuPay**.
- **Floating Concierge Support Bubble**: Bottom-right floating pill *"How can I help you? ×"* with an interactive modal connecting directly to an online jewellery specialist.

---

### 3. Rotating AurNya Logo Route Loader
- **Seamless Latency Masking**: To hide route transition times, clicking internal links or trigger buttons now displays a luxury backdrop blur with the **3D rotating golden AurNya coin/crest** (`animate-coin-spin`), accompanied by a golden shimmer runner and elegant serif typography.
- **Global Helper**: Exposed via `startAurnyaLoader(label)` and `stopAurnyaLoader()` for async actions (Buy Now, Pincode Check, Login).

---

### 4. Interactive Product Page Enhancements (`/product/[slug]`)
- **Functional Instant Buy Now Button**: Validates size/variant selection and navigates directly to `/checkout` with the item pre-loaded in the cart.
- **Working PIN Code Checker**: Live 6-digit Indian PIN code validator with real estimated delivery dates (`estimatedDeliveryRange()`, typically 3–7 business days) and COD eligibility badge.

---

### 5. Phase 5 Checkout & Orders Backend
- **Razorpay Order Creation & Webhook Verification**:
  - `POST /api/payments/razorpay/order`: Generates Razorpay order IDs with HMAC SHA-256 signature verification.
  - `POST /api/payments/razorpay/webhook`: Validates webhook payloads and updates order statuses automatically.
- **Cash on Delivery (COD)**: Supports COD with a ₹150 verification surcharge.
- **Automatic Shipping Rules**: Free insured shipping on orders above ₹1,000; flat ₹150 below threshold.
- **Email & Notification Engine**: Sends order confirmation, tracking updates, and PDF invoice generators via Nodemailer / console transport.
- **Dual-Mode Persistence**:
  1. **PostgreSQL + Drizzle ORM**: For production environments (`DATABASE_URL`).
  2. **In-Memory Store**: Auto-fallback when running locally without PostgreSQL.

---

## 🔑 Demo Test Account Credentials

The application is pre-seeded with a complete luxury test account:

| Field | Demo Credential |
| :--- | :--- |
| **Email** | `demo@aurnya.com` |
| **Password** | `AurNya@123` |
| **Full Name** | Sarthak Singh |
| **Phone** | `+91 9525509617` |
| **Preloaded Addresses** | Mumbai (Home) & Bangalore (Boutique Office) |
| **Preloaded Orders** | **#1001** (Delivered), **#1002** (In Transit), **#1003** (Cash on Delivery) |
| **Wishlist Items** | 3 Botanical Diamond & Gold Rings |

*Note: In the login modal, you can also click the single-click **"Fill Demo Credentials"** button.*

---

## 🚀 Running the Project Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in your browser
http://localhost:3000
```

### Running Tests & Typechecks

```bash
# Run all 147 test cases (100% passing)
npm test

# Run TypeScript strict type verification
npm run typecheck
```
