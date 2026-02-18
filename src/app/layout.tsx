import "./globals.css";
import { twMerge } from "tailwind-merge";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { Providers } from "@/components/Providers";
import { Analytics } from "@/components/Analytics";
import { TopLoadingBar } from "@/components/ui/TopLoadingBar";
import { GestureTutorial } from "@/components/ui/GestureTutorial";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { StaticHeader } from "@/components/StaticHeader";

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
    <html lang="en" className="scroll-smooth">
      <head>
        {/* PWA and Theme Meta Tags - Warm Modern Design */}
        <meta name="theme-color" content="#D97756" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Mobile Optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Isaac Vazquez" />
        <meta name="application-name" content="Isaac Vazquez Portfolio" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />

        {/* Windows Tiles */}
        <meta name="msapplication-TileColor" content="#D97756" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#00F5FF" />
        
        {/* AI-Optimized Structured Data */}
        <AIStructuredData
          schema={{
            type: "Person",
            data: {
              name: "Isaac Vazquez",
              jobTitle: "Technical Product Manager & UC Berkeley Haas MBA Candidate",
              description:
                "Technical Product Manager and UC Berkeley Haas MBA Candidate '27 with 6+ years experience in civic tech and SaaS. Building mission-driven products that balance user insight, data-driven decisions, and cross-functional collaboration.",
              url: "https://isaacavazquez.com",
              image: "https://isaacavazquez.com/og-image.png",
              email: "isaacavazquez95@gmail.com",
              sameAs: [
                "https://linkedin.com/in/isaac-vazquez",
                "https://github.com/IsaacAVazquez",
                "https://twitter.com/isaacvazquez",
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
                "Product Operations",
                "Go-To-Market Planning",
                "Cross-functional Leadership",
                "Experimentation and Analytics",
                "Quality Assurance",
                "Test Automation",
                "Civic Technology",
                "SaaS Platforms",
                "Data-informed Product Decisions",
                "User Research",
                "SQL",
                "Data Analysis",
                "Agile/Scrum",
                "A/B Testing",
                "Product Metrics",
                "Stakeholder Management",
              ],
              expertise: [
                {
                  name: "Product Management",
                  proficiencyLevel: "Advanced",
                  yearsExperience: 3,
                  description:
                    "Product strategy, discovery, roadmapping, and cross-functional leadership",
                },
                {
                  name: "Quality Assurance",
                  proficiencyLevel: "Expert",
                  yearsExperience: 6,
                  description:
                    "Test automation, quality strategy, release management, and continuous improvement",
                },
                {
                  name: "Data Analysis",
                  proficiencyLevel: "Advanced",
                  yearsExperience: 6,
                  description:
                    "SQL, analytics dashboards, experimentation, and data-driven decision making",
                },
                {
                  name: "Technical Product Leadership",
                  proficiencyLevel: "Advanced",
                  yearsExperience: 4,
                  description:
                    "Bridging technical execution with strategic product outcomes",
                },
              ],
              awards: [
                {
                  name: "Consortium Fellow",
                  description:
                    "Selected as Consortium Fellow at UC Berkeley Haas School of Business",
                  dateAwarded: "2025",
                  awarder: {
                    "@type": "Organization",
                    name: "The Consortium for Graduate Study in Management",
                  },
                },
                {
                  name: "MLT Professional Development Fellow",
                  description:
                    "Management Leadership for Tomorrow Professional Development Program Fellow",
                  dateAwarded: "2024",
                  awarder: {
                    "@type": "Organization",
                    name: "Management Leadership for Tomorrow (MLT)",
                  },
                },
              ],
              alumniOf: [
                {
                  "@type": "CollegeOrUniversity",
                  name: "UC Berkeley Haas School of Business",
                  description: "MBA Candidate (Class of 2027)",
                  degree: "Master of Business Administration",
                  fieldOfStudy: [
                    "Product Management",
                    "Strategy",
                    "Venture Capital",
                  ],
                  startDate: "2025-08",
                  endDate: "2027-05",
                  address: {
                    addressLocality: "Berkeley",
                    addressRegion: "CA",
                    addressCountry: "US",
                  },
                  url: "https://haas.berkeley.edu",
                },
                {
                  "@type": "CollegeOrUniversity",
                  name: "Florida State University",
                  description:
                    "Bachelor of Arts - Political Science and International Affairs",
                  degree: "Bachelor of Arts",
                  fieldOfStudy: ["Political Science", "International Affairs"],
                  endDate: "2018",
                  address: {
                    addressLocality: "Tallahassee",
                    addressRegion: "FL",
                    addressCountry: "US",
                  },
                },
              ],
              worksFor: {
                "@type": "Organization",
                name: "Civitech",
                description:
                  "Civic technology company providing voter engagement platforms",
                url: "https://civitech.io",
                industry: "Civic Technology",
                address: {
                  addressLocality: "Austin",
                  addressRegion: "TX",
                  addressCountry: "US",
                },
              },
              hasOccupation: [
                {
                  "@type": "Occupation",
                  name: "Technical Product Manager",
                  description:
                    "Product management for civic tech and SaaS platforms",
                  occupationLocation: {
                    "@type": "City",
                    name: "Austin",
                    containedInPlace: {
                      "@type": "State",
                      name: "Texas",
                    },
                  },
                  skills: [
                    "Product Strategy",
                    "User Research",
                    "Roadmapping",
                    "Stakeholder Management",
                    "Experimentation",
                    "Data Analysis",
                  ],
                  startDate: "2022",
                  employer: {
                    "@type": "Organization",
                    name: "Civitech",
                  },
                },
                {
                  "@type": "Occupation",
                  name: "Quality Assurance Engineer",
                  description:
                    "Quality engineering leadership and test automation strategy",
                  occupationLocation: {
                    "@type": "City",
                    name: "Austin",
                    containedInPlace: {
                      "@type": "State",
                      name: "Texas",
                    },
                  },
                  skills: [
                    "Quality Assurance",
                    "Test Automation",
                    "Cypress",
                    "Release Management",
                    "Continuous Improvement",
                  ],
                  startDate: "2022",
                  endDate: "2025",
                  employer: {
                    "@type": "Organization",
                    name: "Civitech",
                  },
                },
              ],
              memberOf: [
                {
                  "@type": "Organization",
                  name: "The Consortium for Graduate Study in Management",
                  description: "Leading organization for diversity in business education",
                },
                {
                  "@type": "Organization",
                  name: "Management Leadership for Tomorrow (MLT)",
                  description:
                    "Career advancement organization for high-achieving Black, Latinx, and Native American professionals",
                },
                {
                  "@type": "Organization",
                  name: "Austin Tech Community",
                },
              ],
              seeks: "Associate Product Manager or Product Manager roles in Austin TX or San Francisco Bay Area, particularly in civic tech, SaaS, or mission-driven startups",
            },
          }}
        />

        {/* Website Schema */}
        <StructuredData type="WebSite" />
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
          "min-h-screen antialiased text-neutral-800 dark:text-neutral-200"
        )}
        style={{
          backgroundColor: 'var(--surface-primary)',
          [fontConfig.inter.variable as string]: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          [fontConfig.jetbrainsMono.variable as string]: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          [fontConfig.orbitron.variable as string]: 'Orbitron, "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
        } as React.CSSProperties}
      >
        <Analytics>
          <Providers>
            <TopLoadingBar />
            <GestureTutorial />
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black focus:shadow-lg">
              Skip to main content
            </a>

            {/* Static Header with Navigation */}
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
