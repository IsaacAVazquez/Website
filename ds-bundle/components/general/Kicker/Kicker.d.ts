import * as React from 'react';

/**
 * Kicker — from isaac-vazquez-portfolio@0.1.0.
 */
export interface KickerProps {
  variant?: "dot" | "plain";
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

export declare const Kicker: React.ComponentType<KickerProps>;
