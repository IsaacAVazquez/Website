import { siteConfig, safeJsonLd } from "@/lib/seo";
import { profile, profileSameAs } from "@/lib/profile";

interface StructuredDataProps {
  type?: "Person" | "WebSite" | "WebPage" | "SoftwareApplication" | "BreadcrumbList" | "SportsApplication" | "FAQPage" | "CreativeWork" | "ProfessionalService" | "ContactPage" | "ProfilePage" | "Organization" | "Article" | "BlogPosting" | "JobPosting";
  data?: Record<string, string | number | boolean | object>;
}

function normalizePerson(value: unknown) {
  if (typeof value === "string") {
    return {
      "@type": "Person",
      name: value,
      url: siteConfig.url,
    };
  }

  if (value && typeof value === "object") {
    return {
      "@type": "Person",
      ...(value as Record<string, unknown>),
    };
  }

  return {
    "@type": "Person",
    name: siteConfig.name,
    url: siteConfig.url,
  };
}

// Article/BlogPosting publisher must be an Organization with a logo to be
// eligible for Google's Article rich result. Represent the personal brand as
// an Organization rather than reusing the author Person.
function normalizeOrganizationPublisher(value: unknown) {
  const logo = {
    "@type": "ImageObject",
    url: `${siteConfig.url}/icons/icon-512x512.png`,
    width: 512,
    height: 512,
  };

  if (value && typeof value === "object") {
    return {
      "@type": "Organization",
      logo,
      ...(value as Record<string, unknown>),
    };
  }

  return {
    "@type": "Organization",
    name: typeof value === "string" ? value : siteConfig.name,
    url: siteConfig.url,
    logo,
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
          "@type": "Person",
          "name": siteConfig.name,
          "jobTitle": profile.fullTitle,
          "description": siteConfig.description,
          "url": siteConfig.url,
          "image": `${siteConfig.url}${siteConfig.ogImage}`,
          "sameAs": profileSameAs,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": profile.location.locality,
            "addressRegion": profile.location.region,
            "addressCountry": "US"
          },
          "worksFor": {
            "@type": "Organization",
            "name": profile.employer.name,
            "url": profile.employer.url,
            "description": profile.employer.description,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": profile.location.locality,
              "addressRegion": profile.location.region,
              "addressCountry": "US"
            }
          },
          "knowsAbout": profile.knowsAbout,
          "alumniOf": profile.education,
          "hasOccupation": [
            {
              "@type": "Occupation",
              "name": "Product Manager",
              "occupationLocation": {
                "@type": "City",
                "name": profile.location.locality,
                "containedInPlace": {
                  "@type": "State",
                  "name": profile.location.region
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
                "name": profile.location.locality,
                "containedInPlace": {
                  "@type": "State",
                  "name": profile.location.region
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
            "name": "San Francisco Bay Area Product & Tech Community"
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
          ...(data.description ? { description: data.description } : {}),
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

      case "BreadcrumbList": {
        // Destructure `items` out so it isn't re-emitted as an invalid
        // top-level property alongside the computed `itemListElement`.
        const { items, ...breadcrumbRest } = data;
        return {
          ...baseData,
          "@type": "BreadcrumbList",
          "itemListElement": items || [],
          ...breadcrumbRest,
        };
      }

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
            "Overall and position-specific rankings",
            "PPR, Half PPR, and Standard scoring",
            "FantasyPros consensus tiers and expert ranges",
            "Published snapshot freshness metadata",
            "Manual draft assistant with local persistence"
          ],
          "screenshot": `${siteConfig.url}${siteConfig.ogImage}`,
          "offers": offers || {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
        };
      }

      case "FAQPage": {
        // Destructure `questions` out so it isn't re-emitted as an invalid
        // top-level property alongside the computed `mainEntity`.
        const { questions, ...faqRest } = data;
        return {
          ...baseData,
          "@type": "FAQPage",
          "mainEntity": questions || [],
          ...faqRest,
        };
      }

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
          ...(data.description ? { description: data.description } : {}),
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
            "jobTitle": profile.fullTitle,
            "url": siteConfig.url,
            "sameAs": profileSameAs
          },
          ...data,
        };

      case "ContactPage":
        return {
          ...baseData,
          "@type": "ContactPage",
          "name": data.name || `Contact ${siteConfig.name}`,
          "description": data.description || `Get in touch with ${siteConfig.name} for product management opportunities and consulting engagements.`,
          "url": data.url || `${siteConfig.url}/contact`,
          "mainEntity": data.mainEntity || {
            "@type": "Person",
            "name": siteConfig.name,
            "email": "IsaacVazquez@berkeley.edu",
            "url": siteConfig.url,
          },
          ...data,
        };

      case "ProfilePage":
        return {
          ...baseData,
          "@type": "ProfilePage",
          "name": data.name || `${siteConfig.name} - Professional Profile`,
          "description": data.description || siteConfig.description,
          "url": data.url || siteConfig.url,
          "mainEntity": {
            "@type": "Person",
            "name": siteConfig.name,
            "jobTitle": profile.fullTitle,
            "description": siteConfig.description,
            "url": siteConfig.url,
            "image": `${siteConfig.url}${siteConfig.ogImage}`,
            "sameAs": profileSameAs,
          },
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
          "publisher": normalizeOrganizationPublisher(publisher),
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

      case "JobPosting":
        return {
          ...baseData,
          "@type": "JobPosting",
          "title": data.title || "Associate Product Manager / Product Manager",
          "description": data.description || "Seeking Product Manager or Associate Product Manager roles where I can leverage my technical background, data analytics expertise, and cross-functional leadership to build mission-driven products.",
          "datePosted": data.datePosted || "2024-08-15",
          "validThrough": data.validThrough || "2027-05-31",
          "employmentType": data.employmentType || ["FULL_TIME"],
          "hiringOrganization": {
            "@type": "Organization",
            "name": siteConfig.name,
            "sameAs": siteConfig.url,
          },
          "jobLocation": data.jobLocation || [
            {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Austin",
                "addressRegion": "TX",
                "addressCountry": "US"
              }
            },
            {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "San Francisco",
                "addressRegion": "CA",
                "addressCountry": "US"
              }
            },
            {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Berkeley",
                "addressRegion": "CA",
                "addressCountry": "US"
              }
            }
          ],
          "applicantLocationRequirements": data.applicantLocationRequirements || {
            "@type": "Country",
            "name": "US"
          },
          "jobLocationType": data.jobLocationType || "TELECOMMUTE",
          "baseSalary": data.baseSalary || {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": {
              "@type": "QuantitativeValue",
              "minValue": 100000,
              "maxValue": 180000,
              "unitText": "YEAR"
            }
          },
          "qualifications": data.qualifications || "MBA from UC Berkeley Haas, 6+ years experience in quality assurance and data analytics, technical product management background",
          "skills": data.skills || "Product Strategy, Roadmapping, Cross-functional Leadership, Data Analytics, SQL, Agile/Scrum, User Research, Stakeholder Management",
          "educationRequirements": data.educationRequirements || {
            "@type": "EducationalOccupationalCredential",
            "credentialCategory": "degree",
            "educationalLevel": "Master's degree"
          },
          "experienceRequirements": data.experienceRequirements || {
            "@type": "OccupationalExperienceRequirements",
            "monthsOfExperience": 72
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
        __html: safeJsonLd(getStructuredData()),
      }}
    />
  );
}
