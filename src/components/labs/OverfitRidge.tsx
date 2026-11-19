"use client";

import { useMemo, useState } from "react";
import { LabFrame, Readout, Slider, Stage } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt, solve } from "@/lib/stats";
import { gaussian, mulberry32 } from "@/lib/rng";

/**
 * m4 · Polynomial degree versus a Ridge penalty, fitted live.
 *
 * The fit solves the regularised normal equations (XᵀX + λI)w = Xᵀy directly —
 * the same closed form the lecture quotes, with λ on every weight except the
 * intercept. Features are scaled to [-1, 1] before the powers are taken, or a
 * degree-12 design matrix would be numerically hopeless.
 */
const SEED = 20240927;
const TRUE = (x: number) => Math.sin(x * 2.3) * 0.75 + x * 0.25;

interface Pt {
  x: number;
  y: number;
}

function buildData(): { train: Pt[]; test: Pt[] } {
  const rand = mulberry32(SEED);
  const norm = gaussian(rand);
  const make = (n: number, noise: number): Pt[] =>
    Array.from({ length: n }, (_, i) => {
      const x = -1 + (2 * i) / (n - 1) + (rand() - 0.5) * 0.08;
      return { x, y: TRUE(x) + norm() * noise };
    });
  return { train: make(12, 0.16), test: make(9, 0.16) };
}

function fit(train: Pt[], degree: number, lambda: number): number[] {
  const n = degree + 1;
  const X = train.map((p) => Array.from({ length: n }, (_, j) => p.x ** j));
  const XtX = Array.from({ length: n }, (_, a) =>
    Array.from({ length: n }, (_, b) => X.reduce((acc, row) => acc + row[a] * row[b], 0)),
  );
  // Ridge shrinks the slopes, never the intercept.
  for (let j = 1; j < n; j++) XtX[j][j] += lambda;
  const Xty = Array.from({ length: n }, (_, a) =>
    X.reduce((acc, row, i) => acc + row[a] * train[i].y, 0),
  );
  return solve(XtX, Xty);
}

const predict = (w: number[], x: number): number =>
  w.reduce((acc, c, j) => acc + c * x ** j, 0);

const mse = (pts: Pt[], w: number[]): number =>
  pts.reduce((acc, p) => acc + (p.y - predict(w, p.x)) ** 2, 0) / pts.length;

const W = 620;
const H = 290;
const PAD = 36;

export default function OverfitRidge() {
  const [degree, setDegree] = useState(1);
  const [logLambda, setLogLambda] = useState(-6); // λ = 1e-6 ≈ no penalty
  const { train, test } = useMemo(() => buildData(), []);

  const lambda = 10 ** logLambda;
  const w = useMemo(() => fit(train, degree, lambda), [train, degree, lambda]);

  const trainMse = mse(train, w);
  const testMse = mse(test, w);
  // ‖w‖ over the slopes only — the quantity Ridge actually penalises.
  const normW = Math.sqrt(w.slice(1).reduce((a, c) => a + c * c, 0));

  const sx = (x: number) => PAD + ((x + 1.15) / 2.3) * (W - PAD * 2);
  const sy = (y: number) => H - PAD - ((y + 1.6) / 3.2) * (H - PAD * 2);

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 220; i++) {
      const x = -1.08 + (2.16 * i) / 220;
      const y = Math.max(-1.6, Math.min(1.6, predict(w, x)));
      pts.push(`${i === 0 ? "M" : "L"}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`);
    }
    return pts.join(" ");
  }, [w]);

  const truth = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 160; i++) {
      const x = -1.08 + (2.16 * i) / 160;
      pts.push(`${i === 0 ? "M" : "L"}${sx(x).toFixed(2)},${sy(TRUE(x)).toFixed(2)}`);
    }
    return pts.join(" ");
  }, []);

  const gap = testMse - trainMse;

  return (
    <LabFrame
      title={LABS.poly.title}
      how={LABS.poly.how}
      notice="Raise the degree to 11 with no penalty: training error collapses towards zero while test error climbs and ‖w‖ runs into the thousands. Now raise λ. The curve calms, ‖w‖ shrinks, and the two errors meet again — that gap between them is the only honest overfitting detector you have."
      onReset={() => {
        setDegree(1);
        setLogLambda(-6);
      }}
      stage={
        <Stage
          viewBox={`0 0 ${W} ${H}`}
          label={`A degree ${degree} polynomial fitted to 12 training points with Ridge penalty ${fmt(lambda, 6)}`}
        >
          <line x1={PAD} x2={W - PAD} y1={sy(0)} y2={sy(0)} stroke="var(--line)" />
          <path d={truth} fill="none" stroke="var(--muted-2)" strokeWidth="1.5" strokeDasharray="5 4" />
          <path d={curve} fill="none" stroke="var(--accent)" strokeWidth="2.5" />

          {test.map((p, i) => (
            <circle
              key={`te-${i}`}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r="5"
              fill="none"
              stroke="var(--warn)"
              strokeWidth="1.8"
            />
          ))}
          {train.map((p, i) => (
            <circle key={`tr-${i}`} cx={sx(p.x)} cy={sy(p.y)} r="4.5" fill="var(--accent-2)" />
          ))}

          <text x={PAD} y={18} fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
            filled = train · hollow = test · dashed = the true function
          </text>
        </Stage>
      }
      controls={
        <>
          <Slider
            label="Polynomial degree"
            value={degree}
            min={1}
            max={11}
            step={1}
            onChange={setDegree}
            display={`${degree}`}
            hint="1 underfits. Past 8 it starts threading every training point."
          />
          <Slider
            label="Ridge penalty α"
            value={logLambda}
            min={-6}
            max={1}
            step={0.25}
            onChange={setLogLambda}
            display={lambda < 1e-5 ? "≈ 0 (off)" : lambda.toExponential(1)}
            hint="Larger α = stronger penalty = simpler model."
          />
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Train MSE", value: fmt(trainMse, 4), tone: "good" },
            { label: "Test MSE", value: fmt(testMse, 4), tone: "warn" },
            {
              label: "Gap (test − train)",
              value: fmt(gap, 4),
              tone: gap > 0.1 ? "danger" : "good",
            },
            { label: "‖w‖ (slopes)", value: normW > 999 ? normW.toExponential(2) : fmt(normW, 2) },
            { label: "Weights fitted", value: `${w.length}` },
            {
              label: "Diagnosis",
              value:
                trainMse > 0.12
                  ? "underfitting"
                  : gap > 0.1
                    ? "overfitting"
                    : "good fit",
              tone: trainMse > 0.12 ? "warn" : gap > 0.1 ? "danger" : "good",
            },
          ]}
        />
      }
    />
  );
}
