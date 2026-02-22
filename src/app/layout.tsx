import "./globals.css";
import { twMerge } from "tailwind-merge";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
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
    <html lang="en" className="scroll-smooth">
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
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />

        <AIStructuredData
          schema={{
            type: "Person",
            data: {
              name: "Isaac Vazquez",
              jobTitle: "Technical Product Manager & UC Berkeley Haas MBA Candidate",
              description:
                "Technical Product Manager and UC Berkeley Haas MBA Candidate '27 with 6+ years experience in SaaS and consumer products. Building mission-driven products that balance user insight, data-driven decisions, and cross-functional collaboration.",
              url: "https://isaacavazquez.com",
              image: "https://isaacavazquez.com/og-image.png",
              email: "IsaacVazquez@berkeley.edu",
              sameAs: [
                "https://linkedin.com/in/isaac-vazquez",
                "https://github.com/IsaacAVazquez",
              ],
              address: {
                addressLocality: "Berkeley",
                addressRegion: "CA",
                addressCountry: "US",
              },
              knowsAbout: [
                "Product Management",
                "Product Strategy",
                "Product Discovery",
                "Cross-functional Leadership",
                "Quality Assurance",
                "Test Automation",
                "Consumer Technology",
                "SaaS Platforms",
                "Data Analysis",
                "Agile/Scrum",
              ],
              expertise: [
                {
                  name: "Product Management",
                  proficiencyLevel: "Advanced",
                  yearsExperience: 3,
                  description: "Product strategy, discovery, roadmapping, and cross-functional leadership",
                },
                {
                  name: "Quality Assurance",
                  proficiencyLevel: "Expert",
                  yearsExperience: 6,
                  description: "Test automation, quality strategy, release management, and continuous improvement",
                },
              ],
              alumniOf: [
                {
                  "@type": "CollegeOrUniversity",
                  name: "UC Berkeley Haas School of Business",
                  description: "MBA Candidate (Class of 2027)",
                },
                {
                  "@type": "CollegeOrUniversity",
                  name: "Florida State University",
                  description: "Bachelor of Arts - Political Science and International Affairs",
                },
              ],
              worksFor: {
                "@type": "Organization",
                name: "Civitech",
                description: "Civic technology company providing voter engagement platforms",
                url: "https://civitech.io",
              },
            },
          }}
        />

        <StructuredData type="WebSite" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const storedTheme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = storedTheme || 'system';
                document.documentElement.dataset.theme = theme;
                const useDark = theme === 'dark' || (theme === 'system' && prefersDark);
                document.documentElement.classList.toggle('dark', useDark);
              } catch (_) {}
            })();`,
          }}
        />
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
