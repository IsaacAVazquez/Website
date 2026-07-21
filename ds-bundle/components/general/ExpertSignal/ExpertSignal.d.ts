import * as React from 'react';

/**
 * ExpertSignal — from isaac-vazquez-portfolio@0.1.0.
 */
export interface ExpertSignalProps {
  type?: "credential" | "achievement" | "expertise" | "education" | "experience" | "award";
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  verified?: boolean;
  variant?: "default" | "inline" | "compact" | "badge";
  className?: string;
}

export declare const ExpertSignal: React.ComponentType<ExpertSignalProps>;
