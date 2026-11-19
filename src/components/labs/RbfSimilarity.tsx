"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Choice, LabFrame, Readout, Slider, Stage } from "./LabKit";
import { LABS } from "@/lib/labs";
import { clamp, fmt, solve } from "@/lib/stats";
import { gaussian, mulberry32 } from "@/lib/rng";

/**
 * m5 · The RBF kernel as a similarity score.
 *
 * K(a, b) = exp(−γ‖a − b‖²): 1 for identical points, fading to 0 with distance.
 * The model is kernel ridge classification — α = (K + λI)⁻¹(y − b), λ = 1/C,
 * b = mean training label — which has exactly the SVM's prediction form
 * f(x) = Σᵢ cᵢ K(xᵢ, x) + b (an SVM writes cᵢ = αᵢyᵢ). Far from every training
 * point every K is ≈ 0, so f falls back to b: that is what large γ looks like.
 */
type Dataset = "rings" | "moons" | "xor";

interface Pt {
  x1: number;
  x2: number;
  y: 1 | -1;
}

const SEEDS: Record<Dataset, number> = { rings: 58, moons: 137, xor: 148 };
const N_POINTS = 120; // first 60 train, last 60 held out

function makeData(kind: Dataset): { train: Pt[]; test: Pt[] } {
  const rand = mulberry32(SEEDS[kind]);
  const normal = gaussian(rand);
  const pts: Pt[] = [];
  for (let i = 0; i < N_POINTS; i++) {
    const y: 1 | -1 = rand() < 0.5 ? 1 : -1;
    let x1: number;
    let x2: number;
    if (kind === "rings") {
      const t = rand() * 2 * Math.PI;
      const r = (y === 1 ? 0.9 : 2) + normal() * 0.35;
      x1 = r * Math.cos(t);
      x2 = r * Math.sin(t);
    } else if (kind === "moons") {
      const t = rand() * Math.PI;
      if (y === 1) {
        x1 = Math.cos(t);
        x2 = Math.sin(t);
      } else {
        x1 = 1 - Math.cos(t);
        x2 = 0.5 - Math.sin(t);
      }
      x1 = (x1 - 0.5) * 1.7 + normal() * 0.3;
      x2 = (x2 - 0.25) * 1.7 + normal() * 0.3;
    } else {
      const sx = rand() < 0.5 ? -1 : 1;
      const sy = y === 1 ? sx : -sx;
      x1 = sx * 1.2 + normal() * 0.65;
      x2 = sy * 1.2 + normal() * 0.65;
    }
    pts.push({ x1, x2, y });
  }
  return { train: pts.slice(0, 60), test: pts.slice(60) };
}

const kernel = (gamma: number, a1: number, a2: number, b1: number, b2: number) =>
  Math.exp(-gamma * ((a1 - b1) ** 2 + (a2 - b2) ** 2));

interface Model {
  c: number[];
  b: number;
  f: (x1: number, x2: number) => number;
}

function fit(train: Pt[], gamma: number, C: number): Model {
  const n = train.length;
  const lambda = 1 / C;
  const b = train.reduce((s, p) => s + p.y, 0) / n;
  const K = train.map((p, i) =>
    train.map((q, j) => kernel(gamma, p.x1, p.x2, q.x1, q.x2) + (i === j ? lambda : 0)),
  );
  const c = solve(
    K,
    train.map((p) => p.y - b),
  );
  const f = (x1: number, x2: number) => {
    let s = b;
    for (let i = 0; i < n; i++) s += c[i] * kernel(gamma, train[i].x1, train[i].x2, x1, x2);
    return s;
  };
  return { c, b, f };
}

const accuracy = (m: Model, pts: Pt[]) =>
  pts.filter((p) => Math.sign(m.f(p.x1, p.x2)) === p.y).length / pts.length;

/* ---- geometry ---------------------------------------------------------- */
const LO = -3;
const HI = 3;
const BOX = 400;
const G = 96; // heatmap cells per side
const toPx = (v: number) => ((v - LO) / (HI - LO)) * BOX;
const toPy = (v: number) => BOX - ((v - LO) / (HI - LO)) * BOX;
const UNIT = BOX / (HI - LO);
const cellCentre = (i: number) => LO + ((i + 0.5) * (HI - LO)) / G;

/** f = 0 contour by marching squares on the cell-centre grid. */
function zeroContour(vals: Float64Array): string {
  const at = (i: number, j: number) => vals[j * G + i];
  const segs: string[] = [];
  const P = (x: number, y: number) => `${toPx(x).toFixed(1)},${toPy(y).toFixed(1)}`;
  for (let j = 0; j < G - 1; j++) {
    for (let i = 0; i < G - 1; i++) {
      const v00 = at(i, j);
      const v10 = at(i + 1, j);
      const v01 = at(i, j + 1);
      const v11 = at(i + 1, j + 1);
      const x0 = cellCentre(i);
      const x1 = cellCentre(i + 1);
      const y0 = cellCentre(j);
      const y1 = cellCentre(j + 1);
      const cross: [number, number][] = [];
      const lerp = (a: number, b: number) => a / (a - b);
      if (v00 > 0 !== v10 > 0) cross.push([x0 + (x1 - x0) * lerp(v00, v10), y0]);
      if (v10 > 0 !== v11 > 0) cross.push([x1, y0 + (y1 - y0) * lerp(v10, v11)]);
      if (v01 > 0 !== v11 > 0) cross.push([x0 + (x1 - x0) * lerp(v01, v11), y1]);
      if (v00 > 0 !== v01 > 0) cross.push([x0, y0 + (y1 - y0) * lerp(v00, v01)]);
      if (cross.length >= 2) segs.push(`M${P(...cross[0])}L${P(...cross[1])}`);
      if (cross.length === 4) segs.push(`M${P(...cross[2])}L${P(...cross[3])}`);
    }
  }
  return segs.join("");
}

/** Resolve a CSS colour token to RGB via the canvas parser (handles hex and rgba). */
function tokenRgb(ctx: CanvasRenderingContext2D, name: string): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  ctx.fillStyle = "#000000";
  ctx.fillStyle = raw || "#000000";
  const s = String(ctx.fillStyle);
  if (s.startsWith("#")) {
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  }
  const m = s.match(/[\d.]+/g) ?? ["0", "0", "0"];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

const halfRadius = (gamma: number) => Math.sqrt(Math.LN2 / gamma);

function fmtK(k: number): string {
  if (k >= 0.001) return fmt(k, 3);
  if (k === 0) return "0";
  return k.toExponential(2).replace("e-", "e−");
}

const fmtGamma = (g: number) => (g < 1 ? fmt(g, 2) : g < 10 ? fmt(g, 1) : fmt(g, 0));
const fmtC = (c: number) => (c < 1 ? fmt(c, 2) : c < 10 ? fmt(c, 1) : fmt(c, 0));

/* ---- K(d) curve panel -------------------------------------------------- */
const KW = 320;
const KH = 230;
const KL = 40;
const KR = 14;
const KT = 22;
const KB = 30;
const kx = (d: number) => KL + (d / 3) * (KW - KL - KR);
const ky = (k: number) => KT + (1 - k) * (KH - KT - KB);

const DEFAULT_GAMMA_LOG = Math.log10(2);
const DEFAULT_C_LOG = 1; // C = 10

export default function RbfSimilarity() {
  const [dataset, setDataset] = useState<Dataset>("rings");
  const [gammaLog, setGammaLog] = useState(DEFAULT_GAMMA_LOG);
  const [cLog, setCLog] = useState(DEFAULT_C_LOG);
  const [cursor, setCursor] = useState<{ x1: number; x2: number } | null>(null);
  const [themeTick, setThemeTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const gamma = 10 ** gammaLog;
  const C = 10 ** cLog;
  const dHalf = halfRadius(gamma);

  const data = useMemo(() => makeData(dataset), [dataset]);
  const model = useMemo(() => fit(data.train, gamma, C), [data, gamma, C]);

  const grid = useMemo(() => {
    const vals = new Float64Array(G * G);
    for (let j = 0; j < G; j++) {
      for (let i = 0; i < G; i++) vals[j * G + i] = model.f(cellCentre(i), cellCentre(j));
    }
    return vals;
  }, [model]);

  const boundary = useMemo(() => zeroContour(grid), [grid]);

  const trainAcc = useMemo(() => accuracy(model, data.train), [model, data]);
  const testAcc = useMemo(() => accuracy(model, data.test), [model, data]);
  const gap = trainAcc - testAcc;

  // Redraw when the theme flips (dark ↔ light), since canvas pixels can't follow CSS variables.
  useEffect(() => {
    const mo = new MutationObserver(() => setThemeTick((t) => t + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = G;
    canvas.height = G;
    const bg = tokenRgb(ctx, "--ink-2");
    const pos = tokenRgb(ctx, "--accent-2");
    const neg = tokenRgb(ctx, "--danger");
    const img = ctx.createImageData(G, G);
    for (let j = 0; j < G; j++) {
      for (let i = 0; i < G; i++) {
        const v = grid[j * G + i];
        const col = v >= 0 ? pos : neg;
        const a = 0.06 + 0.5 * Math.min(1, Math.abs(v));
        const o = ((G - 1 - j) * G + i) * 4; // canvas rows run top-down
        img.data[o] = bg[0] + (col[0] - bg[0]) * a;
        img.data[o + 1] = bg[1] + (col[1] - bg[1]) * a;
        img.data[o + 2] = bg[2] + (col[2] - bg[2]) * a;
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [grid, themeTick]);

  const nearest = useMemo(() => {
    if (!cursor) return null;
    let best = 0;
    let bestD = Infinity;
    data.train.forEach((p, i) => {
      const d = Math.hypot(p.x1 - cursor.x1, p.x2 - cursor.x2);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return { p: data.train[best], d: bestD, k: Math.exp(-gamma * bestD * bestD) };
  }, [cursor, data, gamma]);

  const track = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const x1 = LO + ((e.clientX - r.left) / r.width) * (HI - LO);
    const x2 = HI - ((e.clientY - r.top) / r.height) * (HI - LO);
    setCursor({ x1: clamp(x1, LO, HI), x2: clamp(x2, LO, HI) });
  };

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 150; i++) {
      const d = (3 * i) / 150;
      pts.push(`${i ? "L" : "M"}${kx(d).toFixed(1)},${ky(Math.exp(-gamma * d * d)).toFixed(1)}`);
    }
    return pts.join("");
  }, [gamma]);

  const exampleK = Math.exp(-gamma * 5);
  const kAt1 = Math.exp(-gamma);
  const bubbleR = dHalf * UNIT;

  return (
    <LabFrame
      title={LABS.rbf.title}
      how={LABS.rbf.how}
      notice="Small γ: every point's bubble is wide, so the boundary is smooth and broad — add a low C and it flattens out and underfits (high bias). Large γ: the bubbles shrink to dots, the boundary wraps individual training points, train accuracy hits 100% while test accuracy falls (high variance) — away from every bubble nothing is similar, so f just falls back to b. C plays second fiddle: high C trusts every training point, low C smooths. And always scale your features before using RBF: d is a distance, so a feature measured in thousands would swamp one measured in fractions."
      onReset={() => {
        setDataset("rings");
        setGammaLog(DEFAULT_GAMMA_LOG);
        setCLog(DEFAULT_C_LOG);
        setCursor(null);
      }}
      stage={
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="min-w-0 space-y-2">
              <Stage
                viewBox={`0 0 ${KW} ${KH}`}
                label={`Similarity K equals exp of minus gamma d squared, for gamma ${fmtGamma(gamma)}; it falls to one half at d = ${fmt(dHalf, 2)}`}
              >
                <text x={KL} y={14} fontSize="11" fontFamily="monospace" fill="var(--muted)">
                  K(d) = exp(−γ·d²),  γ = {fmtGamma(gamma)}
                </text>
                {[0, 0.5, 1].map((k) => (
                  <g key={k}>
                    <line x1={KL} x2={KW - KR} y1={ky(k)} y2={ky(k)} stroke="var(--line)" />
                    <text x={KL - 6} y={ky(k) + 4} textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                      {k}
                    </text>
                  </g>
                ))}
                {[0, 1, 2, 3].map((d) => (
                  <text key={d} x={kx(d)} y={KH - 10} textAnchor="middle" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                    {d}
                  </text>
                ))}
                <text x={KW - KR} y={KH - 10} textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                  d →
                </text>

                {dHalf <= 3 ? (
                  <g>
                    <line
                      x1={kx(dHalf)}
                      x2={kx(dHalf)}
                      y1={ky(0)}
                      y2={ky(0.5)}
                      stroke="var(--warn)"
                      strokeWidth={1.4}
                      strokeDasharray="4 3"
                    />
                    <text
                      x={clamp(kx(dHalf) + 6, KL, KW - KR - 70)}
                      y={ky(0.5) - 6}
                      fontSize="11"
                      fontFamily="monospace"
                      fill="var(--warn)"
                    >
                      d½ = {fmt(dHalf, 2)}
                    </text>
                  </g>
                ) : (
                  <text x={KW - KR} y={ky(0.5) - 6} textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--warn)">
                    d½ = {fmt(dHalf, 2)} (off the chart) →
                  </text>
                )}

                <path d={curve} fill="none" stroke="var(--accent)" strokeWidth={2.2} />

                {[0.5, 1, 2].map((d) => {
                  const k = Math.exp(-gamma * d * d);
                  return (
                    <g key={d}>
                      <circle cx={kx(d)} cy={ky(k)} r={4.5} fill="var(--accent-2)" stroke="var(--ink-2)" strokeWidth={1.5} />
                      <text
                        x={kx(d)}
                        y={ky(k) - 9}
                        textAnchor="middle"
                        fontSize="11"
                        fontFamily="monospace"
                        fill="var(--accent-2)"
                      >
                        {fmtK(k)}
                      </text>
                    </g>
                  );
                })}

                {nearest && nearest.d <= 3 ? (
                  <circle cx={kx(nearest.d)} cy={ky(nearest.k)} r={5} fill="none" stroke="var(--text)" strokeWidth={1.8} />
                ) : null}
              </Stage>
              <p className="font-mono text-[12.5px]" style={{ color: "var(--muted)" }}>
                dots: K at d = 0.5, 1, 2 · ring: your cursor&apos;s distance
              </p>
              <p className="font-mono text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                <span style={{ color: "var(--text)" }}>Worked example</span> — a = (1, 2), b = (2, 0):
                <br />‖a − b‖² = 1² + 2² = 5
                <br />K = exp(−γ·5) = exp(−{fmt(5 * gamma, 2)}) ={" "}
                <span style={{ color: "var(--accent-2)" }}>{fmtK(exampleK)}</span>
              </p>
            </div>

            <div className="min-w-0 space-y-2">
              <div
                className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-sm)] border"
                style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
              >
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${BOX} ${BOX}`}
                  className="absolute inset-0 block h-full w-full cursor-crosshair"
                  style={{ touchAction: "manipulation" }}
                  role="img"
                  aria-label={`Kernel classifier on ${dataset}: train accuracy ${fmt(trainAcc * 100, 0)}%, test accuracy ${fmt(testAcc * 100, 0)}%. Hover or tap to see the similarity bubble of the nearest training point.`}
                  onPointerMove={track}
                  onPointerDown={track}
                  onPointerLeave={(e) => {
                    if (e.pointerType === "mouse") setCursor(null);
                  }}
                >
                  <defs>
                    <radialGradient id="rbf-bubble">
                      {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
                        <stop
                          key={t}
                          offset={t}
                          stopColor="var(--text)"
                          // the gradient spans 2·d½, so K(r) = 0.5^(4t²) — the real fall-off
                          stopOpacity={0.4 * 0.5 ** (4 * t * t)}
                        />
                      ))}
                    </radialGradient>
                  </defs>

                  {nearest ? (
                    <g pointerEvents="none">
                      <circle cx={toPx(nearest.p.x1)} cy={toPy(nearest.p.x2)} r={2 * bubbleR} fill="url(#rbf-bubble)" />
                      <circle
                        cx={toPx(nearest.p.x1)}
                        cy={toPy(nearest.p.x2)}
                        r={bubbleR}
                        fill="none"
                        stroke="var(--text)"
                        strokeWidth={1.4}
                        strokeDasharray="5 4"
                      />
                    </g>
                  ) : null}

                  <path d={boundary} fill="none" stroke="var(--text)" strokeWidth={2.2} strokeLinecap="round" />

                  {data.test.map((p, i) => (
                    <circle
                      key={`t${i}`}
                      cx={toPx(p.x1)}
                      cy={toPy(p.x2)}
                      r={3.8}
                      fill="var(--ink-2)"
                      fillOpacity={0.6}
                      stroke={p.y === 1 ? "var(--accent-2)" : "var(--danger)"}
                      strokeWidth={1.7}
                    />
                  ))}
                  {data.train.map((p, i) => (
                    <circle
                      key={`r${i}`}
                      cx={toPx(p.x1)}
                      cy={toPy(p.x2)}
                      r={4.2}
                      fill={p.y === 1 ? "var(--accent-2)" : "var(--danger)"}
                      stroke="var(--ink-2)"
                      strokeWidth={1.2}
                    />
                  ))}

                  {nearest && cursor ? (
                    <g pointerEvents="none">
                      <line
                        x1={toPx(cursor.x1)}
                        y1={toPy(cursor.x2)}
                        x2={toPx(nearest.p.x1)}
                        y2={toPy(nearest.p.x2)}
                        stroke="var(--warn)"
                        strokeWidth={1.6}
                      />
                      <circle cx={toPx(cursor.x1)} cy={toPy(cursor.x2)} r={3.5} fill="var(--warn)" />
                      <text
                        x={clamp(toPx(cursor.x1) + 10, 6, BOX - 90)}
                        y={clamp(toPy(cursor.x2) - 10, 16, BOX - 6)}
                        fontSize="13"
                        fontFamily="monospace"
                        fill="var(--warn)"
                        stroke="var(--ink-2)"
                        strokeWidth={3}
                        paintOrder="stroke"
                      >
                        K = {fmtK(nearest.k)}
                      </text>
                    </g>
                  ) : null}

                  <text
                    x={8}
                    y={18}
                    fontSize="12"
                    fontFamily="monospace"
                    fill="var(--text)"
                    stroke="var(--ink-2)"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    f(x) = Σᵢ cᵢ·K(xᵢ, x) + b
                  </text>
                </svg>
              </div>
              <p className="text-[12.5px]" style={{ color: "var(--muted)" }}>
                Kernel classifier (kernel ridge — same K and same Σαᵢ K(xᵢ,x) form as an SVM; here cᵢ plays αᵢyᵢ).
                Shading = sign and confidence of f; solid line = the f = 0 boundary.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]" style={{ color: "var(--muted)" }}>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent-2)" }} aria-hidden />
                  class +1
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--danger)" }} aria-hidden />
                  class −1
                </span>
                <span>● train (60) · ○ held-out test (60)</span>
              </div>
              <p className="font-mono text-[12.5px]" style={{ color: nearest ? "var(--warn)" : "var(--muted-2)" }} aria-live="polite">
                {nearest
                  ? `cursor → nearest training point: d = ${fmt(nearest.d, 2)}, K = exp(−${fmtGamma(gamma)}·${fmt(nearest.d, 2)}²) = ${fmtK(nearest.k)}`
                  : "Hover or tap the map to see the nearest training point's similarity bubble (dashed ring = d½)."}
              </p>
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <Choice<Dataset>
            label="Dataset"
            value={dataset}
            onChange={(d) => {
              setDataset(d);
              setCursor(null);
            }}
            options={[
              { value: "rings", label: "rings" },
              { value: "moons", label: "moons" },
              { value: "xor", label: "XOR blobs" },
            ]}
          />
          <Slider
            label="γ (gamma) — how fast similarity fades"
            value={gammaLog}
            min={Math.log10(0.05)}
            max={Math.log10(200)}
            step={0.01}
            onChange={setGammaLog}
            display={`γ = ${fmtGamma(gamma)}`}
            hint="Log scale, 0.05 → 200. Influence radius d½ = √(ln 2 / γ)."
          />
          <Slider
            label="C — how hard to fit each training point"
            value={cLog}
            min={-2}
            max={3}
            step={0.01}
            onChange={setCLog}
            display={`C = ${fmtC(C)}`}
            hint="Log scale, 0.01 → 1000. Ridge penalty λ = 1/C."
          />
        </>
      }
      readout={
        <Readout
          items={[
            { label: "γ", value: fmtGamma(gamma) },
            { label: "C", value: fmtC(C) },
            { label: "Train accuracy", value: `${fmt(trainAcc * 100, 0)}%`, tone: "good" },
            { label: "Test accuracy", value: `${fmt(testAcc * 100, 0)}%`, tone: testAcc < 0.75 ? "warn" : "good" },
            { label: "Train − test gap", value: fmt(gap, 2), tone: gap > 0.15 ? "danger" : "accent" },
            { label: "K at d = 1", value: fmtK(kAt1) },
            { label: "Influence radius d½", value: fmt(dHalf, 2) },
            { label: "b (vote when nothing is similar)", value: fmt(model.b, 2) },
          ]}
        />
      }
    />
  );
}
