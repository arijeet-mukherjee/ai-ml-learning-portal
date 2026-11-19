"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { Choice, LabButton, LabFrame, Readout, Slider } from "./LabKit";
import { LABS } from "@/lib/labs";
import { clamp, fmt } from "@/lib/stats";

/**
 * m8 · A derivative is the slope you see when you zoom in far enough.
 *
 * Two dots, A = (x₀, f(x₀)) and B = (x₀ + h, f(x₀ + h)). The secant through
 * them has slope Δy/Δx. Shrinking h slides B into A and the secant swings onto
 * the tangent; the slope it settles on is f′(x₀). The right-hand panel zooms in
 * so the rise/run triangle always fills it, which is where the curve visibly
 * straightens into a line (except at ReLU's kink, which never does).
 */
type FnId = "sq" | "cubic" | "sin" | "sigmoid" | "relu";

interface Fn {
  f: (x: number) => number;
  /** Analytic derivative; null where it does not exist (ReLU at exactly 0). */
  df: (x: number) => number | null;
  rule: string;
  ruleShort: (x: number) => string;
  xr: [number, number];
  yr: [number, number];
  xStep: number;
  yTicks: number[];
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

const FNS: Record<FnId, Fn> = {
  sq: {
    f: (x) => x * x,
    df: (x) => 2 * x,
    rule: "d/dx x² = 2x",
    ruleShort: () => "2x",
    xr: [-3, 3],
    yr: [-1, 9.5],
    xStep: 1,
    yTicks: [0, 2, 4, 6, 8],
  },
  cubic: {
    f: (x) => x * x * x - 3 * x,
    df: (x) => 3 * x * x - 3,
    rule: "d/dx (x³ − 3x) = 3x² − 3",
    ruleShort: () => "3x² − 3",
    xr: [-3, 3],
    yr: [-5, 5],
    xStep: 1,
    yTicks: [-4, -2, 0, 2, 4],
  },
  sin: {
    f: (x) => Math.sin(x),
    df: (x) => Math.cos(x),
    rule: "d/dx sin x = cos x",
    ruleShort: () => "cos x",
    xr: [-3, 3],
    yr: [-1.5, 1.5],
    xStep: 1,
    yTicks: [-1, 0, 1],
  },
  sigmoid: {
    f: sigmoid,
    df: (x) => sigmoid(x) * (1 - sigmoid(x)),
    rule: "σ′(x) = σ(x)(1 − σ(x))",
    ruleShort: () => "σ(1 − σ)",
    xr: [-6, 6],
    yr: [-0.15, 1.15],
    xStep: 2,
    yTicks: [0, 0.5, 1],
  },
  relu: {
    f: (x) => Math.max(0, x),
    df: (x) => (x > 0 ? 1 : x < 0 ? 0 : null),
    rule: "ReLU′(x) = 1 if x > 0, 0 if x < 0 (kink at 0)",
    ruleShort: (x) => (x > 0 ? "1 (x > 0)" : x < 0 ? "0 (x < 0)" : "none (kink)"),
    xr: [-3, 3],
    yr: [-0.8, 3.2],
    xStep: 1,
    yTicks: [0, 1, 2, 3],
  },
};

const FN_OPTIONS: { value: FnId; label: string }[] = [
  { value: "sq", label: "x²" },
  { value: "cubic", label: "x³ − 3x" },
  { value: "sin", label: "sin x" },
  { value: "sigmoid", label: "sigmoid σ(x)" },
  { value: "relu", label: "ReLU max(0,x)" },
];

/* h lives on a log scale: slider position t ∈ [0, H_STEPS] ↦ h ∈ [H_MIN, H_MAX]. */
const H_MIN = 0.001;
const H_MAX = 2;
const H_STEPS = 500;
const hToT = (h: number) =>
  Math.round((Math.log(h / H_MIN) / Math.log(H_MAX / H_MIN)) * H_STEPS);
const tToH = (t: number) => H_MIN * Math.pow(H_MAX / H_MIN, t / H_STEPS);
const ANIM_MS = 2500;

const DEFAULT_FN: FnId = "sq";
const DEFAULT_X0 = 1;
const DEFAULT_H = 1;

/* Main plot geometry (viewBox units). */
const W = 420;
const H = 330;
const ML = 32;
const MR = 10;
const MT = 46;
const MB = 24;
const PW = W - ML - MR;
const PH = H - MT - MB;

/* Zoom panel geometry. */
const ZW = 260;
const ZH = 330;
const ZL = 10;
const ZR = 10;
const ZT = 46;
const ZB = 48;
const ZPW = ZW - ZL - ZR;
const ZPH = ZH - ZT - ZB;

/** Show tiny numbers with two significant figures instead of rounding them to 0. */
const fmtV = (v: number) => (v !== 0 && Math.abs(v) < 0.01 ? v.toPrecision(2) : fmt(v, 4));
const fmtH = (h: number) => h.toPrecision(3);

const halo = {
  paintOrder: "stroke",
  stroke: "var(--ink-2)",
  strokeWidth: 3,
  strokeLinejoin: "round",
} as const;

function samplePath(
  f: (x: number) => number,
  lo: number,
  hi: number,
  n: number,
  sx: (x: number) => number,
  sy: (y: number) => number,
  extra: number[] = [],
): string {
  const xs: number[] = [];
  for (let i = 0; i <= n; i++) xs.push(lo + ((hi - lo) * i) / n);
  for (const e of extra) if (e > lo && e < hi) xs.push(e);
  xs.sort((a, b) => a - b);
  return xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${sx(x).toFixed(2)},${sy(f(x)).toFixed(2)}`)
    .join(" ");
}

export default function SlopeDetective() {
  const [fnId, setFnId] = useState<FnId>(DEFAULT_FN);
  const [x0, setX0] = useState(DEFAULT_X0);
  const [h, setH] = useState(DEFAULT_H);
  const [animating, setAnimating] = useState(false);
  const animRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragging = useRef(false);
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const fn = FNS[fnId];
  const [xmin, xmax] = fn.xr;
  const [ymin, ymax] = fn.yr;

  const sx = useCallback((x: number) => ML + ((x - xmin) / (xmax - xmin)) * PW, [xmin, xmax]);
  const sy = useCallback((y: number) => MT + ((ymax - y) / (ymax - ymin)) * PH, [ymin, ymax]);

  /* The numbers the whole lab is about. */
  const xB = x0 + h;
  const f0 = fn.f(x0);
  const f1 = fn.f(xB);
  const dy = f1 - f0;
  const secant = dy / h;
  const deriv = fn.df(x0);
  const err = deriv === null ? NaN : Math.abs(secant - deriv);

  /* ---------- animation: h → 0 in log space over ~2.5 s ---------- */
  const stopAnim = useCallback(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    setAnimating(false);
  }, []);

  useEffect(
    () => () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    },
    [],
  );

  const animate = () => {
    if (animating) {
      stopAnim();
      return;
    }
    if (reduce) {
      setH(H_MIN);
      return;
    }
    const from = h < 0.002 ? H_MAX : h;
    const l0 = Math.log(from);
    const l1 = Math.log(H_MIN);
    const t0 = performance.now();
    setAnimating(true);
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / ANIM_MS);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      setH(Math.exp(l0 + (l1 - l0) * e));
      if (u < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
        setAnimating(false);
      }
    };
    animRef.current = requestAnimationFrame(tick);
  };

  /* ---------- pointer: click or drag on the main plot to move x₀ ---------- */
  const setFromPointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const x = xmin + ((px - ML) / PW) * (xmax - xmin);
    setX0(Math.round(clamp(Math.round(x / 0.05) * 0.05, xmin, xmax) * 100) / 100);
  };

  /* ---------- main plot pieces ---------- */
  const curve = useMemo(
    () => samplePath(fn.f, xmin, xmax, 300, sx, sy, fnId === "relu" ? [0] : []),
    [fn, fnId, xmin, xmax, sx, sy],
  );

  const xTicks: number[] = [];
  for (let v = Math.ceil(xmin / fn.xStep) * fn.xStep; v <= xmax + 1e-9; v += fn.xStep) xTicks.push(v);

  const lineAcross = (slope: number) => ({
    x1: sx(xmin),
    y1: sy(f0 + slope * (xmin - x0)),
    x2: sx(xmax),
    y2: sy(f0 + slope * (xmax - x0)),
  });

  const Ax = sx(x0);
  const Ay = sy(f0);
  const Bx = sx(xB);
  const By = sy(f1);
  const runPx = Bx - Ax;
  const risePx = By - Ay; // screen units: negative means B is above A
  const bOff = xB > xmax;

  /* ---------- zoom panel: keep the triangle a fixed fraction of the panel ---------- */
  const kx = PW / (xmax - xmin);
  const ky = PH / (ymax - ymin);
  const aspect = ky / kx; // keep slopes looking the same as on the main plot
  const fitX = (0.6 * ZPW) / h;
  const fitY = Math.abs(dy) > 0 ? (0.6 * ZPH) / (Math.abs(dy) * aspect) : Infinity;
  const Kx = Math.max(kx, Math.min(fitX, fitY));
  const Ky = Kx * aspect;
  const zoom = Kx / kx;
  const cx = x0 + h / 2;
  const cy = f0 + dy / 2;
  const zx = (x: number) => ZL + ZPW / 2 + (x - cx) * Kx;
  const zy = (y: number) => ZT + ZPH / 2 - (y - cy) * Ky;
  const wLo = cx - ZPW / (2 * Kx);
  const wHi = cx + ZPW / (2 * Kx);
  const zCurve = samplePath(fn.f, wLo, wHi, 200, zx, zy, fnId === "relu" ? [0] : []);
  const kinkInView = fnId === "relu" && wLo < 0 && wHi > 0;
  const zoomStr = zoom < 10 ? zoom.toFixed(1) : `${Math.round(zoom)}`;

  const zA = { x: zx(x0), y: zy(f0) };
  const zB = { x: zx(xB), y: zy(f1) };
  const zC = { x: zx(xB), y: zy(f0) };
  const bAbove = f1 >= f0;

  /* Δy label: beside the vertical leg when it is tall enough, otherwise tucked
     on the far side of the triangle from the Δx label, always inside the panel. */
  const dyText = `Δy = ${fmtV(dy)}`;
  const dyW = dyText.length * 7;
  const legPx = Math.abs(zB.y - zC.y);
  const dyLabel = (() => {
    if (legPx >= 26) {
      const right = zC.x + 6 + dyW <= ZL + ZPW - 2;
      return {
        x: right ? zC.x + 6 : Math.max(zC.x - 6, ZL + dyW + 2),
        y: clamp((zC.y + zB.y) / 2 + 4, ZT + 12, ZT + ZPH - 4),
        textAnchor: (right ? "start" : "end") as "start" | "end",
      };
    }
    return {
      x: clamp(zC.x - 12, ZL + dyW + 2, ZL + ZPW - 2),
      y: clamp(bAbove ? Math.min(zB.y, zC.y) - 12 : Math.max(zB.y, zC.y) + 20, ZT + 12, ZT + ZPH - 4),
      textAnchor: "end" as const,
    };
  })();

  const reset = () => {
    stopAnim();
    setFnId(DEFAULT_FN);
    setX0(DEFAULT_X0);
    setH(DEFAULT_H);
  };

  const clipMain = `sd-main-${uid}`;
  const clipZoom = `sd-zoom-${uid}`;

  /** Right-angle marker at C, pointing into the triangle. */
  const rightAngle = (Cx: number, Cy: number, toBy: number, s: number) => {
    const sgn = toBy < Cy ? -1 : 1;
    return `M${Cx - s},${Cy} L${Cx - s},${Cy + sgn * s} L${Cx},${Cy + sgn * s}`;
  };

  return (
    <LabFrame
      title={LABS.derivative.title}
      how={LABS.derivative.how}
      notice="As h shrinks, B slides into A and the orange secant swings onto the green tangent — the slope it settles on is the derivative. Steep parts of a curve have a large derivative; at a flat top or bottom it is 0, which is exactly where minima live. ReLU is the exception: zoom in on its kink at 0 and it never straightens out, so there is no single slope there."
      onReset={reset}
      stage={
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* ---------------- main plot ---------------- */}
          <div
            className="overflow-hidden rounded-[var(--radius-sm)] border"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="block h-auto w-full cursor-crosshair touch-pan-y"
              role="img"
              aria-label={`Curve with point A at x = ${fmt(x0, 2)} and B at x = ${fmt(xB, 3)}; secant slope ${fmt(secant, 3)}, true slope ${deriv === null ? "undefined" : fmt(deriv, 3)}. Click or drag to move A.`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                dragging.current = true;
                setFromPointer(e);
              }}
              onPointerMove={(e) => {
                if (dragging.current) setFromPointer(e);
              }}
              onPointerUp={() => {
                dragging.current = false;
              }}
              onPointerCancel={() => {
                dragging.current = false;
              }}
            >
              <defs>
                <clipPath id={clipMain}>
                  <rect x={ML} y={MT} width={PW} height={PH} />
                </clipPath>
              </defs>

              <text x={ML} y={17} fontSize="12.5" fontFamily="monospace" fill="var(--text)">
                {fn.rule}
              </text>
              {/* legend */}
              <g fontSize="11" fontFamily="monospace">
                <line x1={ML} x2={ML + 18} y1={31} y2={31} stroke="var(--warn)" strokeWidth="2.5" />
                <text x={ML + 23} y={35} fill="var(--warn)">
                  secant A→B
                </text>
                <line
                  x1={ML + 118}
                  x2={ML + 136}
                  y1={31}
                  y2={31}
                  stroke="var(--good)"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                <text x={ML + 141} y={35} fill="var(--good)">
                  tangent at A
                </text>
              </g>

              {/* grid + axes */}
              {xTicks.map((v) => (
                <g key={`x${v}`}>
                  <line x1={sx(v)} x2={sx(v)} y1={MT} y2={MT + PH} stroke="var(--line)" />
                  <text
                    x={sx(v)}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="monospace"
                    fill="var(--muted-2)"
                  >
                    {v}
                  </text>
                </g>
              ))}
              {fn.yTicks.map((v) => (
                <g key={`y${v}`}>
                  <line x1={ML} x2={ML + PW} y1={sy(v)} y2={sy(v)} stroke="var(--line)" />
                  <text
                    x={ML - 5}
                    y={sy(v) + 4}
                    textAnchor="end"
                    fontSize="11"
                    fontFamily="monospace"
                    fill="var(--muted-2)"
                  >
                    {v}
                  </text>
                </g>
              ))}
              <line x1={ML} x2={ML + PW} y1={sy(0)} y2={sy(0)} stroke="var(--line-strong)" />
              <line x1={sx(0)} x2={sx(0)} y1={MT} y2={MT + PH} stroke="var(--line-strong)" />

              <g clipPath={`url(#${clipMain})`}>
                <path d={curve} fill="none" stroke="var(--accent)" strokeWidth="2.25" />

                {/* rise / run triangle */}
                <path
                  d={`M${Ax},${Ay} L${Bx},${Ay} L${Bx},${By} Z`}
                  fill="var(--violet-soft)"
                  stroke="none"
                />
                <line x1={Ax} x2={Bx} y1={Ay} y2={Ay} stroke="var(--violet)" strokeWidth="1.75" />
                <line x1={Bx} x2={Bx} y1={Ay} y2={By} stroke="var(--violet)" strokeWidth="1.75" />
                {Math.abs(runPx) > 14 && Math.abs(risePx) > 14 ? (
                  <path
                    d={rightAngle(Bx, Ay, By, 6)}
                    fill="none"
                    stroke="var(--violet)"
                    strokeWidth="1"
                  />
                ) : null}

                {/* secant and tangent, extended across the plot */}
                <line {...lineAcross(secant)} stroke="var(--warn)" strokeWidth="2" />
                {deriv !== null ? (
                  <line
                    {...lineAcross(deriv)}
                    stroke="var(--good)"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                ) : null}

                {runPx > 44 ? (
                  <text
                    x={(Ax + Bx) / 2}
                    y={risePx <= 0 ? Ay + 15 : Ay - 7}
                    textAnchor="middle"
                    fontSize="11.5"
                    fontFamily="monospace"
                    fill="var(--violet)"
                    style={halo}
                  >
                    Δx = h
                  </text>
                ) : null}
                {Math.abs(risePx) > 20 ? (
                  <text
                    x={Bx + 6}
                    y={(Ay + By) / 2 + 4}
                    fontSize="11.5"
                    fontFamily="monospace"
                    fill="var(--violet)"
                    style={halo}
                  >
                    Δy
                  </text>
                ) : null}

                <circle cx={Bx} cy={By} r="5" fill="var(--warn)" stroke="var(--ink-2)" strokeWidth="1.5" />
                <circle cx={Ax} cy={Ay} r="6" fill="var(--accent-2)" stroke="var(--ink-2)" strokeWidth="1.5" />
                <text
                  x={Ax - 9}
                  y={Ay - 9}
                  textAnchor="end"
                  fontSize="12.5"
                  fontWeight="600"
                  fill="var(--accent-2)"
                  style={halo}
                >
                  A
                </text>
                {Math.hypot(runPx, risePx) > 16 ? (
                  <text
                    x={Bx + 8}
                    y={By - 8}
                    fontSize="12.5"
                    fontWeight="600"
                    fill="var(--warn)"
                    style={halo}
                  >
                    B
                  </text>
                ) : null}
              </g>

              {bOff ? (
                <text
                  x={ML + PW - 4}
                  y={MT + 14}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="monospace"
                  fill="var(--warn)"
                  style={halo}
                >
                  B is off the plot →
                </text>
              ) : Math.abs(runPx) < 14 ? (
                <text
                  x={ML + PW - 4}
                  y={MT + PH - 6}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="monospace"
                  fill="var(--muted)"
                  style={halo}
                >
                  triangle too small here — see the zoom
                </text>
              ) : null}
              {deriv === null ? (
                <text
                  x={ML + 4}
                  y={MT + 14}
                  fontSize="11"
                  fontFamily="monospace"
                  fill="var(--danger)"
                  style={halo}
                >
                  no single tangent at a kink
                </text>
              ) : null}
            </svg>
          </div>

          {/* ---------------- zoom panel ---------------- */}
          <div
            className="overflow-hidden rounded-[var(--radius-sm)] border"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
          >
            <svg
              viewBox={`0 0 ${ZW} ${ZH}`}
              className="block h-auto w-full"
              role="img"
              aria-label={`Zoomed view around A at ${zoomStr} times magnification`}
            >
              <defs>
                <clipPath id={clipZoom}>
                  <rect x={ZL} y={ZT} width={ZPW} height={ZPH} />
                </clipPath>
              </defs>
              <text x={ZL} y={17} fontSize="12.5" fontFamily="monospace" fill="var(--text)">
                zoom ×{zoomStr} around A
              </text>
              <text x={ZL} y={34} fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                {kinkInView ? "a kink never straightens out" : "closer in, the curve looks straight"}
              </text>
              <rect
                x={ZL}
                y={ZT}
                width={ZPW}
                height={ZPH}
                fill="none"
                stroke="var(--line)"
              />

              <g clipPath={`url(#${clipZoom})`}>
                <path d={zCurve} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
                <path
                  d={`M${zA.x},${zA.y} L${zC.x},${zC.y} L${zB.x},${zB.y} Z`}
                  fill="var(--violet-soft)"
                  stroke="none"
                />
                <line x1={zA.x} x2={zC.x} y1={zA.y} y2={zC.y} stroke="var(--violet)" strokeWidth="1.75" />
                <line x1={zC.x} x2={zB.x} y1={zC.y} y2={zB.y} stroke="var(--violet)" strokeWidth="1.75" />
                {Math.abs(zB.y - zC.y) > 14 ? (
                  <path
                    d={rightAngle(zC.x, zC.y, zB.y, 7)}
                    fill="none"
                    stroke="var(--violet)"
                    strokeWidth="1"
                  />
                ) : null}

                <line
                  x1={zx(wLo)}
                  y1={zy(f0 + secant * (wLo - x0))}
                  x2={zx(wHi)}
                  y2={zy(f0 + secant * (wHi - x0))}
                  stroke="var(--warn)"
                  strokeWidth="2"
                />
                {deriv !== null ? (
                  <line
                    x1={zx(wLo)}
                    y1={zy(f0 + deriv * (wLo - x0))}
                    x2={zx(wHi)}
                    y2={zy(f0 + deriv * (wHi - x0))}
                    stroke="var(--good)"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                ) : null}

                <text
                  x={(zA.x + zC.x) / 2}
                  y={bAbove ? zC.y + 15 : zC.y - 7}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontFamily="monospace"
                  fill="var(--violet)"
                  style={halo}
                >
                  Δx = h = {fmtH(h)}
                </text>
                <text
                  {...dyLabel}
                  fontSize="11.5"
                  fontFamily="monospace"
                  fill="var(--violet)"
                  style={halo}
                >
                  {dyText}
                </text>

                <circle cx={zB.x} cy={zB.y} r="5" fill="var(--warn)" stroke="var(--ink-2)" strokeWidth="1.5" />
                <circle cx={zA.x} cy={zA.y} r="6" fill="var(--accent-2)" stroke="var(--ink-2)" strokeWidth="1.5" />
                <text
                  x={zA.x - 9}
                  y={zA.y - 9}
                  textAnchor="end"
                  fontSize="12.5"
                  fontWeight="600"
                  fill="var(--accent-2)"
                  style={halo}
                >
                  A
                </text>
                <text
                  x={zB.x + 8}
                  y={zB.y - 8}
                  fontSize="12.5"
                  fontWeight="600"
                  fill="var(--warn)"
                  style={halo}
                >
                  B
                </text>
              </g>

              <text x={ZL} y={ZH - 26} fontSize="11.5" fontFamily="monospace" fill="var(--warn)">
                secant slope  {fmtV(secant)}
              </text>
              <text x={ZL} y={ZH - 9} fontSize="11.5" fontFamily="monospace" fill="var(--good)">
                tangent slope {deriv === null ? "undefined" : fmtV(deriv)}
              </text>
            </svg>
          </div>
        </div>
      }
      controls={
        <>
          <Choice<FnId>
            label="Curve f(x)"
            value={fnId}
            options={FN_OPTIONS}
            onChange={(id) => {
              setFnId(id);
              const [lo, hi] = FNS[id].xr;
              setX0((v) => clamp(v, lo, hi));
            }}
          />
          <Slider
            label="Point x₀ (or click the plot)"
            value={x0}
            min={xmin}
            max={xmax}
            step={0.05}
            onChange={(v) => setX0(Math.round(v * 100) / 100)}
            display={`x₀ = ${fmt(x0, 2)}`}
          />
          <Slider
            label="Gap h (log scale)"
            value={hToT(h)}
            min={0}
            max={H_STEPS}
            step={1}
            onChange={(t) => {
              stopAnim();
              setH(tToH(t));
            }}
            display={`h = ${fmtH(h)}`}
            hint="Slide left to shrink h from 2 down to 0.001."
          />
          <div className="flex flex-wrap gap-2">
            <LabButton onClick={animate}>{animating ? "Stop" : "Animate h → 0"}</LabButton>
            <LabButton
              tone="plain"
              onClick={() => {
                stopAnim();
                setH(DEFAULT_H);
              }}
            >
              Back to h = 1
            </LabButton>
          </div>
        </>
      }
      readout={
        <Readout
          items={[
            { label: "f(x₀)", value: fmt(f0, 4) },
            { label: "Δx = h", value: fmtH(h) },
            { label: "Δy = f(x₀+h) − f(x₀)", value: fmtV(dy) },
            { label: "Secant slope Δy/Δx", value: fmtV(secant), tone: "warn" },
            {
              label: "True slope f′(x₀)",
              value: deriv === null ? "undefined" : fmtV(deriv),
              tone: deriv === null ? "danger" : "good",
            },
            {
              label: "Error |secant − true|",
              value: deriv === null ? "—" : fmtV(err),
              tone: deriv === null ? undefined : err < 0.01 ? "good" : "accent",
            },
            { label: "Rule used", value: fn.ruleShort(x0) },
          ]}
        />
      }
    />
  );
}
