import * as React from 'react';

/**
 * StatCard — from isaac-vazquez-portfolio@0.1.0.
 */
export interface StatCardProps {
  eyebrow: string;
  title?: string;
  metric: string;
  detail: string;
  icon: React.ReactNode;
  variant?: "compact" | "full";
}

export declare const StatCard: React.ComponentType<StatCardProps>;
