import type { Config } from "tailwindcss" with { "resolution-mode": "import" };
// flattenColorPalette is not exported publicly by Tailwind, so we define it here
function flattenColorPalette(colors: Record<string, any>, target: Record<string, any> = {}, prefix = ""): Record<string, any> {
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === "object" && value !== null) {
      flattenColorPalette(value, target, prefix ? `${prefix}-${key}` : key);
    } else {
      target[prefix ? `${prefix}-${key}` : key] = value;
    }
  }
  return target;
}

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-orbitron)", "system-ui", "sans-serif"],
        accent: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
        '6xl': 'var(--text-6xl)',
        '7xl': 'var(--text-7xl)',
        // Editorial oversized display fonts
        'display-sm': 'var(--text-display-sm)',
        'display-md': 'var(--text-display-md)',
        'display-lg': 'var(--text-display-lg)',
        'display-xl': 'var(--text-display-xl)',
        'display-xxl': 'var(--text-display-xxl)',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        // Mouthwash Studio Monochrome Color System
        primary: "var(--color-primary)",      // Pure black (#000000)
        secondary: "var(--color-secondary)",  // Pure white (#FFFFFF)
        accent: "var(--color-accent)",        // Mid grey (#9C9C9C)
        tertiary: "var(--color-tertiary)",    // Dark grey (#5B5B5B)
        warning: "var(--color-warning)",      // Very dark grey (#181818)
        error: "var(--color-error)",          // Pure black (#000000)

        // Mouthwash Monochrome Neutral Scale
        neutral: {
          50: "var(--neutral-50)",    // Pure white (#FFFFFF)
          100: "var(--neutral-100)",  // Near white (#FAFAFA)
          200: "var(--neutral-200)",  // Light grey (#D0D0D0)
          300: "var(--neutral-300)",  // Medium light grey (#A1A1A1)
          400: "var(--neutral-400)",  // Mid grey (#9C9C9C)
          500: "var(--neutral-500)",  // Dark grey (#5B5B5B)
          600: "var(--neutral-600)",  // Very dark grey (#181818)
          700: "var(--neutral-700)",  // Near black (#111111)
          800: "var(--neutral-800)",  // Darker black (#0A0A0A)
          900: "var(--neutral-900)",  // Pure black (#000000)
          950: "var(--neutral-950)",  // Pure black (#000000)
        },

        // Semantic surfaces
        surface: {
          primary: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
          elevated: "var(--surface-elevated)",
          overlay: "var(--surface-overlay)",
        },

        // Legacy support - backwards compatible (now monochrome)
        "electric-blue": "var(--electric-blue)",
        "matrix-green": "var(--matrix-green)",
        "warning-amber": "var(--warning-amber)",
        "error-red": "var(--error-red)",
        "neon-purple": "var(--neon-purple)",
        "cyber-teal": "var(--cyber-teal)",
        "terminal-bg": "var(--terminal-bg)",
        "terminal-border": "var(--terminal-border)",
        "terminal-text": "var(--terminal-text)",
        "terminal-cursor": "var(--terminal-cursor)",

        // Vivid color aliases (now monochrome)
        "vivid-blue": "var(--vivid-blue)",
        "vivid-teal": "var(--vivid-teal)",
        "vivid-purple": "var(--vivid-purple)",
        "vivid-pink": "var(--vivid-pink)",
        "vivid-yellow": "var(--vivid-yellow)",
        "vivid-green": "var(--vivid-green)",
      },
      spacing: {
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        "2xl": "var(--space-2xl)",
        "3xl": "var(--space-3xl)",
        "4xl": "var(--space-4xl)",
      },
      boxShadow: {
        // Mouthwash Studio Ultra Subtle Shadows
        'subtle': 'var(--shadow-subtle)',         // 0 1px 2px rgba(0,0,0,0.03)
        'elevated': 'var(--shadow-elevated)',     // 0 4px 8px rgba(0,0,0,0.06)
        'primary': 'var(--shadow-primary)',       // 0 1px 2px rgba(0,0,0,0.04)
        'secondary': 'var(--shadow-secondary)',   // 0 2px 4px rgba(0,0,0,0.04)
        'accent': 'var(--shadow-accent)',         // 0 1px 2px rgba(0,0,0,0.06)
        'warm-lg': 'var(--shadow-warm-lg)',       // 0 4px 8px rgba(0,0,0,0.05)
        'warm-xl': 'var(--shadow-warm-xl)',       // 0 8px 16px rgba(0,0,0,0.06)
        // Legacy glow support (now maps to monochrome shadows)
        'glow-blue': 'var(--glow-primary)',
        'glow-teal': 'var(--glow-secondary)',
        'glow-purple': 'var(--glow-accent)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'skeleton-loading': 'skeleton-loading 1.5s ease-in-out infinite',
        'slide-in-up': 'slide-in-up 0.3s ease',
        'shake': 'shake 0.3s cubic-bezier(.36,.07,.19,.97)',
        'spinner-rotate': 'spinner-rotate 0.75s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'skeleton-loading': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'slide-in-up': {
          'from': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        'spinner-rotate': {
          'to': { transform: 'rotate(360deg)' },
        },
      },
      transitionDuration: {
        '0': '0ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), addVariablesForColors],
} satisfies Config;

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}

export default config;
