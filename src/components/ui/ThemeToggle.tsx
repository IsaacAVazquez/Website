"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const currentTheme = resolvedTheme || theme || "light"
  const isDarkMode = currentTheme === "dark"
  const nextTheme = isDarkMode ? "light" : "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className={cn(
        "relative inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-ink)]",
        className
      )}
      aria-label={`Theme: ${currentTheme}. Switch to ${nextTheme}.`}
      title={`Switch to ${nextTheme} theme`}
    >
      <span className="relative block h-5 w-5" aria-hidden="true">
        <Sun
          className={`absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ${
            isDarkMode ? "scale-0 rotate-90" : "scale-100 rotate-0"
          }`}
        />
        <Moon
          className={`absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ${
            isDarkMode ? "scale-100 rotate-0" : "scale-0 -rotate-90"
          }`}
        />
      </span>
      <span className="sr-only">Cycle theme preference</span>
    </button>
  )
}
