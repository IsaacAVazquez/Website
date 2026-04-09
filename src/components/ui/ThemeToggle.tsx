"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const currentTheme = resolvedTheme || theme || "light"
  const isDarkMode = currentTheme === "dark"
  const nextTheme = isDarkMode ? "light" : "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-ink)]"
      aria-label={`Theme: ${currentTheme}. Switch to ${nextTheme}.`}
      title={`Switch to ${nextTheme} theme`}
    >
      <Sun
        className={`h-5 w-5 transition-transform duration-200 ${
          isDarkMode ? "scale-0 rotate-90" : "scale-100 rotate-0"
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-transform duration-200 ${
          isDarkMode ? "scale-100 rotate-0" : "scale-0 -rotate-90"
        }`}
      />
      <span className="sr-only">Cycle theme preference</span>
    </button>
  )
}
