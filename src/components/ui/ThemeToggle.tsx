"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSun, IconMoon } from "@tabler/icons-react";

const themes = ["light", "dark", "system"] as const;
export type ThemeOption = typeof themes[number];

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeOption>("system");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait until mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme") as ThemeOption | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme || "system";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    if (initialTheme === "dark" || (initialTheme === "system" && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", event.matches);
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const updateTheme = (nextTheme: ThemeOption) => {
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    setMenuOpen(false);
    document.documentElement.dataset.theme = nextTheme;

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = nextTheme === "dark" || (nextTheme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  };

  // Prevent flash of incorrect theme
  if (!mounted) {
    return (
      <div className="p-3 rounded-xl min-w-[44px] min-h-[44px]" aria-hidden="true" />
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setMenuOpen((prev) => !prev)}
        className="relative p-3 rounded-xl transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B4F3D] dark:text-[#D4A88E] hover:text-[#FF6B35] dark:hover:text-[#FF8E53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Select theme (current: ${theme})`}
        aria-expanded={menuOpen}
        aria-controls="theme-menu"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 180, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative z-10"
          >
            {theme === "dark" ? (
              <IconMoon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <IconSun className="h-5 w-5" aria-hidden="true" />
            )}
          </motion.div>
        </AnimatePresence>
        <motion.div
          className="absolute inset-0 rounded-xl bg-[#FF6B35]/10 dark:bg-[#FF8E53]/20 blur-md opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <motion.ul
            id="theme-menu"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-36 rounded-lg bg-white dark:bg-[#2D1B12] border border-[#FFE4D6] dark:border-[#FF8E53]/30 shadow-xl z-20 overflow-hidden"
            role="menu"
          >
            {themes.map((option) => (
              <li key={option} role="menuitem">
                <button
                  onClick={() => updateTheme(option)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    theme === option
                      ? "text-[#FF6B35] dark:text-[#FF8E53] bg-[#FFF5EF] dark:bg-[#4A3426]"
                      : "text-[#4A3426] dark:text-[#D4A88E] hover:bg-[#FFF8F0] dark:hover:bg-[#4A3426]/60"
                  }`}
                >
                  {option === "system" ? "System Default" : `Use ${option} mode`}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
