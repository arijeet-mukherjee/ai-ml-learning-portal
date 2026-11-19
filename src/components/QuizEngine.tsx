"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Choice } from "./labs/LabKit";
import { QUIZ } from "@/content/quiz";
import { modules } from "@/content/modules";
import { recordQuiz } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";

/**
 * The professor's questions, scored, with his own explanation revealed after each
 * answer and a link back to the module so a wrong answer has somewhere to go.
 */
type Filter = "all" | string;

export default function QuizEngine() {
  const [filter, setFilter] = useState<Filter>("all");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const { progress } = useProgress();

  const questions = useMemo(
    () =>
      QUIZ.map((q, i) => ({ ...q, index: i })).filter(
        (q) => filter === "all" || q.m === filter,
      ),
    [filter],
  );

  const answered = questions.filter((q) => answers[q.index] !== undefined);
  const correct = answered.filter((q) => answers[q.index] === q.a);

  const choose = (index: number, option: number, moduleId: string) => {
    if (answers[index] !== undefined) return;
    const next = { ...answers, [index]: option };
    setAnswers(next);
    const forModule = QUIZ.map((q, i) => ({ ...q, index: i })).filter((q) => q.m === moduleId);
    const done = forModule.filter((q) => next[q.index] !== undefined);
    recordQuiz(moduleId, done.filter((q) => next[q.index] === q.a).length, done.length);
  };

  return (
    <div className="mt-7">
      <Choice<Filter>
        label="Module"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: `All ${QUIZ.length}` },
          ...modules
            .filter((m) => QUIZ.some((q) => q.m === m.id))
            .map((m) => ({ value: m.id, label: `M${m.number}` })),
        ]}
      />

      <div
        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[var(--radius)] border px-4 py-3"
        style={{ borderColor: "var(--line)", background: "var(--panel)" }}
      >
        <span className="text-[14px]" style={{ color: "var(--muted)" }}>
          {answered.length} of {questions.length} answered
        </span>
        <span className="font-mono text-[16px]" style={{ color: "var(--good)" }}>
          {correct.length} correct
        </span>
        {answered.length ? (
          <span className="font-mono text-[14px]" style={{ color: "var(--muted-2)" }}>
            {Math.round((correct.length / answered.length) * 100)}%
          </span>
        ) : null}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setAnswers({})}
          className="rounded-md border px-2.5 py-1.5 text-[12.5px]"
          style={{ borderColor: "var(--line-strong)", color: "var(--muted-2)" }}
        >
          Start over
        </button>
      </div>

      <ol className="mt-6 space-y-4">
        {questions.map((q) => {
          const picked = answers[q.index];
          const mod = modules.find((m) => m.id === q.m);
          return (
            <li
              key={q.index}
              className="rounded-[var(--radius)] border p-4"
              style={{ borderColor: "var(--line)", background: "var(--panel)" }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[11.5px]" style={{ color: "var(--accent-2)" }}>
                  M{mod?.number ?? "?"}
                </span>
                <h3 className="text-[16px] font-medium">{q.q}</h3>
              </div>

              <div className="mt-3 space-y-1.5">
                {q.o.map((opt, oi) => {
                  const isPicked = picked === oi;
                  const isRight = oi === q.a;
                  const show = picked !== undefined;
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={show}
                      onClick={() => choose(q.index, oi, q.m)}
                      className="flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left text-[14.5px] transition-colors disabled:cursor-default"
                      style={{
                        borderColor: show
                          ? isRight
                            ? "var(--good)"
                            : isPicked
                              ? "var(--danger)"
                              : "var(--line)"
                          : "var(--line-strong)",
                        background: show
                          ? isRight
                            ? "var(--good-soft)"
                            : isPicked
                              ? "var(--danger-soft)"
                              : "transparent"
                          : "transparent",
                      }}
                    >
                      <span className="w-4 shrink-0">
                        {show && isRight ? (
                          <Check size={14} style={{ color: "var(--good)" }} aria-hidden />
                        ) : show && isPicked ? (
                          <X size={14} style={{ color: "var(--danger)" }} aria-hidden />
                        ) : null}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {picked !== undefined ? (
                <div
                  className="mt-3 rounded-md border-l-[3px] px-3 py-2 text-[14.5px]"
                  style={{
                    borderColor: "var(--accent)",
                    background: "var(--accent-soft)",
                    color: "var(--muted)",
                  }}
                >
                  {q.w}
                  {mod ? (
                    <>
                      {" "}
                      <Link
                        href={`/modules/${mod.id}`}
                        className="font-medium"
                        style={{ color: "var(--accent)" }}
                      >
                        Re-read {mod.title} →
                      </Link>
                    </>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {Object.keys(progress.quiz).length ? (
        <p className="mt-6 text-[13px]" style={{ color: "var(--muted-2)" }}>
          Scores are kept on this device only.
        </p>
      ) : null}
    </div>
  );
}
