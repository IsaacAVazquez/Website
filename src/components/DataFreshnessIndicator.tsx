'use client';

import React, { useEffect, useState } from 'react';
import { DataFileMetadata } from '@/lib/dataFileWriter';

interface DataFreshnessIndicatorProps {
  position?: string;
  className?: string;
}

export function DataFreshnessIndicator({ position, className = '' }: DataFreshnessIndicatorProps) {
  const [metadata, setMetadata] = useState<DataFileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    async function fetchMetadata() {
      try {
        const response = await fetch(`/api/data-metadata${position ? `?position=${position}` : ''}`);
        if (response.ok) {
          const data = await response.json();
          setMetadata(data.metadata);
        }
      } catch (error) {
        console.error('Failed to fetch data metadata:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [position]);

  if (loading || !metadata || !isClient) {
    return null;
  }

  const lastUpdated = new Date(metadata.lastUpdated);
  const now = new Date();
  const hoursAgo = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60));
  const daysAgo = Math.floor(hoursAgo / 24);

  let freshnessText = '';
  let freshnessColor = '';

  if (hoursAgo < 1) {
    freshnessText = 'Just updated';
    freshnessColor = 'text-matrix-green';
  } else if (hoursAgo < 24) {
    freshnessText = `Updated ${hoursAgo}h ago`;
    freshnessColor = 'text-electric-blue';
  } else if (daysAgo === 1) {
    freshnessText = 'Updated yesterday';
    freshnessColor = 'text-warning-amber';
  } else {
    freshnessText = `Updated ${daysAgo} days ago`;
    freshnessColor = daysAgo > 3 ? 'text-error-red' : 'text-warning-amber';
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className={`w-2 h-2 rounded-full ${freshnessColor.replace('text-', 'bg-')} animate-pulse`} />
      <span className={`${freshnessColor} font-mono`}>
        {freshnessText}
      </span>
      <span className="text-slate-500 text-xs">
        ({metadata.format.toUpperCase()})
      </span>
    </div>
  );
}