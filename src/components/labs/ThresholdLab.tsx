"use client";

import { useMemo, useState } from "react";
import { LabFrame, Readout, Slider, Stage } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt } from "@/lib/stats";
import { gaussian, mulberry32 } from "@/lib/rng";

/**
 * m3 · Each dot is a patient with a model score. Sliding the threshold trades
 * precision against recall, which is the decision behind every screening system.
 *
 * Scores are drawn once from a seeded generator so the picture is stable: 40
 * malignant cases centred high, 120 benign centred low, roughly the balance of
 * the Wisconsin data (37.3% malignant).
 */
const SEED = 20240906;

interface Patient {
  score: number;
  positive: boolean;
  jitter: number;
}

function buildPatients(): Patient[] {
  const rand = mulberry32(SEED);
  const norm = gaussian(rand);
  const out: Patient[] = [];
  for (let i = 0; i < 60; i++) {
    out.push({
      score: Math.min(0.99, Math.max(0.01, 0.68 + norm() * 0.17)),
      positive: true,
      jitter: rand(),
    });
  }
  for (let i = 0; i < 100; i++) {
    out.push({
      score: Math.min(0.99, Math.max(0.01, 0.3 + norm() * 0.16)),
      positive: false,
      jitter: rand(),
    });
  }
  return out;
}

const W = 620;
const H = 210;
const PAD = 34;

export default function ThresholdLab() {
  const [threshold, setThreshold] = useState(0.5);
  const patients = useMemo(() => buildPatients(), []);

  const m = useMemo(() => {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    let tn = 0;
    for (const p of patients) {
      const flagged = p.score >= threshold;
      if (p.positive && flagged) tp++;
      else if (p.positive) fn++;
      else if (flagged) fp++;
      else tn++;
    }
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    return {
      tp,
      fp,
      fn,
      tn,
      precision,
      recall,
      f1,
      accuracy: (tp + tn) / patients.length,
    };
  }, [patients, threshold]);

  const sx = (v: number) => PAD + v * (W - PAD * 2);

  return (
    <LabFrame
      title={LABS.threshold.title}
      how={LABS.threshold.how}
      notice="Drag the line left and the missed tumours fall towards zero while false alarms climb. There is no setting that fixes both — which is why the metric you chase has to come from the cost of the mistake, decided before you train anything."
      onReset={() => setThreshold(0.5)}
      stage={
        <Stage
          viewBox={`0 0 ${W} ${H}`}
          label={`Patient scores with the decision threshold at ${fmt(threshold, 2)}; ${m.tp} caught, ${m.fn} missed, ${m.fp} false alarms`}
        >
          <text x={PAD} y={18} fontSize="11" fontFamily="monospace" fill="var(--danger)">
            malignant (class 1)
          </text>
          <text x={PAD} y={H - 48} fontSize="11" fontFamily="monospace" fill="var(--accent-2)">
            benign (class 0)
          </text>

          {/* the threshold */}
          <rect
            x={sx(threshold)}
            y={24}
            width={W - PAD - sx(threshold)}
            height={H - 64}
            fill="var(--warn-soft)"
          />
          <line
            x1={sx(threshold)}
            x2={sx(threshold)}
            y1={22}
            y2={H - 38}
            stroke="var(--warn)"
            strokeWidth="2"
          />
          <text
            x={sx(threshold)}
            y={H - 26}
            textAnchor="middle"
            fontSize="11"
            fontFamily="monospace"
            fill="var(--warn)"
          >
            {fmt(threshold, 2)}
          </text>

          {patients.map((p, i) => {
            const flagged = p.score >= threshold;
            const correct = flagged === p.positive;
            const yBase = p.positive ? 30 : H - 92;
            return (
              <circle
                key={i}
                cx={sx(p.score)}
                cy={yBase + p.jitter * 36}
                r={correct ? 3 : 4.2}
                fill={
                  p.positive
                    ? correct
                      ? "var(--danger)"
                      : "var(--violet)"
                    : correct
                      ? "var(--accent-2)"
                      : "var(--warn)"
                }
                opacity={correct ? 0.65 : 1}
              />
            );
          })}

          <line x1={PAD} x2={W - PAD} y1={H - 38} y2={H - 38} stroke="var(--line-strong)" />
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <text
              key={t}
              x={sx(t)}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fontFamily="monospace"
              fill="var(--muted-2)"
            >
              {t}
            </text>
          ))}
        </Stage>
      }
      controls={
        <>
          <Slider
            label="Decision threshold"
            value={threshold}
            min={0.02}
            max={0.98}
            step={0.01}
            onChange={setThreshold}
            display={fmt(threshold, 2)}
            hint="predict_proba(X)[:, 1] ≥ threshold → flag as malignant. 0.5 is what predict() uses."
          />
          <div
            className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-sm)] border text-center text-[12.5px]"
            style={{ borderColor: "var(--line)", background: "var(--line)" }}
          >
            {(
              [
                ["True positive", m.tp, "var(--danger)"],
                ["False positive", m.fp, "var(--warn)"],
                ["False negative", m.fn, "var(--violet)"],
                ["True negative", m.tn, "var(--accent-2)"],
              ] as [string, number, string][]
            ).map(([label, v, color]) => (
              <div key={label} className="px-2 py-2" style={{ background: "var(--ink-2)" }}>
                <div style={{ color: "var(--muted-2)" }}>{label}</div>
                <div className="font-mono text-[16px]" style={{ color }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Precision  TP/(TP+FP)", value: fmt(m.precision, 3), tone: "warn" },
            { label: "Recall  TP/(TP+FN)", value: fmt(m.recall, 3), tone: "danger" },
            { label: "F1", value: fmt(m.f1, 3), tone: "good" },
            { label: "Accuracy", value: fmt(m.accuracy, 3) },
            { label: "Tumours missed", value: `${m.fn}`, tone: "danger" },
            { label: "Healthy alarmed", value: `${m.fp}`, tone: "warn" },
          ]}
        />
      }
    />
  );
}
