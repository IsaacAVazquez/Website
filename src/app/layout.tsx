import "./globals.css";
import { twMerge } from "tailwind-merge";
import { constructMetadata } from "@/lib/seo";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { Providers } from "@/components/Providers";
import { Analytics } from "@/components/Analytics";
import { StaticHeader } from "@/components/StaticHeader";

const fontConfig = {
  inter: {
    variable: "--font-inter",
    className: "font-sans",
  },
  jetbrainsMono: {
    variable: "--font-jetbrains-mono",
    className: "font-mono",
  },
};

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
          fontConfig.inter.className,
          "min-h-screen antialiased"
        )}
        style={{
          [fontConfig.inter.variable as string]: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          [fontConfig.jetbrainsMono.variable as string]: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        } as React.CSSProperties}
      >
        <Analytics>
          <Providers>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--neutral-900)] focus:text-white focus:rounded-lg focus:shadow-lg">
              Skip to main content
            </a>
            <StaticHeader />
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </Providers>
        </Analytics>
      </body>
    </html>
  );
}
