"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Choice, LabButton, LabFrame, Readout, Slider } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt } from "@/lib/stats";
import { gaussian, mulberry32 } from "@/lib/rng";

/**
 * m8 · A from-scratch, mini TensorFlow Playground.
 *
 * A fully connected net 2 → (h × L) → 1 with a sigmoid output, trained on the
 * mean binary cross-entropy of all ~200 points at once (full batch). Plain
 * gradient descent needs tens of thousands of epochs on the spiral, so the
 * update is Adam: the same gradients, rescaled per weight.
 */

/* ---------------------------------------------------------------------------
   Maths — pure functions, no React. (The verification script in the scratchpad
   extracts everything between the two "core" markers and checks it.)
   --------------------------------------------------------------------------- */
// core:begin
export type Act = "relu" | "tanh" | "linear";
export type DatasetId = "xor" | "circles" | "moons" | "spiral";

export interface Pt {
  x: number;
  y: number;
  label: 0 | 1;
}

const DATA_SEED: Record<DatasetId, number> = {
  xor: 81101,
  circles: 81102,
  moons: 81103,
  spiral: 81104,
};

/** ~200 deterministic points per dataset, roughly inside [−1, 1]². Class 1 / class 0. */
export function makeDataset(id: DatasetId): Pt[] {
  const rand = mulberry32(DATA_SEED[id]);
  const g = gaussian(rand);
  const out: Pt[] = [];
  if (id === "xor") {
    const centres: [number, number][] = [
      [0.5, 0.5],
      [-0.5, -0.5],
      [0.5, -0.5],
      [-0.5, 0.5],
    ];
    centres.forEach(([cx, cy]) => {
      for (let i = 0; i < 50; i++) {
        out.push({ x: cx + g() * 0.17, y: cy + g() * 0.17, label: cx * cy > 0 ? 1 : 0 });
      }
    });
  } else if (id === "circles") {
    for (let i = 0; i < 100; i++) {
      const t = rand() * Math.PI * 2;
      const r = 0.42 * Math.sqrt(rand());
      out.push({ x: r * Math.cos(t) + g() * 0.03, y: r * Math.sin(t) + g() * 0.03, label: 1 });
    }
    for (let i = 0; i < 100; i++) {
      const t = rand() * Math.PI * 2;
      const r = 0.68 + rand() * 0.27;
      out.push({ x: r * Math.cos(t) + g() * 0.03, y: r * Math.sin(t) + g() * 0.03, label: 0 });
    }
  } else if (id === "moons") {
    for (let i = 0; i < 100; i++) {
      const t = rand() * Math.PI;
      const x = Math.cos(t) + g() * 0.1;
      const y = Math.sin(t) + g() * 0.1;
      out.push({ x: (x - 0.5) / 1.55, y: (y - 0.25) / 1.55, label: 1 });
    }
    for (let i = 0; i < 100; i++) {
      const t = rand() * Math.PI;
      const x = 1 - Math.cos(t) + g() * 0.1;
      const y = 0.5 - Math.sin(t) + g() * 0.1;
      out.push({ x: (x - 0.5) / 1.55, y: (y - 0.25) / 1.55, label: 0 });
    }
  } else {
    // two interleaved arms, 1.75 turns each
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 100; i++) {
        const f = i / 100;
        const r = 0.08 + 0.85 * f;
        const t = 3.5 * Math.PI * f + arm * Math.PI;
        out.push({
          x: r * Math.cos(t) + g() * 0.025,
          y: r * Math.sin(t) + g() * 0.025,
          label: arm === 0 ? 1 : 0,
        });
      }
    }
  }
  return out;
}

export interface Model {
  sizes: number[]; // e.g. [2, 4, 1]
  act: Act;
  W: number[][]; // W[l][o * nIn + i]: weight from unit i of layer l into unit o of layer l+1
  b: number[][];
  mW: number[][];
  vW: number[][];
  mb: number[][];
  vb: number[][];
  t: number; // Adam step count
  epoch: number;
  loss: number;
  acc: number;
  history: number[]; // loss every `stride` epochs, starting at epoch 0
  stride: number;
}

export const archSizes = (layers: number, neurons: number): number[] => [
  2,
  ...Array.from({ length: layers }, () => neurons),
  1,
];

export const paramCount = (sizes: number[]): number =>
  sizes.slice(1).reduce((acc, n, l) => acc + n * sizes[l] + n, 0);

function activate(act: Act, z: number): number {
  if (act === "relu") return z > 0 ? z : 0;
  if (act === "tanh") return Math.tanh(z);
  return z;
}

/** Slope of the activation, written in terms of its input z and its output a. */
function activateSlope(act: Act, z: number, a: number): number {
  if (act === "relu") return z > 0 ? 1 : 0;
  if (act === "tanh") return 1 - a * a;
  return 1;
}

const sigmoid = (s: number): number => 1 / (1 + Math.exp(-s));

/** BCE written on the logit s so it never takes log(0). Equals −[y ln σ(s) + (1−y) ln(1−σ(s))]. */
const bceFromLogit = (s: number, y: number): number =>
  Math.max(s, 0) - s * y + Math.log1p(Math.exp(-Math.abs(s)));

/** Forward pass for one point. Returns the output logit; fills zs/as when given. */
export function logit(
  sizes: number[],
  act: Act,
  W: number[][],
  b: number[][],
  x: number,
  y: number,
  zs?: number[][],
  as?: number[][],
): number {
  let a: number[] = [x, y];
  if (as) as[0] = a;
  for (let l = 0; l < sizes.length - 1; l++) {
    const nIn = sizes[l];
    const nOut = sizes[l + 1];
    const z = new Array<number>(nOut);
    const next = new Array<number>(nOut);
    const last = l === sizes.length - 2;
    for (let o = 0; o < nOut; o++) {
      let s = b[l][o];
      const row = o * nIn;
      for (let i = 0; i < nIn; i++) s += W[l][row + i] * a[i];
      z[o] = s;
      next[o] = last ? s : activate(act, s);
    }
    if (zs) zs[l] = z;
    a = next;
    if (as) as[l + 1] = a;
  }
  return a[0];
}

export const predict = (m: Pick<Model, "sizes" | "act" | "W" | "b">, x: number, y: number): number =>
  sigmoid(logit(m.sizes, m.act, m.W, m.b, x, y));

/** Mean BCE and accuracy over the data set. */
export function evaluate(m: Pick<Model, "sizes" | "act" | "W" | "b">, data: Pt[]): { loss: number; acc: number } {
  let loss = 0;
  let correct = 0;
  for (const p of data) {
    const s = logit(m.sizes, m.act, m.W, m.b, p.x, p.y);
    loss += bceFromLogit(s, p.label);
    if ((s > 0 ? 1 : 0) === p.label) correct++;
  }
  return { loss: loss / data.length, acc: correct / data.length };
}

/** Backprop: gradient of the mean BCE with respect to every weight and bias. */
export function gradients(
  m: Pick<Model, "sizes" | "act" | "W" | "b">,
  data: Pt[],
): { gW: number[][]; gb: number[][] } {
  const { sizes, act, W, b } = m;
  const L = sizes.length - 1;
  const gW = W.map((w) => new Array<number>(w.length).fill(0));
  const gb = b.map((v) => new Array<number>(v.length).fill(0));
  const zs: number[][] = new Array(L);
  const as: number[][] = new Array(L + 1);
  const n = data.length;
  for (const p of data) {
    const s = logit(sizes, act, W, b, p.x, p.y, zs, as);
    // sigmoid + BCE: dLoss/dlogit = ŷ − y
    let delta: number[] = [(sigmoid(s) - p.label) / n];
    for (let l = L - 1; l >= 0; l--) {
      const nIn = sizes[l];
      const aIn = as[l];
      const prev = new Array<number>(nIn).fill(0);
      for (let o = 0; o < delta.length; o++) {
        const d = delta[o];
        gb[l][o] += d;
        const row = o * nIn;
        for (let i = 0; i < nIn; i++) {
          gW[l][row + i] += d * aIn[i];
          prev[i] += d * W[l][row + i];
        }
      }
      if (l > 0) {
        const z = zs[l - 1];
        for (let i = 0; i < nIn; i++) prev[i] *= activateSlope(act, z[i], aIn[i]);
      }
      delta = prev;
    }
  }
  return { gW, gb };
}

/** Fresh weights: He scaling for ReLU, Xavier/Glorot for tanh and linear. */
export function initModel(sizes: number[], act: Act, seed: number, data: Pt[]): Model {
  const g = gaussian(mulberry32(seed * 7919 + 17));
  const W: number[][] = [];
  const b: number[][] = [];
  for (let l = 0; l < sizes.length - 1; l++) {
    const nIn = sizes[l];
    const nOut = sizes[l + 1];
    const scale = act === "relu" && l < sizes.length - 2 ? Math.sqrt(2 / nIn) : Math.sqrt(2 / (nIn + nOut));
    W.push(Array.from({ length: nIn * nOut }, () => g() * scale));
    b.push(Array.from({ length: nOut }, () => (act === "relu" && l < sizes.length - 2 ? 0.1 : 0)));
  }
  const zeros = (a: number[][]) => a.map((r) => r.map(() => 0));
  const base = { sizes, act, W, b };
  const { loss, acc } = evaluate(base, data);
  return {
    ...base,
    mW: zeros(W),
    vW: zeros(W),
    mb: zeros(b),
    vb: zeros(b),
    t: 0,
    epoch: 0,
    loss,
    acc,
    history: [loss],
    stride: 1,
  };
}

const B1 = 0.9;
const B2 = 0.999;
const EPS = 1e-8;
const HISTORY_CAP = 400;

/** k epochs of full-batch Adam. Pure: returns a new model and leaves the old one untouched. */
export function trainEpochs(m: Model, data: Pt[], lr: number, k: number): Model {
  const copy = (a: number[][]) => a.map((r) => r.slice());
  const W = copy(m.W);
  const b = copy(m.b);
  const mW = copy(m.mW);
  const vW = copy(m.vW);
  const mb = copy(m.mb);
  const vb = copy(m.vb);
  let t = m.t;
  let epoch = m.epoch;
  let history = m.history.slice();
  let stride = m.stride;
  let loss = m.loss;
  let acc = m.acc;
  const adam = (p: number[], g: number[], mm: number[], vv: number[], c1: number, c2: number) => {
    for (let i = 0; i < p.length; i++) {
      mm[i] = B1 * mm[i] + (1 - B1) * g[i];
      vv[i] = B2 * vv[i] + (1 - B2) * g[i] * g[i];
      p[i] -= (lr * (mm[i] / c1)) / (Math.sqrt(vv[i] / c2) + EPS);
    }
  };
  for (let e = 0; e < k; e++) {
    const { gW, gb } = gradients({ sizes: m.sizes, act: m.act, W, b }, data);
    t++;
    const c1 = 1 - Math.pow(B1, t);
    const c2 = 1 - Math.pow(B2, t);
    for (let l = 0; l < W.length; l++) {
      adam(W[l], gW[l], mW[l], vW[l], c1, c2);
      adam(b[l], gb[l], mb[l], vb[l], c1, c2);
    }
    epoch++;
    if (epoch % stride === 0 || e === k - 1) {
      ({ loss, acc } = evaluate({ sizes: m.sizes, act: m.act, W, b }, data));
    }
    if (epoch % stride === 0) {
      history.push(loss);
      if (history.length > HISTORY_CAP) {
        history = history.filter((_, i) => i % 2 === 0);
        stride *= 2;
      }
    }
  }
  return { ...m, W, b, mW, vW, mb, vb, t, epoch, loss, acc, history, stride };
}
// core:end

/* ---------------------------------------------------------------------------
   Drawing
   --------------------------------------------------------------------------- */
const DATASETS: { value: DatasetId; label: string }[] = [
  { value: "xor", label: "XOR (4 blobs)" },
  { value: "circles", label: "circles" },
  { value: "moons", label: "two moons" },
  { value: "spiral", label: "spiral" },
];

const LRS = [0.003, 0.005, 0.01, 0.02, 0.03, 0.05, 0.1, 0.2, 0.3, 0.5, 1];
const DEFAULT_LR_IDX = 4; // 0.03
/** Slow at first so the boundary can be seen bending, then faster for the long tail. */
const epochsPerFrame = (epoch: number) => (epoch < 60 ? 1 : epoch < 400 ? 3 : 8);
const DEFAULTS = { dataset: "xor" as DatasetId, layers: 1, neurons: 4, act: "tanh" as Act, seed: 1 };

const CANVAS = 480; // internal pixels of the heatmap canvas
const GRID = 96; // probability samples per side
const DOMAIN = 1.25; // the plane shown is [−DOMAIN, DOMAIN]²

type RGB = [number, number, number];

function parseColor(raw: string, fallback: RGB): RGB {
  const s = raw.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(s);
  if (rgb) {
    const [r, g, b] = rgb[1].split(",").map((v) => parseFloat(v));
    if ([r, g, b].every(Number.isFinite)) return [r, g, b];
  }
  return fallback;
}

const rgbStr = ([r, g, b]: RGB, a = 1) => `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})`;

function drawHeatmap(canvas: HTMLCanvasElement, model: Model, data: Pt[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const css = getComputedStyle(document.documentElement);
  const bg = parseColor(css.getPropertyValue("--ink-2"), [10, 12, 20]);
  const c1 = parseColor(css.getPropertyValue("--accent-2"), [63, 217, 228]);
  const c0 = parseColor(css.getPropertyValue("--warn"), [243, 176, 60]);
  const text = parseColor(css.getPropertyValue("--text"), [232, 236, 248]);
  const panel = parseColor(css.getPropertyValue("--panel"), [14, 17, 27]);
  const line = parseColor(css.getPropertyValue("--line-strong"), [43, 49, 71]);

  // 1 · probability on a GRID × GRID lattice of cell centres
  const probs = new Float64Array(GRID * GRID);
  const step = (2 * DOMAIN) / GRID;
  for (let j = 0; j < GRID; j++) {
    const y = DOMAIN - (j + 0.5) * step;
    for (let i = 0; i < GRID; i++) {
      probs[j * GRID + i] = predict(model, -DOMAIN + (i + 0.5) * step, y);
    }
  }

  // 2 · colour: the class colour, stronger the more confident the net is
  const img = new ImageData(GRID, GRID);
  for (let k = 0; k < probs.length; k++) {
    const p = probs[k];
    const base = p >= 0.5 ? c1 : c0;
    const a = 0.5 * Math.pow(Math.abs(p - 0.5) * 2, 0.75);
    img.data[k * 4] = bg[0] + (base[0] - bg[0]) * a;
    img.data[k * 4 + 1] = bg[1] + (base[1] - bg[1]) * a;
    img.data[k * 4 + 2] = bg[2] + (base[2] - bg[2]) * a;
    img.data[k * 4 + 3] = 255;
  }
  const off = document.createElement("canvas");
  off.width = GRID;
  off.height = GRID;
  off.getContext("2d")?.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(off, 0, 0, CANVAS, CANVAS);

  const toPx = (v: number) => ((v + DOMAIN) / (2 * DOMAIN)) * CANVAS;
  const toPy = (v: number) => ((DOMAIN - v) / (2 * DOMAIN)) * CANVAS;

  // faint axes
  ctx.strokeStyle = rgbStr(line, 0.9);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(toPx(0), 0);
  ctx.lineTo(toPx(0), CANVAS);
  ctx.moveTo(0, toPy(0));
  ctx.lineTo(CANVAS, toPy(0));
  ctx.stroke();

  // 3 · the p = 0.5 contour, by marching squares on the same lattice
  const cell = CANVAS / GRID;
  const cx = (i: number) => (i + 0.5) * cell;
  const v = (i: number, j: number) => probs[j * GRID + i] - 0.5;
  ctx.strokeStyle = rgbStr(text, 0.92);
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let j = 0; j < GRID - 1; j++) {
    for (let i = 0; i < GRID - 1; i++) {
      const a = v(i, j);
      const b = v(i + 1, j);
      const c = v(i + 1, j + 1);
      const d = v(i, j + 1);
      const pts: [number, number][] = [];
      const lerp = (p: number, q: number) => p / (p - q);
      if (a > 0 !== b > 0) pts.push([cx(i) + lerp(a, b) * cell, cx(j)]); // top
      if (b > 0 !== c > 0) pts.push([cx(i + 1), cx(j) + lerp(b, c) * cell]); // right
      if (d > 0 !== c > 0) pts.push([cx(i) + lerp(d, c) * cell, cx(j + 1)]); // bottom
      if (a > 0 !== d > 0) pts.push([cx(i), cx(j) + lerp(a, d) * cell]); // left
      if (pts.length === 2) {
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
      } else if (pts.length === 4) {
        // saddle: pair edges according to the centre's sign
        const centre = (a + b + c + d) / 4;
        const [top, right, bottom, left] = pts;
        if (centre > 0 === a > 0) {
          ctx.moveTo(top[0], top[1]);
          ctx.lineTo(right[0], right[1]);
          ctx.moveTo(bottom[0], bottom[1]);
          ctx.lineTo(left[0], left[1]);
        } else {
          ctx.moveTo(top[0], top[1]);
          ctx.lineTo(left[0], left[1]);
          ctx.moveTo(bottom[0], bottom[1]);
          ctx.lineTo(right[0], right[1]);
        }
      }
    }
  }
  ctx.stroke();

  // 4 · the training points, outlined so they read on either colour
  for (const p of data) {
    ctx.beginPath();
    ctx.arc(toPx(p.x), toPy(p.y), 5, 0, Math.PI * 2);
    ctx.fillStyle = rgbStr(p.label === 1 ? c1 : c0);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = rgbStr(panel);
    ctx.stroke();
  }
}

/* ---------------------------------------------------------------------------
   Network diagram
   --------------------------------------------------------------------------- */
const NW = 380;
const NH = 290;

function NetworkDiagram({ model }: { model: Model }) {
  const { sizes, W } = model;
  const cols = sizes.length;
  const top = 44;
  const bottom = NH - 18;
  const left = 36;
  const right = NW - 36;
  const colX = (l: number) => left + (cols === 1 ? 0 : (l * (right - left)) / (cols - 1));
  const nodeY = (n: number, k: number) => {
    const gap = Math.min(n <= 2 ? 70 : n <= 4 ? 44 : 30, (bottom - top) / Math.max(1, n));
    const mid = (top + bottom) / 2;
    return mid + (k - (n - 1) / 2) * gap;
  };
  let maxW = 0;
  W.forEach((w) => w.forEach((v) => (maxW = Math.max(maxW, Math.abs(v)))));
  maxW = Math.max(maxW, 1);
  const r = sizes.some((s) => s > 6) ? 9 : 11;

  const layerName = (l: number) => (l === 0 ? "input" : l === cols - 1 ? "output" : `hidden ${l}`);

  return (
    <svg
      viewBox={`0 0 ${NW} ${NH}`}
      className="block h-auto w-full"
      role="img"
      aria-label={`Network diagram, layer sizes ${sizes.join(", ")}. Edge thickness shows weight size; colour shows sign.`}
    >
      {/* edges */}
      {sizes.slice(0, -1).map((nIn, l) => {
        const nOut = sizes[l + 1];
        const els = [];
        for (let o = 0; o < nOut; o++) {
          for (let i = 0; i < nIn; i++) {
            const w = W[l][o * nIn + i];
            const mag = Math.abs(w) / maxW;
            els.push(
              <line
                key={`${l}-${o}-${i}`}
                x1={colX(l)}
                y1={nodeY(nIn, i)}
                x2={colX(l + 1)}
                y2={nodeY(nOut, o)}
                stroke={w >= 0 ? "var(--accent-2)" : "var(--warn)"}
                strokeWidth={0.6 + 4.4 * mag}
                strokeLinecap="round"
                opacity={0.35 + 0.6 * mag}
              />,
            );
          }
        }
        return <g key={l}>{els}</g>;
      })}

      {/* nodes */}
      {sizes.map((n, l) => (
        <g key={l}>
          <text
            x={colX(l)}
            y={16}
            textAnchor="middle"
            fontSize="11.5"
            fontFamily="monospace"
            fill="var(--muted-2)"
          >
            {layerName(l)}
          </text>
          <text x={colX(l)} y={31} textAnchor="middle" fontSize="11.5" fontFamily="monospace" fill="var(--text)">
            {n}
          </text>
          {Array.from({ length: n }, (_, k) => (
            <g key={k}>
              <circle
                cx={colX(l)}
                cy={nodeY(n, k)}
                r={l === 0 || l === cols - 1 ? r + 3 : r}
                fill="var(--panel)"
                stroke={l === 0 ? "var(--muted)" : l === cols - 1 ? "var(--accent)" : "var(--line-strong)"}
                strokeWidth="1.8"
              />
              {l === 0 || l === cols - 1 ? (
                <text
                  x={colX(l)}
                  y={nodeY(n, k) + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fontFamily="monospace"
                  fill="var(--text)"
                >
                  {l === 0 ? (k === 0 ? "x₁" : "x₂") : "ŷ"}
                </text>
              ) : null}
            </g>
          ))}
        </g>
      ))}

      <g fontSize="11" fontFamily="monospace">
        <line x1={8} x2={24} y1={NH - 6} y2={NH - 6} stroke="var(--accent-2)" strokeWidth="3" />
        <text x={28} y={NH - 2} fill="var(--muted-2)">
          + weight
        </text>
        <line x1={100} x2={116} y1={NH - 6} y2={NH - 6} stroke="var(--warn)" strokeWidth="3" />
        <text x={120} y={NH - 2} fill="var(--muted-2)">
          − weight
        </text>
        <text x={NW - 8} y={NH - 2} textAnchor="end" fill="var(--muted-2)">
          thickness = |w|
        </text>
      </g>
    </svg>
  );
}

const SW = 380;
const SH = 96;

function Sparkline({ model }: { model: Model }) {
  const { history, stride, epoch } = model;
  const padL = 10;
  const padR = 10;
  const padT = 26;
  const padB = 10;
  const max = Math.max(...history, 0.75);
  const lastEpoch = Math.max(epoch, 1);
  const pts = history.map((l, i) => {
    const x = padL + ((i * stride) / lastEpoch) * (SW - padL - padR);
    const y = SH - padB - (l / max) * (SH - padT - padB);
    return `${Math.min(x, SW - padR).toFixed(1)},${y.toFixed(1)}`;
  });
  if (history.length && epoch % stride !== 0) {
    const y = SH - padB - (model.loss / max) * (SH - padT - padB);
    pts.push(`${(SW - padR).toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <svg
      viewBox={`0 0 ${SW} ${SH}`}
      className="block h-auto w-full"
      role="img"
      aria-label={`Loss over ${epoch} epochs, now ${fmt(model.loss, 3)}`}
    >
      <text x={padL} y={15} fontSize="11.5" fontFamily="monospace" fill="var(--muted-2)">
        loss vs epoch
      </text>
      <text x={SW - padR} y={15} textAnchor="end" fontSize="11.5" fontFamily="monospace" fill="var(--warn)">
        {fmt(model.loss, 3)}
      </text>
      <line x1={padL} x2={SW - padR} y1={SH - padB} y2={SH - padB} stroke="var(--line-strong)" />
      {pts.length > 1 ? (
        <polyline points={pts.join(" ")} fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinejoin="round" />
      ) : (
        <circle cx={padL} cy={SH - padB - (model.loss / max) * (SH - padT - padB)} r="3" fill="var(--warn)" />
      )}
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   The lab
   --------------------------------------------------------------------------- */
export default function NeuralPlayground() {
  const [dataset, setDataset] = useState<DatasetId>(DEFAULTS.dataset);
  const [layers, setLayers] = useState(DEFAULTS.layers);
  const [neurons, setNeurons] = useState(DEFAULTS.neurons);
  const [act, setAct] = useState<Act>(DEFAULTS.act);
  const [lrIdx, setLrIdx] = useState(DEFAULT_LR_IDX);
  const [seed, setSeed] = useState(DEFAULTS.seed);
  const [running, setRunning] = useState(false);
  const [themeTick, setThemeTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const data = useMemo(() => makeDataset(dataset), [dataset]);
  const [model, setModel] = useState<Model>(() =>
    initModel(archSizes(DEFAULTS.layers, DEFAULTS.neurons), DEFAULTS.act, DEFAULTS.seed, makeDataset(DEFAULTS.dataset)),
  );
  const lr = LRS[lrIdx];

  /** Any change to the data or the shape of the net starts over with fresh weights. */
  const rebuild = (next: Partial<typeof DEFAULTS>) => {
    const cfg = { dataset, layers, neurons, act, seed, ...next };
    setDataset(cfg.dataset);
    setLayers(cfg.layers);
    setNeurons(cfg.neurons);
    setAct(cfg.act);
    setSeed(cfg.seed);
    setRunning(false);
    setModel(initModel(archSizes(cfg.layers, cfg.neurons), cfg.act, cfg.seed, makeDataset(cfg.dataset)));
  };

  // training loop: several epochs per animation frame while "Train" is on
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      setModel((m) => trainEpochs(m, data, lr, epochsPerFrame(m.epoch)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, data, lr]);

  // redraw the heatmap when the theme flips
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawHeatmap(canvas, model, data);
  }, [model, data, themeTick]);

  const sizes = model.sizes;
  const arch = sizes.join(" → ");
  const params = paramCount(sizes);

  return (
    <LabFrame
      title={LABS.nnplay.title}
      how={LABS.nnplay.how}
      notice="With 0 hidden layers the boundary is always a straight line, so XOR and circles are impossible. Switch the activation to “linear” and even 2 hidden layers still draw a straight line — stacked linear layers collapse into one. ReLU or tanh lets the network bend the boundary; more neurons buy more bends, and the spiral needs the most. (Updates use Adam — full-batch gradients, each weight’s step rescaled — because plain gradient descent is far too slow on the spiral.)"
      onReset={() => {
        setLrIdx(DEFAULT_LR_IDX);
        rebuild(DEFAULTS);
      }}
      stage={
        <div className="grid gap-3 md:grid-cols-2">
          <div
            className="overflow-hidden rounded-[var(--radius-sm)] border"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS}
              height={CANVAS}
              className="block aspect-square h-auto w-full"
              role="img"
              aria-label={`Predicted probability over the plane for the ${dataset} data set; training accuracy ${fmt(model.acc * 100, 1)}%`}
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-[12.5px]" style={{ color: "var(--muted)" }}>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent-2)" }} />
                class 1 (p → 1)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--warn)" }} />
                class 0 (p → 0)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4" style={{ background: "var(--text)" }} />
                p = 0.5 boundary
              </span>
            </div>
          </div>
          <div className="grid gap-3">
            <div
              className="overflow-hidden rounded-[var(--radius-sm)] border"
              style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
            >
              <NetworkDiagram model={model} />
            </div>
            <div
              className="overflow-hidden rounded-[var(--radius-sm)] border"
              style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
            >
              <Sparkline model={model} />
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <Choice<DatasetId> label="Dataset" value={dataset} options={DATASETS} onChange={(d) => rebuild({ dataset: d })} />
          <Choice<"0" | "1" | "2">
            label="Hidden layers"
            value={String(layers) as "0" | "1" | "2"}
            options={[
              { value: "0", label: "0 (logistic regression)" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
            ]}
            onChange={(v) => rebuild({ layers: Number(v) })}
          />
          <Slider
            label="Neurons per hidden layer"
            value={neurons}
            min={1}
            max={8}
            step={1}
            onChange={(n) => rebuild({ neurons: n })}
            display={layers === 0 ? `${neurons} (unused)` : `${neurons}`}
          />
          <Choice<Act>
            label="Activation"
            value={act}
            options={[
              { value: "relu", label: "ReLU" },
              { value: "tanh", label: "tanh" },
              { value: "linear", label: "linear (none)" },
            ]}
            onChange={(a) => rebuild({ act: a })}
          />
          <Slider
            label="Learning rate η"
            value={lrIdx}
            min={0}
            max={LRS.length - 1}
            step={1}
            onChange={setLrIdx}
            display={String(lr)}
            hint="Log-spaced. Too high and the loss jumps around; too low and training crawls."
          />
          <div className="flex flex-wrap gap-2">
            <LabButton onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Train"}</LabButton>
            <LabButton tone="plain" onClick={() => setModel((m) => trainEpochs(m, data, lr, 1))} disabled={running}>
              Step (1 epoch)
            </LabButton>
            <LabButton tone="plain" onClick={() => rebuild({ seed: seed + 1 })}>
              New random weights
            </LabButton>
          </div>
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Epoch", value: `${model.epoch}` },
            { label: "Loss (cross-entropy)", value: fmt(model.loss, 4), tone: "warn" },
            {
              label: "Train accuracy",
              value: `${fmt(model.acc * 100, 1)}%`,
              tone: model.acc >= 0.95 ? "good" : model.acc >= 0.75 ? "accent" : "danger",
            },
            { label: "Parameters (w + b)", value: `${params}` },
            { label: "Architecture", value: arch },
            { label: "Weight init", value: `seed ${seed}` },
          ]}
        />
      }
    />
  );
}
