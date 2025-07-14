import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Position } from '@/types';
import { dataManager } from '@/lib/dataManager';
import { generateTierGroups } from '@/lib/tierImageGenerator';
import { TierDisplay } from '@/components/TierDisplay';
import { Heading } from '@/components/ui/Heading';
import { Paragraph } from '@/components/ui/Paragraph';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';
import { IconArrowLeft, IconChartBar } from '@tabler/icons-react';
import { MorphButton } from '@/components/ui/MorphButton';

const validPositions: Position[] = ['OVERALL', 'QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'];

const positionNames: Record<Position, string> = {
  'OVERALL': 'Overall Rankings',
  'QB': 'Quarterbacks',
  'RB': 'Running Backs',
  'WR': 'Wide Receivers',
  'TE': 'Tight Ends',
  'FLEX': 'Flex (RB/WR/TE)',
  'K': 'Kickers',
  'DST': 'Defense/Special Teams'
};

export async function generateStaticParams() {
  return validPositions.map((position) => ({
    position: position.toLowerCase(),
  }));
}

export async function generateMetadata({ params }: { params: { position: string } }): Promise<Metadata> {
  const position = params.position.toUpperCase() as Position;
  const positionName = positionNames[position] || params.position;
  
  return {
    title: `${positionName} Tiers - Fantasy Football Rankings`,
    description: `2024 Fantasy Football tier rankings for ${positionName}. Expert consensus rankings grouped into tiers for better draft strategy.`,
  };
}

export default function TierPage({ params }: { params: { position: string } }) {
  const position = params.position.toUpperCase() as Position;
  
  if (!validPositions.includes(position)) {
    notFound();
  }

  // Get players for this position
  const players = dataManager.getPlayersByPosition(position);
  
  if (!players || players.length === 0) {
    return (
      <div className="min-h-screen bg-terminal-bg px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <GlassCard elevation={2} className="p-8 text-center">
            <IconChartBar className="w-16 h-16 text-electric-blue mx-auto mb-4" />
            <Heading size="h2" className="mb-4">No Data Available</Heading>
            <Paragraph className="text-slate-400 mb-6">
              No tier data is currently available for {positionNames[position]}.
            </Paragraph>
            <div className="flex gap-4 justify-center">
              <Link href="/fantasy-football">
                <MorphButton variant="primary">
                  Go to Interactive Tiers
                </MorphButton>
              </Link>
              <Link href="/admin">
                <MorphButton variant="secondary">
                  Import Data
                </MorphButton>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Generate tier groups
  const tierGroups = generateTierGroups(players, position);
  const limitedTierGroups = tierGroups.slice(0, 12); // Limit to 12 tiers as requested

  return (
    <div className="min-h-screen bg-terminal-bg">
      {/* Header */}
      <div className="bg-gradient-to-b from-terminal-bg to-slate-900 border-b border-terminal-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link href="/fantasy-football" className="inline-flex items-center gap-2 text-electric-blue hover:text-electric-blue/80 transition-colors mb-6">
            <IconArrowLeft className="w-4 h-4" />
            Back to Interactive Tiers
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <Heading size="h1" className="text-electric-blue mb-2">
                {positionNames[position]} Tiers
              </Heading>
              <Paragraph className="text-slate-400">
                Expert consensus rankings grouped into {limitedTierGroups.length} tiers for optimal draft strategy
              </Paragraph>
            </div>
            
            <div className="hidden md:block">
              <GlassCard elevation={1} className="px-4 py-2">
                <div className="text-sm text-slate-400">Total Players</div>
                <div className="text-2xl font-bold text-electric-blue">{players.length}</div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Groups */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <TierDisplay 
          tierGroups={limitedTierGroups} 
          position={position}
          showImages={true}
        />
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-terminal-border">
        <div className="flex flex-wrap gap-4 justify-center">
          {validPositions.map((pos) => (
            <Link
              key={pos}
              href={`/fantasy-football/tiers/${pos.toLowerCase()}`}
              className={`px-4 py-2 rounded-lg border transition-all ${
                pos === position
                  ? 'bg-electric-blue text-slate-900 border-electric-blue'
                  : 'bg-terminal-bg border-terminal-border text-slate-300 hover:border-electric-blue/50'
              }`}
            >
              {positionNames[pos]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}