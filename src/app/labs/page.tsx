import type { Metadata } from "next";
import Link from "next/link";
import LabMount from "@/components/LabMount";
import Reveal from "@/components/Reveal";
import { LAB_LIST } from "@/lib/labs";
import { modules } from "@/content/modules";

export const metadata: Metadata = {
  title: "Labs",
  description:
    "All fifteen interactive labs from the Module 1 notebook, rebuilt as React components.",
};

export default function LabsPage() {
  return (
    <div className="px-4 pt-8 pb-24 sm:px-6 lg:px-10">
      <header className="max-w-[var(--measure)]">
        <p
          className="font-mono text-[11.5px] uppercase tracking-[0.18em]"
          style={{ color: "var(--accent)" }}
        >
          Every lab in one place
        </p>
        <h1 className="mt-2 text-[clamp(27px,5vw,42px)] leading-[1.1] font-semibold tracking-[-0.03em]">
          Labs
        </h1>
        <p className="mt-3 text-[17px]" style={{ color: "var(--muted)" }}>
          Fifteen things to poke at. Each one appears inside the chapter it belongs to as
          well — this page is for when you know which idea you want to play with.
        </p>
      </header>

      <nav className="mt-7 flex flex-wrap gap-2" aria-label="Jump to a lab">
        {LAB_LIST.map((l) => (
          <a
            key={l.id}
            href={`#lab-${l.id}`}
            className="rounded-full border px-3 py-1.5 text-[13px]"
            style={{ borderColor: "var(--line-strong)", color: "var(--muted)" }}
          >
            {l.title}
          </a>
        ))}
      </nav>

      <div className="mt-8">
        {LAB_LIST.map((l, i) => {
          const mod = modules.find((m) => m.id === l.moduleId);
          return (
            <Reveal key={l.id} delay={i === 0 ? 0 : 0.02}>
              <section id={`lab-${l.id}`} className="mb-10 scroll-mt-24">
                {mod ? (
                  <Link
                    href={`/modules/${mod.id}`}
                    className="font-mono text-[11px] uppercase tracking-[0.16em]"
                    style={{ color: "var(--accent-2)" }}
                  >
                    M{mod.number} · {mod.title}
                  </Link>
                ) : null}
                <LabMount lab={l.id} />
              </section>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
