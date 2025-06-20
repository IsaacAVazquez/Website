"use client";
import { useEffect, useState } from "react";

export const DarkModeToggle = () => {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    if (dark === null) return;
    const newDark = !dark;
    setDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  if (dark === null) return null; // Prevent hydration mismatch

  return (
    <button
      aria-label="Toggle dark mode"
      className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
      onClick={toggleTheme}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
};
