import * as React from 'react';

/**
 * StatFascia — from isaac-vazquez-portfolio@0.1.0.
 */
export interface StatFasciaProps {
  items: Array<{ eyebrow: string; metric: string; detail?: string }>;
  dense?: boolean;
  className?: string;
}

export declare const StatFascia: React.ComponentType<StatFasciaProps>;
