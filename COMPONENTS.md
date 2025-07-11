# Component Library Documentation

This document provides comprehensive documentation for the UI component library and design system used in the Isaac Vazquez Portfolio project.

## 📋 Table of Contents

- [Design System Overview](#design-system-overview)
- [Base Components](#base-components)
- [Layout Components](#layout-components)
- [Navigation Components](#navigation-components)
- [Data Visualization Components](#data-visualization-components)
- [Form Components](#form-components)
- [Animation Components](#animation-components)
- [Usage Guidelines](#usage-guidelines)
- [Accessibility Features](#accessibility-features)

## 🎨 Design System Overview

### Cyberpunk Professional Theme

The design system is built around a "cyberpunk professional" aesthetic that balances futuristic visual elements with professional usability.

**Core Principles:**
- **Electric Aesthetics** - Neon colors and glow effects
- **Glassmorphism** - Transparent, blurred surfaces
- **Terminal Interfaces** - Command-line inspired interactions
- **Professional Typography** - Clean, readable fonts with cyberpunk accents
- **Accessibility First** - WCAG 2.1 AA compliance

### Color System

```css
/* Primary Cyberpunk Colors */
:root {
  --electric-blue: #00F5FF;    /* Primary accent, headings, links */
  --matrix-green: #39FF14;     /* Secondary accent, highlights, success */
  --warning-amber: #FFB800;    /* Warnings, attention items */
  --error-red: #FF073A;        /* Errors, critical states */
  --neon-purple: #BF00FF;      /* Tertiary accent, special effects */
  --cyber-teal: #00FFBF;       /* Additional accent color */
  
  /* Terminal Interface */
  --terminal-bg: #0A0A0B;      /* Dark backgrounds, cards */
  --terminal-border: #1A1A1B;  /* Subtle borders */
  --terminal-text: #00FF00;    /* Terminal-style text */
  --terminal-cursor: #00F5FF;  /* Cursor and active states */
  
  /* Professional Neutrals */
  --slate-50: #f8fafc;
  --slate-100: #f1f5f9;
  --slate-900: #0f172a;
  --slate-950: #020617;
}
```

### Typography System

```css
/* Font Families */
--font-orbitron: 'Orbitron', monospace;      /* Cyberpunk headings */
--font-inter: 'Inter', sans-serif;           /* Professional body text */
--font-syne: 'Syne', sans-serif;             /* Modern accents */
--font-jetbrains: 'JetBrains Mono', monospace; /* Code and terminal */

/* Type Scale */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Glassmorphism System

```css
/* 5-tier elevation system */
.glass-1 { backdrop-filter: blur(4px); background: rgba(10, 10, 11, 0.8); }
.glass-2 { backdrop-filter: blur(8px); background: rgba(10, 10, 11, 0.7); }
.glass-3 { backdrop-filter: blur(12px); background: rgba(10, 10, 11, 0.6); }
.glass-4 { backdrop-filter: blur(16px); background: rgba(10, 10, 11, 0.5); }
.glass-5 { backdrop-filter: blur(20px); background: rgba(10, 10, 11, 0.4); }
```

## 🧩 Base Components

### GlassCard

A foundational container component with glassmorphism effects and elevation system.

```typescript
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevation?: 1 | 2 | 3 | 4 | 5;
  glow?: boolean;
  hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  elevation = 2,
  glow = false,
  hover = false
}) => {
  return (
    <div 
      className={cn(
        'rounded-lg border border-white/10 backdrop-blur-sm',
        `glass-${elevation}`,
        {
          'shadow-glow-blue': glow,
          'hover:glass-3 transition-all duration-300': hover
        },
        className
      )}
    >
      {children}
    </div>
  );
};
```

**Usage:**
```tsx
<GlassCard elevation={3} glow hover>
  <h2>Content with glassmorphism</h2>
</GlassCard>
```

### MorphButton

Animated button component with cyberpunk styling and multiple variants.

```typescript
interface MorphButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'terminal' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const MorphButton: React.FC<MorphButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  glow = false,
  onClick,
  disabled = false,
  className = ''
}) => {
  const variants = {
    primary: 'bg-electric-blue text-black hover:bg-electric-blue/90',
    secondary: 'bg-matrix-green text-black hover:bg-matrix-green/90',
    terminal: 'bg-terminal-bg border border-terminal-text text-terminal-text hover:bg-terminal-text hover:text-terminal-bg',
    ghost: 'bg-transparent border border-white/20 text-white hover:bg-white/10'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'rounded-md font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-electric-blue/50',
        variants[variant],
        sizes[size],
        {
          'shadow-glow-blue': glow && variant === 'primary',
          'shadow-glow-green': glow && variant === 'secondary',
          'opacity-50 cursor-not-allowed': disabled
        },
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};
```

### Heading

Typography component with consistent styling and cyberpunk theme integration.

```typescript
interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: 'default' | 'gradient' | 'terminal' | 'neon';
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({
  children,
  level = 1,
  variant = 'default',
  className = ''
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const sizes = {
    1: 'text-4xl lg:text-5xl',
    2: 'text-3xl lg:text-4xl',
    3: 'text-2xl lg:text-3xl',
    4: 'text-xl lg:text-2xl',
    5: 'text-lg lg:text-xl',
    6: 'text-base lg:text-lg'
  };

  const variants = {
    default: 'text-white font-orbitron',
    gradient: 'bg-gradient-to-r from-electric-blue to-cyan-400 text-transparent bg-clip-text font-orbitron',
    terminal: 'text-terminal-text font-jetbrains',
    neon: 'text-matrix-green font-orbitron shadow-glow-green'
  };

  return (
    <Tag className={cn(sizes[level], variants[variant], className)}>
      {children}
    </Tag>
  );
};
```

### Badge

Cyberpunk-styled labels and tags for categorization and status indicators.

```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  glow = false,
  className = ''
}) => {
  const variants = {
    default: 'bg-slate-800 text-slate-200 border-slate-700',
    success: 'bg-matrix-green/20 text-matrix-green border-matrix-green/30',
    warning: 'bg-warning-amber/20 text-warning-amber border-warning-amber/30',
    error: 'bg-error-red/20 text-error-red border-error-red/30',
    info: 'bg-electric-blue/20 text-electric-blue border-electric-blue/30'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        variants[variant],
        sizes[size],
        { 'shadow-glow': glow },
        className
      )}
    >
      {children}
    </span>
  );
};
```

## 📐 Layout Components

### ConditionalLayout

Main layout wrapper that provides conditional rendering based on route.

```typescript
interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Floating Navigation */}
      <FloatingNav />
      
      {/* Command Palette */}
      <CommandPalette />
      
      {/* Page Content */}
      <main className={cn('relative', {
        'h-screen overflow-hidden': isHomePage,
        'pt-16': !isHomePage
      })}>
        {children}
      </main>
      
      {/* Footer (not on home page) */}
      {!isHomePage && <Footer />}
    </div>
  );
};
```

### Container

Responsive container component with consistent max-width and padding.

```typescript
interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  className = ''
}) => {
  const sizes = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none'
  };

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizes[size], className)}>
      {children}
    </div>
  );
};
```

## 🧭 Navigation Components

### FloatingNav

Persistent navigation overlay with glassmorphism and smooth animations.

```typescript
interface FloatingNavProps {
  className?: string;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 10);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={cn(
            'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
            'glass-3 rounded-full border border-white/10',
            'px-6 py-3',
            className
          )}
        >
          <div className="flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-full',
                  'transition-all duration-200',
                  {
                    'bg-electric-blue text-black': pathname === link.href,
                    'text-white hover:text-electric-blue': pathname !== link.href
                  }
                )}
              >
                <link.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            ))}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};
```

### CommandPalette

Spotlight-style command interface for quick navigation and actions.

```typescript
interface CommandPaletteProps {
  className?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Open with Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { id: 'home', label: 'Go to Home', action: () => router.push('/') },
    { id: 'about', label: 'Go to About', action: () => router.push('/about') },
    { id: 'projects', label: 'Go to Projects', action: () => router.push('/projects') },
    { id: 'fantasy', label: 'Fantasy Football', action: () => router.push('/fantasy-football') },
    { id: 'resume', label: 'View Resume', action: () => router.push('/resume') },
    { id: 'contact', label: 'Contact Me', action: () => router.push('/contact') },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn(
              'w-full max-w-lg glass-4 rounded-lg border border-white/20',
              'overflow-hidden shadow-2xl',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="p-4 border-b border-white/10">
              <input
                type="text"
                placeholder="Type a command or search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
                autoFocus
              />
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredCommands.map((command) => (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action();
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors"
                >
                  {command.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

## 📊 Data Visualization Components

### TierChartEnhanced

Interactive D3.js chart component for fantasy football tier visualization.

```typescript
interface TierChartEnhancedProps {
  players: Player[];
  width?: number;
  height?: number;
  numberOfTiers?: number;
  scoringFormat?: string;
  className?: string;
}

export const TierChartEnhanced: React.FC<TierChartEnhancedProps> = ({
  players,
  width = 1200,
  height = 600,
  numberOfTiers = 6,
  scoringFormat = 'PPR',
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current || players.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Cluster players into tiers
    const clusteredPlayers = clusterPlayersIntoTiers(players, numberOfTiers);
    
    // Set up chart dimensions
    const margin = { top: 40, right: 40, bottom: 60, left: 120 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(players, d => d.averageRank) as [number, number])
      .range([0, chartWidth]);

    const yScale = d3.scaleBand()
      .domain(clusteredPlayers.map((_, i) => `Tier ${i + 1}`))
      .range([0, chartHeight])
      .paddingInner(0.1);

    // Color scale for tiers
    const colorScale = d3.scaleOrdinal<string>()
      .domain(clusteredPlayers.map((_, i) => `Tier ${i + 1}`))
      .range([
        '#FF073A', // Tier 1 - Red (elite)
        '#FFB800', // Tier 2 - Amber
        '#39FF14', // Tier 3 - Matrix Green
        '#00F5FF', // Tier 4 - Electric Blue
        '#BF00FF', // Tier 5 - Neon Purple
        '#00FFBF'  // Tier 6 - Cyber Teal
      ]);

    // Create chart group
    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        chartGroup.attr('transform', `translate(${margin.left},${margin.top}) ${event.transform}`);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Render tiers and players
    clusteredPlayers.forEach((tierPlayers, tierIndex) => {
      const tierName = `Tier ${tierIndex + 1}`;
      const tierY = yScale(tierName) || 0;
      const tierHeight = yScale.bandwidth();

      // Tier background
      chartGroup.append('rect')
        .attr('x', 0)
        .attr('y', tierY)
        .attr('width', chartWidth)
        .attr('height', tierHeight)
        .attr('fill', colorScale(tierName))
        .attr('opacity', 0.1)
        .attr('rx', 4);

      // Tier label
      chartGroup.append('text')
        .attr('x', -10)
        .attr('y', tierY + tierHeight / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('fill', colorScale(tierName))
        .attr('font-family', 'Orbitron, monospace')
        .attr('font-weight', 'bold')
        .text(tierName);

      // Player dots and error bars
      tierPlayers.forEach((player) => {
        const x = xScale(player.averageRank);
        const y = tierY + tierHeight / 2;

        // Error bar (standard deviation)
        const errorBarLength = xScale(player.standardDeviation || 0) - xScale(0);
        
        chartGroup.append('line')
          .attr('x1', x - errorBarLength / 2)
          .attr('x2', x + errorBarLength / 2)
          .attr('y1', y)
          .attr('y2', y)
          .attr('stroke', colorScale(tierName))
          .attr('stroke-width', 2)
          .attr('opacity', 0.7);

        // Player dot
        const playerDot = chartGroup.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 4)
          .attr('fill', colorScale(tierName))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer');

        // Hover effects
        playerDot
          .on('mouseenter', function() {
            d3.select(this)
              .attr('r', 6)
              .attr('filter', 'drop-shadow(0 0 8px currentColor)');
            
            // Tooltip
            const tooltip = chartGroup.append('g')
              .attr('class', 'tooltip')
              .attr('transform', `translate(${x}, ${y - 20})`);

            const tooltipBg = tooltip.append('rect')
              .attr('x', -50)
              .attr('y', -30)
              .attr('width', 100)
              .attr('height', 50)
              .attr('fill', 'rgba(0, 0, 0, 0.9)')
              .attr('rx', 4)
              .attr('stroke', colorScale(tierName))
              .attr('stroke-width', 1);

            tooltip.append('text')
              .attr('text-anchor', 'middle')
              .attr('y', -15)
              .attr('fill', '#fff')
              .attr('font-size', '12px')
              .text(player.name);

            tooltip.append('text')
              .attr('text-anchor', 'middle')
              .attr('y', 0)
              .attr('fill', colorScale(tierName))
              .attr('font-size', '10px')
              .text(`${player.team} - Rank: ${player.averageRank.toFixed(1)}`);
          })
          .on('mouseleave', function() {
            d3.select(this)
              .attr('r', 4)
              .attr('filter', 'none');
            
            chartGroup.select('.tooltip').remove();
          });
      });
    });

    // X-axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `#${d}`)
      .ticks(10);

    chartGroup.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#9CA3AF');

    // Chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#00F5FF')
      .attr('font-family', 'Orbitron, monospace')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text(`${players[0]?.position || ''} Rankings - ${scoringFormat} Scoring`);

  }, [players, width, height, numberOfTiers, scoringFormat]);

  return (
    <div className={cn('relative', className)}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-700 rounded-lg bg-gray-900"
      />
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <MorphButton
          size="sm"
          variant="ghost"
          onClick={() => {
            const svg = d3.select(svgRef.current);
            svg.transition().call(
              zoom.scaleBy as any,
              1.5
            );
          }}
        >
          +
        </MorphButton>
        <MorphButton
          size="sm"
          variant="ghost"
          onClick={() => {
            const svg = d3.select(svgRef.current);
            svg.transition().call(
              zoom.scaleBy as any,
              1 / 1.5
            );
          }}
        >
          -
        </MorphButton>
        <div className="text-xs text-gray-400 text-center">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>
    </div>
  );
};
```

## 📋 Form Components

### PositionSelector

Multi-select component for fantasy football positions with scoring format options.

```typescript
interface PositionSelectorProps {
  selectedPosition: Position;
  selectedFormat: ScoringFormat;
  onPositionChange: (position: Position) => void;
  onFormatChange: (format: ScoringFormat) => void;
  className?: string;
}

export const PositionSelector: React.FC<PositionSelectorProps> = ({
  selectedPosition,
  selectedFormat,
  onPositionChange,
  onFormatChange,
  className = ''
}) => {
  const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'];
  const formats: ScoringFormat[] = ['STANDARD', 'PPR', 'HALF_PPR'];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Position Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-3">
          Select Position
        </label>
        <div className="flex flex-wrap gap-2">
          {positions.map((position) => (
            <MorphButton
              key={position}
              variant={selectedPosition === position ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onPositionChange(position)}
              className="min-w-[60px]"
            >
              {position}
            </MorphButton>
          ))}
        </div>
      </div>

      {/* Scoring Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-3">
          Scoring Format
        </label>
        <div className="flex gap-2">
          {formats.map((format) => (
            <MorphButton
              key={format}
              variant={selectedFormat === format ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onFormatChange(format)}
              className="flex-1"
            >
              {format.replace('_', ' ')}
            </MorphButton>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## 🎭 Animation Components

### TerminalHero

Animated terminal interface component for the home page.

```typescript
interface TerminalHeroProps {
  className?: string;
}

export const TerminalHero: React.FC<TerminalHeroProps> = ({ className }) => {
  const [currentCommand, setCurrentCommand] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const commands = [
    '> whoami',
    'isaac_vazquez@portfolio:~$ QA Engineer & Full-Stack Developer',
    '> ls -la skills/',
    'drwxr-xr-x  2 isaac  staff  Testing, JavaScript, Python, React',
    '> cat experience.txt',
    'Senior QA Engineer with passion for automation and development',
    '> ./launch_portfolio.sh',
    'Initializing cyberpunk interface... ✓',
    'Loading project showcase... ✓',
    'Ready for exploration! 🚀'
  ];

  // Typing animation effect
  useEffect(() => {
    if (currentCommand >= commands.length) return;

    const command = commands[currentCommand];
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex < command.length) {
        setDisplayText(prev => prev + command[charIndex]);
        charIndex++;
        setTimeout(typeChar, Math.random() * 50 + 25);
      } else {
        setTimeout(() => {
          setDisplayText(prev => prev + '\n');
          setCurrentCommand(prev => prev + 1);
        }, 1000);
      }
    };

    setTimeout(typeChar, 500);
  }, [currentCommand]);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('relative h-screen overflow-hidden', className)}>
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-electric-blue rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full">
        {/* Terminal Interface */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex-1 flex items-center justify-center p-8"
        >
          <GlassCard elevation={4} className="w-full max-w-2xl p-6">
            <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-text/30">
              {/* Terminal Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-terminal-text/20">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-error-red" />
                  <div className="w-3 h-3 rounded-full bg-warning-amber" />
                  <div className="w-3 h-3 rounded-full bg-matrix-green" />
                </div>
                <span className="text-terminal-text text-sm font-jetbrains">
                  terminal
                </span>
              </div>

              {/* Terminal Content */}
              <div className="font-jetbrains text-sm text-terminal-text min-h-[300px]">
                <pre className="whitespace-pre-wrap">
                  {displayText}
                  {showCursor && (
                    <span className="bg-terminal-cursor text-terminal-bg">_</span>
                  )}
                </pre>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Hero Content */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex-1 flex flex-col justify-center p-8"
        >
          <div className="max-w-lg">
            <Heading level={1} variant="gradient" className="mb-6">
              Isaac Vazquez
            </Heading>
            <Heading level={3} variant="terminal" className="mb-8">
              QA Engineer & Builder
            </Heading>
            
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Crafting robust applications through meticulous testing and 
              full-stack development. Specializing in automation, performance 
              optimization, and cyberpunk aesthetics.
            </p>

            <div className="flex space-x-4">
              <MorphButton variant="primary" glow onClick={() => router.push('/projects')}>
                View Projects
              </MorphButton>
              <MorphButton variant="ghost" onClick={() => router.push('/contact')}>
                Get In Touch
              </MorphButton>
            </div>

            {/* Status Indicators */}
            <div className="mt-8 space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-matrix-green rounded-full animate-pulse" />
                <span className="text-sm text-gray-400">System Status: Online</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse" />
                <span className="text-sm text-gray-400">Ready for New Projects</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
```

## 📚 Usage Guidelines

### Component Composition

**Preferred Pattern:**
```tsx
// ✅ Good - Composable and flexible
<GlassCard elevation={3} glow>
  <Heading level={2} variant="gradient">
    Fantasy Football Tiers
  </Heading>
  <div className="space-y-4">
    <PositionSelector 
      selectedPosition={position}
      onPositionChange={setPosition}
    />
    <TierChartEnhanced 
      players={players}
      scoringFormat={format}
    />
  </div>
</GlassCard>

// ❌ Avoid - Monolithic components
<FantasyFootballWidget players={players} position={position} format={format} />
```

### Styling Conventions

**Consistent Class Application:**
```tsx
// ✅ Use cn() utility for conditional classes
const buttonClasses = cn(
  'base-button-styles',
  {
    'active-styles': isActive,
    'disabled-styles': disabled
  },
  className
);

// ❌ Avoid string concatenation
const buttonClasses = `base-button-styles ${isActive ? 'active-styles' : ''} ${className}`;
```

### Animation Best Practices

**Performance-Optimized Animations:**
```tsx
// ✅ Use transform and opacity for smooth animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</motion.div>

// ❌ Avoid animating layout properties
<motion.div
  animate={{ height: isOpen ? 'auto' : 0 }}
>
  Content
</motion.div>
```

## ♿ Accessibility Features

### Keyboard Navigation

All interactive components support keyboard navigation:
- **Tab/Shift+Tab** - Navigate between elements
- **Enter/Space** - Activate buttons and links
- **Escape** - Close modals and dropdowns
- **Arrow Keys** - Navigate within component groups

### Screen Reader Support

```tsx
// ARIA labels and descriptions
<MorphButton
  aria-label="Navigate to projects page"
  aria-describedby="projects-description"
>
  Projects
</MorphButton>

// Focus management
useEffect(() => {
  if (isOpen) {
    modalRef.current?.focus();
  }
}, [isOpen]);

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Color Contrast

All color combinations meet WCAG 2.1 AA standards:
- **Normal text:** 4.5:1 contrast ratio minimum
- **Large text:** 3:1 contrast ratio minimum
- **UI components:** 3:1 contrast ratio for borders and states

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .motion-safe\:animate-none {
    animation: none;
  }
  
  .motion-safe\:transition-none {
    transition: none;
  }
}
```

## 📚 Additional Resources

### Related Documentation
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development environment setup
- [CLAUDE.md](./CLAUDE.md) - Comprehensive application overview
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common component issues

### External References
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Accessibility Guidelines](https://reactjs.org/docs/accessibility.html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

*This component library documentation is maintained alongside the design system. For component updates and new additions, see [CHANGELOG.md](./CHANGELOG.md).*