import * as React from 'react';

/**
 * LeaderLedger — from isaac-vazquez-portfolio@0.1.0.
 */
export interface LeaderLedgerProps {
  title: string;
  entries: Array<{ rank: number; name: string; clubCode: string; value: number }>;
  unit: string;
  emptyLabel?: string;
}

export declare const LeaderLedger: React.ComponentType<LeaderLedgerProps>;
