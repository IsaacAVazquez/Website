"use client";

import { BusinessLocation, napData } from "@/lib/localSEO";
import { IconPhone, IconMail, IconMapPin, IconWorld } from "@tabler/icons-react";
import Link from "next/link";

interface NAPDisplayProps {
  location: BusinessLocation;
  variant?: 'full' | 'compact' | 'footer' | 'contact';
  className?: string;
  showIcons?: boolean;
}

export function NAPDisplay({ 
  location, 
  variant = 'full', 
  className = '',
  showIcons = true 
}: NAPDisplayProps) {
  const formatAddress = (location: BusinessLocation) => {
    return `${location.address.addressLocality}, ${location.address.addressRegion} ${location.address.postalCode}`;
  };

  const formatPhone = (phone: string) => {
    // Convert +1-512-XXX-XXXX to (512) XXX-XXXX format
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const number = cleaned.slice(1);
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    return phone;
  };

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col space-y-1 text-sm ${className}`}>
        <div className="flex items-center space-x-2">
          {showIcons && <IconMapPin className="w-4 h-4 text-electric-blue" />}
          <span>{formatAddress(location)}</span>
        </div>
        <div className="flex items-center space-x-2">
          {showIcons && <IconPhone className="w-4 h-4 text-matrix-green" />}
          <Link 
            href={`tel:${location.phone}`}
            className="hover:text-electric-blue transition-colors"
          >
            {formatPhone(location.phone)}
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-lg font-semibold text-white">{napData.businessName}</h3>
        <div className="space-y-2 text-slate-300">
          <div className="flex items-start space-x-3">
            {showIcons && <IconMapPin className="w-5 h-5 text-electric-blue mt-0.5 flex-shrink-0" />}
            <div>
              <p className="font-medium">{location.address.addressLocality}, {location.address.addressRegion}</p>
              <p className="text-sm opacity-80">Serving {location.serviceAreas.slice(0, 3).join(', ')}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {showIcons && <IconPhone className="w-5 h-5 text-matrix-green" />}
            <Link 
              href={`tel:${location.phone}`}
              className="hover:text-electric-blue transition-colors"
            >
              {formatPhone(location.phone)}
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            {showIcons && <IconMail className="w-5 h-5 text-cyber-teal" />}
            <Link 
              href={`mailto:${location.email}`}
              className="hover:text-electric-blue transition-colors"
            >
              {location.email}
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            {showIcons && <IconWorld className="w-5 h-5 text-neon-purple" />}
            <Link 
              href={location.website}
              className="hover:text-electric-blue transition-colors"
            >
              {location.website.replace('https://', '')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'contact') {
    return (
      <div className={`bg-terminal-bg/50 border border-electric-blue/20 rounded-lg p-6 ${className}`}>
        <h3 className="text-xl font-semibold text-white mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            {showIcons && <IconMapPin className="w-6 h-6 text-electric-blue mt-1 flex-shrink-0" />}
            <div>
              <h4 className="font-medium text-white mb-1">Service Area</h4>
              <p className="text-slate-300">{location.address.addressLocality}, {location.address.addressRegion}</p>
              <p className="text-sm text-slate-400 mt-1">
                Serving: {location.serviceAreas.slice(0, 5).join(', ')}
                {location.serviceAreas.length > 5 && ` and ${location.serviceAreas.length - 5} more areas`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {showIcons && <IconPhone className="w-6 h-6 text-matrix-green flex-shrink-0" />}
            <div>
              <h4 className="font-medium text-white mb-1">Phone</h4>
              <Link 
                href={`tel:${location.phone}`}
                className="text-matrix-green hover:text-electric-blue transition-colors text-lg"
              >
                {formatPhone(location.phone)}
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {showIcons && <IconMail className="w-6 h-6 text-cyber-teal flex-shrink-0" />}
            <div>
              <h4 className="font-medium text-white mb-1">Email</h4>
              <Link 
                href={`mailto:${location.email}`}
                className="text-cyber-teal hover:text-electric-blue transition-colors"
              >
                {location.email}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-l-4 border-electric-blue pl-4">
        <h2 className="text-2xl font-bold text-white mb-2">{napData.businessName}</h2>
        <p className="text-slate-300">{location.description}</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            {showIcons && <IconMapPin className="w-5 h-5 text-electric-blue mt-1 flex-shrink-0" />}
            <div>
              <h3 className="font-semibold text-white">Primary Service Area</h3>
              <p className="text-slate-300">{formatAddress(location)}</p>
              <p className="text-sm text-slate-400 mt-1">
                Also serving: {location.serviceAreas.slice(0, 3).join(', ')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {showIcons && <IconPhone className="w-5 h-5 text-matrix-green flex-shrink-0" />}
            <div>
              <h3 className="font-semibold text-white">Phone</h3>
              <Link 
                href={`tel:${location.phone}`}
                className="text-matrix-green hover:text-electric-blue transition-colors text-lg"
              >
                {formatPhone(location.phone)}
              </Link>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            {showIcons && <IconMail className="w-5 h-5 text-cyber-teal flex-shrink-0" />}
            <div>
              <h3 className="font-semibold text-white">Email</h3>
              <Link 
                href={`mailto:${location.email}`}
                className="text-cyber-teal hover:text-electric-blue transition-colors"
              >
                {location.email}
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {showIcons && <IconWorld className="w-5 h-5 text-neon-purple flex-shrink-0" />}
            <div>
              <h3 className="font-semibold text-white">Website</h3>
              <Link 
                href={location.website}
                className="text-neon-purple hover:text-electric-blue transition-colors"
              >
                {location.website.replace('https://', '')}
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Service Areas */}
      <div className="mt-6">
        <h3 className="font-semibold text-white mb-3">Complete Service Area</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {location.serviceAreas.map((area, index) => (
            <div 
              key={index}
              className="text-sm text-slate-300 bg-terminal-bg/30 px-3 py-1 rounded border border-electric-blue/10"
            >
              {area}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// NAP Microdata Component (for search engines)
export function NAPMicrodata({ location }: { location: BusinessLocation }) {
  return (
    <div style={{ display: 'none' }}>
      <div itemScope itemType="https://schema.org/LocalBusiness">
        <span itemProp="name">{napData.businessName}</span>
        <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
          <span itemProp="streetAddress">{location.address.streetAddress}</span>
          <span itemProp="addressLocality">{location.address.addressLocality}</span>
          <span itemProp="addressRegion">{location.address.addressRegion}</span>
          <span itemProp="postalCode">{location.address.postalCode}</span>
          <span itemProp="addressCountry">{location.address.addressCountry}</span>
        </div>
        <span itemProp="telephone">{location.phone}</span>
        <span itemProp="email">{location.email}</span>
        <span itemProp="url">{location.website}</span>
        {location.serviceAreas.map((area, index) => (
          <span key={index} itemProp="areaServed">{area}</span>
        ))}
        {location.categories.map((category, index) => (
          <span key={index} itemProp="serviceType">{category}</span>
        ))}
      </div>
    </div>
  );
}