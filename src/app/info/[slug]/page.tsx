import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { site } from '@/config/site';
import { social } from '@/lib/env';
import { CookieSettingsClient } from './cookie-settings-client';

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () =>
  Object.keys(site.info).map((slug) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = site.info[slug];
  return t ? { title: `${t} | AurNya`, alternates: { canonical: `/info/${slug}` } } : {};
}

export default async function Info({ params }: Props) {
  const { slug } = await params;
  const t = site.info[slug];
  if (!t) notFound();

  const body = renderBody(slug);

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-14">
      <div className="mb-10 border-b border-[#e4d2a8]/40 pb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#9b7e47] mb-2 font-medium">AurNya · Legal &amp; Information</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium text-charcoal">{t}</h1>
      </div>
      <div className="prose prose-lg max-w-none text-muted [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-charcoal [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-charcoal [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_li]:text-muted [&_a]:text-charcoal [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#9b7e47]">
        {body}
      </div>
    </div>
  );
}

function renderBody(slug: string) {
  switch (slug) {
    case 'delivery-information':
      return (
        <div>
          <p>
            At AurNya, every piece of jewellery is hand-inspected, packed in our signature velvet-lined ivory presentation box, and sealed with tamper-evident security tape before leaving our vault.
          </p>
          <h2>Domestic Delivery (Across India)</h2>
          <ul>
            <li><strong>Dispatched Timeline:</strong> Orders are dispatched within 24 to 48 business hours after quality clearance and payment verification.</li>
            <li><strong>Transit Duration:</strong> 3 to 5 business days for major metropolitan hubs (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata); 5 to 7 business days for regional and non-metro pin codes.</li>
            <li><strong>Complimentary Shipping:</strong> Free insured express shipping on all orders above ₹999.</li>
            <li><strong>Standard Shipping:</strong> A flat ₹99 fee applies to orders below ₹999.</li>
          </ul>
          <h2>Express Vault Delivery</h2>
          <ul>
            <li>Available in select metro pin codes for rapid same-day or next-day delivery.</li>
            <li>Handled exclusively by specialized secure-logistics couriers with OTP handover.</li>
            <li>Optional flat charge: ₹199.</li>
          </ul>
          <h2>Secured &amp; Insured Transit</h2>
          <p>
            Every shipment is 100% transit-insured against damage or loss until safe handover. To ensure complete privacy and discretion, our parcels are shipped in discreet external packaging without any brand jewelry markers.
          </p>
          <h2>Delivery Handover Policy</h2>
          <p>
            Due to the high intrinsic value of fine jewellery, delivery handover requires customer OTP confirmation or recipient signature. Our courier partners will attempt delivery up to 3 times before returning the parcel to our central warehouse.
          </p>
          <h2>Delivery Inquiries</h2>
          <p>
            For urgent dispatch inquiries or custom date scheduling, reach out to our Concierge team at <a href="mailto:concierge@aurnya.com">concierge@aurnya.com</a> or phone <a href="tel:18002660123">1800-266-0123</a>.
          </p>
        </div>
      );

    case 'international-shipping':
      return (
        <div>
          <p>
            AurNya is proud to cater to patrons across the globe. Our bespoke packaging and insured logistics ensure your jewellery arrives safely across international borders.
          </p>
          <h2>Supported Destinations</h2>
          <p>
            We regularly ship to the United States, United Kingdom, Canada, United Arab Emirates, Singapore, Australia, Germany, France, Switzerland, and select GCC countries. If your country is not listed, our concierge team can organize special customs handling.
          </p>
          <h2>International Shipping Rates &amp; Timelines</h2>
          <ul>
            <li><strong>United Arab Emirates &amp; Singapore:</strong> ₹1,499 flat fee. Transit time: 4 to 7 business days via DHL Express / FedEx Priority.</li>
            <li><strong>USA, UK &amp; Canada:</strong> ₹2,199 flat fee. Transit time: 6 to 10 business days.</li>
            <li><strong>Europe &amp; Australia:</strong> ₹2,499 flat fee. Transit time: 7 to 12 business days.</li>
          </ul>
          <h2>Customs Duties, Import Taxes &amp; Tariffs</h2>
          <p>
            International consignments may attract local import duties, VAT, or customs clearance charges as mandated by the destination government. These charges are the sole legal responsibility of the recipient customer and are collected directly by the carrier upon clearance. AurNya does not inflate or collect foreign duties at checkout.
          </p>
          <h2>International Returns</h2>
          <p>
            We welcome international returns initiated within 14 calendar days of delivery. For detailed instructions on courier return labels and insurance coverage, please read our <Link href="/info/returns-exchanges">Returns &amp; Exchanges policy</Link>.
          </p>
        </div>
      );

    case 'payment-options':
      return (
        <div>
          <p>
            AurNya offers bank-grade, encrypted checkout mechanisms supporting all major domestic and international payment gateways.
          </p>
          <h2>Accepted Payment Modes</h2>
          <h3>1. Credit &amp; Debit Cards</h3>
          <p>
            We accept Visa, MasterCard, American Express, Diners Club, and RuPay cards. All transactions are authenticated using mandatory 3D Secure 2.0 (Verified by Visa, MasterCard Identity Check).
          </p>
          <h3>2. Instant UPI (Unified Payments Interface)</h3>
          <p>
            Seamlessly pay via Google Pay, PhonePe, Paytm, BHIM, or your personal bank UPI app via direct intent or dynamic QR scan.
          </p>
          <h3>3. Net Banking</h3>
          <p>
            Direct net banking integrations with over 55+ scheduled Indian banks including HDFC, ICICI, SBI, Axis, and Kotak Mahindra Bank.
          </p>
          <h3>4. Flexible EMI Options</h3>
          <p>
            Available on select credit cards and debit cards with tenures ranging from 3 to 24 months. No-cost EMI options are highlighted during promotional sales.
          </p>
          <h3>5. Cash on Delivery (COD)</h3>
          <p>
            Available for orders up to ₹25,000 across 18,000+ eligible pin codes in India. A nominal ₹49 COD verification fee applies.
          </p>
          <h2>Payment Security &amp; Compliance</h2>
          <p>
            AurNya operates in strict adherence to PCI-DSS Level 1 compliance through our certified payment processor, Razorpay. No card details, CVVs, or bank credentials are ever stored on AurNya servers.
          </p>
        </div>
      );

    case 'track-your-order':
      return (
        <div>
          <p>
            Stay updated with real-time transit telemetry for your AurNya order from artisan workshop preparation to final delivery.
          </p>
          <h2>Tracking Methods</h2>
          <ul>
            <li><strong>Through Your Customer Account:</strong> Log in and navigate to <Link href="/account">My Account &gt; Order History</Link> to view live status updates and airway bill (AWB) numbers.</li>
            <li><strong>SMS &amp; Email Dispatch Alerts:</strong> As soon as your jewellery leaves our vault, an automated notification containing courier tracking URLs is sent to your registered contact details.</li>
            <li><strong>Direct Courier Partner Tracking:</strong> You can enter your tracking code directly into the Bluedart, Delhivery, or FedEx tracking portals.</li>
          </ul>
          <h2>Order Lifecycle States</h2>
          <ol>
            <li><strong>Payment Confirmed:</strong> Order validated and allocated to workshop.</li>
            <li><strong>Crafting &amp; Quality Check:</strong> Hallmarking verification and velvet box packaging.</li>
            <li><strong>Dispatched:</strong> Handed over to logistics with transit insurance activated.</li>
            <li><strong>Out for Delivery:</strong> Courier representative assigned for same-day delivery handover.</li>
            <li><strong>Delivered:</strong> Completed upon recipient OTP verification.</li>
          </ol>
          <div className="mt-8 rounded-2xl border border-charcoal/20 bg-surface p-6">
            <h3 className="font-serif text-xl font-medium text-charcoal mb-2">Need Immediate Tracking Assistance?</h3>
            <p className="text-sm text-muted mb-4">
              If your tracking link has not updated within 24 hours, our logistics concierge will gladly pull telemetry records for you.
            </p>
            <a
              href="https://wa.me/918147349242?text=Hello%20AurNya%2C%20I%20need%20tracking%20assistance%20for%20my%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#211a28] px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-ivory hover:bg-[#34293f] transition"
            >
              WhatsApp Concierge Support →
            </a>
          </div>
        </div>
      );

    case 'returns-exchanges':
      return (
        <div>
          <p>
            We want you to wear your AurNya jewellery with unconditional delight. If you are not completely enchanted by your piece, we offer a hassle-free 7-day return and exchange policy.
          </p>
          <h2>7-Day Return &amp; Exchange Window</h2>
          <ul>
            <li>Eligible within 7 calendar days from the date of recorded parcel delivery.</li>
            <li>Items must be unworn, undamaged, with original security tags intact, and accompanied by the original hallmark certificate and presentation box.</li>
            <li>Customized, laser-engraved, or bespoke commissions are made specifically for you and cannot be returned unless a manufacturing defect is verified.</li>
          </ul>
          <h2>Step-by-Step Return Process</h2>
          <ol>
            <li>Email our returns desk at <a href="mailto:returns@aurnya.com">returns@aurnya.com</a> or message WhatsApp at +91 8147349242 with your Order ID and photos of the piece.</li>
            <li>Our team will authorize the return and generate a prepaid, insured reverse pickup label.</li>
            <li>Our courier partner will arrange secure pickup from your address with an acknowledgment receipt.</li>
            <li>Upon safe arrival at our quality control lab, our gemologists will inspect the piece within 48 hours.</li>
          </ol>
          <h2>Refund Reimbursements</h2>
          <ul>
            <li><strong>Prepaid Orders (Cards/UPI/Net Banking):</strong> Refund processed back to original source account within 5 to 7 banking days.</li>
            <li><strong>Cash on Delivery (COD) Orders:</strong> Refund issued via direct NEFT/IMPS bank transfer or instant AurNya Store Credit within 3 business days of bank detail submission.</li>
          </ul>
        </div>
      );

    case 'find-a-boutique':
      return (
        <div>
          <p>
            Immerse yourself in the tactile world of AurNya. Visit our luxury flagship boutiques to experience our gemstones in natural light, consult with private diamond stylists, and receive bespoke sizing.
          </p>
          <h2>Flagship Boutiques</h2>
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-[#e4d2a8]/40 bg-surface p-6 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9b7e47]">Flagship Salon</span>
              <h3 className="font-serif text-2xl text-charcoal mt-1">AurNya — The Chanakya, New Delhi</h3>
              <p className="text-sm text-muted mt-2">
                1st Floor, The Chanakya, Yashwant Place Commercial Complex, Chanakyapuri, New Delhi — 110021
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-charcoal font-medium">
                <span>🕒 Mon – Sun: 11:00 AM – 8:30 PM</span>
                <span>📞 <a href="tel:01149887700">011-4988-7700</a></span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4d2a8]/40 bg-surface p-6 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9b7e47]">Signature Boutique</span>
              <h3 className="font-serif text-2xl text-charcoal mt-1">AurNya — Palladium, Mumbai</h3>
              <p className="text-sm text-muted mt-2">
                Level 2, Palladium Mall, High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai — 400013
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-charcoal font-medium">
                <span>🕒 Mon – Sun: 11:00 AM – 9:30 PM</span>
                <span>📞 <a href="tel:02266889900">022-6688-9900</a></span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4d2a8]/40 bg-surface p-6 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9b7e47]">Private Studio</span>
              <h3 className="font-serif text-2xl text-charcoal mt-1">AurNya — UB City, Bengaluru</h3>
              <p className="text-sm text-muted mt-2">
                Ground Level, The Collection, UB City, 24 Vittal Mallya Road, Bengaluru — 560001
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-charcoal font-medium">
                <span>🕒 Mon – Sun: 10:30 AM – 9:00 PM</span>
                <span>📞 <a href="tel:08044778800">080-4477-8800</a></span>
              </div>
            </div>
          </div>
          <h2>Bespoke VIP Appointments</h2>
          <p className="mt-6">
            Private VIP viewings and bridal consultation salons may be reserved 24 hours in advance by contacting <a href="mailto:boutique@aurnya.com">boutique@aurnya.com</a>.
          </p>
        </div>
      );

    case 'exercise-your-rights':
      return (
        <div>
          <p>
            AurNya respects your privacy as an inalienable right. Under the Indian Digital Personal Data Protection Act (DPDP Act, 2023), the Information Technology Act (2000), and European Union GDPR standards, you hold full legal entitlement to review and govern your personal data.
          </p>
          <h2>Your Recognized Statutory Rights</h2>
          <h3>1. Right to Access &amp; Summary</h3>
          <p>
            You may request a comprehensive summary of all personal data, transaction records, saved shipping addresses, and communication logs maintained by AurNya.
          </p>
          <h3>2. Right to Correction &amp; Erasure (&quot;Right to be Forgotten&quot;)</h3>
          <p>
            You may request rectification of inaccurate personal credentials, or demand full irrevocable erasure of your profile and account history, subject only to statutory tax retention laws (such as GST invoice records required for 7 years).
          </p>
          <h3>3. Right of Grievance Redressal</h3>
          <p>
            You have the right to register complaints regarding data handling directly with our appointed Data Protection and Grievance Officer.
          </p>
          <h3>4. Right to Nominate</h3>
          <p>
            You may designate another individual to exercise your rights on your behalf in the event of death or incapacity.
          </p>
          <h2>How to Submit an Official Data Rights Request</h2>
          <p>
            To initiate any of the above requests, email our Data Protection Office at <a href="mailto:privacy@aurnya.com">privacy@aurnya.com</a> with the subject header <em>&quot;Statutory Data Subject Request&quot;</em>. All requests are verified, documented, and fulfilled within 30 business days at zero cost to you.
          </p>
        </div>
      );

    case 'cyber-security-policy':
      return (
        <div>
          <p><em>Effective Date: 1 January 2025 | Version: 2.4 | Status: Active</em></p>
          <p>
            AurNya Luxury Jewels Limited is dedicated to ensuring the highest standards of digital hygiene, data encryption, and resilient defense architecture to safeguard customer assets and confidential communications.
          </p>
          <h2>1. Cryptographic Standards &amp; Architecture</h2>
          <ul>
            <li>All data in transit is encrypted using Transport Layer Security (TLS 1.3) with HSTS headers enforced across all endpoints.</li>
            <li>Data at rest within our serverless PostgreSQL cluster is protected via AES-256 bit hardware-level encryption.</li>
            <li>Customer passwords are protected via salted, computational-hardened bcrypt cryptographic hashing algorithms.</li>
          </ul>
          <h2>2. Payment &amp; Financial Security</h2>
          <p>
            AurNya does not handle, store, or inspect full credit card numbers, CVV codes, or netbanking credentials. Payment processing is tokenized through certified PCI-DSS Level 1 payment service providers with end-to-end webhook cryptographic signature verification.
          </p>
          <h2>3. Multi-Factor Authentication &amp; Staff Access</h2>
          <p>
            Administrative panels, owner consoles, and fulfillment systems strictly enforce Time-based One-Time Password (TOTP) / Email OTP authentication. Staff privileges follow the principle of least privilege (PoLP) and are logged in immutable activity audit trails.
          </p>
          <h2>4. Responsible Vulnerability Disclosure</h2>
          <p>
            We welcome independent security researchers to report potential vulnerabilities. Please submit proof-of-concept reports to <a href="mailto:security@aurnya.com">security@aurnya.com</a>. We commit to acknowledging disclosures within 48 hours and will not initiate legal action against researchers acting in good faith.
          </p>
        </div>
      );

    case 'terms-and-conditions':
      return (
        <div>
          <p><em>Last Updated: 1 January 2025 | Jurisdiction: New Delhi, India</em></p>
          <p>
            Welcome to the digital atelier of AurNya. By using our website (<Link href="/">aurnya.com</Link>), purchasing items, or interacting with our concierge, you agree to be legally bound by these Terms &amp; Conditions.
          </p>
          <h2>1. Proprietary Designs &amp; Intellectual Property</h2>
          <p>
            All jewellery designs, CAD models, photography, visual aesthetics, typography, trademarks, and logos displayed on this platform are the exclusive intellectual property of AurNya Luxury Jewels Limited and protected under the Copyright Act, 1957 and Trade Marks Act, 1999. Any reproduction, imitation, or redistribution is strictly prohibited.
          </p>
          <h2>2. Pricing, Invoicing &amp; Taxes</h2>
          <p>
            All prices displayed on the website are in Indian Rupees (INR) and inclusive of statutory Goods and Services Tax (GST). AurNya reserves the right to correct accidental typographic errors in pricing prior to order dispatch.
          </p>
          <h2>3. Contractual Formation</h2>
          <p>
            Receipt of an automated order confirmation email acknowledges intent to purchase but does not constitute legal contract finalization until our workshop confirms inventory validation and initiates courier dispatch.
          </p>
          <h2>4. Dispute Resolution &amp; Governing Law</h2>
          <p>
            These terms are governed exclusively by the laws of the Republic of India. Any unresolved dispute arising out of or in connection with this agreement shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.
          </p>
        </div>
      );

    case 'privacy-notice':
      return (
        <div>
          <p><em>Effective Date: 1 January 2025 | Compliant with DPDP Act 2023 &amp; GDPR</em></p>
          <p>
            AurNya Luxury Jewels Limited (&quot;AurNya&quot;, &quot;we&quot;, &quot;us&quot;) respects your privacy and is dedicated to transparency regarding the collection and management of your personal information.
          </p>
          <h2>Information We Collect</h2>
          <ul>
            <li><strong>Personal Identifiers:</strong> Name, shipping address, billing address, email, telephone number.</li>
            <li><strong>Transaction Data:</strong> Ordered jewellery styles, sizes, payment status identifiers, invoice numbers.</li>
            <li><strong>Device &amp; Telemetry Data:</strong> IP address, browser type, operating system, and session cookies.</li>
          </ul>
          <h2>How We Use Your Data</h2>
          <p>
            Your information is used strictly to fulfill purchases, coordinate secure courier dispatch, verify identity for fraud prevention, and provide personalized concierge assistance. We do not sell or rent customer data to third-party data brokers.
          </p>
          <h2>Third-Party Data Sharing</h2>
          <p>
            We only share data with vetted service partners essential for business fulfillment: logistics carriers (Bluedart, Delhivery), payment gateways (Razorpay), and transactional email dispatchers (Resend).
          </p>
        </div>
      );

    case 'disclaimer':
      return (
        <div>
          <p><em>Last Updated: 1 January 2025</em></p>
          <p>
            The contents and jewellery representations on this website are provided on an &quot;as is&quot; and &quot;as available&quot; basis for informational and commercial e-commerce purposes.
          </p>
          <h2>1. Handcrafted Variations</h2>
          <p>
            Each AurNya piece is handcrafted by master artisans. Minor variations in stone hue, natural diamond inclusions, or surface metal finish are authentic hallmarks of artisanal crafting and do not represent defectiveness.
          </p>
          <h2>2. Digital Display Fidelity</h2>
          <p>
            While we use calibrated studio photography and color-accurate monitors, variations in your personal screen color balance, brightness, or resolution may cause slight visual variance between digital imagery and physical products.
          </p>
          <h2>3. External Hyperlinks</h2>
          <p>
            AurNya is not responsible for the privacy practices, content, or availability of third-party platforms linked on our website (such as social networks or external logistics trackers).
          </p>
        </div>
      );

    case 'cookie-policy':
      return (
        <div>
          <p><em>Last Updated: 1 January 2025</em></p>
          <p>
            This Cookie Policy explains how AurNya utilizes cookies, pixel tags, and local storage technologies to deliver an effortless, tailored browsing experience.
          </p>
          <h2>What are Cookies?</h2>
          <p>
            Cookies are small cryptographic text files placed on your computer or mobile device when you visit our website. They allow the platform to remember your cart items, wishlisted jewellery, and display preferences across sessions.
          </p>
          <h2>Cookie Classifications</h2>
          <ul>
            <li><strong>Strictly Necessary:</strong> Essential for authenticating customer login sessions, CSRF security tokens, and preserving cart contents through checkout.</li>
            <li><strong>Analytical Cookies:</strong> Anonymized usage statistics that help us understand popular jewellery collections and optimize site speed.</li>
            <li><strong>Functional &amp; Preference:</strong> Remembers your dark/light theme choices and saved currency preferences.</li>
          </ul>
          <p className="mt-6">
            To customize your individual cookie settings at any time, please visit our interactive <Link href="/info/cookie-settings">Cookie Settings page</Link>.
          </p>
        </div>
      );

    case 'cookie-settings':
      return <CookieSettingsClient />;

    case 'offers-contests':
      return (
        <div>
          <p>
            Explore our curated seasonal promotions, bespoke anniversary privileges, and exclusive design contest guidelines.
          </p>
          <h2>Current Privileges &amp; Promotional Terms</h2>
          <ul>
            <li><strong>Welcome Privilege:</strong> Enjoy complimentary insured delivery across India on your first jewellery order above ₹999.</li>
            <li><strong>Promotional Discount Codes:</strong> Coupon codes must be applied in the shopping bag prior to checkout. Coupons cannot be redeemed retroactively or combined unless explicitly stated.</li>
            <li><strong>Gift with Purchase Offers:</strong> Complimentary jewellery care kits or travel pouches offered during seasonal drops are subject to stock availability and non-transferable for monetary value.</li>
          </ul>
          <h2>Design Contest &amp; Patron Giveaways</h2>
          <p>
            AurNya design contests hosted on our official Instagram (@aurnya) are open to legal residents of India aged 18 and older. Winners are chosen by an independent jury of artisans and notified exclusively via official company email or verified brand social handles.
          </p>
        </div>
      );

    case 'blog':
      return (
        <div>
          <p className="text-lg">
            Immerse yourself in stories of heritage craftsmanship, styling editorials, gemstone education, and reflections from the AurNya design atelier.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              {
                title: 'The Art of Gold Plating: How AurNya Achieves Lasting Lustre',
                date: 'October 2025',
                category: 'Craftsmanship',
                excerpt: 'Discover our multi-stage electroplating technique and protective micro-coatings engineered for everyday resilience.',
              },
              {
                title: 'Layering Necklaces with Confidence: A Stylist’s Blueprint',
                date: 'September 2025',
                category: 'Style Guide',
                excerpt: 'Proportion, chain textures, and focal pendants: how to curate necklines for daywear and evening gala occasions.',
              },
              {
                title: 'Demystifying Hallmarking: Understanding Purity Stamps',
                date: 'August 2025',
                category: 'Education',
                excerpt: 'A comprehensive guide to BIS hallmark laser stamps, karat purity measurements, and gemological certification.',
              },
              {
                title: 'Caring for Your Heirloom Jewels Across Changing Seasons',
                date: 'July 2025',
                category: 'Jewellery Care',
                excerpt: 'Simple ritual practices to safeguard your pieces from moisture, perfumes, and ambient oxidation.',
              },
            ].map((post) => (
              <article key={post.title} className="rounded-2xl border border-charcoal/20 bg-surface p-6 shadow-sm hover:border-[#e4d2a8] transition">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9b7e47] mb-2">
                  {post.category} · {post.date}
                </p>
                <h2 className="font-serif text-xl font-medium text-charcoal mt-0 mb-3">{post.title}</h2>
                <p className="text-sm text-muted leading-relaxed">{post.excerpt}</p>
                <div className="mt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal hover:text-[#9b7e47] transition">
                    Read Story →
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-6">
          <div>
            <h2>How do I care for my AurNya jewellery?</h2>
            <ul className="mt-2">{site.care.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          <div>
            <h2>Are all pieces hallmarked and certified?</h2>
            <p>
              Yes. All AurNya pieces are crafted to rigorous quality standards and come accompanied by certificate cards verifying metal purity and gemstone specifications.
            </p>
          </div>
          <div>
            <h2>Can I track my shipment online?</h2>
            <p>
              Absolutely. Check our <Link href="/info/track-your-order">Track Your Order</Link> page or visit your customer dashboard once your order is dispatched.
            </p>
          </div>
          <div>
            <h2>What happens if my ring size does not fit?</h2>
            <p>
              We provide free size exchanges within 7 calendar days of receipt. Contact our concierge at <a href="mailto:concierge@aurnya.com">concierge@aurnya.com</a>.
            </p>
          </div>
        </div>
      );

    case 'shipping':
      return (
        <div>
          <p>
            Please visit our dedicated <Link href="/info/delivery-information">Delivery Information</Link> page for full domestic delivery policies, and our <Link href="/info/international-shipping">International Shipping</Link> page for global shipping terms.
          </p>
        </div>
      );

    case 'returns':
      return (
        <div>
          <p>
            Please review our comprehensive <Link href="/info/returns-exchanges">Returns &amp; Exchanges</Link> guide for initiation instructions, timeframes, and refund procedures.
          </p>
        </div>
      );

    case 'privacy':
      return (
        <div>
          <p>
            Please review our formal <Link href="/info/privacy-notice">Privacy Notice</Link>, or visit <Link href="/info/exercise-your-rights">Exercise Your Rights</Link> to submit a data subject inquiry.
          </p>
        </div>
      );

    case 'terms':
      return (
        <div>
          <p>
            Please review our complete <Link href="/info/terms-and-conditions">Terms &amp; Conditions</Link> documentation.
          </p>
        </div>
      );

    case 'care':
      return (
        <div>
          <p>Keep your pieces shining for generations with our basic care guidelines:</p>
          <ul className="mt-3 list-disc pl-5 space-y-2">{site.care.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      );

    case 'tracking':
      return (
        <div>
          <p>
            To track an active order, please refer to our <Link href="/info/track-your-order">Track Your Order</Link> guide.
          </p>
        </div>
      );

    case 'contact':
      return (
        <div>
          <p>Our dedicated luxury concierge team is at your service 7 days a week, 9:00 AM to 9:00 PM IST.</p>
          <ul className="mt-4 space-y-2">
            <li>📞 Toll-free helpline: <a href="tel:18002660123">1800-266-0123</a></li>
            <li>💬 WhatsApp styling desk: <a href="https://wa.me/918147349242" target="_blank" rel="noopener noreferrer">+91 8147349242</a></li>
            <li>✉️ Email inquiries: <a href="mailto:concierge@aurnya.com">concierge@aurnya.com</a></li>
          </ul>
        </div>
      );

    default:
      return (
        <p className="text-muted">
          Page content is currently being updated. Please contact <a href="mailto:concierge@aurnya.com">concierge@aurnya.com</a> for assistance.
        </p>
      );
  }
}
