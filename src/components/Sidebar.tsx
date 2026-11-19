"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { modules } from "@/content/modules";
import { useProgress } from "@/lib/useProgress";

/**
 * Module → chapter navigation with per-module completion. Rendered inside a
 * <nav> in AppShell; on narrow screens AppShell hides it behind a drawer.
 */
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { progress } = useProgress();

  return (
    <nav aria-label="Course contents" className="pb-16">
      {modules.map((m) => {
        const done = m.chapters.filter(
          (c) => progress.chapters[c.slug]?.completed,
        ).length;
        const pct = m.chapters.length ? (done / m.chapters.length) * 100 : 0;
        const moduleActive = pathname?.startsWith(`/modules/${m.id}`);

        return (
          <div key={m.id} className="mb-5">
            <Link
              href={`/modules/${m.id}`}
              onClick={onNavigate}
              className="group flex items-baseline gap-2 px-3"
            >
              <span
                className="font-mono text-[11px] tabular-nums"
                style={{ color: moduleActive ? "var(--accent)" : "var(--muted-2)" }}
              >
                M{m.number}
              </span>
              <span
                className="text-[13px] leading-snug font-semibold tracking-[-0.01em] group-hover:underline"
                style={{ color: moduleActive ? "var(--accent)" : "var(--text)" }}
              >
                {m.title}
              </span>
            </Link>

            <div className="mx-3 mt-1.5 h-[3px] overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, background: "var(--accent)" }}
              />
            </div>

            {m.chapters.length ? (
              <ul className="mt-1.5">
                {m.chapters.map((c) => {
                  const active = pathname === `/learn/${c.slug}` || pathname === `/learn/${c.slug}/`;
                  const complete = progress.chapters[c.slug]?.completed;
                  const visited = progress.chapters[c.slug]?.visited;
                  return (
                    <li key={c.slug}>
                      <Link
                        href={`/learn/${c.slug}`}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className="flex items-center gap-2 rounded-md px-3 py-[7px] text-[13.5px] transition-colors"
                        style={{
                          background: active ? "var(--accent-soft)" : "transparent",
                          color: active
                            ? "var(--text)"
                            : visited
                              ? "var(--muted)"
                              : "var(--muted-2)",
                          boxShadow: active ? "inset 2px 0 0 var(--accent)" : undefined,
                        }}
                      >
                        <span
                          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                          style={{
                            width: 16, height: 16, minWidth: 16, maxWidth: 16,
                            borderColor: complete ? "var(--good)" : "var(--line-strong)",
                            background: complete ? "var(--good-soft)" : "transparent",
                          }}
                          aria-hidden
                        >
                          {complete ? <Check size={10} style={{ color: "var(--good)" }} /> : null}
                        </span>
                        <span className="truncate">{c.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1.5 px-3 text-[12.5px]" style={{ color: "var(--muted-2)" }}>
                Chapters coming — see ADDING_NEW_MODULES.md
              </p>
            )}
          </div>
        );
      })}
    </nav>
  );
}
