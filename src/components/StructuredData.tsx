import {
  buildPersonEntity,
  personCanonicalUrl,
  personSchemaId,
  safeJsonLd,
  siteConfig,
} from "@/lib/seo";
import { profile } from "@/lib/profile";

interface StructuredDataProps {
  type?: "Person" | "WebSite" | "WebPage" | "SoftwareApplication" | "BreadcrumbList" | "SportsApplication" | "FAQPage" | "ContactPage" | "Article" | "BlogPosting";
  data?: Record<string, string | number | boolean | object>;
}

function normalizePerson(value: unknown) {
  if (typeof value === "string") {
    return {
      "@type": "Person",
      "@id": personSchemaId,
      name: value,
      url: personCanonicalUrl,
    };
  }

  if (value && typeof value === "object") {
    return {
      "@type": "Person",
      "@id": personSchemaId,
      ...(value as Record<string, unknown>),
    };
  }

  return {
    "@type": "Person",
    "@id": personSchemaId,
    name: siteConfig.name,
    url: personCanonicalUrl,
  };
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
          ...buildPersonEntity(),
          ...data,
        };

      case "WebSite":
        return {
          ...baseData,
          "@type": "WebSite",
          "@id": `${siteConfig.url}#website`,
          "name": siteConfig.name,
          "alternateName": "Isaac Vazquez Portfolio",
          "description": siteConfig.description,
          "url": siteConfig.url,
          "author": {
            "@type": "Person",
            "@id": personSchemaId,
            "name": siteConfig.name,
            "url": personCanonicalUrl,
          },
          ...data,
        };

      case "WebPage": {
        // `title` feeds the schema.org `name` below — keep it out of the
        // spread so the output carries no nonstandard "title" property.
        const {
          author,
          publisher,
          datePublished,
          dateModified,
          title,
          ...webPageData
        } = data;

        return {
          ...baseData,
          ...webPageData,
          "@type": "WebPage",
          "name": data.title || siteConfig.title,
          "description": data.description || siteConfig.description,
          "url": data.url || siteConfig.url,
          "author": normalizePerson(author),
          "publisher": normalizePerson(publisher),
          ...(datePublished ? { datePublished } : {}),
          ...(dateModified ? { dateModified } : {}),
        };
      }

      case "SoftwareApplication": {
        const {
          author,
          dateCreated,
          dateModified,
          offers,
          ...applicationData
        } = data;

        return {
          ...baseData,
          ...applicationData,
          "@type": "SoftwareApplication",
          "name": data.name || "Project",
          "description": data.description || "",
          "image": data.image,
          ...(dateCreated ? { dateCreated } : {}),
          ...(dateModified ? { dateModified } : {}),
          "author": normalizePerson(author),
          "keywords": data.keywords,
          "programmingLanguage": data.programmingLanguage,
          "applicationCategory": data.applicationCategory || "WebApplication",
          "operatingSystem": data.operatingSystem || "Any",
          "url": data.url || siteConfig.url,
          ...(offers ? { offers } : {}),
        };
      }

      case "BreadcrumbList": {
        const { items, ...breadcrumbData } = data;
        return {
          ...baseData,
          ...breadcrumbData,
          "@type": "BreadcrumbList",
          "itemListElement": items || [],
        };
      }

      case "SportsApplication": {
        const {
          author,
          dateModified,
          offers,
          applicationCategory,
          about,
          audience,
          featureList,
          name,
          description,
          url,
          image,
          screenshot,
          operatingSystem,
          ...sportsApplicationData
        } = data;

        return {
          ...baseData,
          ...sportsApplicationData,
          "@type": "SoftwareApplication",
          "name": name || "Sports Analytics Tool",
          "description": description || "",
          "applicationCategory": applicationCategory || "SportsApplication",
          "operatingSystem": operatingSystem || "Any",
          "url": url || siteConfig.url,
          "author": normalizePerson(author),
          ...(dateModified ? { dateModified } : {}),
          ...(about ? { about } : {}),
          ...(audience ? { audience } : {}),
          ...(featureList ? { featureList } : {}),
          "screenshot": screenshot || image || `${siteConfig.url}${siteConfig.ogImage}`,
          ...(offers ? { offers } : {}),
        };
      }

      case "FAQPage": {
        const { questions, ...faqData } = data;
        return {
          ...baseData,
          ...faqData,
          "@type": "FAQPage",
          "mainEntity": questions || [],
        };
      }

      case "ContactPage": {
        const { mainEntity, ...contactPageData } = data;

        return {
          ...baseData,
          ...contactPageData,
          "@type": "ContactPage",
          "name": data.name || `Contact ${siteConfig.name}`,
          "description": data.description || `Get in touch with ${siteConfig.name} for product management opportunities and consulting engagements.`,
          "url": data.url || `${siteConfig.url}/contact`,
          "mainEntity": normalizePerson(
            mainEntity || {
              name: siteConfig.name,
              email: profile.email,
              url: personCanonicalUrl,
            },
          ),
        };
      }

      case "Article":
      case "BlogPosting": {
        const {
          author,
          authorName,
          publisher,
          datePublished,
          dateModified,
          ...articleData
        } = data;

        return {
          ...baseData,
          ...articleData,
          "@type": type === "BlogPosting" ? "BlogPosting" : "Article",
          "headline": data.headline || data.title,
          "description": data.description,
          "image": data.image,
          ...(datePublished ? { datePublished } : {}),
          ...(dateModified || datePublished
            ? { dateModified: dateModified || datePublished }
            : {}),
          "author": normalizePerson(author || authorName),
          "publisher": normalizePerson(publisher),
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url || siteConfig.url,
          },
          "keywords": data.keywords,
          "articleSection": data.articleSection,
          "wordCount": data.wordCount,
          "inLanguage": "en-US",
        };
      }

      default:
        return baseData;
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd(getStructuredData()),
      }}
    />
  );
}
