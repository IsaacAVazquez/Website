import * as React from 'react';

/**
 * SegmentedTabs — from isaac-vazquez-portfolio@0.1.0.
 */
export interface SegmentedTabsProps {
  tabs: Array<{ id: string; label: string }>;
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  idPrefix: string;
  panelId: string;
  className?: string;
}

export declare const SegmentedTabs: React.ComponentType<SegmentedTabsProps>;
