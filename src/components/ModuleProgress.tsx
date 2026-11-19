"use client";

import { getModule } from "@/content/modules";
import { useProgress } from "@/lib/useProgress";

export default function ModuleProgress({ moduleId }: { moduleId: string }) {
  const { progress, ready } = useProgress();
  const mod = getModule(moduleId);
  if (!ready || !mod || !mod.chapters.length) return null;

  const done = mod.chapters.filter((c) => progress.chapters[c.slug]?.completed).length;
  const pct = (done / mod.chapters.length) * 100;

  return (
    <div className="mt-6 max-w-[var(--measure)]">
      <div className="flex items-baseline justify-between text-[12.5px]">
        <span style={{ color: "var(--muted-2)" }}>
          {done} of {mod.chapters.length} chapters done
        </span>
        <span className="font-mono" style={{ color: "var(--good)" }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="mt-1.5 h-[4px] overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--good))" }}
        />
      </div>
    </div>
  );
}
