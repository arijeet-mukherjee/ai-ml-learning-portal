import type { Metadata } from "next";
import QuizEngine from "@/components/QuizEngine";
import { QUIZ } from "@/content/quiz";

export const metadata: Metadata = {
  title: "Quiz",
  description: "The professor's own 42 questions, with his explanations.",
};

export default function QuizPage() {
  return (
    <div className="px-4 pt-8 pb-24 sm:px-6 lg:px-10">
      <header className="max-w-[var(--measure)]">
        <p
          className="font-mono text-[11.5px] uppercase tracking-[0.18em]"
          style={{ color: "var(--accent)" }}
        >
          {QUIZ.length} questions, straight from the lecture notebook
        </p>
        <h1 className="mt-2 text-[clamp(27px,5vw,42px)] leading-[1.1] font-semibold tracking-[-0.03em]">
          Quiz
        </h1>
        <p className="mt-3 text-[17px]" style={{ color: "var(--muted)" }}>
          These are the professor&apos;s questions and the professor&apos;s explanations,
          unchanged. They are the clearest signal you have about what he thinks is
          testable.
        </p>
      </header>

      <QuizEngine />
    </div>
  );
}
