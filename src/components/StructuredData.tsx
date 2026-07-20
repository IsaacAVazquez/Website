import {
  personCanonicalUrl,
  personSchemaId,
  safeJsonLd,
  siteConfig,
} from "@/lib/seo";
import { profile, profileSameAs } from "@/lib/profile";

interface StructuredDataProps {
  type?: "Person" | "WebSite" | "WebPage" | "SoftwareApplication" | "BreadcrumbList" | "SportsApplication" | "FAQPage" | "CreativeWork" | "ProfessionalService" | "ContactPage" | "ProfilePage" | "Organization" | "Article" | "BlogPosting";
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
    const defaultPerson = {
      "@type": "Person",
      "@id": personSchemaId,
      "name": siteConfig.name,
      "jobTitle": profile.fullTitle,
      "description": siteConfig.description,
      "url": personCanonicalUrl,
      "image": `${siteConfig.url}${siteConfig.ogImage}`,
      "sameAs": profileSameAs,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": profile.location.locality,
        "addressRegion": profile.location.region,
        "addressCountry": profile.location.country,
      },
      "affiliation": {
        "@type": "CollegeOrUniversity",
        "name": profile.education[0].name,
        "description": profile.education[0].description,
      },
      "alumniOf": [profile.education[1]],
      "worksFor": {
        "@type": "Organization",
        "name": profile.currentRole.organization,
      },
      "hasOccupation": [
        {
          "@type": "Occupation",
          "name": "Product Manager",
          "skills": profile.knowsAbout,
        },
      ],
      "knowsAbout": profile.knowsAbout,
    };

    switch (type) {
      case "Person":
        return {
          ...baseData,
          ...defaultPerson,
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
        const {
          author,
          publisher,
          datePublished,
          dateModified,
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
          "offers": offers || {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
          },
        };
      }

      case "BreadcrumbList":
        return {
          ...baseData,
          "@type": "BreadcrumbList",
          "itemListElement": data.items || [],
          ...data,
        };

      case "SportsApplication": {
        const {
          author,
          dateModified,
          offers,
          ...sportsApplicationData
        } = data;

        return {
          ...baseData,
          ...sportsApplicationData,
          "@type": "SoftwareApplication",
          "name": data.name || "Fantasy Football Analytics Tools",
          "description": data.description || "Snapshot-backed fantasy football rankings and a manual draft assistant sourced from FantasyPros consensus pages",
          "applicationCategory": "SportsApplication",
          "operatingSystem": "Any",
          "url": data.url || siteConfig.url,
          "author": normalizePerson(author),
          ...(dateModified ? { dateModified } : {}),
          "about": data.about || {
            "@type": "Thing",
            "name": "Fantasy Football",
            "description": "Strategic game based on NFL player performance statistics"
          },
          "audience": data.audience || {
            "@type": "Audience",
            "audienceType": "Fantasy Football Players"
          },
          "featureList": data.featureList || [
            "Overall and position-specific rankings",
            "PPR, Half PPR, and Standard scoring",
            "FantasyPros consensus tiers and expert ranges",
            "Published snapshot freshness metadata",
            "Manual draft assistant with local persistence"
          ],
          "screenshot": data.screenshot || data.image || `${siteConfig.url}${siteConfig.ogImage}`,
          "offers": offers || {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
        };
      }

      case "FAQPage":
        return {
          ...baseData,
          "@type": "FAQPage",
          "mainEntity": data.questions || [],
          ...data,
        };

      case "CreativeWork": {
        const {
          author,
          creator,
          dateCreated,
          dateModified,
          ...creativeWorkData
        } = data;

        return {
          ...baseData,
          ...creativeWorkData,
          "@type": "CreativeWork",
          "name": data.name || "Portfolio Project",
          "description": data.description || "",
          "author": normalizePerson(author),
          "creator": normalizePerson(creator),
          ...(dateCreated ? { dateCreated } : {}),
          ...(dateModified ? { dateModified } : {}),
          "keywords": data.keywords,
          "about": data.about,
          "image": data.image,
          "url": data.url || siteConfig.url,
          "inLanguage": "en-US",
          "isAccessibleForFree": true,
          "learningResourceType": data.learningResourceType || "Project",
          "workExample": data.workExample,
        };
      }

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

      case "ProfilePage":
        return {
          ...baseData,
          "@type": "ProfilePage",
          "@id": data.url
            ? `${data.url}#profilepage`
            : `${personCanonicalUrl}#profilepage`,
          "name": data.name || `${siteConfig.name} | Professional Profile`,
          "description": data.description || siteConfig.description,
          "url": data.url || personCanonicalUrl,
          "mainEntity": defaultPerson,
          ...data,
        };

      case "Organization":
        return {
          ...baseData,
          "@type": "Organization",
          "name": data.name || "Civitech",
          "description": data.description || "Civic technology company building voter engagement platforms",
          "url": data.url,
          "logo": data.logo,
          "address": data.address,
          "employee": data.employee,
          "foundingDate": data.foundingDate,
          "sameAs": data.sameAs,
          ...data,
        };

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
