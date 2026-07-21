import * as React from 'react';

/**
 * OptimizedImage — from isaac-vazquez-portfolio@0.1.0.
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  lazy?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: "none" | "contain" | "cover" | "fill" | "scale-down";
  objectPosition?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export declare const OptimizedImage: React.ComponentType<OptimizedImageProps>;
