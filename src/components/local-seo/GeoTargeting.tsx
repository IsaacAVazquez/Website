"use client";

import { useState, useEffect } from "react";
import { BusinessLocation, businessLocations, locationDetection } from "@/lib/localSEO";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { Badge } from "@/components/ui/Badge";
import { IconMapPin, IconTarget, IconLocation, IconGps } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

interface GeoTargetingProps {
  onLocationDetected?: (location: BusinessLocation) => void;
  className?: string;
}

export function GeoTargeting({ onLocationDetected, className = '' }: GeoTargetingProps) {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<BusinessLocation | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const coords = await locationDetection.getUserLocation();
      setUserLocation(coords);
      setHasPermission(true);
      
      const closestLocation = await locationDetection.getLocationBasedContent(coords);
      setDetectedLocation(closestLocation);
      onLocationDetected?.(closestLocation);
      setShowLocationPrompt(false);
    } catch (error) {
      console.error('Location detection failed:', error);
      setHasPermission(false);
      // Default to Austin location
      setDetectedLocation(businessLocations[0]);
      onLocationDetected?.(businessLocations[0]);
    } finally {
      setIsDetecting(false);
    }
  };

  const dismissPrompt = () => {
    setShowLocationPrompt(false);
    // Use default location (Austin)
    setDetectedLocation(businessLocations[0]);
    onLocationDetected?.(businessLocations[0]);
  };

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setHasPermission(false);
      dismissPrompt();
    }
  }, []);

  return (
    <div className={className}>
      <AnimatePresence>
        {showLocationPrompt && hasPermission !== false && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <WarmCard hover={false} padding="md" className="p-6 bg-electric-blue/5 border-electric-blue/20">
              <div className="flex items-start space-x-4">
                <IconTarget className="w-8 h-8 text-electric-blue mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">
                    Get Personalized Local Content
                  </h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Allow location access to see content tailored to your area, including local service options and relevant information.
                  </p>
                  <div className="flex space-x-3">
                    <ModernButton 
                      onClick={detectLocation}
                      disabled={isDetecting}
                      size="sm"
                      variant="primary"
                    >
                      {isDetecting ? (
                        <>
                          <IconGps className="w-4 h-4 mr-2 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <IconLocation className="w-4 h-4 mr-2" />
                          Use My Location
                        </>
                      )}
                    </ModernButton>
                    <ModernButton 
                      onClick={dismissPrompt}
                      size="sm"
                      variant="ghost"
                    >
                      Skip
                    </ModernButton>
                  </div>
                </div>
              </div>
            </WarmCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Detection Result */}
      <AnimatePresence>
        {detectedLocation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <WarmCard hover={false} padding="md" className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <IconMapPin className="w-5 h-5 text-matrix-green" />
                  <div>
                    <h4 className="font-medium text-white">
                      Showing content for {detectedLocation.address.addressLocality}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {hasPermission ? 'Based on your location' : 'Default location'}
                    </p>
                  </div>
                </div>
                <Badge variant="matrix" size="sm">
                  {hasPermission ? 'Auto-detected' : 'Default'}
                </Badge>
              </div>
            </WarmCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Area Coverage */}
      {detectedLocation && (
        <GeoServiceCoverage location={detectedLocation} userCoords={userLocation} />
      )}
    </div>
  );
}

interface GeoServiceCoverageProps {
  location: BusinessLocation;
  userCoords?: {lat: number, lng: number} | null;
}

export function GeoServiceCoverage({ location, userCoords }: GeoServiceCoverageProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [isInServiceArea, setIsInServiceArea] = useState<boolean>(true);

  useEffect(() => {
    if (userCoords) {
      // Calculate distance from user to business location
      const dist = calculateDistance(
        userCoords.lat,
        userCoords.lng,
        location.coordinates.latitude,
        location.coordinates.longitude
      );
      setDistance(dist);
      setIsInServiceArea(dist <= 50); // 50 mile service radius
    }
  }, [userCoords, location]);

  return (
    <WarmCard hover={false} padding="md" className="p-6">
      <div className="flex items-start space-x-4">
        <IconTarget className="w-6 h-6 text-electric-blue mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-3">Service Area Coverage</h3>
          
          {userCoords && distance !== null && (
            <div className="mb-4 p-3 bg-terminal-bg/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">
                  Distance from {location.address.addressLocality}:
                </span>
                <span className="font-medium text-white">
                  {distance.toFixed(1)} miles
                </span>
              </div>
              <div className="mt-2">
                <Badge 
                  variant={isInServiceArea ? "matrix" : "outline"}
                  size="sm"
                >
                  {isInServiceArea ? "In Service Area" : "Remote Services Available"}
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-white mb-2">Primary Service Areas</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {location.serviceAreas.slice(0, 6).map((area, index) => (
                  <div 
                    key={index}
                    className="text-sm text-slate-300 bg-electric-blue/10 px-2 py-1 rounded"
                  >
                    {area}
                  </div>
                ))}
              </div>
              {location.serviceAreas.length > 6 && (
                <p className="text-xs text-slate-400 mt-2">
                  Plus {location.serviceAreas.length - 6} additional areas
                </p>
              )}
            </div>

            <div className="border-t border-electric-blue/20 pt-3">
              <h4 className="font-medium text-white mb-2">Service Options</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-matrix-green rounded-full" />
                  <span className="text-sm text-slate-300">On-site consultation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-electric-blue rounded-full" />
                  <span className="text-sm text-slate-300">Remote collaboration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyber-teal rounded-full" />
                  <span className="text-sm text-slate-300">Hybrid project management</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WarmCard>
  );
}

// Location-based content recommendations
export function GeoContentRecommendations({ location }: { location: BusinessLocation }) {
  const getLocalRecommendations = () => {
    if (location.id === 'austin-tx') {
      return [
        {
          title: "Austin Tech Scene Insights",
          description: "Local tech trends and startup ecosystem analysis",
          href: "/blog/austin-tech-landscape"
        },
        {
          title: "Civic Tech in Austin",
          description: "How technology improves city services",
          href: "/blog/civic-tech-austin"
        },
        {
          title: "Austin QA Community",
          description: "Connect with local quality assurance professionals",
          href: "/austin-qa-meetup"
        }
      ];
    } else {
      return [
        {
          title: "Bay Area Innovation",
          description: "Silicon Valley trends and business insights",
          href: "/blog/bay-area-innovation"
        },
        {
          title: "UC Berkeley MBA Network",
          description: "Business school connections and opportunities",
          href: "/blog/uc-berkeley-mba"
        },
        {
          title: "Silicon Valley QA Standards",
          description: "Enterprise-level quality assurance practices",
          href: "/blog/silicon-valley-qa"
        }
      ];
    }
  };

  const recommendations = getLocalRecommendations();

  return (
    <WarmCard hover={false} padding="md" className="p-6">
      <h3 className="font-semibold text-white mb-4">
        Local {location.address.addressLocality} Content
      </h3>
      <div className="space-y-3">
        {recommendations.map((item, index) => (
          <div 
            key={index}
            className="p-3 bg-terminal-bg/30 rounded-lg hover:bg-terminal-bg/50 transition-colors"
          >
            <h4 className="font-medium text-white text-sm mb-1">{item.title}</h4>
            <p className="text-xs text-slate-400 mb-2">{item.description}</p>
            <ModernButton href={item.href} size="sm" variant="ghost">
              Learn More
            </ModernButton>
          </div>
        ))}
      </div>
    </WarmCard>
  );
}

// Helper function to calculate distance
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