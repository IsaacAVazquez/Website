import * as React from 'react';

/**
 * MetricCard — from isaac-vazquez-portfolio@0.1.0.
 */
export interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: React.ReactNode;
  className?: string;
}

export declare const MetricCard: React.ComponentType<MetricCardProps>;
