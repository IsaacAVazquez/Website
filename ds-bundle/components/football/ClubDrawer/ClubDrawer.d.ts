import * as React from 'react';

/**
 * ClubDrawer — from isaac-vazquez-portfolio@0.1.0.
 */
export interface ClubDrawerProps {
  club: null | { id: string; name: string; crest: null | string; accentColor?: null | string; position: number; points: number; played: number; won: number; draw: number; lost: number; goalsFor: number; goalsAgainst: number; goalDifference: number; manager?: null | string; venue?: null | string };
  formSequence: Array<"W" | "D" | "L">;
  topScorers: Array<{ name: string; goals: number; assists: number }>;
  recentFixtures: Array<{ id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } }>;
  upcomingFixtures: Array<{ id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } }>;
  isLoadingDetail?: boolean;
  detailError?: null | string;
  onClose: () => void;
  testId?: string;
}

export declare const ClubDrawer: React.ComponentType<ClubDrawerProps>;
