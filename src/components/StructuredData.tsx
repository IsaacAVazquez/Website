import { siteConfig } from "@/lib/seo";

interface StructuredDataProps {
  type?: "Person" | "WebSite" | "WebPage" | "SoftwareApplication" | "BreadcrumbList";
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
          "jobTitle": "QA Engineer",
          "description": siteConfig.description,
          "url": siteConfig.url,
          "image": `${siteConfig.url}/og-image.png`,
          "sameAs": [
            siteConfig.links.linkedin,
            siteConfig.links.github,
          ],
          "worksFor": {
            "@type": "Organization",
            "name": "Civitech"
          },
          "knowsAbout": [
            "Quality Assurance",
            "Test Automation",
            "Selenium",
            "Cypress",
            "JavaScript",
            "Python",
            "Civic Technology",
            "Data Analysis"
          ],
          "alumniOf": {
            "@type": "EducationalOrganization",
            "name": "Florida State University"
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