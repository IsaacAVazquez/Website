"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BusinessLocation, businessLocations, defaultLocation, locationDetection } from "@/lib/localSEO";

interface LocalSEOContextType {
  currentLocation: BusinessLocation;
  setCurrentLocation: (location: BusinessLocation) => void;
  userLocation: {lat: number, lng: number} | null;
  isLocationDetected: boolean;
  detectUserLocation: () => Promise<void>;
  allLocations: BusinessLocation[];
}

const LocalSEOContext = createContext<LocalSEOContextType | undefined>(undefined);

interface LocalSEOProviderProps {
  children: ReactNode;
  initialLocation?: BusinessLocation;
}

export function LocalSEOProvider({ children, initialLocation }: LocalSEOProviderProps) {
  const [currentLocation, setCurrentLocationState] = useState<BusinessLocation>(
    initialLocation || defaultLocation
  );
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocationDetected, setIsLocationDetected] = useState(false);

  const setCurrentLocation = (location: BusinessLocation) => {
    setCurrentLocationState(location);
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('isaac-local-seo-location', location.id);
    }
  };

  const detectUserLocation = async () => {
    try {
      const coords = await locationDetection.getUserLocation();
      setUserLocation(coords);
      
      const closestLocation = await locationDetection.getLocationBasedContent(coords);
      setCurrentLocation(closestLocation);
      setIsLocationDetected(true);
    } catch (error) {
      console.error('Failed to detect user location:', error);
      setIsLocationDetected(false);
    }
  };

  useEffect(() => {
    // Check for stored location preference
    if (typeof window !== 'undefined') {
      const storedLocationId = localStorage.getItem('isaac-local-seo-location');
      if (storedLocationId) {
        const storedLocation = businessLocations.find(loc => loc.id === storedLocationId);
        if (storedLocation) {
          setCurrentLocationState(storedLocation);
        }
      }
    }
  }, []);

  const value: LocalSEOContextType = {
    currentLocation,
    setCurrentLocation,
    userLocation,
    isLocationDetected,
    detectUserLocation,
    allLocations: businessLocations
  };

  return (
    <LocalSEOContext.Provider value={value}>
      {children}
    </LocalSEOContext.Provider>
  );
}

export function useLocalSEO() {
  const context = useContext(LocalSEOContext);
  if (context === undefined) {
    throw new Error('useLocalSEO must be used within a LocalSEOProvider');
  }
  return context;
}

// Hook for generating location-aware URLs
export function useLocalUrls() {
  const { currentLocation } = useLocalSEO();

  const generateLocalUrl = (path: string, includeLocation = true) => {
    if (!includeLocation) return path;
    
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}location=${currentLocation.id}`;
  };

  const generateServiceUrl = (service: string) => {
    const serviceSlug = service.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return generateLocalUrl(`/services/${serviceSlug}`);
  };

  const generateAreaUrl = (area: string) => {
    const areaSlug = area.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `/areas/${areaSlug}`;
  };

  return {
    generateLocalUrl,
    generateServiceUrl,
    generateAreaUrl,
    currentLocation
  };
}