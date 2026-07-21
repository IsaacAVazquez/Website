import * as React from 'react';

/**
 * ModernButton — from isaac-vazquez-portfolio@0.1.0.
 */
export interface ModernButtonProps {
  href?: string;
  variant?: "outline" | "primary" | "secondary" | "ghost" | "accent" | "mono";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  ariaLabel?: string;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export declare const ModernButton: React.ComponentType<ModernButtonProps>;
