import * as React from 'react';

/**
 * FixtureCard — from isaac-vazquez-portfolio@0.1.0.
 */
export interface FixtureCardProps {
  fixture: { id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } };
  contextTeamId?: null | string;
  onOpenTeam?: (teamId: string) => void;
  compact?: boolean;
  style?: React.CSSProperties;
  periodLabel?: string;
  fallbackLabel?: string;
}

export declare const FixtureCard: React.ComponentType<FixtureCardProps>;
