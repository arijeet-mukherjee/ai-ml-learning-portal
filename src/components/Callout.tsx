"use client";

import type { ReactNode } from "react";

/**
 * The boxed asides the professor uses in his notebook, one component with a tone
 * per variant so they stay visually consistent across every chapter.
 */
export type Tone = "hook" | "trap" | "world" | "genai" | "fix" | "graded" | "cite";

const TONE: Record<Tone, { label: string; color: string; soft: string }> = {
  hook: { label: "Memory hook", color: "var(--accent)", soft: "var(--accent-soft)" },
  trap: { label: "Trap", color: "var(--danger)", soft: "var(--danger-soft)" },
  world: { label: "In the world", color: "var(--good)", soft: "var(--good-soft)" },
  genai: { label: "Inside Gen AI", color: "var(--violet)", soft: "var(--violet-soft)" },
  fix: { label: "Slide correction", color: "var(--warn)", soft: "var(--warn-soft)" },
  graded: { label: "Graded detail", color: "var(--warn)", soft: "var(--warn-soft)" },
  cite: { label: "Further reading", color: "var(--accent-2)", soft: "var(--accent-2-soft)" },
};

export default function Callout({
  tone,
  children,
  label,
}: {
  tone: Tone;
  children: ReactNode;
  label?: string;
}) {
  const t = TONE[tone];
  return (
    <aside
      className="my-5 rounded-[var(--radius)] border px-4 py-3.5"
      style={{
        borderColor: "var(--line)",
        background: t.soft,
        borderLeft: `3px solid ${t.color}`,
      }}
    >
      <span
        className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: t.color }}
      >
        {label ?? t.label}
      </span>
      <div className="text-[15.5px] leading-[1.68]">{children}</div>
    </aside>
  );
}
