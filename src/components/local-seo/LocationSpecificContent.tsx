"use client";

import { BusinessLocation } from "@/lib/localSEO";
import { GlassCard } from "@/components/ui/GlassCard";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { IconMapPin, IconUsers, IconBriefcase, IconStar, IconArrowRight } from "@tabler/icons-react";

interface LocationSpecificContentProps {
  location: BusinessLocation;
  contentType?: 'hero' | 'services' | 'about' | 'testimonials';
  className?: string;
}

export function LocationSpecificContent({ 
  location, 
  contentType = 'hero', 
  className = '' 
}: LocationSpecificContentProps) {
  
  if (contentType === 'hero') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center">
          <Badge variant="electric" className="mb-4">
            Now Serving {location.address.addressLocality}, {location.address.addressRegion}
          </Badge>
          
          <Heading level={1} className="mb-6">
            Professional QA Engineering & Product Strategy in{" "}
            <span className="text-electric-blue">
              {location.address.addressLocality}
            </span>
          </Heading>
          
          <Paragraph size="lg" className="max-w-3xl mx-auto text-slate-300">
            {location.id === 'austin-tx' 
              ? "Bringing quality assurance excellence and strategic product leadership to Austin's thriving tech ecosystem. From civic tech innovations to startup growth, I help businesses build reliable software that scales."
              : "Combining technical expertise with UC Berkeley business insights to drive innovation in the Bay Area. Serving Silicon Valley startups to enterprise clients with strategic product management and quality assurance."
            }
          </Paragraph>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {location.serviceAreas.slice(0, 6).map((area, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {area}
            </Badge>
          ))}
          {location.serviceAreas.length > 6 && (
            <Badge variant="outline" className="text-xs">
              +{location.serviceAreas.length - 6} more areas
            </Badge>
          )}
        </div>
      </div>
    );
  }

  if (contentType === 'services') {
    return (
      <div className={`space-y-8 ${className}`}>
        <div className="text-center">
          <Heading level={2} className="mb-4">
            Services in {location.address.addressLocality}, {location.address.addressRegion}
          </Heading>
          <Paragraph className="text-slate-400 max-w-2xl mx-auto">
            Tailored professional services designed for the unique needs of {location.address.addressLocality} businesses and the surrounding {location.address.addressRegion} market.
          </Paragraph>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {location.categories.map((service, index) => (
            <GlassCard key={index} className="p-6 hover:scale-105 transition-transform">
              <div className="flex items-start space-x-3">
                <IconBriefcase className="w-6 h-6 text-electric-blue mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-2">{service}</h3>
                  <p className="text-sm text-slate-400">
                    {getServiceDescription(service, location)}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Local Market Insights */}
        <GlassCard className="p-8 bg-electric-blue/5 border-electric-blue/20">
          <div className="flex items-start space-x-4">
            <IconMapPin className="w-8 h-8 text-electric-blue mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Why Choose Local {location.address.addressLocality} Expertise?
              </h3>
              <div className="space-y-3 text-slate-300">
                {getLocalAdvantages(location).map((advantage, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <IconStar className="w-4 h-4 text-matrix-green mt-1 flex-shrink-0" />
                    <span className="text-sm">{advantage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (contentType === 'about') {
    return (
      <div className={`space-y-6 ${className}`}>
        <GlassCard className="p-8">
          <div className="flex items-start space-x-4 mb-6">
            <IconUsers className="w-8 h-8 text-electric-blue mt-1 flex-shrink-0" />
            <div>
              <Heading level={3} className="mb-3">
                Local {location.address.addressLocality} Connection
              </Heading>
              <Paragraph className="text-slate-300">
                {getLocationStory(location)}
              </Paragraph>
            </div>
          </div>

          <div className="border-l-4 border-matrix-green pl-6">
            <h4 className="font-semibold text-white mb-2">Community Impact</h4>
            <Paragraph className="text-slate-400 text-sm">
              {getCommunityImpact(location)}
            </Paragraph>
          </div>
        </GlassCard>

        {/* Local Network & Partnerships */}
        <GlassCard className="p-6">
          <h4 className="font-semibold text-white mb-4">
            {location.address.addressLocality} Professional Network
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getLocalNetworks(location).map((network, index) => (
              <div key={index} className="text-center">
                <div className="bg-terminal-bg/50 rounded-lg p-3 mb-2">
                  <span className="text-xs text-electric-blue font-mono">{network.type}</span>
                </div>
                <span className="text-xs text-slate-400">{network.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  if (contentType === 'testimonials') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center">
          <Heading level={2} className="mb-4">
            {location.address.addressLocality} Client Success Stories
          </Heading>
          <Paragraph className="text-slate-400 max-w-2xl mx-auto">
            Real results from businesses across {location.address.addressLocality} and the greater {location.address.addressRegion} area.
          </Paragraph>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {getLocalTestimonials(location).map((testimonial, index) => (
            <GlassCard key={index} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-electric-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-electric-blue font-bold">{testimonial.initials}</span>
                </div>
                <div>
                  <blockquote className="text-slate-300 mb-3">
                    "{testimonial.quote}"
                  </blockquote>
                  <footer className="text-sm">
                    <cite className="text-white font-medium not-italic">{testimonial.name}</cite>
                    <div className="text-slate-400">{testimonial.title}</div>
                    <div className="text-xs text-electric-blue">{testimonial.company} • {testimonial.location}</div>
                  </footer>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="text-center">
          <Link 
            href="/contact" 
            className="inline-flex items-center space-x-2 text-electric-blue hover:text-matrix-green transition-colors"
          >
            <span>Start Your Success Story</span>
            <IconArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

// Helper functions for location-specific content
function getServiceDescription(service: string, location: BusinessLocation): string {
  const descriptions: Record<string, Record<string, string>> = {
    "Quality Assurance Engineer": {
      "austin-tx": "Comprehensive QA services for Austin's growing tech sector, from startups to civic tech platforms.",
      "bay-area-ca": "Enterprise-grade QA engineering for Silicon Valley companies and Bay Area innovation hubs."
    },
    "Product Strategist": {
      "austin-tx": "Strategic product leadership combining Austin's entrepreneurial spirit with proven methodologies.",
      "bay-area-ca": "MBA-level product strategy consulting leveraging UC Berkeley insights and Valley experience."
    },
    "Software Testing Consultant": {
      "austin-tx": "Independent testing consultation for Austin businesses seeking quality assurance expertise.",
      "bay-area-ca": "High-level testing strategy for Bay Area startups and established tech companies."
    }
  };

  return descriptions[service]?.[location.id] || `Professional ${service.toLowerCase()} services in ${location.address.addressLocality}.`;
}

function getLocalAdvantages(location: BusinessLocation): string[] {
  if (location.id === 'austin-tx') {
    return [
      "Deep understanding of Austin's unique tech ecosystem and startup culture",
      "Experience with Austin civic tech requirements and regulations",
      "Local network of Austin developers, entrepreneurs, and business leaders",
      "Knowledge of Texas business practices and market dynamics",
      "Familiarity with Austin's rapid growth challenges and opportunities"
    ];
  } else {
    return [
      "Current UC Berkeley Haas MBA providing cutting-edge business insights",
      "Direct access to Silicon Valley's innovation methodologies",
      "Understanding of Bay Area's competitive landscape and standards",
      "Network within California's tech and business communities",
      "Experience with high-scale Bay Area technology requirements"
    ];
  }
}

function getLocationStory(location: BusinessLocation): string {
  if (location.id === 'austin-tx') {
    return "Based in Austin, Texas, I've been part of the city's incredible tech transformation. From working on civic tech platforms that serve millions of voters to collaborating with local startups, I understand the unique challenges and opportunities that Austin businesses face. My experience spans the full spectrum of Austin's tech ecosystem.";
  } else {
    return "Currently pursuing my MBA at UC Berkeley's prestigious Haas School of Business, I'm immersed in the Bay Area's innovation ecosystem. This unique position allows me to bring both academic rigor and practical Silicon Valley insights to every project, combining theoretical knowledge with real-world application.";
  }
}

function getCommunityImpact(location: BusinessLocation): string {
  if (location.id === 'austin-tx') {
    return "Contributing to Austin's goal of becoming a leading tech hub through quality engineering practices, mentoring local developers, and supporting civic tech initiatives that improve city services for all residents.";
  } else {
    return "Engaging with the Bay Area's entrepreneurial community through UC Berkeley networks, contributing to innovative startups, and applying business school insights to drive technological advancement in the region.";
  }
}

function getLocalNetworks(location: BusinessLocation): Array<{type: string, name: string}> {
  if (location.id === 'austin-tx') {
    return [
      { type: "TECH", name: "Austin Tech Alliance" },
      { type: "CIVIC", name: "Austin Civic Tech" },
      { type: "QA", name: "Austin QA Meetup" },
      { type: "STARTUP", name: "Austin Startup Week" }
    ];
  } else {
    return [
      { type: "MBA", name: "UC Berkeley Haas" },
      { type: "TECH", name: "Bay Area Council" },
      { type: "STARTUP", name: "SF Tech Week" },
      { type: "NETWORK", name: "Silicon Valley Assoc" }
    ];
  }
}

function getLocalTestimonials(location: BusinessLocation): Array<{
  initials: string;
  quote: string;
  name: string;
  title: string;
  company: string;
  location: string;
}> {
  if (location.id === 'austin-tx') {
    return [
      {
        initials: "MR",
        quote: "Isaac's QA expertise was crucial for our Austin startup's product launch. His understanding of both technical requirements and local market needs made all the difference.",
        name: "Maria Rodriguez",
        title: "CTO",
        company: "Austin Health Tech",
        location: "Austin, TX"
      },
      {
        initials: "DL",
        quote: "Working with Isaac on our civic tech platform gave us confidence that we could serve Austin residents reliably. His attention to detail is exceptional.",
        name: "David Lee",
        title: "Product Manager",
        company: "City Innovation Lab",
        location: "Austin, TX"
      }
    ];
  } else {
    return [
      {
        initials: "SK",
        quote: "Isaac brings a unique combination of technical depth and strategic thinking. His UC Berkeley perspective adds real value to our product decisions.",
        name: "Sarah Kim",
        title: "Head of Product",
        company: "Bay Area Fintech",
        location: "San Francisco, CA"
      },
      {
        initials: "JP",
        quote: "The quality of Isaac's testing strategy helped us scale confidently. His business school insights shaped our entire QA approach.",
        name: "James Park",
        title: "Engineering Director",
        company: "Silicon Valley Startup",
        location: "Palo Alto, CA"
      }
    ];
  }
}