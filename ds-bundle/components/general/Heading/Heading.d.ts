import * as React from 'react';

/**
 * Heading — from isaac-vazquez-portfolio@0.1.0.
 */
export interface HeadingProps {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export declare const Heading: React.ComponentType<HeadingProps>;
