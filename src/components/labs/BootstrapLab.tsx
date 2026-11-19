"use client";

import { useCallback, useMemo, useState } from "react";
import { LabButton, LabFrame, Readout, Slider } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt } from "@/lib/stats";
import { mulberry32 } from "@/lib/rng";

/**
 * m6 · Draw N rows with replacement from N, and count what gets left out.
 *
 * P(a given row is never picked) = (1 − 1/N)^N → 1/e ≈ 0.368. A single draw is
 * noisy; the running average over many draws is what converges on it, which is
 * also why out-of-bag error is a usable estimate rather than a curiosity.
 */
const COLS = 20;

export default function BootstrapLab() {
  const [n, setN] = useState(60);
  const [seed, setSeed] = useState(1);
  const [history, setHistory] = useState<number[]>([]);

  const picks = useMemo(() => {
    const rand = mulberry32(20241011 + seed);
    const counts = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) counts[Math.floor(rand() * n)]++;
    return counts;
  }, [n, seed]);

  const oob = picks.filter((c) => c === 0).length;
  const oobShare = oob / n;
  const unique = n - oob;

  const draw = useCallback(() => {
    setHistory((h) => [...h, oobShare]);
    setSeed((s) => s + 1);
  }, [oobShare]);

  const drawMany = useCallback(() => {
    // 50 extra draws, computed the same way the picture is, so the average is honest.
    const extra: number[] = [];
    for (let k = 1; k <= 50; k++) {
      const rand = mulberry32(20241011 + seed + k);
      const counts = new Array<number>(n).fill(0);
      for (let i = 0; i < n; i++) counts[Math.floor(rand() * n)]++;
      extra.push(counts.filter((c) => c === 0).length / n);
    }
    setHistory((h) => [...h, oobShare, ...extra]);
    setSeed((s) => s + 51);
  }, [n, seed, oobShare]);

  const average = history.length
    ? history.reduce((a, b) => a + b, 0) / history.length
    : oobShare;

  const theoretical = (1 - 1 / n) ** n;
  const rows = Math.ceil(n / COLS);
  const cell = 22;

  return (
    <LabFrame
      title={LABS.boot.title}
      how={LABS.boot.how}
      notice="One draw leaves out anywhere from a quarter to a half of the rows — noisy. Press 'Draw 50 more' and the running average settles on 36.8% and stays there. That left-out third is a validation set you got for free, which is what 'out-of-bag score' means."
      onReset={() => {
        setN(60);
        setSeed(1);
        setHistory([]);
      }}
      stage={
        <div
          className="rounded-[var(--radius-sm)] border p-3"
          style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
        >
          <svg
            viewBox={`0 0 ${COLS * cell + 6} ${rows * cell + 6}`}
            className="block h-auto w-full"
            role="img"
            aria-label={`${n} rows: ${unique} picked at least once, ${oob} left out of the bootstrap sample`}
          >
            {picks.map((c, i) => {
              const x = (i % COLS) * cell + 3;
              const y = Math.floor(i / COLS) * cell + 3;
              const fill =
                c === 0 ? "transparent" : c === 1 ? "var(--accent-soft)" : "var(--warn-soft)";
              const stroke =
                c === 0 ? "var(--muted-2)" : c === 1 ? "var(--accent)" : "var(--warn)";
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={cell - 4}
                    height={cell - 4}
                    rx="4"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="1.3"
                    strokeDasharray={c === 0 ? "3 2" : undefined}
                  />
                  {c > 1 ? (
                    <text
                      x={x + (cell - 4) / 2}
                      y={y + (cell - 4) / 2 + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="monospace"
                      fill="var(--warn)"
                    >
                      {c}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]" style={{ color: "var(--muted)" }}>
            <span>
              <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--accent)" }} aria-hidden />
              picked once — {picks.filter((c) => c === 1).length}
            </span>
            <span>
              <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--warn)" }} aria-hidden />
              picked more than once — {picks.filter((c) => c > 1).length}
            </span>
            <span>
              <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm border border-dashed" style={{ borderColor: "var(--muted-2)" }} aria-hidden />
              left out (out-of-bag) — {oob}
            </span>
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="Rows in the training set, N"
            value={n}
            min={20}
            max={200}
            step={10}
            onChange={(v) => {
              setN(v);
              setHistory([]);
            }}
            display={`${n}`}
            hint="The 36.8% limit does not depend on N — check it at 20 and at 200."
          />
          <div className="flex flex-wrap gap-2">
            <LabButton onClick={draw}>Draw a new sample</LabButton>
            <LabButton tone="plain" onClick={drawMany}>
              Draw 50 more
            </LabButton>
          </div>
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Unique rows picked", value: `${unique} of ${n}`, tone: "accent" },
            { label: "Share picked", value: `${fmt((unique / n) * 100, 1)}%`, tone: "good" },
            { label: "Left out this draw", value: `${fmt(oobShare * 100, 1)}%`, tone: "warn" },
            { label: "Draws so far", value: `${history.length || 1}` },
            { label: "Average left out", value: `${fmt(average * 100, 1)}%`, tone: "good" },
            { label: "(1 − 1/N)ᴺ", value: `${fmt(theoretical * 100, 1)}%` },
          ]}
        />
      }
    />
  );
}
