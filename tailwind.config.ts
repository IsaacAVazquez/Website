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
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: "var(--neutral-700)",
        secondary: "var(--neutral-500)",
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
