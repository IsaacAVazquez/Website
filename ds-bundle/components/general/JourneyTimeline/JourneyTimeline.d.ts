import * as React from 'react';

/**
 * JourneyTimeline — from isaac-vazquez-portfolio@0.1.0.
 */
export interface JourneyTimelineProps {
  items?: Array<{ year: number; role: string; company: string; logo?: string; description: string; techStack: Array<string> }>;
}

export declare const JourneyTimeline: React.ComponentType<JourneyTimelineProps>;
