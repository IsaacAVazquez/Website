"use client";
import { useEffect, useState } from "react";

export const DarkModeToggle = () => {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    // On mount, check localStorage or system preference
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setDark(true);
    } else if (stored === "light") {
      setDark(false);
    } else {
      // Fallback to system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (dark === null) return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  if (dark === null) return null; // Prevent hydration mismatch

  return (
    <button
      aria-label="Toggle dark mode"
      className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
      onClick={() => setDark(!dark)}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
};
