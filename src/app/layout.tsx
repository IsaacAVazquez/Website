import "./globals.css";
import { twMerge } from "tailwind-merge";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { Providers } from "@/components/Providers";
import { Analytics } from "@/components/Analytics";

// Use system fonts as fallback when Google Fonts are unavailable
// This ensures the build succeeds in restricted network environments
const fontConfig = {
  inter: {
    variable: "--font-inter",
    className: "font-sans",
  },
  jetbrainsMono: {
    variable: "--font-jetbrains-mono",
    className: "font-mono",
  },
  orbitron: {
    variable: "--font-orbitron",
    className: "font-display",
  },
};

export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth-dark">
      <head>
        {/* PWA and Theme Meta Tags - Mouthwash Monochrome */}
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark light" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Isaac Vazquez" />
        <meta name="application-name" content="Isaac Vazquez Portfolio" />
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

        {/* FAQ Structured Data for better SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is Isaac Vazquez's product management experience?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Isaac Vazquez has 6+ years of experience in product-adjacent roles including quality assurance leadership at Civitech (civic tech), data analytics at Florida State University, and client services at Open Progress. Currently pursuing MBA at UC Berkeley Haas to deepen product management expertise."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What kind of product management roles is Isaac Vazquez looking for?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Isaac is seeking Associate Product Manager (APM) or Product Manager roles in Austin TX or San Francisco Bay Area, particularly in civic tech, SaaS, or mission-driven startups. Interested in opportunities leveraging technical background and data analytics skills."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is Isaac Vazquez's technical background?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Isaac has extensive technical experience including quality assurance leadership, test automation (Cypress), SQL and data analysis, API testing, and Agile/Scrum methodologies. Led QA initiatives for voter engagement platforms at Civitech."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Where is Isaac Vazquez located?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Isaac is based in the Bay Area while attending UC Berkeley Haas and has strong ties to Austin, TX. Open to opportunities in both locations and remote positions with mission-driven organizations."
                  }
                }
              ]
            })
          }}
        />
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
          fontConfig.inter.className,
          "min-h-screen antialiased bg-white dark:bg-black text-black dark:text-white"
        )}
        style={{
          [fontConfig.inter.variable as string]: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          [fontConfig.jetbrainsMono.variable as string]: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          [fontConfig.orbitron.variable as string]: 'Orbitron, "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
        } as React.CSSProperties}
      >
        <Analytics>
          <Providers>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black focus:shadow-lg">
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
