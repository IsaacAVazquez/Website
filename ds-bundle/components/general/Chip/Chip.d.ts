import * as React from 'react';

/**
 * Chip — from isaac-vazquez-portfolio@0.1.0.
 */
export interface ChipProps {
  tone?: "default" | "signal";
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

export declare const Chip: React.ComponentType<ChipProps>;
