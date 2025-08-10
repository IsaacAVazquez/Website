// Lazy loading service for D3.js library
// This prevents the large D3.js bundle from being loaded until needed

let d3Module: any = null;
let d3LoadPromise: Promise<any> | null = null;

// Load D3.js dynamically
export async function loadD3() {
  if (d3Module) {
    return d3Module;
  }
  
  if (!d3LoadPromise) {
    d3LoadPromise = import('d3').then(module => {
      d3Module = module;
      return module;
    });
  }
  
  return d3LoadPromise;
}

// Check if D3 is already loaded
export function isD3Loaded(): boolean {
  return d3Module !== null;
}

// Preload D3.js for faster subsequent usage
export function preloadD3() {
  if (typeof window === 'undefined') return; // Server-side guard
  
  const preload = () => {
    loadD3().catch(() => {
      // Silent fail - preloading is not critical
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(preload);
  } else {
    setTimeout(preload, 1000);
  }
}

// Get commonly used D3 functions (for better tree shaking)
export async function getD3Functions() {
  const d3 = await loadD3();
  
  return {
    // Selection methods
    select: d3.select,
    selectAll: d3.selectAll,
    
    // Scale functions
    scaleLinear: d3.scaleLinear,
    scaleOrdinal: d3.scaleOrdinal,
    scaleBand: d3.scaleBand,
    scaleSequential: d3.scaleSequential,
    
    // Color schemes
    schemeCategory10: d3.schemeCategory10,
    schemeTableau10: d3.schemeTableau10,
    interpolateRdYlGn: d3.interpolateRdYlGn,
    interpolateSpectral: d3.interpolateSpectral,
    
    // Array methods
    extent: d3.extent,
    max: d3.max,
    min: d3.min,
    mean: d3.mean,
    
    // Clustering/ML methods
    cluster: d3.cluster,
    
    // DOM manipulation
    create: d3.create,
    
    // Transitions
    transition: d3.transition,
    
    // Axis
    axisBottom: d3.axisBottom,
    axisLeft: d3.axisLeft,
    
    // Event handling
    pointer: d3.pointer,
    
    // Full D3 object for complex operations
    d3: d3
  };
}

// Async wrapper for common D3 operations
export class LazyD3 {
  private static instance: LazyD3;
  private d3Functions: any = null;
  
  static getInstance(): LazyD3 {
    if (!LazyD3.instance) {
      LazyD3.instance = new LazyD3();
    }
    return LazyD3.instance;
  }
  
  async ensureLoaded() {
    if (!this.d3Functions) {
      this.d3Functions = await getD3Functions();
    }
    return this.d3Functions;
  }
  
  async select(selector: string) {
    const { select } = await this.ensureLoaded();
    return select(selector);
  }
  
  async selectAll(selector: string) {
    const { selectAll } = await this.ensureLoaded();
    return selectAll(selector);
  }
  
  async scaleLinear() {
    const { scaleLinear } = await this.ensureLoaded();
    return scaleLinear();
  }
  
  async scaleOrdinal(domain?: any, range?: any) {
    const { scaleOrdinal } = await this.ensureLoaded();
    const scale = scaleOrdinal();
    if (domain) scale.domain(domain);
    if (range) scale.range(range);
    return scale;
  }
  
  async getColorScheme(scheme: 'category10' | 'tableau10' = 'category10') {
    const d3Funcs = await this.ensureLoaded();
    return scheme === 'category10' ? d3Funcs.schemeCategory10 : d3Funcs.schemeTableau10;
  }
  
  async extent(data: any[], accessor?: (d: any) => any) {
    const { extent } = await this.ensureLoaded();
    return extent(data, accessor);
  }
  
  // Get the full D3 object for complex operations
  async getD3() {
    const { d3 } = await this.ensureLoaded();
    return d3;
  }
}

// Export singleton instance
export const lazyD3 = LazyD3.getInstance();

// Hook for React components to use lazy D3
export function useD3() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [d3Functions, setD3Functions] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    getD3Functions()
      .then(funcs => {
        setD3Functions(funcs);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);
  
  return { d3Functions, isLoading, error };
}

// Note: React import is not included here to avoid circular dependencies
// Components using useD3 should import React themselves