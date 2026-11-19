"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LabFrame, Readout, Slider } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt } from "@/lib/stats";

/**
 * m1 · Bayes drawn as 1,000 people. Canvas rather than SVG: a thousand nodes
 * re-created on every slider tick is exactly the case canvas exists for.
 *
 * The defaults reproduce the lecture's screening example — 2% at-risk, 90%
 * detection, 15% false alarms → 10.9% of those flagged are truly at risk.
 */
const COLS = 50;
const ROWS = 20;
const TOTAL = COLS * ROWS; // 1,000 people

type Kind = "tp" | "fn" | "fp" | "tn";

const FILL: Record<Kind, string> = {
  tp: "#ff7089",
  fn: "#b47cff",
  fp: "#f3b03c",
  tn: "#2b3147",
};

export default function BayesPeople() {
  const [prevalence, setPrevalence] = useState(2); // % at risk
  const [sensitivity, setSensitivity] = useState(90); // % detected
  const [falseAlarm, setFalseAlarm] = useState(15); // % of healthy flagged
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const counts = useMemo(() => {
    const atRisk = Math.round((prevalence / 100) * TOTAL);
    const healthy = TOTAL - atRisk;
    const tp = Math.round((sensitivity / 100) * atRisk);
    const fn = atRisk - tp;
    const fp = Math.round((falseAlarm / 100) * healthy);
    const tn = healthy - fp;
    const flagged = tp + fp;
    return { atRisk, healthy, tp, fn, fp, tn, flagged };
  }, [prevalence, sensitivity, falseAlarm]);

  /** Each person is one cell; order is TP, FN, FP, TN so the blocks read cleanly. */
  const kinds = useMemo(() => {
    const out: Kind[] = [];
    for (let i = 0; i < counts.tp; i++) out.push("tp");
    for (let i = 0; i < counts.fn; i++) out.push("fn");
    for (let i = 0; i < counts.fp; i++) out.push("fp");
    while (out.length < TOTAL) out.push("tn");
    return out;
  }, [counts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cell = cssW / COLS;
    const cssH = cell * ROWS;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const r = Math.max(1.2, cell * 0.3);
    kinds.forEach((kind, i) => {
      const c = i % COLS;
      const row = Math.floor(i / COLS);
      ctx.beginPath();
      ctx.arc(c * cell + cell / 2, row * cell + cell / 2, r, 0, Math.PI * 2);
      ctx.fillStyle = FILL[kind];
      ctx.globalAlpha = kind === "tn" ? 0.75 : 1;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }, [kinds]);

  const posterior = counts.flagged ? counts.tp / counts.flagged : 0;

  return (
    <LabFrame
      title={LABS.bayes.title}
      how={LABS.bayes.how}
      notice="Leave the test alone and drag only the prevalence. At 2% a positive result is mostly a false alarm; by 20% the same test is suddenly trustworthy. The test never changed — the prior did."
      onReset={() => {
        setPrevalence(2);
        setSensitivity(90);
        setFalseAlarm(15);
      }}
      stage={
        <div>
          <canvas
            ref={canvasRef}
            className="block w-full rounded-[var(--radius-sm)] border"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
            role="img"
            aria-label={`One thousand people: ${counts.tp} correctly flagged, ${counts.fn} missed, ${counts.fp} false alarms, ${counts.tn} correctly cleared`}
          />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
            {(
              [
                ["tp", `Flagged, truly at risk — ${counts.tp}`],
                ["fn", `At risk, missed — ${counts.fn}`],
                ["fp", `False alarm — ${counts.fp}`],
                ["tn", `Correctly cleared — ${counts.tn}`],
              ] as [Kind, string][]
            ).map(([kind, label]) => (
              <span key={kind} className="flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: FILL[kind] }}
                  aria-hidden
                />
                {label}
              </span>
            ))}
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="How rare is the condition? (prior)"
            value={prevalence}
            min={0.5}
            max={40}
            step={0.5}
            onChange={setPrevalence}
            display={`${fmt(prevalence, 1)}%`}
            hint={`${counts.atRisk} of 1,000 people`}
          />
          <Slider
            label="Detection rate (sensitivity)"
            value={sensitivity}
            min={50}
            max={100}
            step={1}
            onChange={setSensitivity}
            display={`${sensitivity}%`}
            hint="P(flagged | at risk)"
          />
          <Slider
            label="False-alarm rate"
            value={falseAlarm}
            min={0}
            max={40}
            step={1}
            onChange={setFalseAlarm}
            display={`${falseAlarm}%`}
            hint="P(flagged | healthy)"
          />
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Flagged in total", value: `${counts.flagged}`, tone: "warn" },
            { label: "…of whom truly at risk", value: `${counts.tp}`, tone: "danger" },
            {
              label: "Posterior P(at risk | flagged)",
              value: `${fmt(posterior * 100, 1)}%`,
              tone: "danger",
            },
            {
              label: "Prior P(at risk)",
              value: `${fmt(prevalence, 1)}%`,
            },
            {
              label: "Belief multiplied by",
              value: prevalence ? `${fmt((posterior * 100) / prevalence, 1)}×` : "—",
              tone: "good",
            },
            { label: "Missed cases", value: `${counts.fn}`, tone: "warn" },
          ]}
        />
      }
    />
  );
}
