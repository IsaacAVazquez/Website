"use client";
import { useEffect, useState } from "react";

export const DarkModeToggle = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setDark(true);
    }
  }, []);

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
