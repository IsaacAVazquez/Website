'use client';

import { useState } from 'react';
import { MorphButton } from '@/components/ui/MorphButton';
import { IconRefresh, IconCheck, IconX } from '@tabler/icons-react';

export function UpdateDataButton() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const updateAllData = async () => {
    setIsUpdating(true);
    setStatus('idle');
    setMessage('');

    try {
      // Call the fantasy pros session API without credentials (will use env vars)
      const response = await fetch('/api/fantasy-pros-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // No credentials needed - will use env vars
          scoringFormat: 'ppr'
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(`Updated ${data.totalPlayers || 0} players across all positions`);
      } else {
        setStatus('error');
        setMessage(data.error || 'Update failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <MorphButton
        onClick={updateAllData}
        disabled={isUpdating}
        variant="primary"
        size="sm"
        className="gap-2"
      >
        {isUpdating ? (
          <IconRefresh className="h-4 w-4 animate-spin" />
        ) : status === 'success' ? (
          <IconCheck className="h-4 w-4 text-matrix-green" />
        ) : status === 'error' ? (
          <IconX className="h-4 w-4 text-error-red" />
        ) : (
          <IconRefresh className="h-4 w-4" />
        )}
        {isUpdating ? 'Updating...' : 'Update All Data'}
      </MorphButton>
      
      {message && (
        <p className={`text-xs ${
          status === 'success' ? 'text-matrix-green' : 
          status === 'error' ? 'text-error-red' : 
          'text-slate-400'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}