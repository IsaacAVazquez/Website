import { Position, Player } from '@/types';

interface SampleDataResponse {
  success: boolean;
  data: Player[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  metadata: {
    position: string;
    cached: boolean;
    cacheTime: number;
  };
  error?: string;
}

class SampleDataService {
  private cache = new Map<string, { data: Player[]; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  private getCacheKey(position?: Position, page: number = 1, limit: number = 100): string {
    return `${position || 'all'}-${page}-${limit}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  async getSampleData(
    position?: Position, 
    page: number = 1, 
    limit: number = 100
  ): Promise<Player[]> {
    const cacheKey = this.getCacheKey(position, page, limit);
    const cached = this.cache.get(cacheKey);

    // Return cached data if still valid
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.data;
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (position) {
        params.append('position', position);
      }

      const response = await fetch(`/api/sample-data?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SampleDataResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sample data');
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      });

      return result.data;
    } catch (error) {
      console.error('Error fetching sample data:', error);
      
      // Return cached data even if expired as fallback
      if (cached) {
        console.warn('Using expired cache as fallback');
        return cached.data;
      }
      
      // Ultimate fallback - return empty array
      return [];
    }
  }

  async getAllSampleData(): Promise<Player[]> {
    // For backwards compatibility, fetch all data in chunks
    const allData: Player[] = [];
    let page = 1;
    const limit = 500; // Larger chunks for efficiency
    
    try {
      while (true) {
        const data = await this.getSampleData(undefined, page, limit);
        if (data.length === 0) break;
        
        allData.push(...data);
        
        // If we got less than the limit, we're done
        if (data.length < limit) break;
        page++;
      }
    } catch (error) {
      console.error('Error fetching all sample data:', error);
    }
    
    return allData;
  }

  async getSampleDataByPosition(position: Position): Promise<Player[]> {
    return this.getSampleData(position, 1, 1000); // Get large chunk for position
  }

  // Preload commonly used data
  preloadData(positions: Position[] = ['QB', 'RB', 'WR', 'TE']) {
    if (typeof window === 'undefined') return; // Server-side guard
    
    // Use requestIdleCallback for non-blocking preloading
    const preload = () => {
      positions.forEach(position => {
        this.getSampleData(position, 1, 100).catch(() => {
          // Silent fail - preloading is not critical
        });
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preload);
    } else {
      setTimeout(preload, 1000);
    }
  }

  // Clear cache (useful for testing or memory management)
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats for debugging
  getCacheStats() {
    const stats = {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      totalDataPoints: 0
    };
    
    this.cache.forEach(({ data }) => {
      stats.totalDataPoints += data.length;
    });
    
    return stats;
  }
}

// Export singleton instance
export const sampleDataService = new SampleDataService();

// Export for backwards compatibility
export const getSampleDataByPosition = sampleDataService.getSampleDataByPosition.bind(sampleDataService);
export const getAllSampleData = sampleDataService.getAllSampleData.bind(sampleDataService);

// Preload on client-side mount
if (typeof window !== 'undefined') {
  // Wait a bit after page load to avoid interfering with critical rendering
  window.addEventListener('load', () => {
    setTimeout(() => sampleDataService.preloadData(), 2000);
  });
}