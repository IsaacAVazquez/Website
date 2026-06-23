import { siteConfig, safeJsonLd } from "@/lib/seo";
import { profile, profileSameAs } from "@/lib/profile";

interface StructuredDataProps {
  type?: "Person" | "WebSite" | "WebPage" | "SoftwareApplication" | "BreadcrumbList" | "SportsApplication" | "FAQPage" | "CreativeWork" | "ProfessionalService" | "ContactPage" | "ProfilePage" | "Organization" | "Article" | "BlogPosting" | "JobPosting";
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
          "description": data.description || "Snapshot-backed fantasy football rankings and a manual draft assistant sourced from FantasyPros consensus pages",
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
            "Overall and position-specific rankings",
            "PPR, Half PPR, and Standard scoring",
            "FantasyPros consensus tiers and expert ranges",
            "Published snapshot freshness metadata",
            "Manual draft assistant with local persistence"
          ],
          "screenshot": `${siteConfig.url}${siteConfig.ogImage}`,
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
            "jobTitle": "Technical Product Manager & UC Berkeley MBA Candidate",
            "description": siteConfig.description,
            "url": siteConfig.url,
            "image": `${siteConfig.url}${siteConfig.ogImage}`,
            "sameAs": [
              siteConfig.links.linkedin,
              siteConfig.links.github,
            ],
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
      case "BlogPosting":
        return {
          ...baseData,
          "@type": type === "BlogPosting" ? "BlogPosting" : "Article",
          "headline": data.headline || data.title,
          "description": data.description,
          "image": data.image,
          "datePublished": data.datePublished,
          "dateModified": data.dateModified || data.datePublished,
          "author": {
            "@type": "Person",
            "name": data.authorName || siteConfig.name,
            "url": siteConfig.url,
          },
          "publisher": {
            "@type": "Person",
            "name": siteConfig.name,
            "url": siteConfig.url,
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url || siteConfig.url,
          },
          "keywords": data.keywords,
          "articleSection": data.articleSection,
          "wordCount": data.wordCount,
          "inLanguage": "en-US",
          ...data,
        };

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
