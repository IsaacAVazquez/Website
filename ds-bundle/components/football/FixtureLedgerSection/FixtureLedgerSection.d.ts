import * as React from 'react';

/**
 * FixtureLedgerSection — from isaac-vazquez-portfolio@0.1.0.
 */
export interface FixtureLedgerSectionProps {
  groups: Array<{ key: string; label: string; fixtures: Array<{ id: string; utcDate: string; status: string; matchday: null | number; homeTeam: { id: string; shortName: string; crest: null | string }; awayTeam: { id: string; shortName: string; crest: null | string }; score: { winner: null | string; home: null | number; away: null | number; shootoutHome?: null | number; shootoutAway?: null | number } }> }>;
  onOpenTeam?: (teamId: string) => void;
}

export declare const FixtureLedgerSection: React.ComponentType<FixtureLedgerSectionProps>;
