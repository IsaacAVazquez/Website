'use client';

import { useState } from 'react';
import { ModernButton } from '@/components/ui/ModernButton';
import { IconRefresh } from '@tabler/icons-react';

export function TestFlexImplementation() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testFlex = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/fantasy-pros-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: 'FLEX',
          scoringFormat: 'ppr'
        })
      });

      const data = await response.json();

      if (data.success && data.players) {
        // Group players by position
        const positionCounts: Record<string, number> = {};
        data.players.forEach((player: any) => {
          const pos = player.position;
          positionCounts[pos] = (positionCounts[pos] || 0) + 1;
        });

        setResults({
          success: true,
          totalPlayers: data.players.length,
          positionBreakdown: positionCounts,
          topPlayers: data.players.slice(0, 10).map((p: any) => ({
            name: p.name,
            position: p.position,
            team: p.team,
            rank: p.averageRank
          }))
        });
      } else {
        setResults({ success: false, error: data.error });
      }
    } catch (error) {
      setResults({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ModernButton
        onClick={testFlex}
        disabled={isLoading}
        variant="primary"
        size="sm"
        className="gap-2"
      >
        <IconRefresh className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Test New FLEX Implementation
      </ModernButton>

      {results && (
        <div className="border border-terminal-border rounded p-4 space-y-3">
          {results.success ? (
            <>
              <div className="text-matrix-green font-bold">✓ FLEX Rankings Working!</div>
              <div className="text-sm text-slate-400">
                <p>Total Players: {results.totalPlayers}</p>
                <p className="mt-2">Position Breakdown:</p>
                <ul className="ml-4 text-xs">
                  {Object.entries(results.positionBreakdown as Record<string, number>).map(([pos, count]) => (
                    <li key={pos}>• {pos}: {count} players</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-electric-blue mb-2">Top 10 FLEX Players:</p>
                <div className="space-y-1 text-xs">
                  {results.topPlayers.map((player: any, i: number) => (
                    <div key={i} className="flex justify-between text-slate-500">
                      <span>{i + 1}. {player.name} ({player.position})</span>
                      <span>{player.team} - Rank: {player.rank.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-error-red">
              <p className="font-bold">✗ Error</p>
              <p className="text-sm">{results.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}