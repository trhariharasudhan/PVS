import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getI18n } from "@/i18n/server";

// Self-hosted (app/fonts) so builds never depend on Google Fonts being reachable.
// Editorial serif with a soft, hand-made feel: modern, but rooted in tradition.
const serif = localFont({
  src: [
    { path: "./fonts/fraunces-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/fraunces-latin-wght-italic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

// Tamil headings & accents (பட்டு, பாரம்பரியம் …)
const tamil = localFont({
  src: [
    { path: "./fonts/noto-serif-tamil-tamil-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/noto-serif-tamil-tamil-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-tamil",
  display: "swap",
});

// Tamil body text
const tamilSans = localFont({
  src: [{ path: "./fonts/noto-sans-tamil-tamil-wght-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-tamil-sans",
  display: "swap",
});

const jakarta = localFont({
  src: [{ path: "./fonts/plus-jakarta-sans-latin-wght-normal.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const { locale, t } = getI18n();
  return {
  title: {
    default: t.meta.siteTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: t.meta.siteDescription,
  keywords: [
    "pattu sarees",
    "pattu saree manufacturer",
    "silk sarees",
    "wholesale pattu sarees",
    "pattu saree manufacturer salem",
    "silk saree wholesale tamil nadu",
    "PVS",
    "PVS pattu sarees",
    "Kalipatti silk sarees",
    "Panjakalipatti manufacturer",
    "bridal pattu saree wholesale",
    "custom silk saree order",
    "made to order pattu saree",
    "silk saree weaver salem",
    "traditional silk sarees",
  ],
  authors: [{ name: `${siteConfig.name} - Sathish Kumar` }],
  creator: siteConfig.name,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: "website",
    locale: locale === "ta" ? "ta_IN" : "en_IN",
    url: siteConfig.url,
    title: t.meta.siteTitle,
    description: t.meta.siteDescription,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Pattu Saree Manufacturer`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, t } = getI18n();
  // JSON-LD structured data for PVS Pattu Saree Manufacturer
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.business.name,
    description: siteConfig.description,
    image: `${siteConfig.url}${siteConfig.ogImage}`,
    url: siteConfig.url,
    telephone: siteConfig.business.phone,
    founder: {
      "@type": "Person",
      name: siteConfig.business.owner,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: `${siteConfig.business.address.street}, ${siteConfig.business.address.village}`,
      addressLocality: siteConfig.business.address.post,
      addressRegion: siteConfig.business.address.state,
      postalCode: siteConfig.business.address.pincode,
      addressCountry: "IN",
    },
  };

  return (
    <html lang={locale} className={`${serif.variable} ${jakarta.variable} ${tamil.variable} ${tamilSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-ivory-50 text-charcoal-900 antialiased selection:bg-silk-red-700 selection:text-gold-200">
        <I18nProvider locale={locale} dict={t}>
          <SmoothScroll />
          <Navbar />
          <main id="main" className="flex-grow">
            {children}
          </main>
          <Footer />
          <FloatingWhatsApp />
        </I18nProvider>
      </body>
    </html>
  );
}
