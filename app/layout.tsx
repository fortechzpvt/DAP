import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL, SITE_NAME, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dinesh A Pathum | Travel & Trekking Videos",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Sri Lankan travel and trekking creator documenting journeys across the Himalayas and Sri Lanka's hill country, from the Annapurna Circuit to the Everest region and beyond.",
  keywords: [
    "Dinesh A Pathum",
    "Sri Lankan travel vlogger",
    "trekking YouTuber",
    "Annapurna Circuit",
    "Everest region trek",
    "Sri Lanka hill country",
    "Nepal trekking Sri Lankan",
  ],
  authors: [{ name: "Dinesh A Pathum" }],
  creator: "Dinesh A Pathum",
  publisher: "Dinesh A Pathum",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Dinesh A Pathum | Travel & Trekking Videos",
    description:
      "Sri Lankan travel and trekking creator documenting journeys across the Himalayas and Sri Lanka's hill country.",
    url: "/",
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE,
        width: 1440,
        height: 810,
        alt: "Dinesh A Pathum on a trek in the Everest region, Nepal",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dinesh A Pathum | Travel & Trekking Videos",
    description:
      "Sri Lankan travel and trekking creator documenting journeys across the Himalayas and Sri Lanka's hill country.",
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Dinesh A Pathum",
  url: SITE_URL,
  jobTitle: "Travel & Trekking Content Creator",
  sameAs: [] as string[],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === "production" && (
          // No 'unsafe-eval' here on purpose. Dev mode needs it for React's
          // debugging tools, but the production static export doesn't, and
          // this block only runs in production anyway.
          // connect-src allows *.supabase.co for the Travel Tips read path
          // (lib/supabaseClient.ts). Docs: docs/architecture/travel-tips-backend.md
          <meta
            httpEquiv="Content-Security-Policy"
            content="default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; frame-src https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self' https://cloudflareinsights.com https://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
          />
        )}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;900&family=Poppins:wght@700;900&display=swap"
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className="bg-cream text-dark antialiased">
        {/* Shared SVG filter for the liquid-glass buttons' light-refraction effect */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <filter id="glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="6" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="26" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
