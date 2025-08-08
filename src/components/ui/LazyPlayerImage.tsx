"use client";

import React, { useState, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import { IconUser } from '@tabler/icons-react';

interface LazyPlayerImageProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'empty' | React.ReactNode;
  fallbackIcon?: React.ReactNode;
}

// Simple placeholder blur data URL
const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

// Performance-optimized intersection observer hook
function useIntersectionObserver(
  elementRef: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
): boolean {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!elementRef.current || hasLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        // Load images slightly before they come into view
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, hasLoaded, options]);

  return isVisible;
}

// Optimized player image component with progressive loading
export const LazyPlayerImage = memo<LazyPlayerImageProps>(({
  src,
  alt,
  width = 64,
  height = 64,
  className = "",
  priority = false,
  onLoad,
  onError,
  placeholder = 'blur',
  fallbackIcon = <IconUser size={24} className="text-slate-500" />
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [showImage, setShowImage] = useState(priority);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Only start loading when image is near viewport (unless priority)
  const isVisible = useIntersectionObserver(imageRef, { rootMargin: '100px' });

  // Start loading when visible or priority
  useEffect(() => {
    if (isVisible || priority) {
      setShowImage(true);
    }
  }, [isVisible, priority]);

  const handleImageLoad = () => {
    setImageState('loaded');
    onLoad?.();
  };

  const handleImageError = () => {
    setImageState('error');
    onError?.();
  };

  // Determine what to show based on state
  const shouldShowRealImage = showImage && src && imageState !== 'error';
  const shouldShowPlaceholder = !shouldShowRealImage || imageState === 'loading';
  const shouldShowFallback = !src || imageState === 'error';

  return (
    <div
      ref={imageRef}
      className={`relative inline-block ${className}`}
      style={{ width, height }}
    >
      {/* Real image */}
      {shouldShowRealImage && (
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-300 ${
            imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          placeholder={placeholder === 'blur' ? 'blur' : 'empty'}
          blurDataURL={placeholder === 'blur' ? BLUR_DATA_URL : undefined}
          sizes={`${width}px`}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}

      {/* Placeholder/Loading state */}
      {shouldShowPlaceholder && (
        <div className={`
          absolute inset-0 flex items-center justify-center
          bg-slate-700 rounded-full transition-opacity duration-300
          ${imageState === 'loaded' ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}>
          {shouldShowFallback ? (
            fallbackIcon
          ) : imageState === 'loading' ? (
            placeholder === 'blur' ? (
              <div className="w-full h-full bg-slate-600 animate-pulse rounded-full" />
            ) : (
              <div className="w-4 h-4 border border-slate-400 border-t-transparent rounded-full animate-spin" />
            )
          ) : null}
        </div>
      )}

      {/* Custom placeholder */}
      {placeholder !== 'blur' && placeholder !== 'empty' && shouldShowPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder}
        </div>
      )}
    </div>
  );
});

LazyPlayerImage.displayName = 'LazyPlayerImage';

// Batch image preloader for performance
export class ImagePreloader {
  private static instance: ImagePreloader;
  private loadingQueue = new Set<string>();
  private loadedImages = new Set<string>();
  private maxConcurrentLoads = 3;
  private currentLoads = 0;

  static getInstance(): ImagePreloader {
    if (!ImagePreloader.instance) {
      ImagePreloader.instance = new ImagePreloader();
    }
    return ImagePreloader.instance;
  }

  async preloadImage(src: string): Promise<void> {
    if (this.loadedImages.has(src) || this.loadingQueue.has(src)) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.loadingQueue.add(src);

      const processLoad = () => {
        if (this.currentLoads >= this.maxConcurrentLoads) {
          // Queue for later
          setTimeout(() => processLoad(), 100);
          return;
        }

        this.currentLoads++;
        const img = new window.Image();

        img.onload = () => {
          this.loadedImages.add(src);
          this.loadingQueue.delete(src);
          this.currentLoads--;
          resolve();
        };

        img.onerror = () => {
          this.loadingQueue.delete(src);
          this.currentLoads--;
          reject(new Error(`Failed to load image: ${src}`));
        };

        img.src = src;
      };

      processLoad();
    });
  }

  async preloadImages(sources: string[]): Promise<void> {
    const uniqueSources = [...new Set(sources)].filter(src => 
      src && !this.loadedImages.has(src)
    );

    // Process in batches to avoid overwhelming the browser
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < uniqueSources.length; i += batchSize) {
      batches.push(uniqueSources.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(src => this.preloadImage(src))
      );
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  isLoaded(src: string): boolean {
    return this.loadedImages.has(src);
  }

  isLoading(src: string): boolean {
    return this.loadingQueue.has(src);
  }

  clearCache(): void {
    this.loadedImages.clear();
    this.loadingQueue.clear();
  }

  getCacheStats() {
    return {
      loaded: this.loadedImages.size,
      loading: this.loadingQueue.size,
      currentLoads: this.currentLoads
    };
  }
}

// Hook for using the image preloader
export function useImagePreloader() {
  const preloader = ImagePreloader.getInstance();
  
  return {
    preloadImage: preloader.preloadImage.bind(preloader),
    preloadImages: preloader.preloadImages.bind(preloader),
    isLoaded: preloader.isLoaded.bind(preloader),
    isLoading: preloader.isLoading.bind(preloader),
    clearCache: preloader.clearCache.bind(preloader),
    getCacheStats: preloader.getCacheStats.bind(preloader)
  };
}

export default LazyPlayerImage;