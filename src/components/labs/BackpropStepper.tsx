"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Choice, LabButton, LabFrame, Readout, Slider, Stage } from "./LabKit";
import { LABS } from "@/lib/labs";

/**
 * m8 · Backpropagation on a 2-2-1 network, one multiplication at a time.
 *
 * Hidden layer: ReLU. Output: ŷ = σ(v₁h₁ + v₂h₂ + c). Loss: binary cross-entropy.
 * Every gradient on screen is (gradient arriving from the right) × (local slope),
 * and every weight gradient is checked against a centred finite difference.
 */

/* ---------------------------------------------------------------------------
   Maths — pure, no React. (The verification script in the scratchpad extracts
   everything between the two "core" markers and checks it.)
   --------------------------------------------------------------------------- */
// core:begin
export interface Params {
  w11: number;
  w12: number;
  b1: number;
  w21: number;
  w22: number;
  b2: number;
  v1: number;
  v2: number;
  c: number;
}
export type ParamKey = keyof Params;

export const INITIAL: Params = { w11: 0.5, w12: -0.3, b1: 0.1, w21: -0.4, w22: 0.9, b2: 0.2, v1: 0.7, v2: -0.5, c: -0.1 };

export interface Fwd {
  z1: number;
  h1: number;
  z2: number;
  h2: number;
  z: number;
  yhat: number;
  L: number;
}

const relu = (v: number) => (v > 0 ? v : 0);
const sigmoid = (v: number) => 1 / (1 + Math.exp(-v));

export function forward(p: Params, x1: number, x2: number, y: number): Fwd {
  const z1 = p.w11 * x1 + p.w12 * x2 + p.b1;
  const h1 = relu(z1);
  const z2 = p.w21 * x1 + p.w22 * x2 + p.b2;
  const h2 = relu(z2);
  const z = p.v1 * h1 + p.v2 * h2 + p.c;
  const yhat = sigmoid(z);
  // −[y ln ŷ + (1−y) ln(1−ŷ)], written on the logit z so it never takes log(0)
  const L = Math.max(z, 0) - z * y + Math.log1p(Math.exp(-Math.abs(z)));
  return { z1, h1, z2, h2, z, yhat, L };
}

export type Grads = Params & { dyhat: number; dz: number; dh1: number; dh2: number; dz1: number; dz2: number };

export function backward(p: Params, f: Fwd, x1: number, x2: number, y: number): Grads {
  const dyhat = -y / f.yhat + (1 - y) / (1 - f.yhat); // ∂L/∂ŷ (shown, but not needed)
  const dz = f.yhat - y; // sigmoid + BCE collapse to this
  const v1 = dz * f.h1;
  const v2 = dz * f.h2;
  const c = dz;
  const dh1 = dz * p.v1;
  const dh2 = dz * p.v2;
  const dz1 = dh1 * (f.z1 > 0 ? 1 : 0);
  const dz2 = dh2 * (f.z2 > 0 ? 1 : 0);
  return {
    dyhat,
    dz,
    v1,
    v2,
    c,
    dh1,
    dh2,
    dz1,
    dz2,
    w11: dz1 * x1,
    w12: dz1 * x2,
    b1: dz1,
    w21: dz2 * x1,
    w22: dz2 * x2,
    b2: dz2,
  };
}

export const PARAM_KEYS: ParamKey[] = ["w11", "w12", "b1", "w21", "w22", "b2", "v1", "v2", "c"];

export function applyUpdate(p: Params, g: Grads, eta: number): Params {
  const out = { ...p };
  for (const k of PARAM_KEYS) out[k] = p[k] - eta * g[k];
  return out;
}

export const EPS = 1e-4;

/** Centred finite difference: nudge one parameter both ways and re-run the forward pass. */
export function numericalGrad(p: Params, key: ParamKey, x1: number, x2: number, y: number) {
  const plus = forward({ ...p, [key]: p[key] + EPS }, x1, x2, y).L;
  const minus = forward({ ...p, [key]: p[key] - EPS }, x1, x2, y).L;
  return { plus, minus, est: (plus - minus) / (2 * EPS) };
}

/** Display: fixed 4 dp with a real minus sign and no "−0.0000". */
export function f4(v: number): string {
  const s = v.toFixed(4);
  return (s === "-0.0000" ? "0.0000" : s).replace("-", "−");
}

/** Display for parameters and inputs: up to 4 dp, trailing zeros trimmed (0.5, −0.3, 0.7962). */
export function pn(v: number): string {
  const r = Number(v.toFixed(4));
  return String(Object.is(r, -0) ? 0 : r).replace("-", "−");
}
// core:end

const par = (s: string) => (s.startsWith("−") ? `(${s})` : s);

/* ---------------------------------------------------------------------------
   The step script
   --------------------------------------------------------------------------- */
const STEPS = [
  "start",
  "z1",
  "h1",
  "z2",
  "h2",
  "z",
  "yhat",
  "L",
  "dz",
  "dout",
  "dh1",
  "dz1",
  "dw1",
  "dh2",
  "dz2",
  "dw2",
  "update",
] as const;
type StepId = (typeof STEPS)[number];
const N = STEPS.length - 1; // 16
const idx = (id: StepId) => STEPS.indexOf(id);

const phaseOf = (k: number) => (k === 0 ? "ready" : k <= idx("L") ? "forward" : k < N ? "backward" : "update");

const SYM: Record<ParamKey, string> = {
  w11: "w₁₁",
  w12: "w₁₂",
  b1: "b₁",
  w21: "w₂₁",
  w22: "w₂₂",
  b2: "b₂",
  v1: "v₁",
  v2: "v₂",
  c: "c",
};

/* ---------------------------------------------------------------------------
   Geometry of the computational graph (viewBox 620 × 362)
   --------------------------------------------------------------------------- */
const VW = 620;
const VH = 362;
const R_IN = 26;
const R_L = 28;
const BW = 120;
const BH = 60;
type Pt = { x: number; y: number };
const X1: Pt = { x: 56, y: 95 };
const X2: Pt = { x: 56, y: 255 };
const N1: Pt = { x: 240, y: 95 };
const N2: Pt = { x: 240, y: 255 };
const OUT: Pt = { x: 450, y: 175 };
const LN: Pt = { x: 578, y: 175 };

const leftOf = (b: Pt): Pt => ({ x: b.x - BW / 2, y: b.y });
const rightOf = (b: Pt): Pt => ({ x: b.x + BW / 2, y: b.y });
const zHalf = (b: Pt): Pt => ({ x: b.x - BW / 4, y: b.y });
const hHalf = (b: Pt): Pt => ({ x: b.x + BW / 4, y: b.y });
function fromCircle(c: Pt, r: number, to: Pt): Pt {
  const dx = to.x - c.x;
  const dy = to.y - c.y;
  const d = Math.hypot(dx, dy);
  return { x: c.x + (dx / d) * r, y: c.y + (dy / d) * r };
}
const along = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

type EdgeId = "w11" | "w12" | "w21" | "w22" | "v1" | "v2" | "out";
const EDGES: Record<EdgeId, { a: Pt; b: Pt; t: number }> = {
  w11: { a: fromCircle(X1, R_IN, leftOf(N1)), b: leftOf(N1), t: 0.5 },
  w12: { a: fromCircle(X2, R_IN, leftOf(N1)), b: leftOf(N1), t: 0.62 },
  w21: { a: fromCircle(X1, R_IN, leftOf(N2)), b: leftOf(N2), t: 0.62 },
  w22: { a: fromCircle(X2, R_IN, leftOf(N2)), b: leftOf(N2), t: 0.5 },
  v1: { a: rightOf(N1), b: leftOf(OUT), t: 0.5 },
  v2: { a: rightOf(N2), b: leftOf(OUT), t: 0.5 },
  out: { a: rightOf(OUT), b: fromCircle(LN, R_L, rightOf(OUT)), t: 0.5 },
};

/** Which edges carry the pulse on each step, and in which direction. */
type Seg = [Pt, Pt];
function pulseSegments(id: StepId): Seg[] {
  const e = (k: EdgeId, rev = false): Seg => (rev ? [EDGES[k].b, EDGES[k].a] : [EDGES[k].a, EDGES[k].b]);
  switch (id) {
    case "z1":
      return [e("w11"), e("w12")];
    case "h1":
      return [[zHalf(N1), hHalf(N1)]];
    case "z2":
      return [e("w21"), e("w22")];
    case "h2":
      return [[zHalf(N2), hHalf(N2)]];
    case "z":
      return [e("v1"), e("v2")];
    case "yhat":
      return [[zHalf(OUT), hHalf(OUT)]];
    case "L":
      return [e("out")];
    case "dz":
      return [e("out", true), [hHalf(OUT), zHalf(OUT)]];
    case "dout":
      return [
        [zHalf(OUT), along(EDGES.v1.b, EDGES.v1.a, 0.5)],
        [zHalf(OUT), along(EDGES.v2.b, EDGES.v2.a, 0.5)],
      ];
    case "dh1":
      return [e("v1", true)];
    case "dz1":
      return [[hHalf(N1), zHalf(N1)]];
    case "dw1":
      return [e("w11", true), e("w12", true)];
    case "dh2":
      return [e("v2", true)];
    case "dz2":
      return [[hHalf(N2), zHalf(N2)]];
    case "dw2":
      return [e("w21", true), e("w22", true)];
    default:
      return [];
  }
}

const STEP_EDGES: Partial<Record<StepId, EdgeId[]>> = {
  z1: ["w11", "w12"],
  z2: ["w21", "w22"],
  z: ["v1", "v2"],
  L: ["out"],
  dz: ["out"],
  dout: ["v1", "v2"],
  dh1: ["v1"],
  dw1: ["w11", "w12"],
  dh2: ["v2"],
  dw2: ["w21", "w22"],
  update: ["w11", "w12", "w21", "w22", "v1", "v2"],
};

const CH = 6.9; // approx. width of one 11.5-unit monospace glyph

/** A weight label sitting on its edge: name = value, and below it the gradient or the new value. */
function Pill({
  at,
  top,
  bottom,
  bottomTone,
  hot,
}: {
  at: Pt;
  top: string;
  bottom?: string;
  bottomTone?: "grad" | "new";
  hot?: boolean;
}) {
  const w = Math.max(top.length, bottom?.length ?? 0) * CH + 14;
  const h = bottom ? 34 : 20;
  return (
    <g fontFamily="monospace" fontSize="11.5" textAnchor="middle">
      <rect
        x={at.x - w / 2}
        y={at.y - h / 2}
        width={w}
        height={h}
        rx="6"
        fill="var(--panel)"
        stroke={hot ? "var(--accent)" : "var(--line-strong)"}
        strokeWidth={hot ? 1.6 : 1}
      />
      <text x={at.x} y={at.y - h / 2 + 14} fill="var(--text)">
        {top}
      </text>
      {bottom ? (
        <text x={at.x} y={at.y - h / 2 + 28} fill={bottomTone === "new" ? "var(--good)" : "var(--warn)"}>
          {bottom}
        </text>
      ) : null}
    </g>
  );
}

/* ---------------------------------------------------------------------------
   The lab
   --------------------------------------------------------------------------- */
const DEFAULT_X1 = 2;
const DEFAULT_X2 = 1;
const DEFAULT_ETA = 0.5;

export default function BackpropStepper() {
  const reduce = useReducedMotion();
  const [params, setParams] = useState<Params>(INITIAL);
  const [x1, setX1] = useState(DEFAULT_X1);
  const [x2, setX2] = useState(DEFAULT_X2);
  const [y, setY] = useState<0 | 1>(1);
  const [eta, setEta] = useState(DEFAULT_ETA);
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [history, setHistory] = useState<number[]>([]); // loss at the start of each finished cycle
  const [playing, setPlaying] = useState(false);
  const [pulse, setPulse] = useState(1);

  const fw = useMemo(() => forward(params, x1, x2, y), [params, x1, x2, y]);
  const g = useMemo(() => backward(params, fw, x1, x2, y), [params, fw, x1, x2, y]);
  const next = useMemo(() => applyUpdate(params, g, eta), [params, g, eta]);
  const nextLoss = useMemo(() => forward(next, x1, x2, y).L, [next, x1, x2, y]);

  const id = STEPS[step];
  const at = (s: StepId) => step >= idx(s);
  const phase = phaseOf(step);

  // "Run whole cycle": one step every 700 ms until the update
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => {
      if (step >= N - 1) setPlaying(false);
      setStep(Math.min(N, step + 1));
    }, 700);
    return () => window.clearTimeout(t);
  }, [playing, step]);

  // the pulse that travels along the edges of the current step
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 650);
      setPulse(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, cycle, reduce]);

  const stop = () => setPlaying(false);
  const restartCycle = () => {
    stop();
    setStep(0);
  };
  const resetWeights = () => {
    stop();
    setParams(INITIAL);
    setStep(0);
    setCycle(1);
    setHistory([]);
  };
  const changeInput = (fn: () => void) => {
    fn();
    restartCycle();
    setHistory([]);
  };
  const nextCycle = () => {
    stop();
    setHistory((h) => [...h, fw.L]);
    setParams(next);
    setCycle((c) => c + 1);
    setStep(0);
  };
  const runCycle = () => {
    if (step >= N) return;
    if (reduce) {
      setStep(N);
      return;
    }
    setStep(step + 1);
    if (step + 1 < N) setPlaying(true);
  };

  /* ---------- formula panel ---------- */
  const fwdDone = at("L");
  const lossTrail = [...history, ...(fwdDone ? [fw.L] : []), ...(step === N ? [nextLoss] : [])];
  const trailText = lossTrail.length
    ? (lossTrail.length > 4 ? "… → " : "") + lossTrail.slice(-4).map((v) => v.toFixed(3)).join(" → ")
    : "—";

  const relu1 = fw.z1 > 0 ? 1 : 0;
  const relu2 = fw.z2 > 0 ? 1 : 0;
  const P = params;

  /** "∂L/∂w₁₁ = ∂L/∂z₁ × ∂z₁/∂w₁₁ = (−0.2962) × x₁(2) = −0.5924" */
  const weightLine = (key: ParamKey, node: "z" | "z₁" | "z₂", upstream: number, slope: string) =>
    `∂L/∂${SYM[key]} = ∂L/∂${node} × ∂${node}/∂${SYM[key]} = ${par(f4(upstream))} × ${slope} = ${f4(g[key])}`;

  type Panel = { title: string; words: string; sym?: string; num?: string; lines?: string[]; checks?: ParamKey[] };
  const panel: Panel = (() => {
    switch (id) {
      case "start":
        return {
          title: `Cycle ${cycle} · ready`,
          words: `Inputs x₁ = ${pn(x1)}, x₂ = ${pn(x2)} and target y = ${y} are loaded with ${
            cycle === 1 ? "the starting" : "the updated"
          } weights. Nothing has been computed yet — press “Next step ▶”.`,
        };
      case "z1":
        return {
          title: "Forward 1 · weighted sum into hidden neuron 1",
          words: "Multiply each input by the weight on its edge, add them up, then add the bias.",
          sym: "z₁ = w₁₁·x₁ + w₁₂·x₂ + b₁",
          num: `= ${pn(P.w11)} × ${par(pn(x1))} + ${par(pn(P.w12))} × ${par(pn(x2))} + ${par(pn(P.b1))} = ${f4(fw.z1)}`,
        };
      case "h1":
        return {
          title: "Forward 2 · neuron 1 fires (or not)",
          words: "ReLU keeps a positive number as it is and turns a negative one into 0.",
          sym: "h₁ = ReLU(z₁) = max(0, z₁)",
          num: `= max(0, ${f4(fw.z1)}) = ${f4(fw.h1)}`,
        };
      case "z2":
        return {
          title: "Forward 3 · weighted sum into hidden neuron 2",
          words: "Same recipe, different weights.",
          sym: "z₂ = w₂₁·x₁ + w₂₂·x₂ + b₂",
          num: `= ${pn(P.w21)} × ${par(pn(x1))} + ${par(pn(P.w22))} × ${par(pn(x2))} + ${par(pn(P.b2))} = ${f4(fw.z2)}`,
        };
      case "h2":
        return {
          title: "Forward 4 · neuron 2 fires (or not)",
          words:
            fw.z2 > 0
              ? "z₂ is positive, so ReLU lets it through unchanged."
              : "z₂ is not positive, so ReLU outputs 0 — this neuron is switched off for this example.",
          sym: "h₂ = ReLU(z₂) = max(0, z₂)",
          num: `= max(0, ${f4(fw.z2)}) = ${f4(fw.h2)}`,
        };
      case "z":
        return {
          title: "Forward 5 · weighted sum into the output",
          words: "The output neuron treats h₁ and h₂ as its inputs.",
          sym: "z = v₁·h₁ + v₂·h₂ + c",
          num: `= ${pn(P.v1)} × ${f4(fw.h1)} + ${par(pn(P.v2))} × ${f4(fw.h2)} + ${par(pn(P.c))} = ${f4(fw.z)}`,
        };
      case "yhat":
        return {
          title: "Forward 6 · squash to a probability",
          words: "The sigmoid maps any number into (0, 1), so ŷ reads as “the probability that y = 1”.",
          sym: "ŷ = σ(z) = 1 / (1 + e^(−z))",
          num: `= 1 / (1 + e^(${f4(-fw.z)})) = ${f4(fw.yhat)}`,
        };
      case "L":
        return {
          title: "Forward 7 · how wrong was it?",
          words:
            "Binary cross-entropy: near 0 when ŷ is close to the target, large when the network is confidently wrong.",
          sym: "L = −[y·ln ŷ + (1 − y)·ln(1 − ŷ)]",
          num: `= −[${y} × ln ${f4(fw.yhat)} + ${1 - y} × ln ${f4(1 - fw.yhat)}] = ${f4(fw.L)}`,
        };
      case "dz":
        return {
          title: "Backward 1 · start at the loss: ∂L/∂z",
          words:
            "Chain rule through ŷ: the cross-entropy’s slope is −y/ŷ + (1−y)/(1−ŷ) and the sigmoid’s slope is ŷ(1−ŷ). Multiply them and almost everything cancels, leaving prediction minus target. That is why sigmoid and cross-entropy are always paired.",
          sym: "∂L/∂z = ∂L/∂ŷ × ∂ŷ/∂z = ŷ − y",
          num: `= (${f4(g.dyhat)}) × (${f4(fw.yhat)} × ${f4(1 - fw.yhat)}) = ${f4(fw.yhat)} − ${y} = ${f4(g.dz)}`,
        };
      case "dout":
        return {
          title: "Backward 2 · blame for the output weights",
          words:
            "z = v₁h₁ + v₂h₂ + c, so the local slope ∂z/∂v₁ is just h₁ — a number saved from the forward pass. Each gradient is (gradient arriving from the right) × (local slope).",
          lines: [
            weightLine("v1", "z", g.dz, `h₁(${f4(fw.h1)})`),
            weightLine("v2", "z", g.dz, `h₂(${f4(fw.h2)})`),
            weightLine("c", "z", g.dz, "1"),
          ],
          checks: ["v1", "v2", "c"],
        };
      case "dh1":
        return {
          title: "Backward 3 · pass the blame back to h₁",
          words: "h₁ reaches the loss only through z, and ∂z/∂h₁ = v₁ — the weight on that edge.",
          sym: "∂L/∂h₁ = ∂L/∂z × ∂z/∂h₁ = ∂L/∂z × v₁",
          num: `= (${f4(g.dz)}) × ${par(pn(P.v1))} = ${f4(g.dh1)}`,
        };
      case "dz1":
        return {
          title: "Backward 4 · through neuron 1’s ReLU",
          words:
            relu1 === 1
              ? `ReLU’s slope is 1 where z > 0 and 0 where z ≤ 0. Here z₁ = ${f4(fw.z1)} > 0, so the gradient passes straight through.`
              : `ReLU’s slope is 1 where z > 0 and 0 where z ≤ 0. Here z₁ = ${f4(fw.z1)} ≤ 0: the gate is shut, the gradient becomes 0, and w₁₁, w₁₂, b₁ get no blame for this example.`,
          sym: "∂L/∂z₁ = ∂L/∂h₁ × ReLU′(z₁)",
          num: `= (${f4(g.dh1)}) × ${relu1} = ${f4(g.dz1)}`,
        };
      case "dw1":
        return {
          title: "Backward 5 · blame for neuron 1’s weights",
          words: "z₁ = w₁₁x₁ + w₁₂x₂ + b₁, so the local slopes are the inputs themselves (and 1 for the bias).",
          lines: [
            weightLine("w11", "z₁", g.dz1, `x₁(${pn(x1)})`),
            weightLine("w12", "z₁", g.dz1, `x₂(${pn(x2)})`),
            weightLine("b1", "z₁", g.dz1, "1"),
          ],
          checks: ["w11", "w12", "b1"],
        };
      case "dh2":
        return {
          title: "Backward 6 · pass the blame back to h₂",
          words: "Same move on the other branch: multiply by the weight v₂ on the edge.",
          sym: "∂L/∂h₂ = ∂L/∂z × ∂z/∂h₂ = ∂L/∂z × v₂",
          num: `= (${f4(g.dz)}) × ${par(pn(P.v2))} = ${f4(g.dh2)}`,
        };
      case "dz2":
        return {
          title: "Backward 7 · through neuron 2’s ReLU",
          words:
            relu2 === 1
              ? `Here z₂ = ${f4(fw.z2)} > 0, so ReLU′ = 1 and the gradient passes through.`
              : `Here z₂ = ${f4(fw.z2)} ≤ 0, so ReLU′ = 0: no blame reaches w₂₁, w₂₂ or b₂ for this example.`,
          sym: "∂L/∂z₂ = ∂L/∂h₂ × ReLU′(z₂)",
          num: `= (${f4(g.dh2)}) × ${relu2} = ${f4(g.dz2)}`,
        };
      case "dw2":
        return {
          title: "Backward 8 · blame for neuron 2’s weights",
          words: "Again the local slopes are the inputs (and 1 for the bias).",
          lines: [
            weightLine("w21", "z₂", g.dz2, `x₁(${pn(x1)})`),
            weightLine("w22", "z₂", g.dz2, `x₂(${pn(x2)})`),
            weightLine("b2", "z₂", g.dz2, "1"),
          ],
          checks: ["w21", "w22", "b2"],
        };
      case "update":
        return {
          title: "Update · every parameter takes one step downhill",
          words: `p ← p − η·∂L/∂p with η = ${pn(eta)}. A negative gradient means “increasing p lowers the loss”, so p goes up; a positive one sends p down.`,
          lines: [
            ...PARAM_KEYS.map(
              (k) => `${SYM[k]}: ${pn(P[k])} − ${pn(eta)} × ${par(f4(g[k]))} = ${pn(next[k])}`,
            ),
            `Loss on this example with the new weights: ${f4(fw.L)} → ${f4(nextLoss)}`,
          ],
        };
    }
  })();

  /* ---------- graph ---------- */
  const hotEdges = new Set(STEP_EDGES[id] ?? []);
  const backwardish = phase === "backward";
  const hotColor = backwardish ? "var(--warn)" : phase === "update" ? "var(--good)" : "var(--accent-2)";
  const segs = reduce ? [] : pulseSegments(id);
  const ease = pulse < 0.5 ? 2 * pulse * pulse : 1 - Math.pow(-2 * pulse + 2, 2) / 2;

  const edgeLabel = (k: Exclude<EdgeId, "out">, key: ParamKey, gradStep: StepId) => {
    const e = EDGES[k];
    const atPt = along(e.a, e.b, e.t);
    const bottom = step === N ? `→ ${pn(next[key])}` : at(gradStep) ? `∂ ${f4(g[key])}` : undefined;
    return (
      <Pill
        key={k}
        at={atPt}
        top={`${SYM[key]} = ${pn(P[key])}`}
        bottom={bottom}
        bottomTone={step === N ? "new" : "grad"}
        hot={hotEdges.has(k)}
      />
    );
  };

  const biasPill = (box: Pt, key: ParamKey, gradStep: StepId) => {
    const pos = { x: box.x, y: box.y - BH / 2 - 26 };
    const bottom = step === N ? `→ ${pn(next[key])}` : at(gradStep) ? `∂ ${f4(g[key])}` : undefined;
    return (
      <g>
        <line x1={box.x} x2={box.x} y1={pos.y + 10} y2={box.y - BH / 2} stroke="var(--line-strong)" strokeDasharray="3 3" />
        <Pill
          at={pos}
          top={`${SYM[key]} = ${pn(P[key])}`}
          bottom={bottom}
          bottomTone={step === N ? "new" : "grad"}
          hot={step === N || id === gradStep}
        />
      </g>
    );
  };

  const val = (shown: boolean, v: number) => (shown ? f4(v) : "?");

  const box = (
    c: Pt,
    left: [string, boolean, number, boolean],
    right: [string, boolean, number, boolean],
    fn: string,
    gradsBelow: [string, boolean, number][],
  ) => (
    <g fontFamily="monospace" textAnchor="middle">
      <rect
        x={c.x - BW / 2}
        y={c.y - BH / 2}
        width={BW}
        height={BH}
        rx="9"
        fill="var(--panel)"
        stroke="var(--line-strong)"
        strokeWidth="1.4"
      />
      {[left, right].map(([name, shown, v, hot], i) => {
        const cx = i === 0 ? zHalf(c).x : hHalf(c).x;
        return (
          <g key={name}>
            {hot ? (
              <rect
                x={cx - BW / 4 + 3}
                y={c.y - BH / 2 + 3}
                width={BW / 2 - 6}
                height={BH - 6}
                rx="7"
                fill="none"
                stroke={hotColor}
                strokeWidth="2"
              />
            ) : null}
            <text x={cx} y={c.y - 9} fontSize="12" fill="var(--muted)">
              {name}
            </text>
            <text x={cx} y={c.y + 8} fontSize="12" fill={shown ? "var(--accent-2)" : "var(--muted-2)"}>
              {val(shown, v)}
            </text>
          </g>
        );
      })}
      <line x1={c.x} x2={c.x} y1={c.y - BH / 2 + 8} y2={c.y + BH / 2 - 16} stroke="var(--line)" />
      <text x={c.x} y={c.y + BH / 2 - 5} fontSize="11" fill="var(--muted-2)">
        {fn}
      </text>
      {gradsBelow.map(([name, shown, v], i) =>
        shown ? (
          <g key={name}>
            <text x={i === 0 ? zHalf(c).x : hHalf(c).x} y={c.y + BH / 2 + 15} fontSize="11" fill="var(--muted-2)">
              {name}
            </text>
            <text x={i === 0 ? zHalf(c).x : hHalf(c).x} y={c.y + BH / 2 + 29} fontSize="11.5" fill="var(--warn)">
              {f4(v)}
            </text>
          </g>
        ) : null,
      )}
    </g>
  );

  const inputNode = (c: Pt, name: string, v: number) => (
    <g fontFamily="monospace" textAnchor="middle">
      <circle cx={c.x} cy={c.y} r={R_IN} fill="var(--panel)" stroke="var(--muted)" strokeWidth="1.6" />
      <text x={c.x} y={c.y - 4} fontSize="12" fill="var(--muted)">
        {name}
      </text>
      <text x={c.x} y={c.y + 12} fontSize="12" fill="var(--accent-2)">
        {pn(v)}
      </text>
    </g>
  );

  return (
    <LabFrame
      title={LABS.backprop.title}
      how={LABS.backprop.how}
      notice="The backward pass reuses numbers the forward pass already computed (h₁, h₂, ŷ, the inputs). Every gradient is (gradient arriving from the right) × (local slope). ReLU passes gradient back only where its z was positive — that is how the network decides which weights to blame. After one update the loss falls; restart the cycle and it falls again."
      onReset={() => {
        stop();
        setParams(INITIAL);
        setX1(DEFAULT_X1);
        setX2(DEFAULT_X2);
        setY(1);
        setEta(DEFAULT_ETA);
        setStep(0);
        setCycle(1);
        setHistory([]);
      }}
      stage={
        <div className="space-y-3">
          <Stage viewBox={`0 0 ${VW} ${VH}`} label={`Computational graph of a 2-2-1 network, step ${step} of ${N}: ${panel.title}`}>
            {/* edges */}
            {(Object.keys(EDGES) as EdgeId[]).map((k) => {
              const e = EDGES[k];
              const hot = hotEdges.has(k);
              return (
                <line
                  key={k}
                  x1={e.a.x}
                  y1={e.a.y}
                  x2={e.b.x}
                  y2={e.b.y}
                  stroke={hot ? hotColor : "var(--line-strong)"}
                  strokeWidth={hot ? 2.6 : 1.6}
                />
              );
            })}

            {inputNode(X1, "x₁", x1)}
            {inputNode(X2, "x₂", x2)}

            {box(N1, ["z₁", at("z1"), fw.z1, id === "z1" || id === "dz1"], ["h₁", at("h1"), fw.h1, id === "h1" || id === "dh1"], "ReLU", [
              ["∂L/∂z₁", at("dz1"), g.dz1],
              ["∂L/∂h₁", at("dh1"), g.dh1],
            ])}
            {box(N2, ["z₂", at("z2"), fw.z2, id === "z2" || id === "dz2"], ["h₂", at("h2"), fw.h2, id === "h2" || id === "dh2"], "ReLU", [
              ["∂L/∂z₂", at("dz2"), g.dz2],
              ["∂L/∂h₂", at("dh2"), g.dh2],
            ])}
            {box(OUT, ["z", at("z"), fw.z, id === "z" || id === "dz"], ["ŷ", at("yhat"), fw.yhat, id === "yhat"], "σ", [
              ["∂L/∂z", at("dz"), g.dz],
              ["∂L/∂ŷ", at("dz"), g.dyhat],
            ])}

            {/* loss node */}
            <g fontFamily="monospace" textAnchor="middle">
              <text x={LN.x} y={LN.y - R_L - 10} fontSize="11.5" fill="var(--muted)">
                target y = {y}
              </text>
              <circle
                cx={LN.x}
                cy={LN.y}
                r={R_L}
                fill="var(--panel)"
                stroke={id === "L" ? hotColor : "var(--danger)"}
                strokeWidth={id === "L" ? 2.4 : 1.6}
              />
              <text x={LN.x} y={LN.y - 4} fontSize="12" fill="var(--muted)">
                L
              </text>
              <text x={LN.x} y={LN.y + 12} fontSize="11" fill={at("L") ? "var(--accent-2)" : "var(--muted-2)"}>
                {at("L") ? f4(fw.L) : "?"}
              </text>
              <text x={LN.x} y={LN.y + R_L + 15} fontSize="11" fill="var(--muted-2)">
                BCE
              </text>
            </g>

            {edgeLabel("w11", "w11", "dw1")}
            {edgeLabel("w12", "w12", "dw1")}
            {edgeLabel("w21", "w21", "dw2")}
            {edgeLabel("w22", "w22", "dw2")}
            {edgeLabel("v1", "v1", "dout")}
            {edgeLabel("v2", "v2", "dout")}
            {biasPill(N1, "b1", "dw1")}
            {biasPill(N2, "b2", "dw2")}
            {biasPill(OUT, "c", "dout")}

            {/* the travelling pulse */}
            {pulse < 1
              ? segs.map(([a, b], i) => {
                  const p = along(a, b, ease);
                  return (
                    <circle
                      key={`${step}-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r="5.5"
                      fill={hotColor}
                      opacity={0.95 - 0.5 * pulse}
                    />
                  );
                })
              : null}

            {/* legend */}
            <g fontFamily="monospace" fontSize="11">
              <circle cx={14} cy={VH - 12} r="4.5" fill="var(--accent-2)" />
              <text x={24} y={VH - 8} fill="var(--muted-2)">
                forward value
              </text>
              <circle cx={140} cy={VH - 12} r="4.5" fill="var(--warn)" />
              <text x={150} y={VH - 8} fill="var(--muted-2)">
                ∂ = gradient ∂L/∂(that number)
              </text>
              <circle cx={400} cy={VH - 12} r="4.5" fill="var(--good)" />
              <text x={410} y={VH - 8} fill="var(--muted-2)">
                → value after the update
              </text>
            </g>
          </Stage>

          <div
            className="rounded-[var(--radius-sm)] border px-3.5 py-3"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
            aria-live="polite"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>
                {panel.title}
              </div>
              <div
                className="font-mono text-[11.5px] uppercase tracking-[0.14em]"
                style={{ color: phase === "backward" ? "var(--warn)" : phase === "update" ? "var(--good)" : "var(--accent-2)" }}
              >
                step {step} / {N} · {phase}
              </div>
            </div>
            <p className="mt-1.5 text-[13.5px]" style={{ color: "var(--muted)" }}>
              {panel.words}
            </p>
            {panel.sym ? (
              <p className="mt-2 font-mono text-[13px]" style={{ color: "var(--text)" }}>
                {panel.sym}
              </p>
            ) : null}
            {panel.num ? (
              <p className="mt-0.5 break-words font-mono text-[13px]" style={{ color: phase === "backward" ? "var(--warn)" : "var(--accent-2)" }}>
                {panel.num}
              </p>
            ) : null}
            {panel.lines ? (
              <ul className="mt-2 space-y-0.5 font-mono text-[12.5px]">
                {panel.lines.map((l, i, all) => (
                  <li
                    key={i}
                    className="break-words"
                    style={{
                      color:
                        phase === "update"
                          ? i === all.length - 1
                            ? "var(--good)"
                            : "var(--text)"
                          : "var(--warn)",
                    }}
                  >
                    {l}
                  </li>
                ))}
              </ul>
            ) : null}
            {panel.checks ? (
              <div className="mt-2.5 border-t pt-2" style={{ borderColor: "var(--line)" }}>
                <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
                  Numerical check — what a partial derivative <em>means</em>: nudge one weight by ±ε = 0.0001, keep everything else
                  fixed, re-run the forward pass and measure how much L moved.
                </div>
                <ul className="mt-1 space-y-0.5 font-mono text-[12px]">
                  {panel.checks.map((k) => {
                    const n = numericalGrad(P, k, x1, x2, y);
                    const ok = Math.abs(n.est - g[k]) < 1e-6 + 1e-4 * Math.abs(g[k]);
                    return (
                      <li key={k} className="break-words" style={{ color: "var(--text)" }}>
                        [L({SYM[k]}+ε) − L({SYM[k]}−ε)] / 2ε = ({n.plus.toFixed(8)} − {n.minus.toFixed(8)}) / 0.0002 ={" "}
                        <span style={{ color: "var(--warn)" }}>{n.est.toFixed(6).replace("-", "−")}</span> ≈ analytic{" "}
                        <span style={{ color: "var(--warn)" }}>{g[k].toFixed(6).replace("-", "−")}</span>{" "}
                        <span style={{ color: ok ? "var(--good)" : "var(--danger)" }}>{ok ? "✓" : "✗"}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      }
      controls={
        <>
          <div className="flex flex-wrap gap-2">
            <LabButton
              tone="plain"
              onClick={() => {
                stop();
                setStep((s) => Math.max(0, s - 1));
              }}
              disabled={step === 0}
            >
              ◀ Back
            </LabButton>
            <LabButton
              onClick={() => {
                stop();
                setStep((s) => Math.min(N, s + 1));
              }}
              disabled={step === N}
            >
              Next step ▶
            </LabButton>
            <LabButton tone="plain" onClick={runCycle} disabled={step === N || playing}>
              {playing ? "Running…" : "Run whole cycle"}
            </LabButton>
          </div>
          <div className="flex flex-wrap gap-2">
            <LabButton onClick={nextCycle} disabled={step !== N}>
              Restart cycle with updated weights
            </LabButton>
            <LabButton tone="plain" onClick={resetWeights}>
              Reset to initial weights
            </LabButton>
          </div>
          <Slider
            label="Learning rate η"
            value={eta}
            min={0.05}
            max={2}
            step={0.05}
            onChange={setEta}
            display={pn(eta)}
            hint="Only the update step uses it."
          />
          <Slider
            label="Input x₁"
            value={x1}
            min={-3}
            max={3}
            step={0.5}
            onChange={(v) => changeInput(() => setX1(v))}
            display={pn(x1)}
            hint="Try x₁ = 3: z₂ turns negative and neuron 2’s ReLU blocks its gradient."
          />
          <Slider
            label="Input x₂"
            value={x2}
            min={-3}
            max={3}
            step={0.5}
            onChange={(v) => changeInput(() => setX2(v))}
            display={pn(x2)}
          />
          <Choice<"1" | "0">
            label="Target y"
            value={String(y) as "1" | "0"}
            options={[
              { value: "1", label: "y = 1" },
              { value: "0", label: "y = 0" },
            ]}
            onChange={(v) => changeInput(() => setY(v === "1" ? 1 : 0))}
          />
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Step", value: `${step} / ${N}` },
            {
              label: "Phase",
              value: phase,
              tone: phase === "backward" ? "warn" : phase === "update" ? "good" : "accent",
            },
            { label: "Prediction ŷ", value: at("yhat") ? f4(fw.yhat) : "—" },
            { label: "Loss L", value: at("L") ? f4(fw.L) : "—", tone: "warn" },
            { label: "Cycle", value: `${cycle}` },
            { label: "Loss history", value: trailText, tone: "good" },
          ]}
        />
      }
    />
  );
}
