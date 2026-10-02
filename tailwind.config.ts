import type { Config } from "tailwindcss" with { "resolution-mode": "import" };

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      // Fallbacks inside the var() keep .font-sans/.font-mono resolving where
      // next/font is absent.
      fontFamily: {
        sans: ['var(--font-instrument-sans, "Instrument Sans")', "system-ui", "sans-serif"],
        mono: ['var(--font-fragment-mono, "Fragment Mono")', "ui-monospace", "monospace"],
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
      /*
       * Do NOT map the --space-* tokens onto `spacing` here. Under Tailwind
       * v4's @config compat, spacing suffixes shadow the sizing scale, so
       * `spacing.md` would silently turn every `max-w-md` (28rem) into 1rem
       * site-wide. Band and block spacing comes from the --c97-sp-* ladder in
       * catalog97.css instead.
       */
      /*
       * Catalog 97 draws no rounded corners and no blurred shadows, so the
       * radius and shadow scales compile to nothing here rather than through a
       * token. That holds on every route and outside the page root too, and a
       * stray rounded-lg or shadow-sm left in markup paints square and flat.
       * The printed offset shadow is the one exception and lives in
       * catalog97.css as .c97-offset.
       */
      borderRadius: {
        DEFAULT: '0',
        xs: '0',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        '4xl': '0',
        full: '0',
      },
      boxShadow: {
        DEFAULT: 'none',
        '2xs': 'none',
        xs: 'none',
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
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
} satisfies Config;

export default config;
