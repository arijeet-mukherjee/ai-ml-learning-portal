"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import type { Chapter, SectionKind } from "@/types/content";
import { getModuleOf, getNeighbours } from "@/content/modules";
import ContentRenderer from "./ContentRenderer";
import ReadingProgress from "./ReadingProgress";
import Reveal from "./Reveal";
import { markVisited, setCompleted } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";

/** The pedagogy arc, labelled so the reader always knows where they are in it. */
const KIND_LABEL: Record<SectionKind, string> = {
  why: "Why",
  how: "How",
  when: "When",
  live: "Live example",
  real: "Real example",
  practice: "Practice project",
  recap: "Recap",
};

const KIND_COLOR: Record<SectionKind, string> = {
  why: "var(--accent)",
  how: "var(--accent-2)",
  when: "var(--danger)",
  live: "var(--violet)",
  real: "var(--good)",
  practice: "var(--warn)",
  recap: "var(--muted)",
};

export default function ChapterView({ chapter }: { chapter: Chapter }) {
  const mod = getModuleOf(chapter.slug);
  const { prev, next } = useMemo(() => getNeighbours(chapter.slug), [chapter.slug]);
  const { progress } = useProgress();
  const done = progress.chapters[chapter.slug]?.completed ?? false;

  useEffect(() => {
    markVisited(chapter.slug);
  }, [chapter.slug]);

  return (
    <article className="px-4 pt-8 pb-24 sm:px-6 lg:px-10">
      <ReadingProgress />

      <header className="mx-auto max-w-[var(--measure)]">
        {mod ? (
          <Link
            href={`/modules/${mod.id}`}
            className="font-mono text-[11.5px] uppercase tracking-[0.16em]"
            style={{ color: "var(--accent)" }}
          >
            M{mod.number} · {mod.title}
          </Link>
        ) : null}

        <h1 className="mt-2 text-[clamp(26px,4.4vw,40px)] leading-[1.12] font-semibold tracking-[-0.025em]">
          {chapter.title}
        </h1>
        <p className="mt-3 text-[17px]" style={{ color: "var(--muted)" }}>
          {chapter.description}
        </p>

        <div
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px]"
          style={{ color: "var(--muted-2)" }}
        >
          <span className="flex items-center gap-1.5">
            <Clock size={13} aria-hidden /> {chapter.estimatedMinutes} min
          </span>
          {chapter.islpChapters.length ? (
            <span>ISLP {chapter.islpChapters.join(", ")}</span>
          ) : null}
          {chapter.prerequisites.length ? (
            <span>
              after{" "}
              {chapter.prerequisites.map((p, i) => (
                <span key={p}>
                  {i ? ", " : ""}
                  <Link href={`/learn/${p}`} style={{ color: "var(--accent)" }}>
                    {p.replace(/-/g, " ")}
                  </Link>
                </span>
              ))}
            </span>
          ) : null}
        </div>
      </header>

      <div className="mx-auto mt-10 max-w-[var(--measure)]">
        {chapter.sections.map((section, i) => (
          <Reveal key={section.id} delay={i === 0 ? 0 : 0.03}>
            <section id={section.id} className="mb-14 scroll-mt-24">
              <div data-section-anchor className="mb-4">
                <span
                  className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: KIND_COLOR[section.kind] }}
                >
                  {KIND_LABEL[section.kind]}
                </span>
                <h2 className="mt-1 text-[24px] leading-tight font-semibold tracking-[-0.02em]">
                  {section.title}
                </h2>
              </div>
              <ContentRenderer blocks={section.blocks} />
            </section>
          </Reveal>
        ))}
      </div>

      <div className="mx-auto max-w-[var(--measure)]">
        <div className="rule mb-6" />

        <button
          type="button"
          onClick={() => setCompleted(chapter.slug, !done)}
          className="flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors"
          style={{
            borderColor: done ? "var(--good)" : "var(--line-strong)",
            background: done ? "var(--good-soft)" : "transparent",
            color: done ? "var(--good)" : "var(--muted)",
          }}
        >
          <Check size={15} aria-hidden />
          {done ? "Marked as done" : "Mark this chapter done"}
        </button>

        <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Chapter navigation">
          {prev ? (
            <Link
              href={`/learn/${prev.slug}`}
              className="panel group px-4 py-3 transition-colors"
              style={{ background: "var(--panel)" }}
            >
              <span
                className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]"
                style={{ color: "var(--muted-2)" }}
              >
                <ArrowLeft size={12} aria-hidden /> Previous
              </span>
              <span className="mt-1 block text-[15px] font-medium group-hover:underline">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/learn/${next.slug}`}
              className="panel group px-4 py-3 text-right transition-colors"
              style={{ background: "var(--panel)" }}
            >
              <span
                className="flex items-center justify-end gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]"
                style={{ color: "var(--muted-2)" }}
              >
                Next <ArrowRight size={12} aria-hidden />
              </span>
              <span className="mt-1 block text-[15px] font-medium group-hover:underline">
                {next.title}
              </span>
            </Link>
          ) : null}
        </nav>

        <p className="mt-8 text-[12.5px]" style={{ color: "var(--muted-2)" }}>
          Built from: {chapter.sourceRefs.join(" · ")}
        </p>
      </div>
    </article>
  );
}
