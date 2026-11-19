"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

/**
 * Both icons are always rendered and CSS picks one from the `data-theme`
 * attribute, so there is no mounted flag and no hydration mismatch to guard.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle dark and light theme"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors"
      style={{ width: 36, height: 36, minWidth: 36, maxWidth: 36, borderColor: "var(--line)", color: "var(--muted)" }}
    >
      <Sun size={16} aria-hidden className="h-4 w-4 shrink-0 dark-only" />
      <Moon size={16} aria-hidden className="h-4 w-4 shrink-0 light-only" />
    </button>
  );
}
