"use client";

import { useCallback, useMemo, useState } from "react";
import { LabButton, LabFrame, Readout, Slider, Stage } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt } from "@/lib/stats";
import { gaussian, mulberry32 } from "@/lib/rng";

/**
 * m4 · The sigmoid in one dimension, with log-loss and real gradient descent.
 *
 * The gradient used by "Fit with gradient descent" is the one from the lecture's
 * formula sheet: ∂L/∂w = (1/n) Σ (pᵢ − yᵢ) xᵢ — prediction minus truth, times input.
 */
const SEED = 20240927;

interface Pt {
  x: number;
  y: 0 | 1;
}

function buildData(): Pt[] {
  const rand = mulberry32(SEED);
  const norm = gaussian(rand);
  const out: Pt[] = [];
  for (let i = 0; i < 18; i++) out.push({ x: -1.6 + norm() * 0.85, y: 0 });
  for (let i = 0; i < 18; i++) out.push({ x: 1.6 + norm() * 0.85, y: 1 });
  return out;
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

const W = 620;
const H = 250;
const PAD = 36;

export default function LogisticOneD() {
  const [w, setW] = useState(1);
  const [b, setB] = useState(0);
  const [epochs, setEpochs] = useState(0);
  const data = useMemo(() => buildData(), []);

  const sx = (x: number) => PAD + ((x + 4.5) / 9) * (W - PAD * 2);
  const sy = (p: number) => H - PAD - p * (H - PAD * 2);

  const logLoss = useMemo(() => {
    const eps = 1e-9;
    return (
      data.reduce((acc, pt) => {
        const p = sigmoid(w * pt.x + b);
        return acc - (pt.y * Math.log(p + eps) + (1 - pt.y) * Math.log(1 - p + eps));
      }, 0) / data.length
    );
  }, [data, w, b]);

  const accuracy = useMemo(
    () =>
      data.filter((pt) => (sigmoid(w * pt.x + b) >= 0.5 ? 1 : 0) === pt.y).length /
      data.length,
    [data, w, b],
  );

  const fitStep = useCallback(
    (iterations: number) => {
      let cw = w;
      let cb = b;
      const eta = 0.5;
      for (let it = 0; it < iterations; it++) {
        let gw = 0;
        let gb = 0;
        for (const pt of data) {
          const err = sigmoid(cw * pt.x + cb) - pt.y;
          gw += err * pt.x;
          gb += err;
        }
        cw -= (eta * gw) / data.length;
        cb -= (eta * gb) / data.length;
      }
      setW(Number(cw.toFixed(3)));
      setB(Number(cb.toFixed(3)));
      setEpochs((e) => e + iterations);
    },
    [data, w, b],
  );

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 240; i++) {
      const x = -4.5 + (9 * i) / 240;
      pts.push(`${i === 0 ? "M" : "L"}${sx(x).toFixed(2)},${sy(sigmoid(w * x + b)).toFixed(2)}`);
    }
    return pts.join(" ");
  }, [w, b]);

  const boundary = w !== 0 ? -b / w : null;

  return (
    <LabFrame
      title={LABS.sigmoid.title}
      how={LABS.sigmoid.how}
      notice="w stretches the S and b slides it sideways; the boundary sits wherever z = w·x + b crosses zero, which is why a linear score gives a straight boundary. Push w very high and the curve becomes a step — confident everywhere, including where it is wrong, and log-loss punishes exactly that."
      onReset={() => {
        setW(1);
        setB(0);
        setEpochs(0);
      }}
      stage={
        <Stage
          viewBox={`0 0 ${W} ${H}`}
          label={`Sigmoid with w ${fmt(w, 2)} and b ${fmt(b, 2)}; accuracy ${fmt(accuracy * 100, 1)} percent`}
        >
          {[0, 0.5, 1].map((p) => (
            <g key={p}>
              <line
                x1={PAD}
                x2={W - PAD}
                y1={sy(p)}
                y2={sy(p)}
                stroke={p === 0.5 ? "var(--warn)" : "var(--line)"}
                strokeDasharray={p === 0.5 ? "4 4" : undefined}
              />
              <text x={PAD - 6} y={sy(p) + 4} textAnchor="end" fontSize="10" fontFamily="monospace" fill="var(--muted-2)">
                {p}
              </text>
            </g>
          ))}

          {boundary !== null && boundary > -4.5 && boundary < 4.5 ? (
            <>
              <line
                x1={sx(boundary)}
                x2={sx(boundary)}
                y1={PAD - 6}
                y2={H - PAD}
                stroke="var(--warn)"
                strokeWidth="1.5"
              />
              <text
                x={sx(boundary)}
                y={PAD - 12}
                textAnchor="middle"
                fontSize="10.5"
                fontFamily="monospace"
                fill="var(--warn)"
              >
                z = 0
              </text>
            </>
          ) : null}

          <path d={curve} fill="none" stroke="var(--accent)" strokeWidth="2.5" />

          {data.map((pt, i) => {
            const p = sigmoid(w * pt.x + b);
            const right = (p >= 0.5 ? 1 : 0) === pt.y;
            return (
              <circle
                key={i}
                cx={sx(pt.x)}
                cy={sy(pt.y)}
                r={right ? 4 : 5.5}
                fill={pt.y === 1 ? "var(--danger)" : "var(--accent-2)"}
                opacity={right ? 0.6 : 1}
                stroke={right ? "none" : "var(--warn)"}
                strokeWidth="2"
              />
            );
          })}
        </Stage>
      }
      controls={
        <>
          <Slider label="Weight w" value={w} min={-6} max={6} step={0.1} onChange={(v) => { setW(v); setEpochs(0); }} display={fmt(w, 1)} hint="Steepness of the S." />
          <Slider label="Bias b" value={b} min={-6} max={6} step={0.1} onChange={(v) => { setB(v); setEpochs(0); }} display={fmt(b, 1)} hint="Slides the boundary left or right." />
          <div className="flex flex-wrap gap-2">
            <LabButton onClick={() => fitStep(1)}>One GD step</LabButton>
            <LabButton tone="plain" onClick={() => fitStep(200)}>
              Fit with gradient descent
            </LabButton>
          </div>
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Log-loss", value: fmt(logLoss, 4), tone: "warn" },
            { label: "Accuracy", value: `${fmt(accuracy * 100, 1)}%`, tone: "good" },
            { label: "Boundary x", value: boundary === null ? "—" : fmt(boundary, 3) },
            { label: "GD steps", value: `${epochs}` },
            { label: "P(y=1 | x=0)", value: fmt(sigmoid(b), 3) },
            { label: "log-odds at x=1", value: fmt(w + b, 3) },
          ]}
        />
      }
    />
  );
}
