"use client";

import { useState, useEffect, useRef } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useLazyLoad(options: UseLazyLoadOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If triggerOnce is true and it has already triggered, don't set up observer
    if (triggerOnce && hasTriggered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && triggerOnce) {
          setHasTriggered(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return {
    elementRef,
    isIntersecting: triggerOnce ? (hasTriggered || isIntersecting) : isIntersecting,
    hasTriggered,
  };
}

// Specialized hook for loading heavy components
export function useComponentLazyLoad(loadComponent: () => Promise<any>) {
  const [Component, setComponent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { elementRef, isIntersecting } = useLazyLoad();

  useEffect(() => {
    if (isIntersecting && !Component && !isLoading) {
      setIsLoading(true);
      setError(null);

      loadComponent()
        .then((module) => {
          setComponent(() => module.default || module);
        })
        .catch((err) => {
          setError(err);
          console.error('Failed to load component:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isIntersecting, Component, isLoading, loadComponent]);

  return {
    elementRef,
    Component,
    isLoading,
    error,
    isIntersecting,
  };
}

// Hook for preloading resources
export function usePreloadImages(imageUrls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const { isIntersecting, elementRef } = useLazyLoad();

  useEffect(() => {
    if (!isIntersecting) return;

    const loadImages = imageUrls.filter(url => !loadedImages.has(url));
    
    if (loadImages.length === 0) return;

    const promises = loadImages.map((url) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    });

    Promise.allSettled(promises).then((results) => {
      const successfulUrls = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map(result => result.value);

      setLoadedImages(prev => new Set([...Array.from(prev), ...successfulUrls]));
    });
  }, [isIntersecting, imageUrls, loadedImages]);

  return {
    elementRef,
    loadedImages,
    isLoading: loadedImages.size < imageUrls.length,
  };
}