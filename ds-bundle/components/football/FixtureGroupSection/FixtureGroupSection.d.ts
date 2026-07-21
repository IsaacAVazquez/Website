import * as React from 'react';

/**
 * FixtureGroupSection — from isaac-vazquez-portfolio@0.1.0.
 */
export interface FixtureGroupSectionProps {
  title: string;
  description: string;
  fixtures: Array<{ id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } }>;
  contextTeamId?: null | string;
  onOpenTeam?: (teamId: string) => void;
  getFallbackLabel?: (fixture: { id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } }) => string;
}

export declare const FixtureGroupSection: React.ComponentType<FixtureGroupSectionProps>;
