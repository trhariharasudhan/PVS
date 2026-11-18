import type { Metadata } from "next";
import { Fraunces, Noto_Serif_Tamil, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

// Editorial serif with a soft, hand-made feel: modern, but rooted in tradition.
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

// Tamil accents (பட்டு, பாரம்பரியம் …)
const tamil = Noto_Serif_Tamil({
  subsets: ["tamil"],
  weight: ["400", "600"],
  variable: "--font-tamil",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.brandTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
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
    locale: "en_IN",
    url: siteConfig.url,
    title: siteConfig.brandTitle,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Pattu Saree Manufacturer`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Pattu Saree Manufacturer`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD structured data for PVS Pattu Saree Manufacturer
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.business.name,
    description: siteConfig.description,
    image: siteConfig.ogImage,
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
    <html lang="en" className={`${serif.variable} ${jakarta.variable} ${tamil.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-ivory-50 text-charcoal-900 antialiased selection:bg-silk-red-700 selection:text-gold-200">
        <SmoothScroll />
        <Navbar />
        <main id="main" className="flex-grow">
          {children}
        </main>
        <Footer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
