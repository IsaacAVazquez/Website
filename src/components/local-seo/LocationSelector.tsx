"use client";

import { useState, useEffect } from "react";
import { BusinessLocation, businessLocations, locationDetection } from "@/lib/localSEO";
import { IconMapPin, IconChevronDown } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

interface LocationSelectorProps {
  currentLocation: BusinessLocation;
  onLocationChange: (location: BusinessLocation) => void;
  className?: string;
}

export function LocationSelector({ 
  currentLocation, 
  onLocationChange, 
  className = '' 
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);

  useEffect(() => {
    // Auto-detect user location on mount
    locationDetection.getUserLocation()
      .then(async (coords) => {
        setUserLocation(coords);
        const closestLocation = await locationDetection.getLocationBasedContent(coords);
        if (closestLocation.id !== currentLocation.id) {
          onLocationChange(closestLocation);
          setAutoDetected(true);
        }
      })
      .catch(() => {
        // Geolocation failed or denied, continue with default
      });
  }, []);

  const handleLocationSelect = (location: BusinessLocation) => {
    onLocationChange(location);
    setIsOpen(false);
    setAutoDetected(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-terminal-bg/50 border border-electric-blue/30 rounded-lg px-4 py-2 hover:border-electric-blue/50 transition-colors"
        aria-label="Select location"
      >
        <IconMapPin className="w-4 h-4 text-electric-blue" />
        <span className="text-white font-medium">
          {currentLocation.address.addressLocality}, {currentLocation.address.addressRegion}
        </span>
        {autoDetected && (
          <span className="text-xs text-matrix-green bg-matrix-green/10 px-2 py-0.5 rounded">
            Auto-detected
          </span>
        )}
        <IconChevronDown 
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-terminal-bg border border-electric-blue/20 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2">
              <div className="text-xs text-slate-400 px-3 py-2 border-b border-electric-blue/10">
                Select Your Area
              </div>
              
              {businessLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors hover:bg-electric-blue/10 ${
                    location.id === currentLocation.id 
                      ? 'bg-electric-blue/20 text-electric-blue' 
                      : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {location.address.addressLocality}, {location.address.addressRegion}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {location.categories.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    {location.id === currentLocation.id && (
                      <IconMapPin className="w-4 h-4 text-electric-blue" />
                    )}
                  </div>
                </button>
              ))}
              
              {userLocation && (
                <div className="border-t border-electric-blue/10 pt-2 mt-2">
                  <button
                    onClick={async () => {
                      const closestLocation = await locationDetection.getLocationBasedContent(userLocation);
                      handleLocationSelect(closestLocation);
                      setAutoDetected(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-matrix-green/10 text-matrix-green text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <IconMapPin className="w-4 h-4" />
                      <span>Use my current location</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}