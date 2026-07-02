import type { Config } from "tailwindcss" with { "resolution-mode": "import" };

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-instrument-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-fragment-mono)", "ui-monospace", "monospace"],
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
      },
      colors: {
        primary: "var(--home-signal)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        success: "var(--color-success)",
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
        surface: {
          primary: "var(--home-paper)",
          secondary: "var(--home-paper-alt)",
          elevated: "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
          overlay: "var(--surface-overlay)",
        },
      },
      textColor: {
        "theme-primary": "var(--home-ink)",
        "theme-secondary": "var(--home-ink-muted)",
        "theme-tertiary": "color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))",
        "theme-inverse": "var(--text-inverse)",
      },
      borderColor: {
        "theme-primary": "var(--home-rule)",
        "theme-secondary": "var(--border-secondary)",
        "theme-accent": "var(--border-accent)",
      },
      /*
       * Do NOT map the --space-* tokens onto `spacing` here. Under Tailwind
       * v4's @config compat, spacing suffixes shadow the sizing scale, so
       * `spacing.md` would silently turn every `max-w-md` (28rem) into 1rem
       * site-wide. The --space-* variables remain available in CSS directly.
       */
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
      animation: {
        'skeleton-loading': 'skeleton-loading 1.5s ease-in-out infinite',
        'slide-in-up': 'slide-in-up 0.3s ease',
        'shake': 'shake 0.3s cubic-bezier(.36,.07,.19,.97)',
        'spinner-rotate': 'spinner-rotate 0.75s linear infinite',
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
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
} satisfies Config;

export default config;
