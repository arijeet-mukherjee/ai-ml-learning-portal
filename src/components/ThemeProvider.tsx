"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";

/**
 * The theme lives on `<html data-theme>`. A tiny script in the root layout
 * (injected by next/script before hydration, never rendered by React) sets it
 * from localStorage before first paint, so there is no flash and no
 * `<script>` inside a React component.
 *
 * This replaces next-themes, whose inline script React 19 warns about whenever
 * the tree has to be client-rendered (for example after a hydration mismatch
 * caused by a browser extension).
 */
import { THEME_KEY, type Theme } from "@/lib/theme";

function read(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

export function useTheme() {
  const resolvedTheme = useSyncExternalStore<Theme>(subscribe, read, () => "dark");

  const setTheme = useCallback((t: Theme) => {
    const root = document.documentElement;
    // Same effect as next-themes' disableTransitionOnChange.
    const css = document.createElement("style");
    css.textContent = "*,*::before,*::after{transition:none!important}";
    document.head.appendChild(css);
    root.setAttribute("data-theme", t);
    root.style.colorScheme = t;
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* private mode: the theme just won't persist */
    }
    void window.getComputedStyle(document.body).opacity;
    requestAnimationFrame(() => css.remove());
  }, []);

  return { resolvedTheme, setTheme };
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
