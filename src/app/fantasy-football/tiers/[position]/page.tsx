import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Position } from '@/types';
import { dataManager } from '@/lib/dataManager';
import { generateTierGroups } from '@/lib/tierImageGenerator';
import { TierDisplay } from '@/components/TierDisplay';
import { Heading } from '@/components/ui/Heading';
import { Paragraph } from '@/components/ui/Paragraph';
import { WarmCard } from '@/components/ui/WarmCard';
import { StructuredData } from '@/components/StructuredData';
import { generateBreadcrumbStructuredData } from '@/lib/seo';
import Link from 'next/link';
import { IconArrowLeft, IconChartBar } from '@tabler/icons-react';
import { ModernButton } from '@/components/ui/ModernButton';

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

const positionDescriptions: Record<Position, string> = {
  'OVERALL': '2024 Fantasy Football overall rankings with all positions combined. Expert consensus tiers for complete draft strategy across QB, RB, WR, TE positions.',
  'QB': '2024 Fantasy Football quarterback rankings and tiers. Expert consensus QB rankings for optimal fantasy football draft strategy and weekly lineup decisions.',
  'RB': '2024 Fantasy Football running back rankings and tiers. Expert consensus RB rankings for fantasy football drafts, including handcuffs and sleeper picks.',
  'WR': '2024 Fantasy Football wide receiver rankings and tiers. Expert consensus WR rankings with tier-based draft strategy for fantasy football success.',
  'TE': '2024 Fantasy Football tight end rankings and tiers. Expert consensus TE rankings for fantasy football drafts and weekly roster decisions.',
  'FLEX': '2024 Fantasy Football flex position rankings (RB/WR/TE). Expert consensus rankings for optimal flex lineup decisions and draft strategy.',
  'K': '2024 Fantasy Football kicker rankings and tiers. Expert consensus K rankings for fantasy football drafts and streaming decisions.',
  'DST': '2024 Fantasy Football defense rankings and tiers. Expert consensus DST rankings for fantasy football drafts and weekly streaming strategy.'
};

const positionKeywords: Record<Position, string[]> = {
  'OVERALL': ['fantasy football rankings', 'overall player rankings', 'fantasy football tiers', 'draft rankings'],
  'QB': ['fantasy football QB', 'quarterback rankings', 'fantasy QB tiers', 'QB draft strategy'],
  'RB': ['fantasy football RB', 'running back rankings', 'fantasy RB tiers', 'RB handcuffs'],
  'WR': ['fantasy football WR', 'wide receiver rankings', 'fantasy WR tiers', 'WR sleepers'],
  'TE': ['fantasy football TE', 'tight end rankings', 'fantasy TE tiers', 'TE streaming'],
  'FLEX': ['fantasy football flex', 'flex rankings', 'FLEX position', 'flex strategy'],
  'K': ['fantasy football kickers', 'kicker rankings', 'fantasy K tiers', 'kicker streaming'],
  'DST': ['fantasy football defense', 'DST rankings', 'fantasy defense tiers', 'defense streaming']
};

export async function generateStaticParams() {
  return validPositions.map((position) => ({
    position: position.toLowerCase(),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ position: string }> }): Promise<Metadata> {
  const { position: positionParam } = await params;
  const position = positionParam.toUpperCase() as Position;
  const positionName = positionNames[position] || positionParam;
  const description = positionDescriptions[position] || `2024 Fantasy Football tier rankings for ${positionName}.`;
  const keywords = positionKeywords[position] || [];
  
  return {
    title: `${positionName} Tiers - Fantasy Football Rankings 2024`,
    description,
    keywords: [
      ...keywords,
      'fantasy football',
      'NFL fantasy',
      '2024 fantasy football',
      'expert consensus',
      'tier rankings',
      'draft strategy',
      'Isaac Vazquez'
    ],
    openGraph: {
      title: `${positionName} Fantasy Football Tiers 2024`,
      description,
      type: 'website',
      url: `https://isaacavazquez.com/fantasy-football/tiers/${positionParam}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${positionName} Fantasy Football Tiers 2024`,
      description,
    },
    alternates: {
      canonical: `/fantasy-football/tiers/${positionParam}`,
    },
  };
}

export default async function TierPage({ params }: { params: Promise<{ position: string }> }) {
  const { position: positionParam } = await params;
  const position = positionParam.toUpperCase() as Position;
  
  if (!validPositions.includes(position)) {
    notFound();
  }

  // Get players for this position
  const players = dataManager.getPlayersByPosition(position);
  
  if (!players || players.length === 0) {
    return (
      <div className="min-h-screen bg-terminal-bg px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <WarmCard hover={false} padding="md" elevation={2} className="p-8 text-center">
            <IconChartBar className="w-16 h-16 text-electric-blue mx-auto mb-4" />
            <Heading as="h2" className="mb-4">No Data Available</Heading>
            <Paragraph className="text-slate-400 mb-6">
              No tier data is currently available for {positionNames[position]}.
            </Paragraph>
            <div className="flex gap-4 justify-center">
              <Link href="/fantasy-football">
                <ModernButton variant="primary">
                  Go to Interactive Tiers
                </ModernButton>
              </Link>
              <Link href="/admin">
                <ModernButton variant="secondary">
                  Import Data
                </ModernButton>
              </Link>
            </div>
          </WarmCard>
        </div>
      </div>
    );
  }

  // Generate tier groups
  const tierGroups = generateTierGroups(players, position);
  const limitedTierGroups = tierGroups.slice(0, 12); // Limit to 12 tiers as requested

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Fantasy Football", url: "/fantasy-football" },
    { name: "Tiers", url: "/fantasy-football/tiers" },
    { name: positionNames[position], url: `/fantasy-football/tiers/${positionParam}` }
  ];

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData 
        type="BreadcrumbList" 
        data={{ items: (generateBreadcrumbStructuredData(breadcrumbs) as any).itemListElement }}
      />
      
      {/* Position-Specific Sports Application Schema */}
      <StructuredData 
        type="SportsApplication"
        data={{
          name: `${positionNames[position]} Fantasy Football Tiers`,
          description: positionDescriptions[position],
          about: {
            "@type": "Thing",
            "name": `Fantasy Football ${positionNames[position]}`,
            "description": `${positionNames[position]} player rankings and analysis for fantasy football`
          },
          featureList: [
            `${positionNames[position]} tier rankings`,
            "Expert consensus data",
            "Player performance analysis",
            "Draft strategy insights",
            "Weekly ranking updates"
          ]
        }}
      />

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
              <Heading as="h1" className="text-electric-blue mb-2">
                {positionNames[position]} Tiers
              </Heading>
              <Paragraph className="text-slate-400">
                Expert consensus rankings grouped into {limitedTierGroups.length} tiers for optimal draft strategy
              </Paragraph>
            </div>
            
            <div className="hidden md:block">
              <WarmCard hover={false} padding="md" elevation={1} className="px-4 py-2">
                <div className="text-sm text-slate-400">Total Players</div>
                <div className="text-2xl font-bold text-electric-blue">{players.length}</div>
              </WarmCard>
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
    </>
  );
}