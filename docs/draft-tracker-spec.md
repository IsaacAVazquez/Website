# Draft Tracker Feature Specification

## Overview

The Draft Tracker is a new feature for the fantasy football section that allows users to simulate and track a live fantasy football draft. It will integrate with existing player data and tier calculations while providing an interactive drafting experience.

## User Stories

1. **As a fantasy football player**, I want to track drafted players during my live draft so I can see who's available.
2. **As a draft participant**, I want to see players organized by position and tier so I can make informed decisions.
3. **As a user**, I want to undo draft picks in case of mistakes.
4. **As a league member**, I want to export my draft results for record-keeping.

## Technical Architecture

### Route Structure
```
/fantasy-football/draft-tracker
├── page.tsx (main draft tracker page)
├── components/
│   ├── DraftBoard.tsx
│   ├── PlayerCard.tsx
│   ├── DraftControls.tsx
│   ├── DraftHistory.tsx
│   └── PositionFilter.tsx
└── hooks/
    └── useDraftState.ts
```

### State Management

```typescript
// src/types/draft.ts
export interface DraftSettings {
  totalTeams: number;
  userPosition: number;
  scoringFormat: ScoringFormat;
  draftType: 'snake' | 'linear';
}

export interface DraftPick {
  pickNumber: number;
  teamNumber: number;
  player: Player;
  timestamp: Date;
}

export interface DraftState {
  settings: DraftSettings;
  picks: DraftPick[];
  currentPick: number;
  undoHistory: DraftPick[];
}

// src/hooks/useDraftState.ts
export const useDraftState = () => {
  const [draftState, setDraftState] = useState<DraftState>(() => {
    // Load from localStorage or initialize
    const saved = localStorage.getItem('draftState');
    return saved ? JSON.parse(saved) : initialDraftState;
  });

  const draftPlayer = (player: Player) => {
    const pick: DraftPick = {
      pickNumber: draftState.currentPick,
      teamNumber: calculateTeamNumber(draftState),
      player,
      timestamp: new Date()
    };
    
    setDraftState(prev => ({
      ...prev,
      picks: [...prev.picks, pick],
      currentPick: prev.currentPick + 1
    }));
  };

  const undoLastPick = () => {
    // Implementation
  };

  const resetDraft = () => {
    // Implementation
  };

  return {
    draftState,
    draftPlayer,
    undoLastPick,
    resetDraft,
    isUserPick: calculateIsUserPick(draftState)
  };
};
```

## Component Specifications

### 1. DraftBoard Component

```tsx
// src/app/fantasy-football/draft-tracker/components/DraftBoard.tsx
interface DraftBoardProps {
  players: Player[];
  draftedPlayerIds: Set<string>;
  onDraftPlayer: (player: Player) => void;
  currentPick: number;
  isUserPick: boolean;
}

export const DraftBoard: React.FC<DraftBoardProps> = ({
  players,
  draftedPlayerIds,
  onDraftPlayer,
  currentPick,
  isUserPick
}) => {
  const [selectedPosition, setSelectedPosition] = useState<Position | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const availablePlayers = players.filter(
    player => !draftedPlayerIds.has(player.id)
  );
  
  const filteredPlayers = filterPlayers(availablePlayers, selectedPosition, searchQuery);
  
  return (
    <div className="draft-board">
      <div className="draft-status-bar">
        <h2>Pick #{currentPick}</h2>
        {isUserPick && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="your-pick-indicator"
          >
            Your Pick!
          </motion.div>
        )}
      </div>
      
      <PositionFilter
        selected={selectedPosition}
        onChange={setSelectedPosition}
      />
      
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search players..."
      />
      
      <div className="players-grid">
        {filteredPlayers.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            onDraft={() => onDraftPlayer(player)}
            isDrafted={false}
            showDraftButton={isUserPick}
          />
        ))}
      </div>
    </div>
  );
};
```

### 2. PlayerCard Component

```tsx
// Cyberpunk-themed player card matching existing design system
interface PlayerCardProps {
  player: Player;
  onDraft: () => void;
  isDrafted: boolean;
  showDraftButton: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onDraft,
  isDrafted,
  showDraftButton
}) => {
  const tierColor = getUnifiedTierColor(player.tier);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "player-card glass-morphism",
        isDrafted && "opacity-50 drafted"
      )}
      style={{
        borderColor: tierColor,
        boxShadow: `0 0 20px ${tierColor}20`
      }}
    >
      <div className="player-header">
        <h4 className="player-name">{player.name}</h4>
        <Badge variant="tier" style={{ backgroundColor: tierColor }}>
          Tier {player.tier}
        </Badge>
      </div>
      
      <div className="player-info">
        <span className="team">{player.team}</span>
        <span className="position">{player.position}</span>
        <span className="rank">#{player.averageRank}</span>
      </div>
      
      <div className="player-stats">
        <div className="stat">
          <span className="label">Proj</span>
          <span className="value">{player.projectedPoints}</span>
        </div>
        <div className="stat">
          <span className="label">ADP</span>
          <span className="value">{player.averageRank}</span>
        </div>
      </div>
      
      {showDraftButton && !isDrafted && (
        <MorphButton
          onClick={onDraft}
          variant="primary"
          size="sm"
          className="draft-button"
        >
          Draft
        </MorphButton>
      )}
    </motion.div>
  );
};
```

### 3. Draft History Component

```tsx
interface DraftHistoryProps {
  picks: DraftPick[];
  onUndo: () => void;
  userTeam: number;
}

export const DraftHistory: React.FC<DraftHistoryProps> = ({
  picks,
  onUndo,
  userTeam
}) => {
  return (
    <GlassCard className="draft-history">
      <div className="history-header">
        <h3>Draft History</h3>
        {picks.length > 0 && (
          <MorphButton
            onClick={onUndo}
            variant="secondary"
            size="sm"
          >
            Undo Last
          </MorphButton>
        )}
      </div>
      
      <div className="picks-list">
        {picks.map((pick, index) => (
          <motion.div
            key={pick.pickNumber}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "pick-item",
              pick.teamNumber === userTeam && "user-pick"
            )}
          >
            <span className="pick-number">#{pick.pickNumber}</span>
            <span className="player-name">{pick.player.name}</span>
            <span className="position">{pick.player.position}</span>
            <span className="team">Team {pick.teamNumber}</span>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};
```

## Styling Guidelines

### CSS Variables
```css
.draft-tracker {
  --draft-bg: var(--terminal-bg);
  --draft-border: var(--electric-blue);
  --user-pick-color: var(--matrix-green);
  --drafted-opacity: 0.4;
}
```

### Responsive Layout
```css
.draft-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 2fr 1fr;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: 3fr 1fr;
  }
}
```

## API Integration

### Data Fetching
```typescript
// Use existing fantasy data hooks
const { players, isLoading } = useAllFantasyData({
  scoringFormat: draftState.settings.scoringFormat
});

// Apply existing tier calculations
const tieredPlayers = useMemo(() => {
  return calculateUnifiedTiers(players, 10, scoringFormat);
}, [players, scoringFormat]);
```

### Export Functionality
```typescript
const exportDraftResults = (format: 'csv' | 'pdf' | 'json') => {
  const data = formatDraftData(draftState.picks);
  
  switch (format) {
    case 'csv':
      downloadCSV(data, `draft-${Date.now()}.csv`);
      break;
    case 'pdf':
      generateDraftPDF(data);
      break;
    case 'json':
      downloadJSON(data, `draft-${Date.now()}.json`);
      break;
  }
};
```

## Performance Considerations

1. **Memoization**: Use React.memo for PlayerCard components
2. **Virtual Scrolling**: Implement for large player lists
3. **Debounced Search**: Debounce search input by 300ms
4. **Lazy Loading**: Load player images on demand
5. **Local Storage**: Throttle saves to every 5 seconds

## Future Enhancements

### Phase 2 Features
1. **Mock Draft Mode**: AI-controlled other teams
2. **Trade Analyzer**: Post-draft trade suggestions
3. **Team Analysis**: Strength/weakness breakdown
4. **Draft Strategies**: Best available vs. positional need
5. **Integration**: Import from ESPN/Yahoo/Sleeper

### Phase 3 Features
1. **Real-time Collaboration**: Multiple users drafting together
2. **Draft Grades**: Instant team grading
3. **Keeper Support**: Mark and track keeper players
4. **Auction Support**: Budget-based drafting
5. **Dynasty Features**: Rookie draft support

## Testing Strategy

### Unit Tests
- Draft logic calculations
- Snake draft order
- Player filtering
- State management

### Integration Tests
- Draft flow completion
- Undo/redo functionality
- Export features
- localStorage persistence

### E2E Tests
- Complete draft simulation
- Mobile responsiveness
- Performance under load
- Cross-browser compatibility

This specification provides a complete blueprint for implementing the Draft Tracker feature while maintaining consistency with the existing codebase and design system.