"use client";

import { useState, useEffect } from "react";
import { BusinessLocation, googleBusinessProfile } from "@/lib/localSEO";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { IconMapPin, IconStar, IconExternalLink, IconNavigation, IconPhone, IconMail } from "@tabler/icons-react";
import Link from "next/link";

interface GoogleBusinessIntegrationProps {
  location: BusinessLocation;
  variant?: 'full' | 'compact' | 'map-only';
  className?: string;
}

export function GoogleBusinessIntegration({ 
  location, 
  variant = 'full', 
  className = '' 
}: GoogleBusinessIntegrationProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  // Google Maps embed URL (replace YOUR_GOOGLE_MAPS_API_KEY with actual key)
  const mapsEmbedUrl = googleBusinessProfile.generateMapsEmbedUrl(location);
  const businessProfileUrl = googleBusinessProfile.generateBusinessProfileUrl(location);
  const directionsUrl = googleBusinessProfile.generateDirectionsUrl(location);

  if (variant === 'map-only') {
    return (
      <div className={`${className}`}>
        <div className="aspect-video rounded-lg overflow-hidden border border-electric-blue/20">
          <iframe
            src={mapsEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setMapLoaded(true)}
            title={`Map showing ${location.name} location`}
          />
          {!mapLoaded && (
            <div className="flex items-center justify-center h-full bg-terminal-bg/50">
              <div className="text-slate-400">Loading map...</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <WarmCard hover={false} padding="md" className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Find Us on Google</h3>
          <IconMapPin className="w-5 h-5 text-electric-blue" />
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            {location.address.addressLocality}, {location.address.addressRegion}
          </p>
          
          <div className="flex space-x-2">
            <ModernButton 
              href={businessProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <IconExternalLink className="w-4 h-4 mr-2" />
              View Profile
            </ModernButton>
            
            <ModernButton 
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="primary"
              className="flex-1"
            >
              <IconNavigation className="w-4 h-4 mr-2" />
              Directions
            </ModernButton>
          </div>
        </div>
      </WarmCard>
    );
  }

  // Full variant
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Google Business Profile Card */}
      <WarmCard hover={false} padding="md" className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Find Us on Google Business
            </h2>
            <p className="text-slate-300">
              Connect with us through Google's business platform for reviews, directions, and updates.
            </p>
          </div>
          <IconMapPin className="w-8 h-8 text-electric-blue flex-shrink-0" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-white mb-2">Business Information</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center space-x-2">
                  <IconMapPin className="w-4 h-4 text-electric-blue" />
                  <span>{location.address.addressLocality}, {location.address.addressRegion}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <IconPhone className="w-4 h-4 text-matrix-green" />
                  <Link href={`tel:${location.phone}`} className="hover:text-electric-blue transition-colors">
                    {location.phone}
                  </Link>
                </div>
                <div className="flex items-center space-x-2">
                  <IconMail className="w-4 h-4 text-cyber-teal" />
                  <Link href={`mailto:${location.email}`} className="hover:text-electric-blue transition-colors">
                    {location.email}
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-white mb-2">Service Categories</h3>
              <div className="flex flex-wrap gap-1">
                {location.categories.slice(0, 3).map((category, index) => (
                  <span 
                    key={index}
                    className="text-xs bg-electric-blue/10 text-electric-blue px-2 py-1 rounded"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ModernButton 
              href={businessProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="w-full"
            >
              <IconExternalLink className="w-4 h-4 mr-2" />
              View Google Business Profile
            </ModernButton>
            
            <ModernButton 
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              className="w-full"
            >
              <IconNavigation className="w-4 h-4 mr-2" />
              Get Directions
            </ModernButton>

            {/* Review CTA */}
            <div className="text-center p-3 bg-matrix-green/10 border border-matrix-green/20 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} className="w-4 h-4 text-matrix-green" />
                ))}
              </div>
              <p className="text-xs text-slate-300 mb-2">Love our service?</p>
              <ModernButton 
                href={`${businessProfileUrl}#reviews`}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                variant="ghost"
                className="text-matrix-green"
              >
                Leave a Review
              </ModernButton>
            </div>
          </div>
        </div>
      </WarmCard>

      {/* Interactive Map */}
      <WarmCard hover={false} padding="md" className="p-6">
        <h3 className="font-semibold text-white mb-4">Service Area Map</h3>
        <div className="aspect-video rounded-lg overflow-hidden border border-electric-blue/20 mb-4">
          <iframe
            src={mapsEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setMapLoaded(true)}
            title={`Interactive map showing ${location.name} service area`}
          />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-slate-400 mb-3">
            Serving {location.serviceAreas.length} cities across {location.address.addressRegion}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {location.serviceAreas.slice(0, 8).map((area, index) => (
              <span 
                key={index}
                className="text-xs bg-terminal-bg/50 border border-electric-blue/10 px-2 py-1 rounded"
              >
                {area}
              </span>
            ))}
            {location.serviceAreas.length > 8 && (
              <span className="text-xs text-slate-400">
                +{location.serviceAreas.length - 8} more
              </span>
            )}
          </div>
        </div>
      </WarmCard>
    </div>
  );
}

// Google Business Profile Setup Component
export function GoogleBusinessSetup({ location }: { location: BusinessLocation }) {
  const setupSteps = [
    {
      step: 1,
      title: "Claim Your Business",
      description: "Search for your business on Google and claim ownership",
      action: "Search Google My Business"
    },
    {
      step: 2,
      title: "Verify Your Location",
      description: "Complete verification process via phone, email, or postcard",
      action: "Start Verification"
    },
    {
      step: 3,
      title: "Complete Your Profile",
      description: "Add photos, hours, services, and business description",
      action: "Edit Profile"
    },
    {
      step: 4,
      title: "Optimize for Local SEO",
      description: "Use location keywords and encourage customer reviews",
      action: "Learn More"
    }
  ];

  return (
    <WarmCard hover={false} padding="md" className="p-6">
      <h3 className="text-xl font-semibold text-white mb-4">
        Google Business Profile Setup Guide
      </h3>
      <p className="text-slate-300 mb-6">
        Follow these steps to optimize your Google Business Profile for {location.address.addressLocality}:
      </p>

      <div className="space-y-4">
        {setupSteps.map((step) => (
          <div key={step.step} className="flex items-start space-x-4 p-4 bg-terminal-bg/30 rounded-lg">
            <div className="w-8 h-8 bg-electric-blue/20 text-electric-blue rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
              {step.step}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white mb-1">{step.title}</h4>
              <p className="text-sm text-slate-400 mb-2">{step.description}</p>
              <ModernButton size="sm" variant="outline">
                {step.action}
              </ModernButton>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-matrix-green/10 border border-matrix-green/20 rounded-lg">
        <h4 className="font-medium text-matrix-green mb-2">Pro Tip</h4>
        <p className="text-sm text-slate-300">
          Keep your NAP (Name, Address, Phone) information consistent across all online platforms 
          to improve local search rankings and customer trust.
        </p>
      </div>
    </WarmCard>
  );
}