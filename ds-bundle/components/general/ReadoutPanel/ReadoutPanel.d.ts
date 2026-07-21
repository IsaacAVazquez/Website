import * as React from 'react';

/**
 * ReadoutPanel — from isaac-vazquez-portfolio@0.1.0.
 */
export interface ReadoutPanelProps {
  label?: React.ReactNode;
  stamp?: React.ReactNode;
  rows?: Array<{ label: string; value: React.ReactNode }>;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export declare const ReadoutPanel: React.ComponentType<ReadoutPanelProps>;
