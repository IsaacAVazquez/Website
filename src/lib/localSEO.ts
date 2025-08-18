import type { Metadata } from "next";

// Business location configuration
export interface BusinessLocation {
  id: string;
  name: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  email: string;
  website: string;
  timezone: string;
  serviceAreas: string[];
  categories: string[];
  description: string;
  established?: string;
  hours?: BusinessHours[];
}

export interface BusinessHours {
  dayOfWeek: string;
  opens: string;
  closes: string;
  closed?: boolean;
}

// Primary business locations
export const businessLocations: BusinessLocation[] = [
  {
    id: "austin-tx",
    name: "Isaac Vazquez - QA Engineering & Product Strategy (Austin)",
    address: {
      streetAddress: "Austin",
      addressLocality: "Austin",
      addressRegion: "TX",
      postalCode: "78701",
      addressCountry: "US"
    },
    coordinates: {
      latitude: 30.2672,
      longitude: -97.7431
    },
    phone: "+1-512-XXX-XXXX", // Replace with actual phone
    email: "isaacavazquez95@gmail.com",
    website: "https://isaacavazquez.com",
    timezone: "America/Chicago",
    serviceAreas: [
      "Austin, TX",
      "Round Rock, TX",
      "Cedar Park, TX",
      "Georgetown, TX",
      "Pflugerville, TX",
      "Leander, TX",
      "Kyle, TX",
      "Lakeway, TX",
      "Bee Cave, TX",
      "Dripping Springs, TX"
    ],
    categories: [
      "Quality Assurance Engineer",
      "Product Strategist",
      "Software Testing Consultant",
      "Test Automation Specialist",
      "Civic Tech Professional",
      "Fantasy Football Analytics Developer"
    ],
    description: "Professional QA Engineering and Product Strategy services in Austin, Texas. Specializing in test automation, software quality assurance, and strategic product management for startups and enterprise clients.",
    established: "2018"
  },
  {
    id: "bay-area-ca",
    name: "Isaac Vazquez - Business Strategy & MBA Services (Bay Area)",
    address: {
      streetAddress: "Berkeley",
      addressLocality: "Berkeley",
      addressRegion: "CA",
      postalCode: "94720",
      addressCountry: "US"
    },
    coordinates: {
      latitude: 37.8719,
      longitude: -122.2585
    },
    phone: "+1-510-XXX-XXXX", // Replace with actual phone
    email: "isaacavazquez95@gmail.com", 
    website: "https://isaacavazquez.com",
    timezone: "America/Los_Angeles",
    serviceAreas: [
      "San Francisco, CA",
      "Oakland, CA",
      "Berkeley, CA",
      "San Jose, CA",
      "Palo Alto, CA",
      "Mountain View, CA",
      "Sunnyvale, CA",
      "Fremont, CA",
      "Hayward, CA",
      "Santa Clara, CA",
      "Redwood City, CA",
      "Cupertino, CA"
    ],
    categories: [
      "Business Strategy Consultant",
      "MBA Student Services",
      "Product Management Consultant",
      "Innovation Strategy",
      "Technology Business Leader",
      "UC Berkeley Haas Alumni Network"
    ],
    description: "Business strategy consulting and MBA-level strategic planning services in the San Francisco Bay Area. Combining technical expertise with business school insights for innovative solutions.",
    established: "2024"
  }
];

// NAP (Name, Address, Phone) consistency data
export const napData = {
  businessName: "Isaac Vazquez - QA Engineer & Product Strategist",
  legalName: "Isaac Vazquez",
  brandName: "Isaac Vazquez Digital Platform",
  phone: {
    primary: "+1-512-XXX-XXXX", // Austin primary
    secondary: "+1-510-XXX-XXXX", // Bay Area secondary
    formatted: "(512) XXX-XXXX"
  },
  email: {
    primary: "isaacavazquez95@gmail.com",
    business: "contact@isaacavazquez.com",
    support: "support@isaacavazquez.com"
  },
  website: "https://isaacavazquez.com",
  socialProfiles: {
    linkedin: "https://linkedin.com/in/isaac-vazquez",
    github: "https://github.com/IsaacAVazquez",
    twitter: "https://twitter.com/isaacvazquez"
  }
};

// Generate Local Business Schema
export function generateLocalBusinessSchema(location: BusinessLocation): object {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${location.website}#business-${location.id}`,
    "name": location.name,
    "legalName": napData.legalName,
    "description": location.description,
    "url": location.website,
    "telephone": location.phone,
    "email": location.email,
    "foundingDate": location.established,
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
    "serviceType": location.categories,
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Professional Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "QA Engineering Services",
            "description": "Comprehensive software testing, test automation, and quality assurance consulting"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Product Strategy Consulting",
            "description": "Strategic product management, business analysis, and innovation consulting"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Fantasy Football Analytics",
            "description": "Advanced fantasy sports analytics, data visualization, and algorithmic insights"
          }
        }
      ]
    },
    "sameAs": [
      napData.socialProfiles.linkedin,
      napData.socialProfiles.github,
      napData.socialProfiles.twitter
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": location.phone,
      "email": location.email,
      "contactType": "customer service",
      "areaServed": location.serviceAreas,
      "availableLanguage": ["English"]
    },
    "makesOffer": location.categories.map(category => ({
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": category,
        "provider": {
          "@type": "Person",
          "name": napData.legalName
        }
      }
    }))
  };
}

// Generate Person Schema with local context
export function generatePersonSchemaWithLocation(location: BusinessLocation): object {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${location.website}#person`,
    "name": napData.legalName,
    "jobTitle": "QA Engineer & Product Strategist",
    "description": `Professional QA Engineer and Product Strategist serving ${location.address.addressLocality}, ${location.address.addressRegion} and surrounding areas`,
    "email": location.email,
    "telephone": location.phone,
    "url": location.website,
    "worksFor": {
      "@type": "Organization",
      "name": location.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": location.address.addressLocality,
        "addressRegion": location.address.addressRegion,
        "addressCountry": location.address.addressCountry
      }
    },
    "alumniOf": [
      {
        "@type": "CollegeOrUniversity",
        "name": "UC Berkeley Haas School of Business",
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
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Tallahassee", 
          "addressRegion": "FL",
          "addressCountry": "US"
        }
      }
    ],
    "knowsAbout": location.categories,
    "homeLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": location.address.addressLocality,
        "addressRegion": location.address.addressRegion,
        "addressCountry": location.address.addressCountry
      }
    },
    "sameAs": [
      napData.socialProfiles.linkedin,
      napData.socialProfiles.github,
      napData.socialProfiles.twitter
    ]
  };
}

// Generate Service Area Schema
export function generateServiceAreaSchema(location: BusinessLocation): object {
  return {
    "@context": "https://schema.org",
    "@type": "ServiceArea", 
    "@id": `${location.website}#service-area-${location.id}`,
    "name": `${location.address.addressLocality} Metro Service Area`,
    "description": `Professional QA Engineering and Product Strategy services covering ${location.address.addressLocality} and surrounding metropolitan area`,
    "geoMidpoint": {
      "@type": "GeoCoordinates",
      "latitude": location.coordinates.latitude,
      "longitude": location.coordinates.longitude
    },
    "geoRadius": "50 miles",
    "containsPlace": location.serviceAreas.map(area => ({
      "@type": "City",
      "name": area,
      "containedInPlace": {
        "@type": "State",
        "name": location.address.addressRegion
      }
    }))
  };
}

// Local SEO Metadata Generator
export function generateLocalSEOMetadata(
  location: BusinessLocation,
  pageTitle: string,
  pageDescription: string,
  pageType: 'home' | 'about' | 'services' | 'contact' = 'home'
): Metadata {
  const localTitle = `${pageTitle} | ${location.address.addressLocality}, ${location.address.addressRegion}`;
  const localDescription = `${pageDescription} Serving ${location.address.addressLocality}, ${location.address.addressRegion} and surrounding areas.`;
  
  const localKeywords = [
    `${pageTitle.toLowerCase()} ${location.address.addressLocality.toLowerCase()}`,
    `${pageTitle.toLowerCase()} ${location.address.addressRegion.toLowerCase()}`,
    ...location.serviceAreas.map(area => `${pageTitle.toLowerCase()} ${area.toLowerCase()}`),
    `professional services ${location.address.addressLocality.toLowerCase()}`,
    `QA engineer ${location.address.addressLocality.toLowerCase()}`,
    `product strategist ${location.address.addressLocality.toLowerCase()}`,
    `software testing ${location.address.addressLocality.toLowerCase()}`,
    `business consulting ${location.address.addressLocality.toLowerCase()}`
  ];

  return {
    title: localTitle,
    description: localDescription,
    keywords: localKeywords,
    openGraph: {
      title: localTitle,
      description: localDescription,
      type: 'website',
      locale: 'en_US',
      siteName: napData.brandName,
      images: [
        {
          url: `${location.website}/images/local-seo-${location.id}.png`,
          width: 1200,
          height: 630,
          alt: `${napData.legalName} - ${location.address.addressLocality}, ${location.address.addressRegion}`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: localTitle,
      description: localDescription,
      creator: '@isaacvazquez'
    },
    other: {
      'geo.region': `${location.address.addressCountry}-${location.address.addressRegion}`,
      'geo.placename': location.address.addressLocality,
      'geo.position': `${location.coordinates.latitude};${location.coordinates.longitude}`,
      'ICBM': `${location.coordinates.latitude}, ${location.coordinates.longitude}`,
      'DC.title': localTitle
    }
  };
}

// Google Business Profile Utilities
export const googleBusinessProfile = {
  // Generate Google Maps embed URL
  generateMapsEmbedUrl: (location: BusinessLocation): string => {
    const query = encodeURIComponent(`${location.name}, ${location.address.streetAddress}, ${location.address.addressLocality}, ${location.address.addressRegion}`);
    return `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${query}`;
  },

  // Generate Google Business Profile URL
  generateBusinessProfileUrl: (location: BusinessLocation): string => {
    const query = encodeURIComponent(location.name);
    return `https://www.google.com/maps/search/${query}/@${location.coordinates.latitude},${location.coordinates.longitude},15z`;
  },

  // Generate directions URL
  generateDirectionsUrl: (location: BusinessLocation): string => {
    const destination = encodeURIComponent(`${location.address.streetAddress}, ${location.address.addressLocality}, ${location.address.addressRegion} ${location.address.postalCode}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  },

  // Generate Google Reviews URL
  generateReviewsUrl: (placeId: string): string => {
    return `https://search.google.com/local/writereview?placeid=${placeId}`;
  }
};

// Location detection utilities
export const locationDetection = {
  // Get user's location-based content
  getLocationBasedContent: async (userLocation?: {lat: number, lng: number}): Promise<BusinessLocation> => {
    if (!userLocation) {
      return businessLocations[0]; // Default to Austin
    }

    // Calculate distance to each location
    const distances = businessLocations.map(location => {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng,
        location.coordinates.latitude,
        location.coordinates.longitude
      );
      return { location, distance };
    });

    // Return closest location
    distances.sort((a, b) => a.distance - b.distance);
    return distances[0].location;
  },

  // Detect user location (client-side)
  getUserLocation: (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => reject(error),
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Export default location (Austin)
export const defaultLocation = businessLocations[0];
export const bayAreaLocation = businessLocations[1];