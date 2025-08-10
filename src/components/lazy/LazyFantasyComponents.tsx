"use client";

import React, { lazy, Suspense } from 'react';
import { Player, ScoringFormat, Position } from '@/types';

// Loading fallback component
const ComponentLoader = ({ 
  name, 
  height = 'h-96' 
}: { 
  name: string; 
  height?: string; 
}) => (
  <div className={`flex items-center justify-center ${height} bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-lg`}>
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-400">Loading {name}...</p>
      <p className="text-slate-500 text-sm mt-1">Optimizing performance...</p>
    </div>
  </div>
);

// Lazy-loaded components with code splitting
export const LazyTierChart = lazy(() => 
  import('../LightweightTierChart').then(module => ({
    default: module.LightweightTierChart || module.default
  }))
);

export const LazyDraftTierChart = lazy(() => 
  import('../DraftTierChart').then(module => ({
    default: module.default
  }))
);

export const LazyTierChartEnhanced = lazy(() => 
  import('../TierChartEnhanced').then(module => ({
    default: module.default
  }))
);

export const LazyVirtualizedPlayerList = lazy(() => 
  import('../ui/VirtualizedPlayerList').then(module => ({
    default: module.VirtualizedPlayerList || module.default
  }))
);

// Wrapper components with suspense boundaries
interface LazyTierChartWrapperProps {
  players: Player[];
  scoringFormat?: ScoringFormat;
  numberOfTiers?: number;
  onPlayerClick?: (player: Player) => void;
  onPlayerDraft?: (player: Player) => void;
  showDraftButton?: boolean;
  maxHeight?: number;
  className?: string;
}

export const LazyTierChartWrapper: React.FC<LazyTierChartWrapperProps> = (props) => (
  <Suspense fallback={<ComponentLoader name="Tier Chart" height="h-96" />}>
    <LazyTierChart {...props} />
  </Suspense>
);

interface LazyDraftTierChartWrapperProps {
  players: Player[];
  allPlayers: Player[];
  scoringFormat: "standard" | "halfPPR" | "ppr";
  positionFilter: string;
}

export const LazyDraftTierChartWrapper: React.FC<LazyDraftTierChartWrapperProps> = (props) => (
  <Suspense fallback={<ComponentLoader name="Draft Tiers" height="h-[600px]" />}>
    <LazyDraftTierChart {...props} />
  </Suspense>
);

interface LazyTierChartEnhancedWrapperProps {
  players: Player[];
  width?: number;
  height?: number;
  numberOfTiers?: number;
  scoringFormat?: string;
  hiddenTiers?: Set<number>;
  onTierCountChange?: (tierCount: number) => void;
  onTierGroupsChange?: (tierGroups: any[]) => void;
}

export const LazyTierChartEnhancedWrapper: React.FC<LazyTierChartEnhancedWrapperProps> = (props) => (
  <Suspense fallback={<ComponentLoader name="Enhanced Chart" height="h-[600px]" />}>
    <LazyTierChartEnhanced {...props} />
  </Suspense>
);

interface LazyVirtualizedPlayerListWrapperProps {
  players: Player[];
  onPlayerClick?: (player: Player) => void;
  onPlayerDraft?: (player: Player) => void;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
  showDraftButton?: boolean;
  showRanks?: boolean;
}

export const LazyVirtualizedPlayerListWrapper: React.FC<LazyVirtualizedPlayerListWrapperProps> = (props) => (
  <Suspense fallback={<ComponentLoader name="Player List" height="h-96" />}>
    <LazyVirtualizedPlayerList {...props} />
  </Suspense>
);

// Higher-order component for lazy loading any fantasy component
interface LazyFantasyComponentProps {
  children: React.ReactNode;
  fallbackName?: string;
  fallbackHeight?: string;
  minDelay?: number; // Minimum loading time to prevent flashing
}

export const LazyFantasyComponent: React.FC<LazyFantasyComponentProps> = ({ 
  children, 
  fallbackName = "Component", 
  fallbackHeight = "h-96",
  minDelay = 300 
}) => {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), minDelay);
    return () => clearTimeout(timer);
  }, [minDelay]);

  if (!isReady) {
    return <ComponentLoader name={fallbackName} height={fallbackHeight} />;
  }

  return (
    <Suspense fallback={<ComponentLoader name={fallbackName} height={fallbackHeight} />}>
      {children}
    </Suspense>
  );
};

// Performance monitoring wrapper
interface PerformanceWrapperProps {
  name: string;
  children: React.ReactNode;
  onLoadTime?: (name: string, time: number) => void;
}

export const PerformanceWrapper: React.FC<PerformanceWrapperProps> = ({ 
  name, 
  children, 
  onLoadTime 
}) => {
  const startTime = React.useRef<number>(Date.now());
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    if (isLoaded) {
      const loadTime = Date.now() - startTime.current;
      onLoadTime?.(name, loadTime);
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${name} loaded in ${loadTime}ms`);
      }
    }
  }, [isLoaded, name, onLoadTime]);

  React.useEffect(() => {
    setIsLoaded(true);
  }, []);

  return <>{children}</>;
};

// Composite lazy loading wrapper with performance monitoring
interface OptimizedFantasyComponentProps extends LazyFantasyComponentProps {
  performanceName?: string;
  onLoadTime?: (name: string, time: number) => void;
}

export const OptimizedFantasyComponent: React.FC<OptimizedFantasyComponentProps> = ({
  children,
  fallbackName = "Component",
  fallbackHeight = "h-96",
  minDelay = 300,
  performanceName,
  onLoadTime
}) => (
  <LazyFantasyComponent 
    fallbackName={fallbackName} 
    fallbackHeight={fallbackHeight}
    minDelay={minDelay}
  >
    <PerformanceWrapper 
      name={performanceName || fallbackName} 
      onLoadTime={onLoadTime}
    >
      {children}
    </PerformanceWrapper>
  </LazyFantasyComponent>
);

// Preload utility for critical components
export const preloadFantasyComponents = () => {
  // Preload critical components in the background
  const preloadComponent = (componentImport: () => Promise<any>) => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        componentImport().catch(() => {
          // Silently fail - components will load when needed
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        componentImport().catch(() => {});
      }, 1000);
    }
  };

  // Preload most commonly used components
  preloadComponent(() => import('../LightweightTierChart'));
  preloadComponent(() => import('../ui/VirtualizedPlayerList'));
};

// Auto-preload on client-side mount
if (typeof window !== 'undefined') {
  // Preload components after initial page load
  window.addEventListener('load', () => {
    setTimeout(preloadFantasyComponents, 2000);
  });
}

export default {
  LazyTierChartWrapper,
  LazyDraftTierChartWrapper,
  LazyTierChartEnhancedWrapper,
  LazyVirtualizedPlayerListWrapper,
  LazyFantasyComponent,
  OptimizedFantasyComponent,
  preloadFantasyComponents
};