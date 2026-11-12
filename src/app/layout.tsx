import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { themeBootScript } from "@/lib/theme-boot";
import "./globals.css";
import { site } from "@/config/site";
import { siteUrl } from "@/lib/env";
import { ShopProvider } from "@/store/shop-context";
import { AuthProvider } from "@/store/auth-context";
import { AnnouncementBar } from "@/components/announcement-bar";
import { Header } from "@/components/header";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { RouteLoader } from "@/components/route-loader";
import { JsonLd } from "@/components/json-ld";
import { HideOnAdmin } from "@/components/hide-on-admin";
import { MaintenanceGuard } from "@/components/maintenance-guard";

// Fonts are bundled in src/fonts (Cormorant Garamond + Jost, both SIL Open Font License), so builds never need internet access to Google.
const serif = localFont({
  src: [
    {
      path: "../fonts/cormorant-garamond-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/cormorant-garamond-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});
const sans = localFont({
  src: [
    {
      path: "../fonts/jost-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/jost-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});
// The browser/phone bar colour (theme-color) is set by the theme script, because it must follow the visitor's choice, not just their device.
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    images: ["/images/packaging.jpg"],
  },
  twitter: { card: "summary_large_image" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const url = siteUrl();
  return (
    <html
      lang="en-IN"
      className={`${serif.variable} ${sans.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                name: site.name,
                url,
                logo: `${url}/images/logo.png`,
                slogan: site.tagline,
              },
              {
                "@type": "WebSite",
                name: site.name,
                url,
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${url}/shop?q={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }}
        />
        <AuthProvider>
          <ShopProvider>
            <Suspense fallback={null}>
              <MaintenanceGuard>
                <HideOnAdmin><RouteLoader /></HideOnAdmin>

                <a
                  href="#main"
                  className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:bg-charcoal focus:px-4 focus:py-2 focus:text-ivory"
                >
                  Skip to content
                </a>
                {/* WRAP THE ANNOUNCEMENT BAR IN SUSPENSE */}

                <HideOnAdmin><AnnouncementBar /></HideOnAdmin>

                <HideOnAdmin><Header /></HideOnAdmin>

                <main id="main">{children}</main>

                <HideOnAdmin><Footer /></HideOnAdmin>

                <HideOnAdmin><CartDrawer /></HideOnAdmin>
              </MaintenanceGuard>
            </Suspense>
          </ShopProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
