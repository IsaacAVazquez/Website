import * as React from 'react';

/**
 * DropdownMenu — from isaac-vazquez-portfolio@0.1.0.
 */
export interface DropdownMenuProps {
  children?: React.ReactNode;
  dir?: "ltr" | "rtl";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}

export declare const DropdownMenu: React.ComponentType<DropdownMenuProps>;
