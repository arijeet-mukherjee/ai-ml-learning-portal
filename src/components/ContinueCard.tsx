"use client";

import Link from "next/link";
import { BookOpen, RotateCcw } from "lucide-react";
import { allChapters, getChapter, totalChapters } from "@/content/modules";
import { resetProgress } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";

/** "Continue where you left off", plus the only place progress can be cleared. */
export default function ContinueCard() {
  const { progress, ready } = useProgress();

  if (!ready) return null;

  const completed = allChapters.filter((c) => progress.chapters[c.slug]?.completed).length;
  const last = progress.lastSlug ? getChapter(progress.lastSlug) : undefined;
  const nothingYet = !last && completed === 0;

  return (
    <section
      className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[var(--radius)] border px-5 py-4"
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
    >
      <BookOpen size={18} aria-hidden style={{ color: "var(--accent)" }} />

      {nothingYet ? (
        <p className="text-[15px]" style={{ color: "var(--muted)" }}>
          Nothing read yet — start at{" "}
          <Link href={`/learn/${allChapters[0]?.slug ?? ""}`} style={{ color: "var(--accent)" }}>
            {allChapters[0]?.title}
          </Link>
          .
        </p>
      ) : (
        <div className="min-w-0">
          <p className="text-[12.5px]" style={{ color: "var(--muted-2)" }}>
            {completed} of {totalChapters} chapters done
          </p>
          {last ? (
            <Link
              href={`/learn/${last.slug}`}
              className="text-[16px] font-medium hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Continue: {last.title} →
            </Link>
          ) : null}
        </div>
      )}

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => {
          if (window.confirm("Clear all reading progress on this device?")) resetProgress();
        }}
        className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12.5px]"
        style={{ borderColor: "var(--line-strong)", color: "var(--muted-2)" }}
      >
        <RotateCcw size={12} aria-hidden /> Reset progress
      </button>
    </section>
  );
}
