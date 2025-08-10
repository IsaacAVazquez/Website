import { Position, Player } from '@/types';

// Cache for dynamically imported sample data
let sampleDataCache: any = null;
let sampleDataPromise: Promise<any> | null = null;

// Lazy load the sample data module
export async function loadSampleData() {
  if (sampleDataCache) {
    return sampleDataCache;
  }
  
  if (!sampleDataPromise) {
    sampleDataPromise = import('@/data/sampleData').then(module => {
      sampleDataCache = module;
      return module;
    });
  }
  
  return sampleDataPromise;
}

// Async version of getSampleDataByPosition
export async function getSampleDataByPositionAsync(position: Position): Promise<Player[]> {
  const sampleDataModule = await loadSampleData();
  return sampleDataModule.getSampleDataByPosition(position);
}

// Preload sample data for commonly used positions
export function preloadSampleData(positions: Position[] = ['QB', 'RB', 'WR', 'TE']) {
  if (typeof window === 'undefined') return; // Server-side guard
  
  // Use requestIdleCallback for non-blocking preloading
  const preload = () => {
    loadSampleData().catch(() => {
      // Silent fail - preloading is not critical
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(preload);
  } else {
    setTimeout(preload, 1000);
  }
}

// Check if sample data is already loaded
export function isSampleDataLoaded(): boolean {
  return sampleDataCache !== null;
}

// Get sample data synchronously if loaded, empty array otherwise
export function getSampleDataIfLoaded(position: Position): Player[] {
  if (!sampleDataCache) {
    // Trigger async loading for next time
    loadSampleData().catch(() => {});
    return [];
  }
  
  return sampleDataCache.getSampleDataByPosition(position);
}

// Auto-preload on client-side
if (typeof window !== 'undefined') {
  // Preload sample data after initial page load
  window.addEventListener('load', () => {
    setTimeout(() => preloadSampleData(), 2000);
  });
}