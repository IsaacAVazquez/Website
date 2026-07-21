import * as React from 'react';

/**
 * ResultsTape — from isaac-vazquez-portfolio@0.1.0.
 */
export interface ResultsTapeProps {
  recentFixtures: Array<{ id: string; utcDate: string; status: string; homeTeam: { shortName: string; tla?: null | string }; awayTeam: { shortName: string; tla?: null | string }; score: { winner: null | "HOME_TEAM" | "AWAY_TEAM" | "DRAW"; home: null | number; away: null | number } }>;
  upcomingFixtures: Array<{ id: string; utcDate: string; status: string; homeTeam: { shortName: string; tla?: null | string }; awayTeam: { shortName: string; tla?: null | string }; score: { winner: null | "HOME_TEAM" | "AWAY_TEAM" | "DRAW"; home: null | number; away: null | number } }>;
  label?: React.ReactNode;
  emptyFallback?: React.ReactNode;
  className?: string;
}

export declare const ResultsTape: React.ComponentType<ResultsTapeProps>;
