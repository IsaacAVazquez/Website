import * as React from 'react';

/**
 * MetricCallout — from isaac-vazquez-portfolio@0.1.0.
 */
export interface MetricCalloutProps {
  value: string | number;
  label: string;
  improvement?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "primary";
  size?: "sm" | "md" | "lg";
  animateValue?: boolean;
  className?: string;
}

export declare const MetricCallout: React.ComponentType<MetricCalloutProps>;
