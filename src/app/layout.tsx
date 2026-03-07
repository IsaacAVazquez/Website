export const dynamic = 'force-dynamic';

import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { twMerge } from "tailwind-merge";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { Providers } from "@/components/Providers";
import { StaticHeader } from "@/components/StaticHeader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
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

        <AIStructuredData
          schema={{
            type: "Person",
            data: {
              name: "Isaac Vazquez",
              jobTitle: "Technical Product Manager & UC Berkeley Haas MBA Candidate",
              description:
                "Technical Product Manager and UC Berkeley Haas MBA Candidate '27 with 6+ years experience in SaaS and consumer products. Building mission-driven products that balance user insight, data-driven decisions, and cross-functional collaboration.",
              url: "https://isaacavazquez.com",
              image: "https://isaacavazquez.com/opengraph-image",
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
      </head>
      <body
        className={twMerge(
          inter.variable,
          jetbrainsMono.variable,
          "font-sans min-h-screen antialiased"
        )}
      >
        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--neutral-900)] focus:text-white focus:rounded-lg focus:shadow-lg">
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
