# Component Library Documentation

This document provides comprehensive documentation for the UI component library and design system used in the Isaac Vazquez Portfolio project.

## 📋 Table of Contents

- [Design System Overview](#design-system-overview)
- [Base Components](#base-components)
- [Layout Components](#layout-components)
- [Navigation Components](#navigation-components)
- [Portfolio Components](#portfolio-components)
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
    { id: 'resume', label: 'View Resume', action: () => router.push('/resume') },
    { id: 'contact', label: 'Contact Me', action: () => router.push('/contact') },
    { id: 'github', label: 'Open GitHub', action: () => window.open('https://github.com/IsaacAVazquez', '_blank') },
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

## 💼 Portfolio Components

### ProjectDetailModal

Interactive modal component for displaying detailed project information.

```typescript
interface ProjectDetailModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  className = ''
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn(
              'relative max-w-4xl w-full max-h-[90vh] overflow-auto',
              'glass-4 rounded-lg border border-white/20',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900/90 backdrop-blur-sm p-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <Heading level={2} variant="gradient">
                    {project.title}
                  </Heading>
                  <p className="text-gray-400 mt-2">{project.description}</p>
                </div>
                <MorphButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-4"
                >
                  ✕
                </MorphButton>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Project Screenshot */}
              {project.image && (
                <div className="rounded-lg overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    width={800}
                    height={400}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              )}

              {/* Technologies */}
              <div>
                <Heading level={3} className="mb-3">Technologies Used</Heading>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} variant="info" size="sm">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Key Features */}
              <div>
                <Heading level={3} className="mb-3">Key Features</Heading>
                <ul className="space-y-2">
                  {project.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-electric-blue mt-1">•</span>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Links */}
              <div className="flex space-x-4">
                {project.liveUrl && (
                  <MorphButton
                    variant="primary"
                    onClick={() => window.open(project.liveUrl, '_blank')}
                  >
                    View Live Site
                  </MorphButton>
                )}
                {project.githubUrl && (
                  <MorphButton
                    variant="ghost"
                    onClick={() => window.open(project.githubUrl, '_blank')}
                  >
                    View Code
                  </MorphButton>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### LazyQADashboard

Performance-optimized QA metrics dashboard with lazy loading.

```typescript
interface QAMetric {
  label: string;
  value: number;
  unit: string;
  change: number;
  color: string;
}

export const LazyQADashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<QAMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mockMetrics: QAMetric[] = [
    { label: 'Tests Executed', value: 1247, unit: '', change: 12, color: 'electric-blue' },
    { label: 'Bug Detection Rate', value: 94.2, unit: '%', change: 3.1, color: 'matrix-green' },
    { label: 'Automation Coverage', value: 87.5, unit: '%', change: 5.2, color: 'neon-purple' },
    { label: 'Performance Score', value: 98.1, unit: '', change: 2.8, color: 'warning-amber' }
  ];

  useEffect(() => {
    // Simulate loading delay for demonstration
    const timer = setTimeout(() => {
      setMetrics(mockMetrics);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Heading level={2} variant="gradient">
        QA Engineering Metrics
      </Heading>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard elevation={2} hover className="p-4 h-32">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <h4 className="text-sm text-gray-400 font-medium">
                    {metric.label}
                  </h4>
                  <div className="flex items-baseline space-x-1 mt-2">
                    <span className={`text-2xl font-bold text-${metric.color}`}>
                      {metric.value.toLocaleString()}
                    </span>
                    {metric.unit && (
                      <span className="text-sm text-gray-500">{metric.unit}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <span className={`text-xs ${metric.change > 0 ? 'text-matrix-green' : 'text-error-red'}`}>
                    {metric.change > 0 ? '↗' : '↘'} {Math.abs(metric.change)}%
                  </span>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Mini Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <GlassCard elevation={3} className="p-6">
          <Heading level={3} className="mb-4">Testing Automation Trends</Heading>
          <div className="h-32 bg-gray-800 rounded flex items-center justify-center">
            <span className="text-gray-500">Interactive Chart Placeholder</span>
          </div>
        </GlassCard>
        
        <GlassCard elevation={3} className="p-6">
          <Heading level={3} className="mb-4">Bug Resolution Timeline</Heading>
          <div className="h-32 bg-gray-800 rounded flex items-center justify-center">
            <span className="text-gray-500">Timeline Chart Placeholder</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
```

## 📋 Form Components

### ContactForm

Professional contact form component with validation and cyberpunk styling.

```typescript
interface ContactFormProps {
  onSubmit: (data: ContactFormData) => void;
  isLoading?: boolean;
  className?: string;
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  isLoading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <GlassCard elevation={3} className={cn('p-6', className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Heading level={2} variant="gradient" className="mb-6">
          Get In Touch
        </Heading>

        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={cn(
              'w-full px-4 py-3 rounded-lg bg-gray-900/50 border',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-electric-blue/50',
              'transition-all duration-200',
              errors.name 
                ? 'border-error-red' 
                : 'border-gray-700 hover:border-gray-600'
            )}
            placeholder="Your name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-error-red">{errors.name}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={cn(
              'w-full px-4 py-3 rounded-lg bg-gray-900/50 border',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-electric-blue/50',
              'transition-all duration-200',
              errors.email 
                ? 'border-error-red' 
                : 'border-gray-700 hover:border-gray-600'
            )}
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error-red">{errors.email}</p>
          )}
        </div>

        {/* Subject Field */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Subject *
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            className={cn(
              'w-full px-4 py-3 rounded-lg bg-gray-900/50 border',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-electric-blue/50',
              'transition-all duration-200',
              errors.subject 
                ? 'border-error-red' 
                : 'border-gray-700 hover:border-gray-600'
            )}
            placeholder="Project inquiry, collaboration, etc."
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-error-red">{errors.subject}</p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Message *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            rows={5}
            className={cn(
              'w-full px-4 py-3 rounded-lg bg-gray-900/50 border',
              'text-white placeholder-gray-500 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-electric-blue/50',
              'transition-all duration-200',
              errors.message 
                ? 'border-error-red' 
                : 'border-gray-700 hover:border-gray-600'
            )}
            placeholder="Tell me about your project or how we can work together..."
          />
          {errors.message && (
            <p className="mt-1 text-sm text-error-red">{errors.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <MorphButton
          type="submit"
          variant="primary"
          size="lg"
          disabled={isLoading}
          className="w-full"
          glow
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Sending...</span>
            </div>
          ) : (
            'Send Message'
          )}
        </MorphButton>
      </form>
    </GlassCard>
  );
};
```

### SearchInput

Advanced search input component with filtering capabilities.

```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  suggestions = [],
  onSuggestionSelect,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    setShowSuggestions(isFocused && value.length > 0 && filteredSuggestions.length > 0);
  }, [isFocused, value, filteredSuggestions.length]);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          className={cn(
            'w-full pl-10 pr-4 py-3 rounded-lg',
            'bg-gray-900/50 border border-gray-700',
            'text-white placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-electric-blue/50',
            'focus:border-electric-blue/50',
            'transition-all duration-200'
          )}
          placeholder={placeholder}
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <SearchIcon className="w-5 h-5 text-gray-500" />
        </div>

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-3 rounded-lg border border-white/10 max-h-60 overflow-y-auto z-10">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                onChange(suggestion);
                onSuggestionSelect?.(suggestion);
                setIsFocused(false);
              }}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
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
    Project Showcase
  </Heading>
  <div className="space-y-4">
    <SearchInput 
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder="Search projects..."
    />
    <ProjectGrid 
      projects={filteredProjects}
      onProjectSelect={setSelectedProject}
    />
  </div>
</GlassCard>

// ❌ Avoid - Monolithic components
<ProjectWidget projects={projects} searchTerm={searchTerm} selectedProject={selectedProject} />
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
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

### External References
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Accessibility Guidelines](https://reactjs.org/docs/accessibility.html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

*This component library documentation is maintained alongside the design system. For component updates and new additions, see [CHANGELOG.md](./CHANGELOG.md).*