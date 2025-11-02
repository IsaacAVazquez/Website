import { siteConfig } from "@/lib/seo";

interface StructuredDataProps {
  type?: "Person" | "WebSite" | "WebPage" | "SoftwareApplication" | "BreadcrumbList" | "SportsApplication" | "FAQPage" | "CreativeWork" | "ProfessionalService";
  data?: Record<string, string | number | boolean | object>;
}

export function StructuredData({ type = "Person", data = {} }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
    };

    switch (type) {
      case "Person":
        return {
          ...baseData,
          "@type": "Person",
          "name": siteConfig.name,
          "jobTitle": "Technical Product Manager & UC Berkeley MBA Candidate",
          "description": siteConfig.description,
          "url": siteConfig.url,
          "image": `${siteConfig.url}/og-image.png`,
          "sameAs": [
            siteConfig.links.linkedin,
            siteConfig.links.github,
          ],
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Austin",
            "addressRegion": "TX",
            "addressCountry": "US"
          },
          "worksFor": {
            "@type": "Organization",
            "name": "Civitech",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Austin",
              "addressRegion": "TX",
              "addressCountry": "US"
            }
          },
          "knowsAbout": [
            "Product Management",
            "Product Strategy",
            "Go-To-Market Planning",
            "Cross-functional Leadership",
            "Experimentation and Analytics",
            "Quality Assurance",
            "Test Automation",
            "Civic Technology",
            "SaaS Platforms",
            "Data-informed Product Decisions",
            "Technical Discovery",
            "User Research"
          ],
          "alumniOf": [
            {
              "@type": "CollegeOrUniversity",
              "name": "UC Berkeley Haas School of Business",
              "description": "MBA Candidate",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Berkeley",
                "addressRegion": "CA",
                "addressCountry": "US"
              }
            },
            {
              "@type": "CollegeOrUniversity",
              "name": "Florida State University",
              "description": "Bachelor of Arts, Political Science and International Affairs",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Tallahassee",
                "addressRegion": "FL",
                "addressCountry": "US"
              }
            }
          ],
          "hasOccupation": [
            {
              "@type": "Occupation",
              "name": "Technical Product Manager",
              "occupationLocation": {
                "@type": "City",
                "name": "Austin",
                "containedInPlace": {
                  "@type": "State",
                  "name": "Texas"
                }
              },
              "skills": [
                "Product Strategy",
                "Roadmapping",
                "User Research",
                "Stakeholder Management",
                "Experimentation"
              ]
            },
            {
              "@type": "Occupation",
              "name": "Quality Engineering Leader",
              "occupationLocation": {
                "@type": "City",
                "name": "Austin",
                "containedInPlace": {
                  "@type": "State",
                  "name": "Texas"
                }
              },
              "skills": [
                "Quality Assurance",
                "Automation Strategy",
                "Release Management",
                "Continuous Improvement"
              ]
            }
          ],
          "memberOf": {
            "@type": "Organization",
            "name": "Austin Tech Community"
          },
          ...data,
        };

      case "WebSite":
        return {
          ...baseData,
          "@type": "WebSite",
          "name": `${siteConfig.name} – ${siteConfig.title}`,
          "description": siteConfig.description,
          "url": siteConfig.url,
          "author": {
            "@type": "Person",
            "name": siteConfig.name,
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${siteConfig.url}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          },
          ...data,
        };

      case "WebPage":
        return {
          ...baseData,
          "@type": "WebPage",
          "name": data.title || siteConfig.title,
          "description": data.description || siteConfig.description,
          "url": data.url || siteConfig.url,
          "author": {
            "@type": "Person",
            "name": siteConfig.name,
          },
          "publisher": {
            "@type": "Person",
            "name": siteConfig.name,
          },
          "datePublished": data.datePublished || new Date().toISOString(),
          "dateModified": data.dateModified || new Date().toISOString(),
          ...data,
        };

      case "SoftwareApplication":
        return {
          ...baseData,
          "@type": "SoftwareApplication",
          "name": data.name || "Project",
          "description": data.description || "",
          "image": data.image,
          "dateCreated": data.dateCreated,
          "dateModified": data.dateModified || new Date().toISOString(),
          "author": {
            "@type": "Person",
            "name": siteConfig.name,
            "url": siteConfig.url,
          },
          "keywords": data.keywords,
          "programmingLanguage": data.programmingLanguage,
          "applicationCategory": data.applicationCategory || "WebApplication",
          "operatingSystem": "Any",
          "url": data.url || siteConfig.url,
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          ...data,
        };

      case "BreadcrumbList":
        return {
          ...baseData,
          "@type": "BreadcrumbList",
          "itemListElement": data.items || [],
          ...data,
        };

      case "SportsApplication":
        return {
          ...baseData,
          "@type": "SoftwareApplication",
          "name": data.name || "Fantasy Football Analytics Tools",
          "description": data.description || "Advanced fantasy football analytics and visualization platform",
          "applicationCategory": "SportsApplication",
          "operatingSystem": "Any",
          "url": siteConfig.url,
          "author": {
            "@type": "Person",
            "name": siteConfig.name,
            "url": siteConfig.url,
          },
          "about": {
            "@type": "Thing",
            "name": "Fantasy Football",
            "description": "Strategic game based on NFL player performance statistics"
          },
          "audience": {
            "@type": "Audience",
            "audienceType": "Fantasy Football Players"
          },
          "featureList": [
            "Interactive tier visualizations",
            "Real-time player data",
            "Clustering algorithms",
            "Mobile-optimized interface",
            "Draft assistance tools"
          ],
          "screenshot": `${siteConfig.url}/og-image.png`,
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          ...data,
        };

      case "FAQPage":
        return {
          ...baseData,
          "@type": "FAQPage",
          "mainEntity": data.questions || [],
          ...data,
        };

      case "CreativeWork":
        return {
          ...baseData,
          "@type": "CreativeWork",
          "name": data.name || "Portfolio Project",
          "description": data.description || "",
          "author": {
            "@type": "Person",
            "name": siteConfig.name,
            "url": siteConfig.url,
          },
          "creator": {
            "@type": "Person",
            "name": siteConfig.name,
            "url": siteConfig.url,
          },
          "dateCreated": data.dateCreated,
          "dateModified": data.dateModified || new Date().toISOString(),
          "keywords": data.keywords,
          "about": data.about,
          "image": data.image,
          "url": data.url || siteConfig.url,
          "inLanguage": "en-US",
          "isAccessibleForFree": true,
          "learningResourceType": data.learningResourceType || "Project",
          "workExample": data.workExample,
          ...data,
        };

      case "ProfessionalService":
        return {
          ...baseData,
          "@type": "ProfessionalService",
          "name": data.name || `${siteConfig.name} Product Management Consulting`,
          "description": data.description || siteConfig.description,
          "url": data.url || siteConfig.url,
          "areaServed": data.areaServed || ["Austin, TX", "San Francisco Bay Area, CA", "Remote"],
          "serviceType": data.serviceType || [
            "Product Strategy",
            "Product Discovery",
            "Product Operations",
            "Quality Engineering Advisory"
          ],
          "provider": {
            "@type": "Person",
            "name": siteConfig.name,
            "jobTitle": "Technical Product Manager",
            "url": siteConfig.url,
            "sameAs": [
              siteConfig.links.linkedin,
              siteConfig.links.github
            ]
          },
          ...data,
        };

      default:
        return baseData;
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData()),
      }}
    />
  );
}
