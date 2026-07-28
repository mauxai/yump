"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.dataset.theme !== "light");
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-line text-fg-2 hover:text-fg-0 hover:bg-bg-2 transition-colors"
      suppressHydrationWarning
    >
      {isDark === null ? null : <Icon name={isDark ? "sun" : "moon"} size={15} />}
    </button>
  );
}
