"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { Choice } from "./labs/LabKit";
import { CARDS } from "@/content/cards";
import { modules } from "@/content/modules";

/** The professor's flashcards, one at a time, with his memory hook on the back. */
export default function RevisionDeck() {
  const [filter, setFilter] = useState<string>("all");
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);

  const deck = useMemo(
    () => CARDS.filter((c) => filter === "all" || c.m === filter),
    [filter],
  );

  const card = deck[Math.min(i, deck.length - 1)];
  const mod = card ? modules.find((m) => m.id === card.m) : undefined;

  const move = (d: 1 | -1) => {
    setShown(false);
    setI((v) => (v + d + deck.length) % deck.length);
  };

  return (
    <div className="max-w-[var(--measure)]">
      <Choice<string>
        label="Module"
        value={filter}
        onChange={(v) => {
          setFilter(v);
          setI(0);
          setShown(false);
        }}
        options={[
          { value: "all", label: `All ${CARDS.length}` },
          ...modules
            .filter((m) => CARDS.some((c) => c.m === m.id))
            .map((m) => ({ value: m.id, label: `M${m.number}` })),
        ]}
      />

      {card ? (
        <div
          className="mt-4 rounded-[var(--radius)] border p-5"
          style={{ borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[11.5px]" style={{ color: "var(--accent-2)" }}>
              M{mod?.number ?? "?"}
            </span>
            <span className="font-mono text-[11.5px]" style={{ color: "var(--muted-2)" }}>
              {i + 1} / {deck.length}
            </span>
          </div>

          <p className="mt-2 text-[19px] leading-snug font-medium">{card.q}</p>

          {shown ? (
            <>
              <p className="mt-4 text-[16px]" style={{ color: "var(--muted)" }}>
                {card.a}
              </p>
              {card.h ? (
                <p
                  className="mt-3 rounded-md border-l-[3px] px-3 py-2 text-[15px]"
                  style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
                >
                  <span
                    className="mr-2 font-mono text-[10.5px] uppercase tracking-[0.16em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Hook
                  </span>
                  {card.h}
                </p>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShown(true)}
              className="mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-[14px] font-medium"
              style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
            >
              <Eye size={15} aria-hidden /> Show the answer
            </button>
          )}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous card"
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px]"
              style={{ borderColor: "var(--line-strong)", color: "var(--muted)" }}
            >
              <ArrowLeft size={13} aria-hidden /> Back
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next card"
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px]"
              style={{ borderColor: "var(--line-strong)", color: "var(--muted)" }}
            >
              Next <ArrowRight size={13} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
