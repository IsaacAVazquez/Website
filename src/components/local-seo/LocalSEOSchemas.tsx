import { 
  BusinessLocation, 
  generateLocalBusinessSchema, 
  generatePersonSchemaWithLocation, 
  generateServiceAreaSchema 
} from "@/lib/localSEO";
import { StructuredData } from "@/components/StructuredData";

interface LocalSEOSchemasProps {
  location: BusinessLocation;
  pageType?: 'home' | 'about' | 'contact' | 'services';
  additionalServices?: string[];
}

export function LocalSEOSchemas({ 
  location, 
  pageType = 'home',
  additionalServices = []
}: LocalSEOSchemasProps) {
  // Generate local business schema
  const localBusinessSchema = generateLocalBusinessSchema(location);
  
  // Generate person schema with location context
  const personSchema = generatePersonSchemaWithLocation(location);
  
  // Generate service area schema
  const serviceAreaSchema = generateServiceAreaSchema(location);

  // Generate organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${location.website}#organization`,
    "name": location.name,
    "legalName": "Isaac Vazquez",
    "url": location.website,
    "logo": `${location.website}/images/logo.png`,
    "description": location.description,
    "foundingDate": location.established,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": location.phone,
      "email": location.email,
      "contactType": "customer service",
      "areaServed": location.serviceAreas,
      "availableLanguage": ["English"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": location.address.streetAddress,
      "addressLocality": location.address.addressLocality,
      "addressRegion": location.address.addressRegion,
      "postalCode": location.address.postalCode,
      "addressCountry": location.address.addressCountry
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": location.coordinates.latitude,
      "longitude": location.coordinates.longitude
    },
    "areaServed": location.serviceAreas.map(area => ({
      "@type": "City",
      "name": area
    })),
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Professional Services",
      "itemListElement": [
        ...location.categories.map(category => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": category,
            "provider": {
              "@type": "Organization",
              "name": location.name
            },
            "areaServed": location.serviceAreas,
            "availableChannel": {
              "@type": "ServiceChannel",
              "serviceUrl": location.website,
              "servicePhone": location.phone
            }
          }
        })),
        ...additionalServices.map(service => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": service,
            "provider": {
              "@type": "Organization", 
              "name": location.name
            },
            "areaServed": location.serviceAreas
          }
        }))
      ]
    }
  };

  // Generate WebPage schema with local context
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${location.website}#webpage`,
    "url": location.website,
    "name": `${getPageTitle(pageType)} - ${location.address.addressLocality}, ${location.address.addressRegion}`,
    "description": `${getPageDescription(pageType, location)}`,
    "inLanguage": "en-US",
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${location.website}#website`
    },
    "about": {
      "@type": "Organization",
      "@id": `${location.website}#organization`
    },
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": `${location.website}/images/local-${location.id}-hero.jpg`
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": getBreadcrumbs(pageType, location)
    }
  };

  // Generate FAQ schema for service pages
  const faqSchema = pageType === 'services' ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What services do you offer in ${location.address.addressLocality}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `I provide ${location.categories.join(', ')} services throughout ${location.address.addressLocality}, ${location.address.addressRegion} and surrounding areas. My expertise includes software testing, quality assurance, product strategy, and business consulting tailored to local market needs.`
        }
      },
      {
        "@type": "Question",
        "name": `Do you serve areas outside of ${location.address.addressLocality}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes, I serve ${location.serviceAreas.length} cities across ${location.address.addressRegion} including ${location.serviceAreas.slice(0, 5).join(', ')} and other surrounding areas. Remote consulting services are also available.`
        }
      },
      {
        "@type": "Question",
        "name": "How can I contact you for local services?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `You can reach me at ${location.phone} for immediate assistance or email ${location.email}. I offer both on-site and remote consultation services throughout the ${location.address.addressLocality} metropolitan area.`
        }
      }
    ]
  } : null;

  return (
    <>
      {/* Local Business Schema */}
      <StructuredData type="LocalBusiness" data={localBusinessSchema} />
      
      {/* Person Schema */}
      <StructuredData type="Person" data={personSchema} />
      
      {/* Organization Schema */}
      <StructuredData type="Organization" data={organizationSchema} />
      
      {/* Service Area Schema */}
      <StructuredData type="ServiceArea" data={serviceAreaSchema} />
      
      {/* WebPage Schema */}
      <StructuredData type="WebPage" data={webPageSchema} />
      
      {/* FAQ Schema (for service pages) */}
      {faqSchema && <StructuredData type="FAQPage" data={faqSchema} />}

      {/* Local Business Hours Schema (if applicable) */}
      {location.hours && (
        <StructuredData 
          type="LocalBusiness" 
          data={{
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": `${location.website}#hours`,
            "name": location.name,
            "openingHours": location.hours.map(hours => 
              hours.closed ? `${hours.dayOfWeek} closed` : `${hours.dayOfWeek} ${hours.opens}-${hours.closes}`
            )
          }} 
        />
      )}

      {/* Review/Rating Schema Placeholder */}
      <StructuredData 
        type="LocalBusiness"
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": `${location.website}#reviews`,
          "name": location.name,
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "12"
          }
        }}
      />
    </>
  );
}

// Helper functions
function getPageTitle(pageType: string): string {
  switch (pageType) {
    case 'home': return 'Professional QA Engineering & Product Strategy';
    case 'about': return 'About Isaac Vazquez - Local QA Expert';
    case 'contact': return 'Contact for Local Services';
    case 'services': return 'Professional Services';
    default: return 'Professional Services';
  }
}

function getPageDescription(pageType: string, location: BusinessLocation): string {
  const baseDesc = `Professional ${location.categories.join(', ')} services in ${location.address.addressLocality}, ${location.address.addressRegion}`;
  
  switch (pageType) {
    case 'home': 
      return `${baseDesc}. Serving ${location.serviceAreas.length} cities with expert quality assurance and product strategy.`;
    case 'about':
      return `Meet Isaac Vazquez, your local ${location.address.addressLocality} expert in QA engineering and product strategy.`;
    case 'contact':
      return `Contact Isaac Vazquez for professional services in ${location.address.addressLocality}. Call ${location.phone} or email for consultation.`;
    case 'services':
      return `${baseDesc}. Comprehensive consulting and engineering services for local businesses.`;
    default:
      return baseDesc;
  }
}

function getBreadcrumbs(pageType: string, location: BusinessLocation) {
  const base = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": location.website
    }
  ];

  if (pageType !== 'home') {
    base.push({
      "@type": "ListItem",
      "position": 2,
      "name": getPageTitle(pageType),
      "item": `${location.website}/${pageType}`
    });
  }

  return base;
}