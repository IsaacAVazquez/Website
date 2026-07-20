import "./globals.css";
import {
  Fragment_Mono,
  Instrument_Sans,
  Instrument_Serif,
} from "next/font/google";
import { twMerge } from "tailwind-merge";
import { constructMetadata } from "@/lib/seo";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { Providers } from "@/components/Providers";
import { StaticHeader } from "@/components/StaticHeader";

// Working Instrument type stack (2026-07 redesign): three families instead of
// the previous five. Instrument Sans is the primary display + body face, so it
// loads with swap + preload — it is used above the fold on every route.
// Bricolage Grotesque, Inter, and JetBrains Mono are retired; globals.css
// aliases their old CSS variables to this stack for any stale references.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

// Serif survives for a single italic gesture in deks and manifestos.
// display: "optional" keeps the decorative face from causing a late shift.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "optional",
  preload: false,
});

// Fragment Mono (400 only) carries readouts, kickers, and micro-labels.
const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fragment-mono",
  display: "swap",
  preload: false,
});

export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F6F5F1" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#151412" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Isaac Vazquez" />
        <meta name="application-name" content="Isaac Vazquez Portfolio" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta name="msapplication-TileColor" content="#191813" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="72x72" href="/icons/icon-72x72.png" />
        <link rel="alternate" type="application/rss+xml" title="Isaac Vazquez - Writing & Insights" href="/api/rss" />
      </head>
      <body
        className={twMerge(
          instrumentSans.variable,
          instrumentSerif.variable,
          fragmentMono.variable,
          "font-sans min-h-screen antialiased"
        )}
      >
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--home-signal)] focus:ring-offset-2"
            style={{
              backgroundColor: "var(--home-ink)",
              color: "var(--home-paper)",
            }}
          >
            Skip to main content
          </a>
          <StaticHeader />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
