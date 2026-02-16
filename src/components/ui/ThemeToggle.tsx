"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSun, IconMoon } from "@tabler/icons-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Wait until mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Prevent flash of incorrect theme
  if (!mounted) {
    return (
      <div className="p-3 rounded-xl min-w-[44px] min-h-[44px]" aria-hidden="true" />
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-3 rounded-xl transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B4F3D] dark:text-[#D4A88E] hover:text-[#FF6B35] dark:hover:text-[#FF8E53]"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-live="polite"
    >
      {/* Icon with smooth rotation animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 180, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative z-10"
        >
          {theme === "light" ? (
            <IconSun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <IconMoon className="h-5 w-5" aria-hidden="true" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Subtle glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-[#FF6B35]/10 dark:bg-[#FF8E53]/20 blur-md opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}
