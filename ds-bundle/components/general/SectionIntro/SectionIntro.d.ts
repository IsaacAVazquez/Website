import * as React from 'react';

/**
 * SectionIntro — from isaac-vazquez-portfolio@0.1.0.
 */
export interface SectionIntroProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  align?: "center" | "left";
  size?: "md" | "lg";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export declare const SectionIntro: React.ComponentType<SectionIntroProps>;
