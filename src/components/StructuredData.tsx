import { siteConfig } from "@/lib/seo";

interface StructuredDataProps {
  type?: "Person" | "WebSite" | "WebPage" | "SoftwareApplication" | "BreadcrumbList" | "SportsApplication" | "FAQPage";
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
          "jobTitle": "QA Engineer & Fantasy Football Analytics Developer",
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
          "homeLocation": {
            "@type": "Place",
            "name": "Austin, Texas",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Austin",
              "addressRegion": "Texas",
              "addressCountry": "United States"
            }
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
            "Fantasy Football Analytics",
            "Fantasy Sports Data Visualization",
            "NFL Player Analytics",
            "Fantasy Football Tools",
            "D3.js Visualization",
            "K-Means Clustering",
            "Real-time Data Processing",
            "Quality Assurance",
            "Test Automation",
            "TypeScript",
            "React",
            "Next.js",
            "Data Analysis",
            "Software Quality",
            "Austin Tech Community",
            "Texas Software Development"
          ],
          "alumniOf": {
            "@type": "EducationalOrganization",
            "name": "Florida State University",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Tallahassee",
              "addressRegion": "FL",
              "addressCountry": "US"
            }
          },
          "hasOccupation": [
            {
              "@type": "Occupation",
              "name": "QA Engineer",
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
                "Test Automation",
                "Software Testing",
                "Bug Detection",
                "Performance Testing"
              ]
            },
            {
              "@type": "Occupation",
              "name": "Fantasy Football Analytics Developer",
              "occupationLocation": {
                "@type": "City",
                "name": "Austin",
                "containedInPlace": {
                  "@type": "State",
                  "name": "Texas"
                }
              },
              "skills": [
                "Fantasy Football Data Analysis",
                "Sports Analytics",
                "Data Visualization",
                "Web Development",
                "Machine Learning"
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