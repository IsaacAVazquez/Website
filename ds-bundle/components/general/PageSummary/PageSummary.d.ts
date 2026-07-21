import * as React from 'react';

/**
 * PageSummary — from isaac-vazquez-portfolio@0.1.0.
 */
export interface PageSummaryProps {
  title?: string;
  summary: React.ReactNode;
  tldr?: React.ReactNode;
  context?: React.ReactNode;
  variant?: "default" | "compact" | "featured";
  showIcon?: boolean;
  className?: string;
}

export declare const PageSummary: React.ComponentType<PageSummaryProps>;
