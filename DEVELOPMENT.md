# Development Guide

This guide provides detailed information for developers working on the Isaac Vazquez Portfolio project.

## 📋 Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Code Architecture](#code-architecture)
- [Component System](#component-system)
- [API Development](#api-development)
- [Styling and Design](#styling-and-design)
- [Testing Guidelines](#testing-guidelines)
- [Performance Optimization](#performance-optimization)
- [Debugging Tips](#debugging-tips)

## 🛠️ Development Environment Setup

### Prerequisites

**Required:**
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher (or yarn 1.22.0+)
- Git 2.30.0 or higher

**Recommended:**
- VS Code with extensions:
  - TypeScript and JavaScript Language Features
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint

### Local Development Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/IsaacAVazquez/Website.git
   cd Website
   npm install
   ```

2. **Environment Configuration**
   Create `.env.local` for development:
   ```env
   # Optional: FantasyPros API integration
   FANTASYPROS_API_KEY=your_key_here
   
   # Development URLs
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Server will start at `http://localhost:3000` with hot reload enabled.

### Development Workflow

**Branch Strategy:**
- `main` - Production branch (auto-deploys to Netlify)
- `develop` - Development integration branch
- `feature/*` - Feature development branches
- `hotfix/*` - Critical production fixes

**Commit Convention:**
```
feat: add new fantasy football tier visualization
fix: resolve mobile navigation overlay issue
docs: update API documentation
style: improve cyberpunk theme colors
refactor: optimize data clustering algorithm
test: add unit tests for data manager
```

## 🏗️ Code Architecture

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (routes)/          # Route groups
│   ├── api/               # API route handlers
│   ├── globals.css        # Global styles and CSS variables
│   └── layout.tsx         # Root layout component
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── forms/            # Form components
│   └── charts/           # Data visualization components
├── lib/                   # Utility functions and services
│   ├── api/              # API client functions
│   ├── data/             # Data processing utilities
│   └── utils/            # General utility functions
├── types/                 # TypeScript type definitions
├── constants/             # Application constants
├── hooks/                 # Custom React hooks
└── data/                  # Static data and fixtures
```

### Design Patterns

**Component Patterns:**
```typescript
// Use consistent prop interfaces
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

// Export typed components
export const Component: React.FC<ComponentProps> = ({ 
  className,
  children,
  variant = 'primary'
}) => {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
};
```

**State Management:**
- Local state: `useState` for component-level state
- Server state: Built-in Next.js data fetching
- Global state: Context API for theme and user preferences
- Form state: Controlled components with validation

**Error Handling:**
```typescript
// API routes
try {
  const result = await apiCall();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  );
}

// Components
const [error, setError] = useState<string>('');

useEffect(() => {
  fetchData().catch(err => {
    setError(err.message);
    console.error('Data fetch failed:', err);
  });
}, []);
```

## 🧩 Component System

### UI Component Library

**Base Components:**
- `GlassCard` - Glassmorphism container with elevation
- `MorphButton` - Animated button with cyberpunk styling
- `Heading` - Typography component with consistent styling
- `Badge` - Cyberpunk-styled labels and tags

**Composite Components:**
- `TerminalHero` - Home page terminal interface
- `TierChartEnhanced` - Interactive D3.js chart component
- `FloatingNav` - Persistent navigation overlay
- `CommandPalette` - Spotlight-style command interface

### Component Development Guidelines

**File Structure:**
```typescript
// Component file: Button.tsx
import { cn } from '@/lib/utils';

interface ButtonProps {
  // Props interface
}

export const Button: React.FC<ButtonProps> = (props) => {
  // Component implementation
};

// Export for use in other components
export default Button;
```

**Styling Conventions:**
```typescript
// Use Tailwind with conditional classes
const buttonStyles = cn(
  'base-button-styles',
  {
    'primary-styles': variant === 'primary',
    'secondary-styles': variant === 'secondary',
  },
  className
);
```

**Accessibility Requirements:**
- Include ARIA labels for interactive elements
- Ensure keyboard navigation support
- Use semantic HTML elements
- Provide focus indicators
- Support screen readers

## 🔌 API Development

### API Route Structure

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const param = searchParams.get('param');
    
    // Validation
    if (!param) {
      return NextResponse.json(
        { error: 'Parameter required' },
        { status: 400 }
      );
    }
    
    // Business logic
    const result = await processData(param);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Fantasy Football API Integration

**Data Manager API:**
- `GET /api/data-manager` - Retrieve stored player data
- `POST /api/data-manager` - Store player rankings
- `DELETE /api/data-manager` - Clear stored data

**FantasyPros Integration:**
- `POST /api/fantasy-pros-session` - Session-based authentication
- `GET /api/fantasy-pros-free` - Public rankings access
- `POST /api/fantasy-pros` - API key authentication

**Data Flow:**
1. Admin page initiates data fetch
2. API routes handle FantasyPros authentication
3. Player data is processed and stored
4. Frontend components retrieve and visualize data

## 🎨 Styling and Design

### Cyberpunk Theme Implementation

**CSS Custom Properties:**
```css
/* globals.css */
:root {
  /* Cyberpunk color palette */
  --electric-blue: #00F5FF;
  --matrix-green: #39FF14;
  --neon-purple: #BF00FF;
  
  /* Glassmorphism values */
  --glass-blur: blur(20px);
  --glass-opacity: 0.1;
  --glass-border: rgba(255, 255, 255, 0.2);
}
```

**Tailwind Configuration:**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'electric-blue': 'var(--electric-blue)',
        'matrix-green': 'var(--matrix-green)',
        'neon-purple': 'var(--neon-purple)',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
        'jetbrains': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'terminal-blink': 'blink 1s infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
      }
    }
  }
}
```

**Animation Patterns:**
```typescript
// Framer Motion configurations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
```

### Responsive Design Guidelines

**Breakpoints:**
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)
- `2xl`: 1536px (ultra-wide)

**Mobile-First Approach:**
```css
/* Default: mobile styles */
.component {
  @apply flex flex-col gap-4;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    @apply flex-row gap-8;
  }
}
```

## 🧪 Testing Guidelines

### Testing Strategy

**Unit Testing:**
- Component logic and utility functions
- API route handlers
- Data processing algorithms

**Integration Testing:**
- API endpoint functionality
- Component interaction workflows
- Data flow between services

**E2E Testing:**
- Critical user journeys
- Fantasy football data import/visualization
- Navigation and accessibility

### Testing Tools Setup

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# TypeScript support
npm install --save-dev @types/jest ts-jest
```

**Test Structure:**
```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## ⚡ Performance Optimization

### Next.js Optimizations

**Image Optimization:**
```tsx
import Image from 'next/image';

// Optimized images with proper sizing
<Image
  src="/images/hero.webp"
  alt="Portfolio hero"
  width={1200}
  height={800}
  priority // For above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

**Code Splitting:**
```typescript
// Dynamic imports for heavy components
const TierChartEnhanced = dynamic(
  () => import('@/components/TierChartEnhanced'),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false // Client-side only for D3.js
  }
);
```

**Bundle Analysis:**
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

### Data Fetching Optimization

**Server Components:**
```typescript
// app/page.tsx - Server Component
export default async function HomePage() {
  const data = await fetchStaticData(); // Runs on server
  
  return (
    <div>
      <StaticContent data={data} />
      <DynamicComponent /> {/* Client component */}
    </div>
  );
}
```

**Client-Side Caching:**
```typescript
// Custom hook with caching
export function usePlayerData(position: string) {
  return useSWR(
    `/api/data-manager?position=${position}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0
    }
  );
}
```

## 🐛 Debugging Tips

### Common Issues and Solutions

**1. FantasyPros Authentication Failures**
```typescript
// Debug CSRF token detection
console.log('Available patterns:', csrfPatternResults);
console.log('Found tokens:', tokenLikeStrings);

// Check cookie management
console.log('Cookies:', response.headers['set-cookie']);
```

**2. D3.js Chart Rendering Issues**
```typescript
// Ensure proper SVG dimensions
useEffect(() => {
  if (!svgRef.current) return;
  
  const svg = d3.select(svgRef.current);
  const { width, height } = svg.node().getBoundingClientRect();
  
  console.log('SVG dimensions:', { width, height });
}, []);
```

**3. Tailwind Styles Not Applying**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Verify Tailwind config
npx tailwindcss --init --dry-run
```

### Development Tools

**VS Code Configuration:**
```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

**Browser DevTools:**
- React Developer Tools
- Performance tab for optimization
- Network tab for API debugging
- Lighthouse for performance audits

### Logging Strategy

```typescript
// Development logging
const isDev = process.env.NODE_ENV === 'development';

const log = {
  info: (message: string, data?: any) => {
    if (isDev) console.log(`ℹ️ ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`❌ ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    if (isDev) console.warn(`⚠️ ${message}`, data);
  }
};
```

## 📚 Additional Resources

### External Documentation
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [D3.js Documentation](https://d3js.org/)

### Project-Specific Resources
- [CLAUDE.md](./CLAUDE.md) - Comprehensive application overview
- [API.md](./API.md) - API endpoint documentation
- [COMPONENTS.md](./COMPONENTS.md) - Component library guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

---

*This development guide is maintained alongside the project. For questions or suggestions, please open an issue or submit a pull request.*