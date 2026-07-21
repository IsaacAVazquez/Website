import * as React from 'react';

/**
 * WarmCard — from isaac-vazquez-portfolio@0.1.0.
 */
export interface WarmCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none" | "xl";
  ariaLabel?: string;
  ariaDescription?: string;
  onClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
}

export declare const WarmCard: React.ComponentType<WarmCardProps>;
