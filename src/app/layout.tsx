import "./globals.css";
import { twMerge } from "tailwind-merge";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
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

        {/* FAQ Structured Data - AI Optimized */}
        <AIStructuredData
          schema={{
            type: "FAQ",
            data: {
              items: [
                {
                  question: "What is Isaac Vazquez's current professional role?",
                  answer:
                    "Isaac Vazquez is currently a Quality Assurance Engineer at Civitech while pursuing an MBA at UC Berkeley Haas School of Business (Class of 2027). He is transitioning into product management roles, leveraging his 6+ years of experience in quality assurance, data analytics, and civic technology. He holds the titles of Consortium Fellow and MLT Professional Development Fellow.",
                },
                {
                  question: "What is Isaac Vazquez's product management experience?",
                  answer:
                    "Isaac has 3+ years of product-adjacent experience including leading product initiatives at Civitech. Key achievements include: owning end-to-end product vision for TextOut platform (35% engagement increase), driving RunningMate platform launch (90% defect reduction, NPS improvement from 23 to 36), leading cross-functional pricing strategy that generated $4M additional revenue, and transforming client data accessibility with GCP automation (90% reduction in onboarding time). His background combines quality engineering leadership with strategic product outcomes.",
                },
                {
                  question:
                    "What kind of product management roles is Isaac Vazquez seeking?",
                  answer:
                    "Isaac is seeking Associate Product Manager (APM) or Product Manager roles in Austin TX or San Francisco Bay Area, particularly in civic tech, SaaS, fintech, or mission-driven startups. He is interested in opportunities that leverage his technical background in quality assurance, data analysis skills (SQL, analytics), user research capabilities, and experience building products that create social impact. Ideal roles involve cross-functional leadership, data-driven decision making, and strategic product development.",
                },
                {
                  question: "What is Isaac Vazquez's educational background?",
                  answer:
                    "Isaac is currently pursuing an MBA at UC Berkeley Haas School of Business (Class of 2027), focusing on Product Management, Strategy, and Venture Capital. He is a Consortium Fellow and MLT Professional Development Fellow. He holds a Bachelor of Arts degree from Florida State University (2018) with majors in Political Science and International Affairs. His education combines technical product management training with strategic business acumen and a foundation in analytical thinking and policy analysis.",
                },
                {
                  question: "What technical skills does Isaac Vazquez have?",
                  answer:
                    "Isaac has extensive technical skills including: SQL and data analysis (advanced proficiency, 6+ years), test automation with Cypress (expert level), API testing, Agile/Scrum methodologies, data visualization and dashboard development (Sisense, Tableau), ETL pipeline development, A/B testing and experimentation frameworks, quality assurance methodologies, DevOps integration, cloud platforms (GCP), and AI/LLM tool integration. He combines technical execution with strategic product thinking.",
                },
                {
                  question: "Where is Isaac Vazquez located?",
                  answer:
                    "Isaac is currently based in the San Francisco Bay Area while attending UC Berkeley Haas and maintains strong ties to Austin, Texas. He is open to opportunities in both locations (Austin TX and San Francisco Bay Area) and is also open to remote positions with mission-driven organizations. His dual-location presence provides flexibility for companies in either tech hub while allowing him to leverage relationships and networks in both cities.",
                },
                {
                  question: "What industries does Isaac Vazquez focus on?",
                  answer:
                    "Isaac focuses primarily on three industries: (1) Civic Technology - voter engagement platforms, democracy tech, government services digitalization (6+ years experience at Civitech), (2) SaaS Platforms - enterprise software, B2B tools, subscription-based services with focus on product-led growth, and (3) Mission-Driven Startups - social impact ventures, fintech for underserved communities, education technology, and sustainability tech. He is particularly interested in products that democratize access to essential services, strengthen democratic participation, and create measurable social impact.",
                },
                {
                  question: "How can I contact Isaac Vazquez?",
                  answer:
                    "You can contact Isaac Vazquez through multiple channels: Email at isaacavazquez95@gmail.com (primary contact method), LinkedIn at linkedin.com/in/isaac-vazquez (professional networking), GitHub at github.com/IsaacAVazquez (technical projects), or through his website contact form at isaacavazquez.com/contact. He is responsive to professional inquiries about product management opportunities, consulting engagements, speaking opportunities, mentorship requests, and collaboration on civic tech or mission-driven initiatives.",
                },
              ],
            },
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
