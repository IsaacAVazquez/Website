import * as React from 'react';

/**
 * Badge — from isaac-vazquez-portfolio@0.1.0.
 */
export interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  glow?: boolean;
  href?: string;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

export declare const Badge: React.ComponentType<BadgeProps>;
