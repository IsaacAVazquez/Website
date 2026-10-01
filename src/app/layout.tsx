import type { Viewport } from "next";
import "./globals.css";
import {
  Anton,
  Archivo,
  Fragment_Mono,
  Great_Vibes,
  Instrument_Sans,
  Newsreader,
} from "next/font/google";
import { twMerge } from "tailwind-merge";
import { constructMetadata } from "@/lib/seo";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { Providers } from "@/components/Providers";

// Instrument Sans is what Tailwind's font-sans utility names (see
// tailwind.config.ts). It is left over from the Working Instrument, and a few
// fantasy and score pools elements still set font-sans.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

// Fragment Mono (400 only) carries readouts, kickers, and micro-labels. It
// preloads because mono chips sit above the fold on the tool routes, and it
// falls back to a plain monospace stack: next/font's generated fallback
// measured about a third wider on uppercase, tracked labels, so a late swap
// rewrapped the fantasy board's header chips and moved the board 64px on a
// throttled phone (CLS 0.16, 2026-09-14). Menlo and Courier New land within
// 4px of the real face on those chips.
const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fragment-mono",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["Menlo", "Courier New", "monospace"],
});

/*
 * Catalog 97 type stack, used on every route (see catalog97.css). Anton
 * preloads because every h1 is poster type, and Archivo because it is the
 * body face; the rest load on demand.
 */

// Newsreader sets the names of things inside a page, mostly below the hero,
// and preloading it would add six files (three weights, two styles) to every
// route, so it loads on demand.
const c97Newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-c97-newsreader",
  display: "swap",
  preload: false,
});

// Cross-platform stand-in for Helvetica Neue, which is macOS-only. It is the
// body face above the fold on every route, so it preloads.
const c97Archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-c97-archivo",
  display: "swap",
  preload: true,
});

// The print-shop headline face: every landing h1 and section h2, plus the plate numerals.
const c97Anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-c97-anton",
  display: "swap",
  preload: true,
});

// Footer wordmark only. Fallback for Snell Roundhand, which is macOS-only.
const c97GreatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-c97-great-vibes",
  display: "optional",
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1ebdf" },
    { media: "(prefers-color-scheme: dark)", color: "#14100c" },
  ],
  colorScheme: "light dark",
};

export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Isaac Vazquez" />
        <meta name="application-name" content="Isaac Vazquez Portfolio" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta name="msapplication-TileColor" content="#2b211a" />
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
          fragmentMono.variable,
          c97Newsreader.variable,
          c97Archivo.variable,
          c97Anton.variable,
          c97GreatVibes.variable,
          "font-sans min-h-screen antialiased"
        )}
      >
        <Providers>
          <a
            href="#main-content"
            className="c97-skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2"
          >
            Skip to main content
          </a>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
