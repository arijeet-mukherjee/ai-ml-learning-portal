"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { SITE } from "@/lib/site";

export default function Header({
  onMenu,
  onSearch,
}: {
  onMenu: () => void;
  onSearch: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-xl"
      style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--ink) 86%, transparent)" }}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-4">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open course contents"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md lg:hidden"
          style={{ width: 36, height: 36, minWidth: 36, maxWidth: 36, color: "var(--muted)" }}
        >
          <Menu size={18} aria-hidden />
        </button>

        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[14px] leading-none font-bold"
            style={{ width: 28, height: 28, minWidth: 28, maxWidth: 28, background: "var(--accent-soft)", color: "var(--accent)" }}
            aria-hidden
          >
            {SITE.mark}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] leading-tight font-semibold tracking-[-0.01em]">
              {SITE.name}
            </span>
            <span
              className="hidden truncate text-[11.5px] leading-tight sm:block"
              style={{ color: "var(--muted-2)" }}
            >
              {SITE.tagline}
            </span>
          </span>
        </Link>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onSearch}
          className="flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-[13px] leading-none transition-colors"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          <Search size={14} aria-hidden className="shrink-0" />
          <span className="hidden sm:inline">Search</span>
          <kbd
            className="hidden rounded px-1.5 py-0.5 font-mono text-[10.5px] sm:inline"
            style={{ background: "var(--panel-2)", color: "var(--muted-2)" }}
          >
            ⌘K
          </kbd>
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
