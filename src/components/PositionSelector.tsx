'use client';

import React from 'react';
import { Position, ScoringFormat } from '@/types';
import { motion } from 'framer-motion';

interface PositionSelectorProps {
  selectedPosition: Position;
  selectedFormat: ScoringFormat;
  onPositionChange: (position: Position) => void;
  onFormatChange: (format: ScoringFormat) => void;
}

const POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'];
const SCORING_FORMATS: { value: ScoringFormat; label: string }[] = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PPR', label: 'PPR' },
  { value: 'HALF_PPR', label: 'Half PPR' }
];

function PositionSelectorComponent({
  selectedPosition,
  selectedFormat,
  onPositionChange,
  onFormatChange
}: PositionSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-[var(--home-paper-alt)] backdrop-blur-sm rounded-lg border border-[var(--home-rule)]">
      {/* Position Selector */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] mb-2">
          Position
        </label>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map(position => (
            <motion.button
              key={position}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPositionChange(position)}
              className={`
                px-4 py-2 rounded-md font-medium transition-all duration-200
                ${selectedPosition === position
                  ? 'bg-[var(--home-haze)] text-white shadow-lg shadow-[var(--home-haze)]/30'
                  : 'bg-[var(--neutral-800)] text-[var(--neutral-300)] hover:bg-[var(--neutral-700)] border border-[var(--neutral-700)]'
                }
              `}
            >
              {position}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Scoring Format Selector */}
      <div className="sm:w-48">
        <label className="block text-sm font-medium text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] mb-2">
          Scoring Format
        </label>
        <select
          value={selectedFormat}
          onChange={(e) => onFormatChange(e.target.value as ScoringFormat)}
          className="w-full px-4 py-2 bg-[var(--neutral-800)] border border-[var(--neutral-700)] rounded-md text-[var(--home-ink)] focus:border-[var(--home-haze)] focus:ring-1 focus:ring-[var(--home-haze)] transition-all"
        >
          {SCORING_FORMATS.map(format => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Memoize PositionSelector to prevent unnecessary re-renders
export default React.memo(PositionSelectorComponent, (prevProps, nextProps) => {
  return (
    prevProps.selectedPosition === nextProps.selectedPosition &&
    prevProps.selectedFormat === nextProps.selectedFormat &&
    prevProps.onPositionChange === nextProps.onPositionChange &&
    prevProps.onFormatChange === nextProps.onFormatChange
  );
});