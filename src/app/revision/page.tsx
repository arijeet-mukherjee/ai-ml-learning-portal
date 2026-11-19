import type { Metadata } from "next";
import RevisionDeck from "@/components/RevisionDeck";
import ContentRenderer from "@/components/ContentRenderer";
import { CHEAT_SHEET, FORMULA_SHEET, VIVA } from "@/content/revision";
import { CARDS } from "@/content/cards";

export const metadata: Metadata = {
  title: "Revision",
  description:
    "The quick-revision cheat sheet, the formula sheet, every viva question and the professor's flashcards.",
};

export default function RevisionPage() {
  return (
    <div className="px-4 pt-8 pb-24 sm:px-6 lg:px-10">
      <header className="max-w-[var(--measure)]">
        <p
          className="font-mono text-[11.5px] uppercase tracking-[0.18em]"
          style={{ color: "var(--accent)" }}
        >
          The night before
        </p>
        <h1 className="mt-2 text-[clamp(27px,5vw,42px)] leading-[1.1] font-semibold tracking-[-0.03em]">
          Revision
        </h1>
        <p className="mt-3 text-[17px]" style={{ color: "var(--muted)" }}>
          The study guide&apos;s cheat sheet, the notebook&apos;s formula sheet, the six
          likely viva questions and all {CARDS.length} of the professor&apos;s flashcards — on one page.
        </p>
      </header>

      <section className="mt-10 max-w-[var(--measure)]">
        <h2 className="mb-3 text-[21px] font-semibold tracking-[-0.02em]">
          Quick-revision cheat sheet
        </h2>
        <ContentRenderer blocks={CHEAT_SHEET} />
      </section>

      <section className="mt-12 max-w-[var(--measure)]">
        <h2 className="mb-3 text-[21px] font-semibold tracking-[-0.02em]">Formula sheet</h2>
        <ContentRenderer blocks={FORMULA_SHEET} />
      </section>

      <section className="mt-12 max-w-[var(--measure)]">
        <h2 className="mb-3 text-[21px] font-semibold tracking-[-0.02em]">
          Likely viva questions
        </h2>
        <ContentRenderer blocks={VIVA} />
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-[21px] font-semibold tracking-[-0.02em]">Flashcards</h2>
        <RevisionDeck />
      </section>
    </div>
  );
}
