"use client";

import { Pause, Play, RotateCcw, SkipForward, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { gaussian, mulberry32 } from "@/lib/rng";
import { Readout, Stage } from "./LabKit";

/* ===========================================================================
   Algorithm atlas: the "same four columns" table from the four-step recipe,
   with a worked example under every loss and parameter, and a button on each
   row that opens a dialog animating that algorithm's optimiser on a toy
   problem, with the loss drawn live underneath.

   Worked-example numbers are hand calculations, re-checked in Python; see
   SOURCE_NOTES.md ("Algorithm atlas").
   =========================================================================== */

type AlgoId = "linreg" | "logreg" | "ridge" | "lasso" | "svm" | "tree" | "kmeans";

interface Row {
  id: AlgoId;
  name: string;
  model: string;
  params: string;
  loss: string;
  lossExample: string;
  optimiser: string;
  optimiserNote: string;
  hook: string;
}

const ROWS: Row[] = [
  {
    id: "linreg",
    name: "Linear regression",
    model: "w·x + b",
    params: "Learns w (slope) and b (intercept). w = 1.5 means one more unit of x adds 1.5 to the prediction.",
    loss: "MSE: average of (y − ŷ)²",
    lossExample:
      "Points (1,2), (2,4), (3,5) and the line ŷ = x + 1: errors 0, 1, 1 → MSE = (0 + 1 + 1)/3 = 0.67. The best line, ŷ = 1.5x + 0.67, gets 0.056.",
    optimiser: "Closed form (XᵀX)⁻¹Xᵀy",
    optimiserNote: "One matrix formula, no iterations. The animation walks there by gradient descent so you can watch it arrive.",
    hook: "Draw the errors as squares. MSE is their average area.",
  },
  {
    id: "logreg",
    name: "Logistic regression",
    model: "σ(w·x + b)",
    params: "w sets how steep the S-curve is, b slides it sideways. The boundary sits where w·x + b = 0: w = 2, b = −4 puts it at x = 2.",
    loss: "Log-loss: −ln(probability given to the true class)",
    lossExample:
      "True class gets p = 0.9 → 0.105. p = 0.5 → 0.693. p = 0.2 → 1.609. Confident and wrong costs the most.",
    optimiser: "lbfgs / gradient descent",
    optimiserNote: "No closed form, so it walks downhill. lbfgs is a smarter walker that also uses the curvature.",
    hook: "Confident and wrong is punished hardest.",
  },
  {
    id: "ridge",
    name: "Ridge",
    model: "w·x + b",
    params: "Same w and b, plus α, which you choose: how hard to pull every weight towards 0.",
    loss: "MSE + α‖w‖² (sum of squared weights)",
    lossExample: "w = (3, −2), α = 0.5 → penalty 0.5 × (3² + 2²) = 6.5, added on top of the MSE.",
    optimiser: "Closed form",
    optimiserNote: "The linear-regression formula with α added on the diagonal of XᵀX. Still one step.",
    hook: "Ridge shrinks every weight but never kills one.",
  },
  {
    id: "lasso",
    name: "Lasso",
    model: "w·x + b",
    params: "Same w, b and α, but a big enough α sets weights to exactly 0. It picks features for you.",
    loss: "MSE + α‖w‖₁ (sum of absolute weights)",
    lossExample: "w = (3, −2), α = 0.5 → penalty 0.5 × (3 + 2) = 2.5.",
    optimiser: "Coordinate descent",
    optimiserNote: "|w| has a sharp corner at 0, so there is no single formula. Update one weight at a time, holding the rest fixed.",
    hook: "Lasso ropes small weights all the way to zero.",
  },
  {
    id: "svm",
    name: "Linear SVM",
    model: "sign(w·x + b)",
    params: "w points across the street, b shifts it. Street width = 2/‖w‖. C, which you choose, trades width against points inside it.",
    loss: "Hinge max(0, 1 − y·(w·x + b)) + ½‖w‖²",
    lossExample:
      "w = (1, 1), b = −3, true class +1. (3, 1) scores 1 → hinge 0, safe. (2, 1.5) scores 0.5 → hinge 0.5, inside the street. (1, 1) scores −1 → hinge 2, wrong side.",
    optimiser: "Quadratic programming",
    optimiserNote: "A bowl-shaped objective with linear constraints is a QP. The animation takes small subgradient steps instead so the street visibly moves.",
    hook: "Widest street, fewest trespassers.",
  },
  {
    id: "tree",
    name: "Decision tree",
    model: "Nested if-statements",
    params: "Learns which feature and threshold to ask at each node. You set max_depth and min_samples_leaf.",
    loss: "Gini 1 − Σ pₖ² (or entropy)",
    lossExample:
      "6 yes / 4 no: Gini = 1 − 0.6² − 0.4² = 0.48. Split into 5/1 (0.278) and 1/3 (0.375): weighted 0.6 × 0.278 + 0.4 × 0.375 = 0.317, a gain of 0.163.",
    optimiser: "Greedy search",
    optimiserNote: "Try every feature and every threshold, keep the best split, never go back. Then repeat inside each child.",
    hook: "Ask the question that leaves the purest groups.",
  },
  {
    id: "kmeans",
    name: "K-means",
    model: "k centroids",
    params: "Learns k centre points. You choose k, and n_init restarts from different starting centres.",
    loss: "SSE: Σ (distance to own centroid)²",
    lossExample: "Points 1, 2, 9, 10 with centroids 1.5 and 9.5: SSE = 4 × 0.5² = 1. Centroids 2 and 9 give SSE = 2.",
    optimiser: "Alternating assignment / update",
    optimiserNote: "Assign every point to its nearest centroid, move every centroid to the mean of its points, repeat. SSE never goes up.",
    hook: "Assign, average, repeat.",
  },
];

/* ---------------------------------------------------------------- helpers */

const W = 360;
const H = 260;
const PAD = 28;

type Tone = "accent" | "good" | "warn" | "danger";
interface Series {
  values: number[];
  color: string;
  label: string;
}
interface Sim {
  n: number;
  stage: (i: number) => ReactNode;
  stageLabel: string;
  chart: { series: Series[]; xs?: number[]; xLabel: string; yLabel: string; log?: boolean };
  readout: (i: number) => { label: string; value: string; tone?: Tone }[];
  narrate: (i: number) => string;
}

const f = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "—");
const lin = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

const CLASS = ["var(--accent)", "var(--warn)", "var(--good)"];

function Axes({ sx, sy, x0, x1, y0, y1 }: { sx: (v: number) => number; sy: (v: number) => number; x0: number; x1: number; y0: number; y1: number }) {
  return (
    <g>
      <line x1={sx(x0)} y1={sy(y0)} x2={sx(x1)} y2={sy(y0)} stroke="var(--line-strong)" />
      <line x1={sx(x0)} y1={sy(y0)} x2={sx(x0)} y2={sy(y1)} stroke="var(--line-strong)" />
    </g>
  );
}

/* ------------------------------------------------------- linear regression */

function linregSim(): Sim {
  const pts = [
    [1, 2],
    [2, 4],
    [3, 5],
  ];
  const lr = 0.1;
  const n = 160;
  const ws: number[] = [];
  const bs: number[] = [];
  const mse: number[] = [];
  let w = 0.5;
  let b = 0.5;
  for (let i = 0; i < n; i++) {
    let gw = 0;
    let gb = 0;
    let l = 0;
    for (const [x, y] of pts) {
      const r = y - (w * x + b);
      l += r * r;
      gw += -2 * x * r;
      gb += -2 * r;
    }
    ws.push(w);
    bs.push(b);
    mse.push(l / pts.length);
    w -= (lr * gw) / pts.length;
    b -= (lr * gb) / pts.length;
  }
  const sx = lin(0, 4.5, PAD, W - 12);
  const sy = lin(0, 6.5, H - PAD, 10);
  const unitY = sy(0) - sy(1);
  return {
    n,
    stageLabel: "Three points, a line moving towards the best fit, and each squared error drawn as a square",
    stage: (i) => {
      const w = ws[i];
      const b = bs[i];
      return (
        <g>
          <defs>
            <clipPath id="lr-clip">
              <rect x={PAD} y={10} width={W - 12 - PAD} height={H - PAD - 10} />
            </clipPath>
          </defs>
          <Axes sx={sx} sy={sy} x0={0} x1={4.5} y0={0} y1={6.5} />
          <g clipPath="url(#lr-clip)">
            {pts.map(([x, y], k) => {
              const yh = w * x + b;
              const side = Math.abs(y - yh) * unitY;
              const top = Math.min(sy(y), sy(yh));
              return <rect key={k} x={sx(x)} y={top} width={side} height={side} fill="var(--danger-soft)" stroke="var(--danger)" strokeWidth={1} />;
            })}
            <line x1={sx(0)} y1={sy(0.6667)} x2={sx(4.5)} y2={sy(1.5 * 4.5 + 0.6667)} stroke="var(--good)" strokeDasharray="5 4" strokeWidth={1.5} />
            <line x1={sx(0)} y1={sy(b)} x2={sx(4.5)} y2={sy(w * 4.5 + b)} stroke="var(--accent)" strokeWidth={2.5} />
          </g>
          {pts.map(([x, y], k) => (
            <circle key={k} cx={sx(x)} cy={sy(y)} r={5} fill="var(--text)" />
          ))}
          <text x={sx(4.45)} y={sy(1.5 * 4.5 + 0.6667) + 16} textAnchor="end" fontSize={11} fill="var(--good)">
            closed-form answer
          </text>
          <text x={PAD + 4} y={22} fontSize={11} fill="var(--muted)">
            red squares = squared errors
          </text>
        </g>
      );
    },
    chart: { series: [{ values: mse, color: "var(--accent)", label: "MSE" }], xLabel: "gradient-descent step", yLabel: "MSE (log scale)", log: true },
    readout: (i) => [
      { label: "w (slope)", value: f(ws[i], 3) },
      { label: "b (intercept)", value: f(bs[i], 3) },
      { label: "MSE", value: f(mse[i], 3), tone: mse[i] < 0.06 ? "good" : "warn" },
      { label: "closed form", value: "1.5, 0.667" },
    ],
    narrate: (i) =>
      i < 15
        ? "Start with w = 0.5, b = 0.5. Each red square's side is one error, so its area is that error squared. MSE is the average area: 5.42."
        : i < n - 30
          ? "Each step moves w and b a little downhill: w ← w − η·∂MSE/∂w, with η = 0.1. Watch the squares shrink."
          : "Gradient descent lands on the dashed line, which the closed form (XᵀX)⁻¹Xᵀy reaches in one jump: w = 1.5, b = 0.667, MSE = 0.056.",
  };
}

/* ----------------------------------------------------- logistic regression */

function logregSim(): Sim {
  const xs = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5];
  const ys = [0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1];
  const lr = 0.5;
  const n = 200;
  const ws: number[] = [];
  const bs: number[] = [];
  const ll: number[] = [];
  let w = 0;
  let b = 0;
  for (let i = 0; i < n; i++) {
    let gw = 0;
    let gb = 0;
    let l = 0;
    xs.forEach((x, k) => {
      const p = sigmoid(w * x + b);
      l += -Math.log(ys[k] ? p : 1 - p);
      gw += (p - ys[k]) * x;
      gb += p - ys[k];
    });
    ws.push(w);
    bs.push(b);
    ll.push(l / xs.length);
    w -= (lr * gw) / xs.length;
    b -= (lr * gb) / xs.length;
  }
  const sx = lin(0, 6, PAD, W - 12);
  const sy = lin(0, 1, H - PAD, 16);
  return {
    n,
    stageLabel: "Pass/fail points against hours studied, with the S-curve learning to separate them",
    stage: (i) => {
      const w = ws[i];
      const b = bs[i];
      const d = Array.from({ length: 61 }, (_, k) => {
        const x = k / 10;
        return `${k ? "L" : "M"}${sx(x).toFixed(1)},${sy(sigmoid(w * x + b)).toFixed(1)}`;
      }).join(" ");
      const boundary = w !== 0 ? -b / w : NaN;
      return (
        <g>
          <Axes sx={sx} sy={sy} x0={0} x1={6} y0={0} y1={1} />
          <line x1={sx(0)} y1={sy(0.5)} x2={sx(6)} y2={sy(0.5)} stroke="var(--line)" strokeDasharray="3 4" />
          {xs.map((x, k) => {
            const p = sigmoid(w * x + b);
            const loss = -Math.log(ys[k] ? p : 1 - p);
            return (
              <line key={`e${k}`} x1={sx(x)} y1={sy(ys[k])} x2={sx(x)} y2={sy(p)} stroke="var(--danger)" strokeWidth={Math.min(1 + loss * 3, 7)} strokeOpacity={0.55} />
            );
          })}
          <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
          {Number.isFinite(boundary) && boundary > 0 && boundary < 6 ? (
            <g>
              <line x1={sx(boundary)} y1={sy(0)} x2={sx(boundary)} y2={sy(1)} stroke="var(--good)" strokeDasharray="5 4" />
              <text x={sx(boundary) + 4} y={sy(0.5) - 6} fontSize={11} fill="var(--good)">
                boundary
              </text>
            </g>
          ) : null}
          {xs.map((x, k) => (
            <circle key={k} cx={sx(x)} cy={sy(ys[k])} r={5} fill={ys[k] ? CLASS[0] : CLASS[1]} />
          ))}
          <text x={sx(0.1)} y={sy(1) - 4} fontSize={11} fill="var(--muted)">
            pass (y = 1)
          </text>
          <text x={sx(0.1)} y={sy(0) + 16} fontSize={11} fill="var(--muted)">
            fail (y = 0) · x = hours studied
          </text>
        </g>
      );
    },
    chart: { series: [{ values: ll, color: "var(--accent)", label: "log-loss" }], xLabel: "gradient-descent step", yLabel: "mean log-loss" },
    readout: (i) => [
      { label: "w (steepness)", value: f(ws[i], 3) },
      { label: "b (shift)", value: f(bs[i], 3) },
      { label: "boundary x = −b/w", value: ws[i] ? f(-bs[i] / ws[i], 2) : "—" },
      { label: "mean log-loss", value: f(ll[i], 3), tone: "accent" },
    ],
    narrate: (i) =>
      i < 10
        ? "w = 0, b = 0: the curve is flat at 0.5, so every point costs −ln 0.5 = 0.693. Thick red bars are the points the curve is most wrong about."
        : i < n - 40
          ? "Gradient descent: w ← w − η·mean((p − y)·x), b ← b − η·mean(p − y). The curve steepens and slides until pass and fail sit on opposite sides."
          : "The 2.5-hour pass and the 3-hour fail overlap, so the loss can't reach 0. It settles where the two mistakes are balanced.",
  };
}

/* --------------------------------------------------------- ridge and lasso */

const FEATURES = ["Size", "Age", "Garden", "Rooms"];
const W_OLS = [3, -2, 0.5, 1.2];

function shrinkSim(kind: "ridge" | "lasso"): Sim {
  const n = 121;
  const alphas = Array.from({ length: n }, (_, i) => i * 0.05);
  const shrink = (v: number, a: number) =>
    kind === "ridge" ? v / (1 + a) : Math.sign(v) * Math.max(Math.abs(v) - a / 2, 0);
  const paths = W_OLS.map((v) => alphas.map((a) => shrink(v, a)));
  const colors = ["var(--accent)", "var(--warn)", "var(--good)", "var(--violet)"];
  const sx = lin(-0.5, 3.5, PAD + 8, W - 12);
  const sy = lin(-3.2, 3.2, H - 22, 22);
  return {
    n,
    stageLabel: `${kind === "ridge" ? "Ridge" : "Lasso"} weights shrinking as alpha grows, with the plain least-squares weights as outlines`,
    stage: (i) => (
      <g>
        <line x1={PAD} y1={sy(0)} x2={W - 8} y2={sy(0)} stroke="var(--line-strong)" />
        <text x={PAD - 2} y={sy(0) + 4} fontSize={10} textAnchor="end" fill="var(--muted-2)">
          0
        </text>
        {W_OLS.map((v, k) => {
          const now = paths[k][i];
          const cx = sx(k);
          const bw = 46;
          const top = (x: number) => Math.min(sy(0), sy(x));
          return (
            <g key={k}>
              <rect x={cx - bw / 2} y={top(v)} width={bw} height={Math.abs(sy(v) - sy(0))} fill="none" stroke="var(--line-strong)" strokeDasharray="4 3" />
              <rect x={cx - bw / 2} y={top(now)} width={bw} height={Math.max(Math.abs(sy(now) - sy(0)), 0.5)} fill={colors[k]} fillOpacity={0.85} />
              <text x={cx} y={H - 3} textAnchor="middle" fontSize={11} fill="var(--muted)">
                {FEATURES[k]}
              </text>
              <text x={cx} y={now > 0 ? top(now) - 5 : now < 0 ? top(now) + Math.abs(sy(now) - sy(0)) + 13 : sy(0) - 6} textAnchor="middle" fontSize={11} fill={now === 0 ? "var(--danger)" : "var(--text)"} fontFamily="var(--font-mono)">
                {now === 0 ? "0 ✕" : f(now, 2)}
              </text>
            </g>
          );
        })}
        <text x={W - 10} y={18} textAnchor="end" fontSize={11} fill="var(--muted)">
          dashed = plain least squares (α = 0)
        </text>
      </g>
    ),
    chart: {
      series: paths.map((p, k) => ({ values: p, color: colors[k], label: FEATURES[k] })),
      xs: alphas,
      xLabel: "α (penalty strength)",
      yLabel: "weight",
    },
    readout: (i) => {
      const a = alphas[i];
      const ws = paths.map((p) => p[i]);
      const pen = kind === "ridge" ? a * ws.reduce((s, v) => s + v * v, 0) : a * ws.reduce((s, v) => s + Math.abs(v), 0);
      const zeros = ws.filter((v) => v === 0).length;
      return [
        { label: "α", value: f(a, 2) },
        { label: kind === "ridge" ? "penalty α‖w‖²" : "penalty α‖w‖₁", value: f(pen, 2) },
        { label: "weights exactly 0", value: `${zeros} of 4`, tone: zeros ? "danger" : "good" },
        { label: "Size weight", value: f(ws[0], 3) },
      ];
    },
    narrate: (i) => {
      const a = alphas[i];
      if (a === 0) return "α = 0 is plain least squares: Size 3, Age −2, Garden 0.5, Rooms 1.2. These are the dashed outlines.";
      return kind === "ridge"
        ? "On this toy problem with independent features, ridge divides every weight by (1 + α). At α = 1 that's 1.5, −1, 0.25, 0.6: all smaller, none exactly 0."
        : a < 1
          ? "On this toy problem, lasso subtracts α/2 from each weight's size and stops at 0. At α = 1: 2.5, −1.5, 0, 0.7."
          : "Garden hits 0 at α = 1, Rooms at 2.4, Age at 4, Size at 6. The weights that matter least go first, which is why lasso is called feature selection.";
    },
  };
}

/* ------------------------------------------------------------- linear SVM */

function svmSim(): Sim {
  const rand = mulberry32(17);
  const g = gaussian(rand);
  const pts: { x: number; y: number; c: 1 | -1 }[] = [];
  for (let k = 0; k < 12; k++) pts.push({ x: 1.3 + 0.7 * g(), y: 1.1 + 0.7 * g(), c: 1 });
  for (let k = 0; k < 12; k++) pts.push({ x: -1.2 + 0.7 * g(), y: -1.0 + 0.7 * g(), c: -1 });
  const C = 1;
  const n = 220;
  const hist: { w: [number, number]; b: number; J: number; hinge: number; viol: number }[] = [];
  let w: [number, number] = [0.3, -0.9];
  let b = 0.8;
  for (let t = 0; t < n; t++) {
    let hinge = 0;
    let viol = 0;
    let gw0 = w[0];
    let gw1 = w[1];
    let gb = 0;
    for (const p of pts) {
      const m = p.c * (w[0] * p.x + w[1] * p.y + b);
      if (m < 1) {
        hinge += 1 - m;
        viol++;
        gw0 -= C * p.c * p.x;
        gw1 -= C * p.c * p.y;
        gb -= C * p.c;
      }
    }
    const J = 0.5 * (w[0] * w[0] + w[1] * w[1]) + C * hinge;
    hist.push({ w: [w[0], w[1]], b, J, hinge, viol });
    const eta = 0.02 / (1 + 0.01 * t);
    w = [w[0] - eta * gw0, w[1] - eta * gw1];
    b -= eta * gb;
  }
  const D = 3.2;
  const sx = lin(-D, D, PAD, W - 12);
  const sy = lin(-D, D, H - 10, 10);
  const lineAt = (w: [number, number], b: number, off: number) => {
    // w0 x + w1 y + b = off, clipped to the box by sampling x at both edges or y at both edges
    if (Math.abs(w[1]) > Math.abs(w[0])) {
      const y = (x: number) => (off - b - w[0] * x) / w[1];
      return [sx(-D), sy(y(-D)), sx(D), sy(y(D))];
    }
    const x = (y: number) => (off - b - w[1] * y) / w[0];
    return [sx(x(-D)), sy(-D), sx(x(D)), sy(D)];
  };
  return {
    n,
    stageLabel: "Two classes of points and an SVM street, centre line and margins, moving to the widest gap",
    stage: (i) => {
      const { w, b } = hist[i];
      const [a1, a2, a3, a4] = lineAt(w, b, 0);
      const [p1, p2, p3, p4] = lineAt(w, b, 1);
      const [m1, m2, m3, m4] = lineAt(w, b, -1);
      return (
        <g>
          <defs>
            <clipPath id="svm-clip">
              <rect x={PAD} y={10} width={W - 12 - PAD} height={H - 20} />
            </clipPath>
          </defs>
          <rect x={PAD} y={10} width={W - 12 - PAD} height={H - 20} fill="none" stroke="var(--line)" />
          <g clipPath="url(#svm-clip)">
            <polygon points={`${p1},${p2} ${p3},${p4} ${m3},${m4} ${m1},${m2}`} fill="var(--accent-soft)" fillOpacity={0.6} />
            <line x1={p1} y1={p2} x2={p3} y2={p4} stroke="var(--muted)" strokeDasharray="5 4" />
            <line x1={m1} y1={m2} x2={m3} y2={m4} stroke="var(--muted)" strokeDasharray="5 4" />
            <line x1={a1} y1={a2} x2={a3} y2={a4} stroke="var(--text)" strokeWidth={2} />
          </g>
          {pts.map((p, k) => {
            const m = p.c * (w[0] * p.x + w[1] * p.y + b);
            return (
              <g key={k}>
                {m < 1 ? <circle cx={sx(p.x)} cy={sy(p.y)} r={9} fill="none" stroke="var(--danger)" strokeWidth={1.8} /> : null}
                <circle cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill={p.c === 1 ? CLASS[0] : CLASS[1]} />
              </g>
            );
          })}
          <text x={PAD + 6} y={24} fontSize={11} fill="var(--danger)">
            red ring = hinge &gt; 0 (inside the street or wrong side)
          </text>
        </g>
      );
    },
    chart: { series: [{ values: hist.map((h) => h.J), color: "var(--accent)", label: "objective" }], xLabel: "subgradient step", yLabel: "½‖w‖² + C·Σ hinge (log)", log: true },
    readout: (i) => {
      const h = hist[i];
      const norm = Math.hypot(h.w[0], h.w[1]);
      return [
        { label: "street width 2/‖w‖", value: f(2 / norm, 2) },
        { label: "Σ hinge", value: f(h.hinge, 2), tone: h.hinge < 0.5 ? "good" : "warn" },
        { label: "points with hinge > 0", value: `${h.viol} of ${pts.length}` },
        { label: "objective", value: f(h.J, 2), tone: "accent" },
      ];
    },
    narrate: (i) =>
      i < 25
        ? "The starting street points the wrong way, so many points sit on the wrong side and every one of them pays hinge."
        : i < n - 60
          ? "Each step pulls the street towards the ringed points (the hinge term) while shrinking ‖w‖ (the ½‖w‖² term). Shrinking ‖w‖ is the same as widening the street."
          : "Only the points touching the dashed edges still matter. Those are the support vectors. Every other point could move and the street would not change.",
  };
}

/* ---------------------------------------------------------- decision tree */

interface TPt {
  x: number;
  y: number;
  c: 0 | 1;
}
interface Split {
  feat: "x" | "y";
  t: number;
}

function giniOf(pts: TPt[]) {
  if (!pts.length) return 0;
  const p = pts.filter((q) => q.c === 0).length / pts.length;
  return 1 - p * p - (1 - p) * (1 - p);
}
function weightedGini(pts: TPt[], s: Split) {
  const L = pts.filter((p) => p[s.feat] < s.t);
  const R = pts.filter((p) => p[s.feat] >= s.t);
  return (L.length * giniOf(L) + R.length * giniOf(R)) / pts.length;
}
function candidates(pts: TPt[], feat: "x" | "y") {
  const v = [...new Set(pts.map((p) => +p[feat].toFixed(3)))].sort((a, b) => a - b);
  return v.slice(1).map((u, k) => (u + v[k]) / 2);
}

function treeSim(): Sim {
  const rand = mulberry32(5);
  const pts: TPt[] = Array.from({ length: 30 }, () => {
    const x = rand() * 10;
    const y = rand() * 10;
    return { x, y, c: x < 4 || y > 6.5 ? 0 : 1 };
  });

  interface Frame {
    node: string;
    nodePts: TPt[];
    region: [number, number, number, number];
    cand: Split | null;
    g: number;
    best: Split | null;
    bestG: number;
    committed: { s: Split; region: [number, number, number, number] }[];
  }
  const frames: Frame[] = [];
  const committed: Frame["committed"] = [];

  const search = (node: string, nodePts: TPt[], region: [number, number, number, number]) => {
    let best: Split | null = null;
    let bestG = Infinity;
    for (const feat of ["x", "y"] as const) {
      for (const t of candidates(nodePts, feat)) {
        const s = { feat, t };
        const g = weightedGini(nodePts, s);
        if (g < bestG - 1e-12) {
          bestG = g;
          best = s;
        }
        frames.push({ node, nodePts, region, cand: s, g, best, bestG, committed: [...committed] });
      }
    }
    if (best) committed.push({ s: best, region });
    for (let k = 0; k < 18; k++) frames.push({ node, nodePts, region, cand: null, g: NaN, best, bestG, committed: [...committed] });
    return best!;
  };

  const root = search("root", pts, [0, 10, 0, 10]);
  const left = pts.filter((p) => p[root.feat] < root.t);
  const right = pts.filter((p) => p[root.feat] >= root.t);
  const impure = giniOf(left) > giniOf(right) ? "left" : "right";
  const childPts = impure === "left" ? left : right;
  const region: [number, number, number, number] =
    root.feat === "x"
      ? impure === "left" ? [0, root.t, 0, 10] : [root.t, 10, 0, 10]
      : impure === "left" ? [0, 10, 0, root.t] : [0, 10, root.t, 10];
  search(
    `${root.feat === "x" ? (impure === "left" ? "left" : "right") : impure === "left" ? "lower" : "upper"} side`,
    childPts,
    region,
  );

  const sx = lin(0, 10, PAD, W - 12);
  const sy = lin(0, 10, H - 10, 10);
  const segFor = (s: Split, r: [number, number, number, number]) =>
    s.feat === "x" ? [sx(s.t), sy(r[2]), sx(s.t), sy(r[3])] : [sx(r[0]), sy(s.t), sx(r[1]), sy(s.t)];
  const accuracy = (fr: Frame) => {
    // Leaves = regions cut by committed splits; predict majority class in each.
    const leafOf = (p: TPt) =>
      fr.committed
        .map((c) => {
          const [x0, x1, y0, y1] = c.region;
          if (p.x < x0 || p.x >= x1 || p.y < y0 || p.y >= y1) return "";
          return `${c.s.feat}${c.s.t}${p[c.s.feat] < c.s.t ? "<" : ">"}`;
        })
        .join("|");
    const groups = new Map<string, TPt[]>();
    pts.forEach((p) => groups.set(leafOf(p), [...(groups.get(leafOf(p)) ?? []), p]));
    let ok = 0;
    groups.forEach((g) => {
      const a = g.filter((p) => p.c === 0).length;
      ok += Math.max(a, g.length - a);
    });
    return ok / pts.length;
  };

  return {
    n: frames.length,
    stageLabel: "Points of two classes, with a dashed candidate cut sweeping across and the chosen cuts drawn solid",
    stage: (i) => {
      const fr = frames[i];
      const [rx0, rx1, ry0, ry1] = fr.region;
      return (
        <g>
          <rect x={PAD} y={10} width={W - 12 - PAD} height={H - 20} fill="none" stroke="var(--line)" />
          <rect x={sx(rx0)} y={sy(ry1)} width={sx(rx1) - sx(rx0)} height={sy(ry0) - sy(ry1)} fill="var(--accent-soft)" fillOpacity={0.35} />
          {fr.committed.map((c, k) => {
            const [a, b2, c2, d] = segFor(c.s, c.region);
            return <line key={k} x1={a} y1={b2} x2={c2} y2={d} stroke="var(--text)" strokeWidth={2.5} />;
          })}
          {fr.cand
            ? (() => {
                const [a, b2, c2, d] = segFor(fr.cand, fr.region);
                return <line x1={a} y1={b2} x2={c2} y2={d} stroke="var(--accent-2)" strokeWidth={2} strokeDasharray="6 4" />;
              })()
            : null}
          {pts.map((p, k) => (
            <circle key={k} cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill={CLASS[p.c]} fillOpacity={fr.nodePts.includes(p) ? 1 : 0.3} />
          ))}
        </g>
      );
    },
    chart: { series: [{ values: frames.map((fr) => fr.g), color: "var(--accent-2)", label: "weighted Gini" }], xLabel: "candidate split tried", yLabel: "weighted Gini of the cut" },
    readout: (i) => {
      const fr = frames[i];
      return [
        { label: "searching", value: fr.node },
        { label: "trying", value: fr.cand ? `${fr.cand.feat} < ${f(fr.cand.t, 2)}` : "— locked in" },
        { label: "weighted Gini", value: fr.cand ? f(fr.g, 3) : "—" },
        { label: "best so far", value: fr.best ? `${fr.best.feat} < ${f(fr.best.t, 2)} (${f(fr.bestG, 3)})` : "—", tone: "good" },
        { label: "node Gini before", value: f(giniOf(fr.nodePts), 3) },
        { label: "training accuracy", value: `${Math.round(accuracy(fr) * 100)}%`, tone: "accent" },
      ];
    },
    narrate: (i) => {
      const fr = frames[i];
      if (fr.node === "root")
        return fr.cand
          ? "Greedy search at the root: try every cut on x, then every cut on y. Each try is scored by the weighted Gini of the two sides; lower means purer."
          : "The lowest-Gini cut is locked in and never reconsidered. That's what greedy means.";
      return fr.cand
        ? "Now the same search, but only inside the mixed side (highlighted). The pure side is already a finished leaf."
        : "Two questions, every leaf pure: training accuracy 100%. Real trees stop earlier using max_depth or min_samples_leaf, so they don't memorise noise.";
    },
  };
}

/* ---------------------------------------------------------------- k-means */

function kmeansSim(): Sim {
  const rand = mulberry32(11);
  const g = gaussian(rand);
  const centres = [
    [-1.8, 1.2],
    [1.6, 1.4],
    [0, -1.6],
  ];
  const pts = centres.flatMap(([cx, cy]) => Array.from({ length: 14 }, () => [cx + 0.55 * g(), cy + 0.55 * g()]));
  let cents = [
    [-2.6, -2.4],
    [-2.0, -2.7],
    [-2.5, -1.8],
  ];
  const nearest = (p: number[], cs: number[][]) => {
    let best = 0;
    let bd = Infinity;
    cs.forEach((c, k) => {
      const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2;
      if (d < bd) {
        bd = d;
        best = k;
      }
    });
    return best;
  };
  const sse = (cs: number[][], asg: number[]) => pts.reduce((s, p, k) => s + (p[0] - cs[asg[k]][0]) ** 2 + (p[1] - cs[asg[k]][1]) ** 2, 0);

  interface Frame {
    it: number;
    phase: "assign" | "update" | "done";
    cents: number[][];
    asg: number[];
    changed: number;
    sse: number;
  }
  const frames: Frame[] = [];
  let asg = pts.map(() => -1);
  for (let it = 1; it <= 10; it++) {
    const next = pts.map((p) => nearest(p, cents));
    const changed = next.filter((v, k) => v !== asg[k]).length;
    asg = next;
    for (let k = 0; k < 16; k++) frames.push({ it, phase: "assign", cents, asg, changed, sse: sse(cents, asg) });
    const target = cents.map((c, j) => {
      const mine = pts.filter((_, k) => asg[k] === j);
      return mine.length ? [mine.reduce((s, p) => s + p[0], 0) / mine.length, mine.reduce((s, p) => s + p[1], 0) / mine.length] : c;
    });
    const moved = target.some((t, j) => Math.hypot(t[0] - cents[j][0], t[1] - cents[j][1]) > 1e-6);
    if (!moved || changed === 0) {
      for (let k = 0; k < 20; k++) frames.push({ it, phase: "done", cents, asg, changed: 0, sse: sse(cents, asg) });
      break;
    }
    for (let k = 1; k <= 16; k++) {
      const u = k / 16;
      const e = u * u * (3 - 2 * u);
      const cs = cents.map((c, j) => [c[0] + (target[j][0] - c[0]) * e, c[1] + (target[j][1] - c[1]) * e]);
      frames.push({ it, phase: "update", cents: cs, asg, changed, sse: sse(cs, asg) });
    }
    cents = target;
  }

  const D = 3.4;
  const sx = lin(-D, D, PAD, W - 12);
  const sy = lin(-D, D, H - 10, 10);
  return {
    n: frames.length,
    stageLabel: "Points in three clumps and three centroids alternating between assigning points and moving to their mean",
    stage: (i) => {
      const fr = frames[i];
      return (
        <g>
          <rect x={PAD} y={10} width={W - 12 - PAD} height={H - 20} fill="none" stroke="var(--line)" />
          {fr.phase !== "done"
            ? pts.map((p, k) => (
                <line key={`l${k}`} x1={sx(p[0])} y1={sy(p[1])} x2={sx(fr.cents[fr.asg[k]][0])} y2={sy(fr.cents[fr.asg[k]][1])} stroke={CLASS[fr.asg[k]]} strokeOpacity={0.25} />
              ))
            : null}
          {pts.map((p, k) => (
            <circle key={k} cx={sx(p[0])} cy={sy(p[1])} r={4} fill={CLASS[fr.asg[k]]} />
          ))}
          {fr.cents.map((c, j) => (
            <g key={j} transform={`translate(${sx(c[0])},${sy(c[1])})`}>
              <rect x={-8} y={-8} width={16} height={16} transform="rotate(45)" fill="var(--ink-2)" stroke={CLASS[j]} strokeWidth={3} />
            </g>
          ))}
          <text x={PAD + 6} y={24} fontSize={11} fill="var(--muted)">
            ◆ = centroid · thin lines = distance being squared
          </text>
        </g>
      );
    },
    chart: { series: [{ values: frames.map((fr) => fr.sse), color: "var(--accent)", label: "SSE" }], xLabel: "animation time", yLabel: "SSE (log)", log: true },
    readout: (i) => {
      const fr = frames[i];
      return [
        { label: "iteration", value: `${fr.it}` },
        { label: "step", value: fr.phase === "assign" ? "assign" : fr.phase === "update" ? "update" : "converged" },
        { label: "points that switched", value: `${fr.changed}`, tone: fr.changed ? "warn" : "good" },
        { label: "SSE", value: f(fr.sse, 1), tone: "accent" },
      ];
    },
    narrate: (i) => {
      const fr = frames[i];
      if (fr.phase === "done") return "Nothing switched, so nothing can move: converged. SSE went down at every step, and k-means guarantees that. A bad start can still trap it in a worse answer, which is why n_init restarts several times.";
      if (fr.it === 1 && fr.phase === "assign") return "A deliberately bad start: all three centroids crammed in one corner. Assign step: every point joins its nearest centroid.";
      return fr.phase === "assign"
        ? "Assign: each point picks its nearest centroid. Points that switch colour are the ones that just found a closer centre."
        : "Update: each centroid slides to the mean of its own points. Moving to the mean is exactly what minimises that cluster's squared distances.";
    },
  };
}

const SIMS: Record<AlgoId, () => Sim> = {
  linreg: linregSim,
  logreg: logregSim,
  ridge: () => shrinkSim("ridge"),
  lasso: () => shrinkSim("lasso"),
  svm: svmSim,
  tree: treeSim,
  kmeans: kmeansSim,
};

/* ------------------------------------------------------------ line chart */

function LineChart({ chart, i }: { chart: Sim["chart"]; i: number }) {
  const CW = 360;
  const CH = 150;
  const L = 44;
  const R = 10;
  const T = 24;
  const B = 30;
  const n = chart.series[0].values.length;
  const xs = chart.xs ?? Array.from({ length: n }, (_, k) => k);
  const tr = (v: number) => (chart.log ? Math.log10(Math.max(v, 1e-6)) : v);
  const all = chart.series.flatMap((s) => s.values.filter(Number.isFinite).map(tr));
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (!chart.log) lo = Math.min(lo, 0);
  if (hi - lo < 1e-9) hi = lo + 1;
  const sx = lin(xs[0], xs[n - 1], L, CW - R);
  const sy = lin(lo, hi, CH - B, T);
  const ticks = [lo, (lo + hi) / 2, hi];
  return (
    <Stage viewBox={`0 0 ${CW} ${CH}`} label={`${chart.yLabel} against ${chart.xLabel}`}>
      <line x1={L} y1={CH - B} x2={CW - R} y2={CH - B} stroke="var(--line-strong)" />
      <line x1={L} y1={T} x2={L} y2={CH - B} stroke="var(--line-strong)" />
      {ticks.map((t, k) => (
        <text key={k} x={L - 5} y={sy(t) + 4} textAnchor="end" fontSize={10} fill="var(--muted-2)" fontFamily="var(--font-mono)">
          {chart.log ? (10 ** t < 10 ? (10 ** t).toPrecision(2) : f(10 ** t, 0)) : f(t, Math.abs(hi - lo) < 2 ? 2 : 1)}
        </text>
      ))}
      {!chart.log && lo < 0 ? <line x1={L} y1={sy(0)} x2={CW - R} y2={sy(0)} stroke="var(--line)" strokeDasharray="3 3" /> : null}
      {chart.series.map((s, si) => {
        let d = "";
        let pen = false;
        for (let k = 0; k <= i && k < n; k++) {
          const v = s.values[k];
          if (!Number.isFinite(v)) {
            pen = false;
            continue;
          }
          d += `${pen ? "L" : "M"}${sx(xs[k]).toFixed(1)},${sy(tr(v)).toFixed(1)} `;
          pen = true;
        }
        const last = s.values[Math.min(i, n - 1)];
        return (
          <g key={si}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2} />
            {Number.isFinite(last) ? <circle cx={sx(xs[Math.min(i, n - 1)])} cy={sy(tr(last))} r={3.5} fill={s.color} /> : null}
          </g>
        );
      })}
      <text x={(L + CW - R) / 2} y={CH - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
        {chart.xLabel}
      </text>
      <text x={L} y={14} fontSize={11} fill="var(--muted)">
        {chart.yLabel}
      </text>
      {chart.series.length > 1
        ? chart.series.map((s, si) => (
            <text key={si} x={CW - R - 4 - (chart.series.length - 1 - si) * 44} y={14} textAnchor="end" fontSize={10.5} fill={s.color}>
              {s.label}
            </text>
          ))
        : null}
    </Stage>
  );
}

/* ---------------------------------------------------------------- dialog */

function AnimationDialog({ row, onClose }: { row: Row; onClose: () => void }) {
  const sim = useMemo(() => SIMS[row.id](), [row.id]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const scrubId = useId();

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setI((v) => {
        if (v >= sim.n - 1) {
          setPlaying(false);
          return v;
        }
        return Math.min(v + speed, sim.n - 1);
      });
    }, 45);
    return () => window.clearInterval(id);
  }, [playing, speed, sim.n]);

  const onKey = (e: React.KeyboardEvent) => {
    // Keep the portal's global shortcuts (j/k, t, /) from firing behind the dialog.
    e.stopPropagation();
    if (e.key === "Escape") onClose();
  };

  const togglePlay = () => {
    if (i >= sim.n - 1) setI(0);
    setPlaying((p) => !p);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-6"
      style={{ background: "color-mix(in srgb, var(--ink) 72%, transparent)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKey}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[940px] overflow-hidden rounded-[var(--radius)] border"
        style={{ borderColor: "var(--line-strong)", background: "var(--panel)", boxShadow: "var(--shadow-2)" }}
      >
        <header className="flex items-start justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--line)", background: "var(--panel-2)" }}>
          <div className="min-w-0">
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--accent-2)" }}>
              Watch it learn
            </div>
            <h4 id={titleId} className="mt-0.5 text-[17px] font-semibold tracking-[-0.01em]">
              {row.name} · <span className="font-mono text-[15px]">{row.model}</span>
            </h4>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close animation"
            className="inline-flex shrink-0 items-center justify-center rounded-md border"
            style={{ width: 34, height: 34, minWidth: 34, borderColor: "var(--line-strong)", color: "var(--muted)" }}
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="flex flex-col gap-4 p-4 md:flex-row">
          <div className="min-w-0 md:basis-[55%]">
            <Stage viewBox={`0 0 ${W} ${H}`} label={sim.stageLabel}>
              {sim.stage(i)}
            </Stage>
          </div>
          <div className="flex min-w-0 flex-col gap-3 md:basis-[45%]">
            <LineChart chart={sim.chart} i={i} />
            <Readout items={sim.readout(i)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4">
          <CtlButton onClick={togglePlay} label={playing ? "Pause" : i >= sim.n - 1 ? "Replay" : "Play"}>
            {playing ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
          </CtlButton>
          <CtlButton
            onClick={() => {
              setPlaying(false);
              setI((v) => Math.min(v + 1, sim.n - 1));
            }}
            label="Step"
          >
            <SkipForward size={14} aria-hidden />
          </CtlButton>
          <CtlButton
            onClick={() => {
              setI(0);
              setPlaying(true);
            }}
            label="Restart"
          >
            <RotateCcw size={14} aria-hidden />
          </CtlButton>
          <CtlButton onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))} label={`Speed ${speed}×`} />
          <label htmlFor={scrubId} className="sr-only">
            Animation frame
          </label>
          <input
            id={scrubId}
            type="range"
            min={0}
            max={sim.n - 1}
            value={i}
            onChange={(e) => {
              setPlaying(false);
              setI(Number(e.target.value));
            }}
            className="h-1.5 min-w-[120px] flex-1 cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]"
            style={{ background: "var(--line-strong)" }}
          />
        </div>

        <p aria-live="polite" className="mx-4 mt-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-[14.5px]" style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}>
          {sim.narrate(i)}
        </p>

        <dl className="mt-3 border-t px-4 py-3 text-[14px]" style={{ borderColor: "var(--line)" }}>
          {[
            ["Model", `${row.model}. ${row.params}`],
            ["Loss", row.loss],
            ["Loss, worked example", row.lossExample],
            ["Optimiser", `${row.optimiser}. ${row.optimiserNote}`],
          ].map(([k, v]) => (
            <div key={k} className="py-1 sm:flex sm:gap-3">
              <dt className="shrink-0 font-semibold sm:w-[160px]" style={{ color: "var(--muted)" }}>
                {k}
              </dt>
              <dd>{v}</dd>
            </div>
          ))}
          <div className="mt-2 rounded-[var(--radius-sm)] px-3 py-2" style={{ background: "var(--accent-soft)" }}>
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
              Remember ·{" "}
            </span>
            {row.hook}
          </div>
        </dl>
      </div>
    </div>
  );
}

function CtlButton({ onClick, label, children }: { onClick: () => void; label: string; children?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium"
      style={{ borderColor: "var(--line-strong)", color: "var(--text)" }}
    >
      {children}
      {label}
    </button>
  );
}

/* ------------------------------------------------------------ the table */

export default function AlgoAtlas() {
  const [open, setOpen] = useState<AlgoId | null>(null);
  const triggers = useRef<Partial<Record<AlgoId, HTMLButtonElement | null>>>({});
  const close = useCallback(() => {
    const id = open;
    setOpen(null);
    if (id) requestAnimationFrame(() => triggers.current[id]?.focus());
  }, [open]);
  const row = ROWS.find((r) => r.id === open);

  const muted = { color: "var(--muted)" } as const;
  return (
    <figure className="my-6 w-full min-w-0">
      <div className="overflow-x-auto rounded-[var(--radius)] border" style={{ borderColor: "var(--line)" }}>
        <table className="w-full min-w-[760px] border-collapse text-[14px]">
          <thead>
            <tr style={{ background: "var(--panel)" }}>
              {["Algorithm", "Model shape & parameters", "Loss, with a worked example", "Optimiser"].map((h) => (
                <th key={h} scope="col" className="border-b px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, ri) => (
              <tr key={r.id} style={{ background: ri % 2 ? "var(--panel)" : "transparent" }}>
                <td className="w-[150px] border-t px-3 py-3 align-top" style={{ borderColor: "var(--line)" }}>
                  <div className="font-semibold">{r.name}</div>
                  <button
                    ref={(el) => {
                      triggers.current[r.id] = el;
                    }}
                    type="button"
                    onClick={() => setOpen(r.id)}
                    aria-haspopup="dialog"
                    aria-label={`Animate ${r.name}`}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-medium transition-colors"
                    style={{ borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--text)" }}
                  >
                    <Play size={12} aria-hidden /> Animate
                  </button>
                </td>
                <td className="w-[210px] border-t px-3 py-3 align-top" style={{ borderColor: "var(--line)" }}>
                  <div className="font-mono text-[13.5px]" style={{ color: "var(--accent-2)" }}>
                    {r.model}
                  </div>
                  <div className="mt-1 text-[13px] leading-snug" style={muted}>
                    {r.params}
                  </div>
                </td>
                <td className="border-t px-3 py-3 align-top" style={{ borderColor: "var(--line)" }}>
                  <div className="font-medium">{r.loss}</div>
                  <div className="mt-1 text-[13px] leading-snug" style={muted}>
                    <span style={{ color: "var(--accent)" }}>e.g. </span>
                    {r.lossExample}
                  </div>
                </td>
                <td className="w-[190px] border-t px-3 py-3 align-top" style={{ borderColor: "var(--line)" }}>
                  <div className="font-medium">{r.optimiser}</div>
                  <div className="mt-1 text-[13px] leading-snug" style={muted}>
                    {r.optimiserNote}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 text-[13.5px]" style={{ color: "var(--muted-2)" }}>
        Same four columns, different entries. Press <b>Animate</b> on any row to watch its optimiser drive its loss down on a toy problem. Fill this table in yourself as each algorithm arrives and the course stops feeling like a list.
      </figcaption>
      {/* Portalled to <body>: chapter blocks animate in with transforms, which would
          otherwise trap a position:fixed dialog inside the table's box. Only
          rendered after a click, so document exists. */}
      {row ? createPortal(<AnimationDialog key={row.id} row={row} onClose={close} />, document.body) : null}
    </figure>
  );
}
