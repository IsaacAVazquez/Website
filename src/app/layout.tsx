import "./globals.css";
import {
  Instrument_Sans,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import { twMerge } from "tailwind-merge";
import { constructMetadata } from "@/lib/seo";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { Providers } from "@/components/Providers";
import { StaticHeader } from "@/components/StaticHeader";

// Inter is body text everywhere, but Chrome was warning that the
// preloaded weight subset wasn't used "within a few seconds" of the
// load event — the wordmark uses Instrument Sans above the fold and
// Inter sits below. preload: false skips the link-preload header; the
// system font stack covers first paint and Inter swaps in as expected
// once the woff2 lands. Weights are pinned to what we actually use so
// Next doesn't ship extra weight subsets.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

// JetBrains Mono only appears in code blocks / kicker meta. Skip the
// link-preload so Chromium stops warning that it loaded but went unused
// on pages with no code or meta — it still loads on demand.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
});

// Display-only fonts use display: "optional" so the browser falls back to
// the system stack if the webfont isn't immediately available, avoiding the
// late layout shift that swap can cause on these decorative families.
// preload: false matches optional — preloading + skipping-on-late-load
// triggered the "preloaded but not used" warnings on every page.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "optional",
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "optional",
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
        <meta name="theme-color" content="#2563EB" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Isaac Vazquez" />
        <meta name="application-name" content="Isaac Vazquez Portfolio" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta name="msapplication-TileColor" content="#2563EB" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="72x72" href="/icons/icon-72x72.png" />
        <link rel="alternate" type="application/rss+xml" title="Isaac Vazquez - Writing & Insights" href="/api/rss" />
      </head>
      <body
        className={twMerge(
          inter.variable,
          jetbrainsMono.variable,
          instrumentSans.variable,
          instrumentSerif.variable,
          "font-sans min-h-screen antialiased"
        )}
      >
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--home-haze)] focus:ring-offset-2"
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
