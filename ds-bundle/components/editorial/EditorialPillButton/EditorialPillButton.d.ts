import * as React from 'react';

/**
 * EditorialPillButton — from isaac-vazquez-portfolio@0.1.0.
 */
export interface EditorialPillButtonProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  role?: "tab";
  ariaSelected?: boolean;
  size?: "sm" | "md";
}

export declare const EditorialPillButton: React.ComponentType<EditorialPillButtonProps>;
