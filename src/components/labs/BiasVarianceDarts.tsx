"use client";

import { useMemo, useState } from "react";
import { LabButton, LabFrame, Readout, Slider } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt, mean } from "@/lib/stats";
import { gaussian, mulberry32 } from "@/lib/rng";

/**
 * m5 · Each dart is one model trained on a different sample, all predicting the
 * same point. Bias is how far the *average* dart sits from the bullseye; variance
 * is how much the darts disagree with each other.
 *
 * "Lecture example" reproduces the slide exactly: four models predicting 11.3,
 * 11.3, 14.7 and 11.3 for a truth of 12 → mean 12.15, bias −0.15, variance 2.17.
 */
const SEED = 20241004;
const LECTURE = [11.3, 11.3, 14.7, 11.3];
const LECTURE_TRUTH = 12;

const W = 320;
const H = 320;

export default function BiasVarianceDarts() {
  const [bias, setBias] = useState(0.2);
  const [spread, setSpread] = useState(1.5);
  const [count, setCount] = useState(14);
  const [nudge, setNudge] = useState(0);
  const [lecture, setLecture] = useState(false);

  const darts = useMemo(() => {
    const rand = mulberry32(SEED + nudge);
    const norm = gaussian(rand);
    // The bias pushes every dart the same way; the spread scatters them.
    const angle = Math.PI / 5;
    return Array.from({ length: count }, () => ({
      x: Math.cos(angle) * bias + norm() * spread,
      y: Math.sin(angle) * bias + norm() * spread,
    }));
  }, [bias, spread, count, nudge]);

  const stats = useMemo(() => {
    if (lecture) {
      const g = mean(LECTURE);
      const variance =
        LECTURE.reduce((a, p) => a + (p - g) ** 2, 0) / LECTURE.length;
      return {
        biasValue: LECTURE_TRUTH - g,
        variance,
        meanPrediction: g,
        total: (LECTURE_TRUTH - g) ** 2 + variance,
      };
    }
    const gx = mean(darts.map((d) => d.x));
    const gy = mean(darts.map((d) => d.y));
    const biasValue = Math.hypot(gx, gy);
    const variance =
      darts.reduce((a, d) => a + (d.x - gx) ** 2 + (d.y - gy) ** 2, 0) / darts.length;
    return {
      biasValue,
      variance,
      meanPrediction: 0,
      total: biasValue ** 2 + variance,
    };
  }, [darts, lecture]);

  const scale = 26;
  const cx = W / 2;
  const cy = H / 2;

  const gx = mean(darts.map((d) => d.x));
  const gy = mean(darts.map((d) => d.y));

  const verdict =
    stats.biasValue > 1.2
      ? stats.variance > 2.5
        ? "high bias, high variance — worst of both"
        : "high bias, low variance — underfitting"
      : stats.variance > 2.5
        ? "low bias, high variance — overfitting"
        : "low bias, low variance — ideal";

  return (
    <LabFrame
      title={LABS.darts.title}
      how={LABS.darts.how}
      notice="Tight cluster away from the centre is underfitting — the model family is simply wrong, and more data will not help. Scattered around the centre is overfitting — right on average, unreliable on any single run, and that is the case bagging exists to fix."
      onReset={() => {
        setBias(0.2);
        setSpread(1.5);
        setCount(14);
        setNudge(0);
        setLecture(false);
      }}
      stage={
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div
            className="overflow-hidden rounded-[var(--radius-sm)] border"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
          >
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full max-w-[320px]" role="img" aria-label={`A dartboard with ${count} model predictions; bias ${fmt(stats.biasValue, 2)}, variance ${fmt(stats.variance, 2)}`}>
              {[4, 3, 2, 1].map((r) => (
                <circle
                  key={r}
                  cx={cx}
                  cy={cy}
                  r={r * scale}
                  fill={r % 2 ? "transparent" : "var(--panel-2)"}
                  stroke="var(--line-strong)"
                />
              ))}
              <circle cx={cx} cy={cy} r="6" fill="var(--good)" />
              <text x={cx + 11} y={cy + 4} fontSize="10.5" fontFamily="monospace" fill="var(--good)">
                truth
              </text>

              {/* average prediction */}
              <circle
                cx={cx + gx * scale}
                cy={cy - gy * scale}
                r="7"
                fill="none"
                stroke="var(--warn)"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <line
                x1={cx}
                y1={cy}
                x2={cx + gx * scale}
                y2={cy - gy * scale}
                stroke="var(--warn)"
                strokeWidth="1.5"
              />

              {darts.map((d, i) => (
                <g key={i}>
                  <circle cx={cx + d.x * scale} cy={cy - d.y * scale} r="4" fill="var(--accent)" opacity="0.85" />
                </g>
              ))}
            </svg>
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="Bias — how far the average sits from truth"
            value={bias}
            min={0}
            max={3.5}
            step={0.1}
            onChange={(v) => {
              setBias(v);
              setLecture(false);
            }}
            display={fmt(bias, 1)}
          />
          <Slider
            label="Variance — how much the models disagree"
            value={spread}
            min={0.1}
            max={2.6}
            step={0.1}
            onChange={(v) => {
              setSpread(v);
              setLecture(false);
            }}
            display={fmt(spread, 1)}
          />
          <Slider
            label="Models trained (darts)"
            value={count}
            min={3}
            max={40}
            step={1}
            onChange={setCount}
            display={`${count}`}
          />
          <div className="flex flex-wrap gap-2">
            <LabButton onClick={() => setNudge((n) => n + 1)}>Resample</LabButton>
            <LabButton tone="plain" onClick={() => setLecture((v) => !v)}>
              {lecture ? "Back to the dartboard" : "Lecture example (Y = 12)"}
            </LabButton>
          </div>
        </>
      }
      readout={
        lecture ? (
          <Readout
            items={[
              { label: "Predictions", value: LECTURE.join(", ") },
              { label: "Average g(X)", value: fmt(stats.meanPrediction, 2) },
              { label: "Bias = Y − g(X)", value: fmt(stats.biasValue, 2), tone: "good" },
              { label: "Variance", value: fmt(stats.variance, 2), tone: "warn" },
              { label: "Bias² + Variance", value: fmt(stats.total, 2) },
              { label: "Reading", value: "low bias, modest variance" },
            ]}
          />
        ) : (
          <Readout
            items={[
              { label: "Bias (distance to truth)", value: fmt(stats.biasValue, 2), tone: "good" },
              { label: "Variance", value: fmt(stats.variance, 2), tone: "warn" },
              { label: "Bias²", value: fmt(stats.biasValue ** 2, 2) },
              { label: "Expected error ≈", value: fmt(stats.total, 2), tone: "danger" },
              { label: "Models", value: `${count}` },
              { label: "Reading", value: verdict },
            ]}
          />
        )
      }
    />
  );
}
