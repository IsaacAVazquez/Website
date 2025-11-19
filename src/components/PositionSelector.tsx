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
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800">
      {/* Position Selector */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-400 mb-2">
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
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
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
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Scoring Format
        </label>
        <select
          value={selectedFormat}
          onChange={(e) => onFormatChange(e.target.value as ScoringFormat)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
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