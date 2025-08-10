# Quick Wins - Immediate Improvements

## 15-Minute Fixes

### 1. Remove Unused Dependencies
```bash
npm uninstall @mdx-js/loader @next/mdx @mapbox/rehype-prism prismjs ml-kmeans simple-statistics @tailwindcss/vite @vitejs/plugin-react vite motion
```

### 2. Delete Vite Configuration
```bash
rm vite.config.mts
```

### 3. Fix Duplicate Component
```bash
rm -rf src/components/components/ui/ui/text-generate-effect.tsx
```

### 4. Remove Dead Sidebar Code
```bash
rm src/components/ui/Sidebar.tsx
```

## 1-Hour Improvements

### 1. Create Logger Utility
```typescript
// src/lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  info: (...args: any[]) => isDev && console.info(...args),
  warn: (...args: any[]) => isDev && console.warn(...args),
  error: (...args: any[]) => console.error(...args), // Always log errors
  debug: (...args: any[]) => isDev && console.debug(...args),
  table: (data: any) => isDev && console.table(data),
  time: (label: string) => isDev && console.time(label),
  timeEnd: (label: string) => isDev && console.timeEnd(label),
};

// Global replacement regex: console\.(log|info|warn|debug) -> logger.$1
```

### 2. Create OpenGraph Image
Design a 1200x630px image with:
- Your name and title
- "QA Engineer & Builder"
- Cyberpunk theme elements
- Save as `/public/og-image.png`

### 3. Add Skip Navigation
```tsx
// In src/app/layout.tsx, add after <body> tag:
<a 
  href="#main-content" 
  className="skip-link absolute left-[-9999px] focus:left-4 focus:top-4 focus:z-50 bg-electric-blue text-black px-4 py-2 rounded"
>
  Skip to main content
</a>

// Add id="main-content" to your main content container
```

### 4. Consolidate Badge Components
```tsx
// src/components/ui/Badge.tsx - Unified component
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'tier' | 'status';
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  href,
  className,
  style
}) => {
  const baseClasses = cn(
    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
    'transition-all duration-200',
    {
      'bg-gray-800 text-gray-200 hover:bg-gray-700': variant === 'default',
      'text-white': variant === 'tier',
      'bg-green-900 text-green-200': variant === 'status',
    },
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <span className={baseClasses} style={style}>
      {children}
    </span>
  );
};
```

## Half-Day Projects

### 1. Basic Draft Tracker Page
```tsx
// src/app/fantasy-football/draft-tracker/page.tsx
'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { MorphButton } from '@/components/ui/MorphButton';
import { useAllFantasyData } from '@/hooks/useAllFantasyData';
import { Player } from '@/types';

export default function DraftTracker() {
  const [draftedPlayers, setDraftedPlayers] = useState<Player[]>([]);
  const { players, isLoading } = useAllFantasyData({ scoringFormat: 'PPR' });

  const draftPlayer = (player: Player) => {
    setDraftedPlayers([...draftedPlayers, player]);
  };

  const undoLastPick = () => {
    setDraftedPlayers(draftedPlayers.slice(0, -1));
  };

  const availablePlayers = players.filter(
    p => !draftedPlayers.find(dp => dp.id === p.id)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-electric-blue">
        Draft Tracker
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Players */}
        <div className="lg:col-span-2">
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Available Players</h2>
            {isLoading ? (
              <p>Loading players...</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {availablePlayers.slice(0, 50).map(player => (
                  <div 
                    key={player.id}
                    className="flex justify-between items-center p-3 hover:bg-gray-800 rounded"
                  >
                    <div>
                      <span className="font-medium">{player.name}</span>
                      <span className="text-gray-400 ml-2">
                        {player.team} - {player.position}
                      </span>
                    </div>
                    <MorphButton
                      size="sm"
                      onClick={() => draftPlayer(player)}
                    >
                      Draft
                    </MorphButton>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
        
        {/* Drafted Players */}
        <div>
          <GlassCard>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Drafted</h2>
              {draftedPlayers.length > 0 && (
                <MorphButton
                  size="sm"
                  variant="secondary"
                  onClick={undoLastPick}
                >
                  Undo
                </MorphButton>
              )}
            </div>
            <div className="space-y-2">
              {draftedPlayers.map((player, index) => (
                <div key={`${player.id}-${index}`} className="p-2 bg-gray-800 rounded">
                  <span className="text-gray-400 mr-2">#{index + 1}</span>
                  <span>{player.name}</span>
                  <span className="text-gray-400 ml-2">{player.position}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
```

### 2. Add to Navigation
```tsx
// src/constants/navlinks.tsx
export const navlinks = [
  // ... existing links
  {
    href: "/fantasy-football/draft-tracker",
    label: "Draft Tracker",
    icon: IconClipboardList,
  },
];
```

### 3. Clean Up Test API Routes
```bash
# Remove test routes
rm -rf src/app/api/test-login
rm -rf src/app/api/test-login-detailed
rm -rf src/app/api/test-scrape
rm -rf src/app/api/debug-fantasypros
```

### 4. Implement Backup Rotation
```typescript
// scripts/rotate-backups.js
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../src/data/backup');
const MAX_BACKUPS = 5;

// Get all backup files
const files = fs.readdirSync(BACKUP_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => ({
    name: f,
    path: path.join(BACKUP_DIR, f),
    mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime
  }))
  .sort((a, b) => b.mtime - a.mtime);

// Keep only the most recent MAX_BACKUPS files
if (files.length > MAX_BACKUPS) {
  const filesToDelete = files.slice(MAX_BACKUPS);
  filesToDelete.forEach(file => {
    fs.unlinkSync(file.path);
    console.log(`Deleted old backup: ${file.name}`);
  });
}

console.log(`Kept ${Math.min(files.length, MAX_BACKUPS)} most recent backups`);
```

## SEO Quick Fixes

### 1. Add Canonical URLs
```tsx
// In src/lib/seo.ts, update constructMetadata:
export const constructMetadata = ({
  title = siteConfig.name,
  description = siteConfig.description,
  // ... other params
  canonicalUrl,
}: {
  // ... other types
  canonicalUrl?: string;
} = {}): Metadata => {
  return {
    // ... existing metadata
    alternates: {
      canonical: canonicalUrl || `https://isaacavazquez.com${pathname}`,
    },
  };
};
```

### 2. Improve Image Alt Text
```tsx
// Example fix in TierChartEnhanced.tsx
alt={`${player.name} - ${player.team} ${player.position} fantasy football player headshot`}
```

### 3. Add Loading States
```tsx
// Create src/components/ui/SkeletonLoader.tsx
export const SkeletonLoader = ({ type }: { type: string }) => {
  if (type === 'tier-chart') {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded mb-4 w-1/3"></div>
        <div className="h-96 bg-gray-800 rounded"></div>
      </div>
    );
  }
  // Add more skeleton types as needed
};
```

These quick wins can be implemented immediately to improve code quality, performance, and user experience without requiring extensive refactoring or testing.