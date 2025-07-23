"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import PlayerImageService from '@/lib/playerImageService';
import { Player } from '@/types';

interface CachedImage {
  url: string;
  timestamp: number;
  dimensions?: { width: number; height: number };
}

interface ImageCacheContextValue {
  getPlayerImage: (player: Player) => Promise<string | null>;
  preloadImages: (players: Player[]) => Promise<void>;
  getCachedImage: (playerKey: string) => string | null;
  clearCache: () => void;
  isLoading: (playerKey: string) => boolean;
  cacheStats: {
    size: number;
    hitRate: number;
    memoryUsage: number;
  };
}

const ImageCacheContext = createContext<ImageCacheContextValue | null>(null);

// Cache configuration
const CACHE_CONFIG = {
  maxSize: 500, // Maximum number of images to cache
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  storageKey: 'player-image-cache',
  preloadBatchSize: 10, // Number of images to preload simultaneously
  memoryLimit: 50 * 1024 * 1024, // 50MB memory limit
};

// Position priority for smart preloading
const POSITION_PRIORITY = {
  'QB': 1,
  'RB': 2, 
  'WR': 3,
  'TE': 4,
  'K': 5,
  'DST': 6,
};

export function PlayerImageCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Map<string, CachedImage>>(new Map());
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    requests: 0,
    hits: 0,
    memoryUsage: 0,
  });

  // Load cache from localStorage on mount
  useEffect(() => {
    const loadCacheFromStorage = () => {
      try {
        const stored = localStorage.getItem(CACHE_CONFIG.storageKey);
        if (stored) {
          const parsedCache = JSON.parse(stored);
          const now = Date.now();
          const validEntries = new Map<string, CachedImage>();
          
          // Filter out expired entries
          Object.entries(parsedCache).forEach(([key, value]) => {
            const cachedImage = value as CachedImage;
            if (now - cachedImage.timestamp < CACHE_CONFIG.maxAge) {
              validEntries.set(key, cachedImage);
            }
          });
          
          setCache(validEntries);
          console.log(`🗂️ Loaded ${validEntries.size} cached images from storage`);
        }
      } catch (error) {
        console.warn('Failed to load image cache from storage:', error);
      }
    };

    loadCacheFromStorage();
  }, []);

  // Save cache to localStorage when it changes
  useEffect(() => {
    if (cache.size === 0) return;

    try {
      const cacheObject = Object.fromEntries(cache);
      localStorage.setItem(CACHE_CONFIG.storageKey, JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to save image cache to storage:', error);
      // If storage is full, clear old entries and try again
      clearOldEntries();
    }
  }, [cache]);

  // Calculate memory usage
  useEffect(() => {
    const calculateMemoryUsage = () => {
      let totalSize = 0;
      cache.forEach((cachedImage) => {
        // Estimate memory usage based on URL length (rough approximation)
        totalSize += cachedImage.url.length * 2; // 2 bytes per character
        if (cachedImage.dimensions) {
          // Rough estimate for image data in memory
          totalSize += cachedImage.dimensions.width * cachedImage.dimensions.height * 4; // 4 bytes per pixel
        }
      });
      
      setStats(prev => ({ ...prev, memoryUsage: totalSize }));
    };

    calculateMemoryUsage();
  }, [cache]);

  const clearOldEntries = useCallback(() => {
    const now = Date.now();
    const newCache = new Map<string, CachedImage>();
    
    // Sort by timestamp and keep only recent entries
    const sortedEntries = Array.from(cache.entries())
      .filter(([_, value]) => now - value.timestamp < CACHE_CONFIG.maxAge)
      .sort(([_, a], [__, b]) => b.timestamp - a.timestamp)
      .slice(0, CACHE_CONFIG.maxSize);

    sortedEntries.forEach(([key, value]) => {
      newCache.set(key, value);
    });

    setCache(newCache);
    console.log(`🧹 Cleaned cache: ${cache.size} -> ${newCache.size} entries`);
  }, [cache]);

  const getPlayerKey = useCallback((player: Player): string => {
    return `${player.name}-${player.team}`;
  }, []);

  const getCachedImage = useCallback((playerKey: string): string | null => {
    const cachedImage = cache.get(playerKey);
    if (cachedImage) {
      const now = Date.now();
      if (now - cachedImage.timestamp < CACHE_CONFIG.maxAge) {
        setStats(prev => ({ ...prev, hits: prev.hits + 1 }));
        return cachedImage.url;
      } else {
        // Remove expired entry
        setCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(playerKey);
          return newCache;
        });
      }
    }
    return null;
  }, [cache]);

  const cacheImage = useCallback((playerKey: string, url: string, dimensions?: { width: number; height: number }) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(playerKey, {
        url,
        timestamp: Date.now(),
        dimensions,
      });

      // Enforce cache size limit
      if (newCache.size > CACHE_CONFIG.maxSize) {
        const sortedEntries = Array.from(newCache.entries())
          .sort(([_, a], [__, b]) => b.timestamp - a.timestamp)
          .slice(0, CACHE_CONFIG.maxSize);
        
        newCache.clear();
        sortedEntries.forEach(([key, value]) => {
          newCache.set(key, value);
        });
      }

      return newCache;
    });
  }, []);

  const getPlayerImage = useCallback(async (player: Player): Promise<string | null> => {
    const playerKey = getPlayerKey(player);
    
    setStats(prev => ({ ...prev, requests: prev.requests + 1 }));

    // Check cache first
    const cachedUrl = getCachedImage(playerKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Check if already loading
    if (loadingSet.has(playerKey)) {
      // Wait for ongoing request
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!loadingSet.has(playerKey)) {
            resolve(getCachedImage(playerKey));
          } else {
            setTimeout(checkLoading, 50);
          }
        };
        checkLoading();
      });
    }

    // Start loading
    setLoadingSet(prev => new Set(prev).add(playerKey));

    try {
      const imageUrl = await PlayerImageService.getPlayerImageUrl(player);
      if (imageUrl) {
        // Get image dimensions for better caching
        const dimensions = await getImageDimensions(imageUrl);
        cacheImage(playerKey, imageUrl, dimensions);
        
        console.log(`📸 Cached image for ${player.name}: ${imageUrl}`);
        return imageUrl;
      }
    } catch (error) {
      console.warn(`Failed to load image for ${player.name}:`, error);
    } finally {
      setLoadingSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerKey);
        return newSet;
      });
    }

    return null;
  }, [getPlayerKey, getCachedImage, cacheImage, loadingSet]);

  const getImageDimensions = useCallback((url: string): Promise<{ width: number; height: number } | undefined> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve(undefined);
      img.src = url;
    });
  }, []);

  const preloadImages = useCallback(async (players: Player[]): Promise<void> => {
    // Sort players by position priority for smart preloading
    const sortedPlayers = [...players].sort((a, b) => {
      const aPriority = POSITION_PRIORITY[a.position as keyof typeof POSITION_PRIORITY] || 999;
      const bPriority = POSITION_PRIORITY[b.position as keyof typeof POSITION_PRIORITY] || 999;
      return aPriority - bPriority;
    });

    // Filter out already cached or loading players
    const playersToLoad = sortedPlayers.filter(player => {
      const playerKey = getPlayerKey(player);
      return !cache.has(playerKey) && !loadingSet.has(playerKey);
    });

    if (playersToLoad.length === 0) return;

    console.log(`🚀 Preloading ${playersToLoad.length} player images...`);

    // Load in batches to avoid overwhelming the browser
    const batches = [];
    for (let i = 0; i < playersToLoad.length; i += CACHE_CONFIG.preloadBatchSize) {
      batches.push(playersToLoad.slice(i, i + CACHE_CONFIG.preloadBatchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(player => getPlayerImage(player));
      await Promise.allSettled(batchPromises);
      
      // Small delay between batches to prevent overwhelming
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Preloading complete. Cache size: ${cache.size}`);
  }, [cache, loadingSet, getPlayerKey, getPlayerImage]);

  const isLoading = useCallback((playerKey: string): boolean => {
    return loadingSet.has(playerKey);
  }, [loadingSet]);

  const clearCache = useCallback(() => {
    setCache(new Map());
    localStorage.removeItem(CACHE_CONFIG.storageKey);
    setStats({ requests: 0, hits: 0, memoryUsage: 0 });
    console.log('🗑️ Image cache cleared');
  }, []);

  const cacheStats = {
    size: cache.size,
    hitRate: stats.requests > 0 ? (stats.hits / stats.requests) * 100 : 0,
    memoryUsage: stats.memoryUsage,
  };

  const contextValue: ImageCacheContextValue = {
    getPlayerImage,
    preloadImages,
    getCachedImage,
    clearCache,
    isLoading,
    cacheStats,
  };

  return (
    <ImageCacheContext.Provider value={contextValue}>
      {children}
    </ImageCacheContext.Provider>
  );
}

export function usePlayerImageCache(): ImageCacheContextValue {
  const context = useContext(ImageCacheContext);
  if (!context) {
    throw new Error('usePlayerImageCache must be used within a PlayerImageCacheProvider');
  }
  return context;
}

// Hook for getting a single player image with loading state
export function usePlayerImage(player: Player | null) {
  const { getPlayerImage, getCachedImage, isLoading } = usePlayerImageCache();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!player) {
      setImageUrl(null);
      return;
    }

    const playerKey = `${player.name}-${player.team}`;
    
    // Check cache first
    const cachedUrl = getCachedImage(playerKey);
    if (cachedUrl) {
      setImageUrl(cachedUrl);
      setLoading(false);
      return;
    }

    // Check if loading
    if (isLoading(playerKey)) {
      setLoading(true);
      return;
    }

    // Load image
    setLoading(true);
    getPlayerImage(player).then((url) => {
      setImageUrl(url);
      setLoading(false);
    });
  }, [player, getPlayerImage, getCachedImage, isLoading]);

  return { imageUrl, loading };
}