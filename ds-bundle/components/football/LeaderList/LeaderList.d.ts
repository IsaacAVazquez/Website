import * as React from 'react';

/**
 * LeaderList — from isaac-vazquez-portfolio@0.1.0.
 */
export interface LeaderListProps {
  leaders: Array<{ rank: number; name: string; clubId: string; clubCode: string; total: number; appearances: number; perMatch: number }>;
  statLabel: string;
  clubLookup?: Map<string, string>;
}

export declare const LeaderList: React.ComponentType<LeaderListProps>;
