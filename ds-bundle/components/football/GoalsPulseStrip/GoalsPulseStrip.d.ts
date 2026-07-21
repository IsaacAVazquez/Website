import * as React from 'react';

/**
 * GoalsPulseStrip — from isaac-vazquez-portfolio@0.1.0.
 */
export interface GoalsPulseStripProps {
  data: Array<{ matchday: number; totalGoals: number }>;
  capLabel?: string;
  className?: string;
}

export declare const GoalsPulseStrip: React.ComponentType<GoalsPulseStripProps>;
