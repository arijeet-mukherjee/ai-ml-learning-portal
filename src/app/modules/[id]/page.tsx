import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import ModuleHero from "@/components/ModuleHero";
import Reveal from "@/components/Reveal";
import ModuleProgress from "@/components/ModuleProgress";
import { LAB_LIST } from "@/lib/labs";
import { DATASET_LIST } from "@/lib/datasets";
import { getModule, modules } from "@/content/modules";

export function generateStaticParams() {
  return modules.map((m) => ({ id: m.id }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = getModule(id);
  if (!m) return { title: "Not found" };
  return { title: `M${m.number} · ${m.title}`, description: m.tagline };
}

export default async function ModulePage({ params }: Props) {
  const { id } = await params;
  const mod = getModule(id);
  if (!mod) notFound();

  const labs = LAB_LIST.filter((l) => l.moduleId === mod.id);
  const datasets = DATASET_LIST.filter((d) => d.moduleId === mod.id);
  const minutes = mod.chapters.reduce((a, c) => a + c.estimatedMinutes, 0);

  return (
    <div className="px-4 pt-8 pb-24 sm:px-6 lg:px-10">
      <ModuleHero motif={mod.motif} height={190} />

      <header className="mt-6 max-w-[var(--measure)]">
        <p
          className="font-mono text-[11.5px] uppercase tracking-[0.18em]"
          style={{ color: "var(--accent)" }}
        >
          Module {mod.number} · {mod.date} · {mod.who}
        </p>
        <h1 className="mt-2 text-[clamp(27px,5vw,42px)] leading-[1.1] font-semibold tracking-[-0.03em]">
          {mod.title}
        </h1>
        <p className="mt-3 text-[17.5px]" style={{ color: "var(--muted)" }}>
          {mod.tagline}
        </p>
        <p
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]"
          style={{ color: "var(--muted-2)" }}
        >
          <span className="flex items-center gap-1.5">
            <Clock size={13} aria-hidden /> {minutes} min of reading
          </span>
          <span>
            {mod.chapters.length} chapter{mod.chapters.length === 1 ? "" : "s"}
          </span>
          {labs.length ? <span>{labs.length} labs</span> : null}
        </p>
      </header>

      <ModuleProgress moduleId={mod.id} />

      <section className="mt-9 max-w-[var(--measure)]">
        <h2 className="mb-4 text-[20px] font-semibold tracking-[-0.02em]">Chapters</h2>
        {mod.chapters.length ? (
          <ol className="space-y-3">
            {mod.chapters.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.04}>
                <li>
                  <Link href={`/learn/${c.slug}`} className="panel group block p-4">
                    <div className="flex items-baseline gap-3">
                      <span
                        className="font-mono text-[13px] tabular-nums"
                        style={{ color: "var(--accent-2)" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-[17px] font-semibold group-hover:underline">
                        {c.title}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-[14.5px]" style={{ color: "var(--muted)" }}>
                      {c.description}
                    </p>
                    <p className="mt-2 font-mono text-[11.5px]" style={{ color: "var(--muted-2)" }}>
                      {c.estimatedMinutes} min
                      {c.islpChapters.length ? ` · ISLP ${c.islpChapters.join(", ")}` : ""}
                    </p>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ol>
        ) : (
          <div className="panel p-5">
            <p className="text-[15px]" style={{ color: "var(--muted)" }}>
              No chapters written for this module yet. The structure, labs and datasets are
              already wired up — adding chapters is a content-only change, documented in{" "}
              <code>ADDING_NEW_MODULES.md</code>.
            </p>
          </div>
        )}
      </section>

      {labs.length ? (
        <section className="mt-10 max-w-[var(--measure)]">
          <h2 className="mb-3 text-[20px] font-semibold tracking-[-0.02em]">Labs in this module</h2>
          <ul className="space-y-2">
            {labs.map((l) => (
              <li key={l.id} className="panel p-4">
                <h3 className="text-[15.5px] font-medium">{l.title}</h3>
                <p className="mt-1 text-[14px]" style={{ color: "var(--muted)" }}>
                  {l.how}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {datasets.length ? (
        <section className="mt-10 max-w-[var(--measure)]">
          <h2 className="mb-3 text-[20px] font-semibold tracking-[-0.02em]">Dataset</h2>
          <ul className="space-y-2">
            {datasets.map((d) => (
              <li key={d.id} className="panel p-4">
                <h3 className="text-[15.5px] font-medium">
                  {d.title}{" "}
                  <span className="font-mono text-[12px]" style={{ color: "var(--muted-2)" }}>
                    {d.rows} rows
                  </span>
                </h3>
                <p className="mt-1 text-[14px]" style={{ color: "var(--muted)" }}>
                  {d.about}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
