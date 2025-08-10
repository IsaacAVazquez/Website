import "./globals.css";
import { Inter, JetBrains_Mono, Orbitron } from "next/font/google";
import { twMerge } from "tailwind-merge";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { Providers } from "@/components/Providers";
import { Analytics } from "@/components/Analytics";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});


const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth-dark">
      <head>
        {/* PWA and Theme Meta Tags */}
        <meta name="theme-color" content="#00F5FF" />
        <meta name="color-scheme" content="dark light" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FF Analytics" />
        <meta name="application-name" content="Fantasy Football Analytics" />
        <meta name="msapplication-TileColor" content="#0A0A0B" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#00F5FF" />
        
        {/* Structured Data */}
        <StructuredData type="Person" />
        <StructuredData type="WebSite" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            })();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring initialization
              (function() {
                if (typeof window !== 'undefined' && '${process.env.NODE_ENV}' === 'development') {
                  const startTime = performance.now();
                  window.addEventListener('load', function() {
                    const loadTime = performance.now() - startTime;
                    console.log('🚀 Page loaded in ' + loadTime.toFixed(2) + 'ms');
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={twMerge(
          inter.className,
          inter.variable,
          jetbrainsMono.variable,
          orbitron.variable,
          "min-h-screen antialiased bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0A0A0B] dark:via-[#0F172A] dark:to-[#1E293B] text-slate-900 dark:text-slate-50"
        )}
      >
        <Analytics>
          <Providers>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-electric-blue focus:text-slate-900 focus:rounded-md focus:shadow-lg">
              Skip to main content
            </a>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </Providers>
        </Analytics>
      </body>
    </html>
  );
}
