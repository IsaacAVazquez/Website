import * as React from 'react';

/**
 * InstrumentTape — from isaac-vazquez-portfolio@0.1.0.
 */
export interface InstrumentTapeProps {
  label?: React.ReactNode;
  items: Array<{ key: string; content: React.ReactNode }>;
  ariaLabel: string;
  className?: string;
  emptyFallback?: React.ReactNode;
}

export declare const InstrumentTape: React.ComponentType<InstrumentTapeProps>;
