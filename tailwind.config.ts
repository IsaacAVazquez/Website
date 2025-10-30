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
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        // 2025: Semantic color system with contextual naming
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        tertiary: "var(--color-tertiary)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",

        // Neutral scale
        neutral: {
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
          950: "var(--neutral-950)",
        },

        // Semantic surfaces
        surface: {
          primary: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
          elevated: "var(--surface-elevated)",
          overlay: "var(--surface-overlay)",
        },

        // Legacy support - backwards compatible
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

        // Vivid color aliases for components
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
        'glow-blue': 'var(--glow-blue)',
        'glow-teal': 'var(--glow-teal)',
        'glow-purple': 'var(--glow-purple)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
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
