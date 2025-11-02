import { businessLocations, BusinessLocation } from './localSEO';

export interface LocalSitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  location?: BusinessLocation;
  alternateLanguages?: { [key: string]: string };
}

// Generate location-specific sitemap entries
export function generateLocalSitemapEntries(): LocalSitemapEntry[] {
  const baseUrl = 'https://isaacavazquez.com';
  const entries: LocalSitemapEntry[] = [];
  const now = new Date();

  // Core pages with location variants
  const corePages = [
    { path: '', priority: 1.0, changeFreq: 'weekly' as const },
    { path: '/services', priority: 0.9, changeFreq: 'weekly' as const },
    { path: '/contact', priority: 0.8, changeFreq: 'monthly' as const },
    { path: '/resume', priority: 0.7, changeFreq: 'monthly' as const },
    { path: '/fantasy-football', priority: 0.8, changeFreq: 'daily' as const }
  ];

  // Generate entries for each location
  businessLocations.forEach(location => {
    // Main location pages
    corePages.forEach(page => {
      const locationSlug = location.id;
      const url = page.path 
        ? `${baseUrl}${page.path}?location=${locationSlug}`
        : `${baseUrl}?location=${locationSlug}`;

      entries.push({
        url,
        lastModified: now,
        changeFrequency: page.changeFreq,
        priority: page.priority,
        location
      });
    });

    // Location-specific service pages
    location.categories.forEach((service, index) => {
      const serviceSlug = service.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      entries.push({
        url: `${baseUrl}/services/${serviceSlug}?location=${location.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
        location
      });
    });

    // Service area pages
    location.serviceAreas.forEach((area, index) => {
      const areaSlug = area.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      entries.push({
        url: `${baseUrl}/areas/${areaSlug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
        location
      });
    });

    // Location testimonials/reviews page
    entries.push({
      url: `${baseUrl}/testimonials/${location.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
      location
    });
  });

  return entries;
}

// Generate XML sitemap content
export function generateLocalSitemapXML(): string {
  const entries = generateLocalSitemapEntries();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:geo="http://www.google.com/geo/schemas/sitemap/1.0">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified.toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
    ${entry.location ? `<geo:geo>
      <geo:format>kml</geo:format>
    </geo:geo>` : ''}
    ${entry.alternateLanguages ? Object.entries(entry.alternateLanguages).map(([lang, url]) => 
      `<xhtml:link rel="alternate" hreflang="${lang}" href="${url}"/>`).join('\n    ') : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

// Generate location-specific robots.txt entries
export function generateLocalRobotsTxt(): string {
  const baseUrl = 'https://isaacavazquez.com';
  
  const robotsTxt = `User-agent: *
Allow: /

# Local SEO pages
Allow: /services/*
Allow: /areas/*
Allow: /testimonials/*

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-local.xml

# Location-specific content
${businessLocations.map(location => 
  `# ${location.address.addressLocality}, ${location.address.addressRegion} content
Allow: /*location=${location.id}*`
).join('\n')}

# Disallow admin and temporary pages
Disallow: /admin/
Disallow: /temp/
Disallow: /_next/
Disallow: /api/

# Crawl delay
Crawl-delay: 1`;

  return robotsTxt;
}

// Generate local business index for search engines
export function generateLocalBusinessIndex(): LocalBusinessIndex {
  return {
    businesses: businessLocations.map(location => ({
      id: location.id,
      name: location.name,
      address: location.address,
      coordinates: location.coordinates,
      serviceAreas: location.serviceAreas,
      categories: location.categories,
      urls: {
        main: `https://isaacavazquez.com?location=${location.id}`,
        contact: `https://isaacavazquez.com/contact?location=${location.id}`,
        services: location.categories.map(service => ({
          name: service,
          url: `https://isaacavazquez.com/services/${service.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}?location=${location.id}`
        }))
      },
      socialProfiles: {
        googleBusiness: `https://www.google.com/maps/search/${encodeURIComponent(location.name)}/@${location.coordinates.latitude},${location.coordinates.longitude},15z`,
        linkedin: 'https://linkedin.com/in/isaac-vazquez',
        github: 'https://github.com/IsaacAVazquez'
      },
      lastUpdated: new Date().toISOString()
    })),
    lastGenerated: new Date().toISOString(),
    totalLocations: businessLocations.length,
    totalServiceAreas: businessLocations.reduce((total, loc) => total + loc.serviceAreas.length, 0)
  };
}

export interface LocalBusinessIndex {
  businesses: Array<{
    id: string;
    name: string;
    address: BusinessLocation['address'];
    coordinates: BusinessLocation['coordinates'];
    serviceAreas: string[];
    categories: string[];
    urls: {
      main: string;
      contact: string;
      services: Array<{ name: string; url: string }>;
    };
    socialProfiles: {
      googleBusiness: string;
      linkedin: string;
      github: string;
    };
    lastUpdated: string;
  }>;
  lastGenerated: string;
  totalLocations: number;
  totalServiceAreas: number;
}

// Generate Google My Business posts data
export function generateGoogleBusinessPosts(location: BusinessLocation): GoogleBusinessPost[] {
  const posts: GoogleBusinessPost[] = [
    {
      type: 'UPDATE',
      title: `${location.address.addressLocality} QA Services Available`,
      content: `Professional quality assurance and testing services now available in ${location.address.addressLocality}, ${location.address.addressRegion}. Contact us for a free consultation.`,
      callToAction: {
        actionType: 'LEARN_MORE',
        url: `https://isaacavazquez.com/contact?location=${location.id}`
      },
      media: {
        type: 'PHOTO',
        url: `https://isaacavazquez.com/images/local-${location.id}-services.jpg`
      },
      publishDate: new Date(),
      location: location.id
    },
    {
      type: 'OFFER',
      title: 'Free QA Consultation',
      content: `Get a free 30-minute consultation on your software quality needs. Available for ${location.address.addressLocality} area businesses.`,
      callToAction: {
        actionType: 'CALL',
        url: `tel:${location.phone}`
      },
      offer: {
        couponCode: 'FREECONSULT',
        redeemOnlineUrl: `https://isaacavazquez.com/contact?location=${location.id}&offer=consultation`,
        termsConditions: 'Valid for new clients only. One consultation per business.'
      },
      publishDate: new Date(),
      location: location.id
    },
    {
      type: 'EVENT',
      title: `${location.address.addressLocality} Tech Meetup`,
      content: `Join us for a local tech discussion about quality assurance best practices in ${location.address.addressLocality}.`,
      event: {
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 hours
        location: `${location.address.addressLocality}, ${location.address.addressRegion}`
      },
      callToAction: {
        actionType: 'LEARN_MORE',
        url: `https://isaacavazquez.com/events?location=${location.id}`
      },
      publishDate: new Date(),
      location: location.id
    }
  ];

  return posts;
}

export interface GoogleBusinessPost {
  type: 'UPDATE' | 'OFFER' | 'EVENT' | 'PRODUCT';
  title: string;
  content: string;
  callToAction: {
    actionType: 'LEARN_MORE' | 'CALL' | 'ORDER_ONLINE' | 'BOOK' | 'SHOP_NOW' | 'SIGN_UP';
    url: string;
  };
  media?: {
    type: 'PHOTO' | 'VIDEO';
    url: string;
  };
  offer?: {
    couponCode: string;
    redeemOnlineUrl: string;
    termsConditions: string;
  };
  event?: {
    startDate: Date;
    endDate: Date;
    location: string;
  };
  publishDate: Date;
  location: string;
}

// Generate local landing page suggestions
export function generateLocalLandingPages(location: BusinessLocation): LocalLandingPage[] {
  const pages: LocalLandingPage[] = [];

  // Service + Location pages
  location.categories.forEach(service => {
    pages.push({
      url: `/services/${service.toLowerCase().replace(/\s+/g, '-')}/${location.id}`,
      title: `${service} in ${location.address.addressLocality}, ${location.address.addressRegion}`,
      description: `Professional ${service.toLowerCase()} services in ${location.address.addressLocality}. Serving ${location.serviceAreas.slice(0, 3).join(', ')} and surrounding areas.`,
      keywords: [
        `${service.toLowerCase()} ${location.address.addressLocality.toLowerCase()}`,
        `${service.toLowerCase()} ${location.address.addressRegion.toLowerCase()}`,
        ...location.serviceAreas.slice(0, 5).map(area => `${service.toLowerCase()} ${area.toLowerCase()}`)
      ],
      priority: 0.8,
      serviceArea: location.serviceAreas,
      localContent: {
        heroTitle: `Expert ${service} Services in ${location.address.addressLocality}`,
        localBenefits: [
          `Local ${location.address.addressLocality} expertise`,
          `Serving ${location.serviceAreas.length}+ cities in ${location.address.addressRegion}`,
          `Understanding of local business needs`,
          `Quick response times in the ${location.address.addressLocality} area`
        ],
        serviceAreas: location.serviceAreas,
        testimonials: `Real reviews from ${location.address.addressLocality} clients`
      }
    });
  });

  // Area-specific pages
  location.serviceAreas.forEach(area => {
    pages.push({
      url: `/areas/${area.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
      title: `QA Engineering & Product Strategy Services in ${area}`,
      description: `Professional quality assurance and product strategy services in ${area}. Local expertise for ${area} businesses.`,
      keywords: [
        `qa engineer ${area.toLowerCase()}`,
        `software testing ${area.toLowerCase()}`,
        `product strategy ${area.toLowerCase()}`,
        `quality assurance ${area.toLowerCase()}`
      ],
      priority: 0.6,
      serviceArea: [area],
      localContent: {
        heroTitle: `${area} QA Engineering Services`,
        localBenefits: [
          `Dedicated ${area} service area`,
          `Local market understanding`,
          `Quick on-site availability`,
          `Community-focused approach`
        ],
        serviceAreas: [area],
        testimonials: `Trusted by ${area} businesses`
      }
    });
  });

  return pages;
}

export interface LocalLandingPage {
  url: string;
  title: string;
  description: string;
  keywords: string[];
  priority: number;
  serviceArea: string[];
  localContent: {
    heroTitle: string;
    localBenefits: string[];
    serviceAreas: string[];
    testimonials: string;
  };
}
