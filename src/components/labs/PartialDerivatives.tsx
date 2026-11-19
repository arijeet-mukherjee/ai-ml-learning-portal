"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { Choice, LabButton, LabFrame, Readout, Slider } from "./LabKit";
import { LABS } from "@/lib/labs";
import { clamp, fmt } from "@/lib/stats";

/**
 * m8 · A function of two variables is a hill. Freeze y and walk in x: that
 * slice is an ordinary curve, and its slope is ∂f/∂x. Same for y. Put the two
 * slopes side by side and you have the gradient, which points uphill and
 * crosses every contour line at a right angle. Gradient descent walks against it.
 *
 * All three surfaces are convex quadratics. The tilted bowl's Hessian is
 * [[2, 0.6], [0.6, 4]] (eigenvalues ≈ 1.83 and 4.17, both positive).
 */
type SurfId = "bowl" | "valley" | "tilted";

interface Surf {
  f: (x: number, y: number) => number;
  fx: (x: number, y: number) => number;
  fy: (x: number, y: number) => number;
  fText: string;
  gradText: string;
  min: [number, number];
}

/* Minimum of the tilted bowl: solve 2x + 0.6y = 2, 0.6x + 4y = −2. */
const TILT_DET = 2 * 4 - 0.6 * 0.6;
const TILT_MIN: [number, number] = [(2 * 4 - 0.6 * -2) / TILT_DET, (2 * -2 - 0.6 * 2) / TILT_DET];

const SURFS: Record<SurfId, Surf> = {
  bowl: {
    f: (x, y) => x * x + y * y,
    fx: (x) => 2 * x,
    fy: (_x, y) => 2 * y,
    fText: "f(x, y) = x² + y²",
    gradText: "∂f/∂x = 2x  ·  ∂f/∂y = 2y",
    min: [0, 0],
  },
  valley: {
    f: (x, y) => 0.5 * x * x + 4 * y * y,
    fx: (x) => x,
    fy: (_x, y) => 8 * y,
    fText: "f(x, y) = 0.5x² + 4y²",
    gradText: "∂f/∂x = x  ·  ∂f/∂y = 8y",
    min: [0, 0],
  },
  tilted: {
    f: (x, y) => (x - 1) ** 2 + 2 * (y + 0.5) ** 2 + 0.6 * x * y,
    fx: (x, y) => 2 * (x - 1) + 0.6 * y,
    fy: (x, y) => 4 * (y + 0.5) + 0.6 * x,
    fText: "f(x, y) = (x−1)² + 2(y+0.5)² + 0.6xy",
    gradText: "∂f/∂x = 2(x−1) + 0.6y  ·  ∂f/∂y = 4(y+0.5) + 0.6x",
    min: TILT_MIN,
  },
};

const SURF_OPTIONS: { value: SurfId; label: string }[] = [
  { value: "bowl", label: "round bowl" },
  { value: "valley", label: "long valley" },
  { value: "tilted", label: "tilted bowl" },
];

const DOM = 3; // x, y ∈ [−3, 3]
const DEFAULT_SURF: SurfId = "bowl";
const DEFAULT_P: [number, number] = [2, 1.5];
const DEFAULT_LR = 0.1;
const BLOWN = 1e3;

/* Contour map geometry. */
const CW = 380;
const CL = 30;
const CT = 58;
const S = 338;
const CH = CT + S + 44;
const cx = (x: number) => CL + ((x + DOM) / (2 * DOM)) * S;
const cy = (y: number) => CT + ((DOM - y) / (2 * DOM)) * S;

/* Slice panel geometry. */
const SW = 300;
const SH = 196;
const SL = 36;
const SR = 10;
const ST = 36;
const SB = 24;
const SPW = SW - SL - SR;
const SPH = SH - ST - SB;

const HEAT_N = 36;
const CONTOUR_N = 72;
const LEVELS = 12;

/** Caption numbers: two decimals, but no decimals once a diverging run makes them huge. */
const fmtC = (v: number) => (Math.abs(v) >= 100 ? fmt(v, 0) : fmt(v, 2));

const halo = {
  paintOrder: "stroke",
  stroke: "var(--ink-2)",
  strokeWidth: 3,
  strokeLinejoin: "round",
} as const;

function niceTicks(lo: number, hi: number, target: number): number[] {
  const raw = (hi - lo) / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

/** Everything about a surface that does not depend on P: range, heat cells, contour paths. */
function buildMap(surf: Surf) {
  const fmin = surf.f(surf.min[0], surf.min[1]);
  let fmax = -Infinity;
  for (let i = 0; i <= 60; i++)
    for (let j = 0; j <= 60; j++) {
      fmax = Math.max(fmax, surf.f(-DOM + (i / 60) * 2 * DOM, -DOM + (j / 60) * 2 * DOM));
    }

  const cell = (2 * DOM) / HEAT_N;
  const heat: { x: number; y: number; o: number }[] = [];
  for (let i = 0; i < HEAT_N; i++)
    for (let j = 0; j < HEAT_N; j++) {
      const x = -DOM + (i + 0.5) * cell;
      const y = -DOM + (j + 0.5) * cell;
      const t = clamp((surf.f(x, y) - fmin) / (fmax - fmin), 0, 1);
      heat.push({ x: cx(-DOM + i * cell), y: cy(-DOM + (j + 1) * cell), o: 0.04 + 0.4 * Math.sqrt(t) });
    }

  /* Marching squares. Levels are spaced by the square root so a quadratic's
     rings come out evenly spaced, the way a hiker's map would draw them. */
  const n = CONTOUR_N;
  const g = (k: number) => -DOM + (k / n) * 2 * DOM;
  const v: number[][] = [];
  for (let i = 0; i <= n; i++) {
    v.push([]);
    for (let j = 0; j <= n; j++) v[i].push(surf.f(g(i), g(j)));
  }
  const levels: number[] = [];
  for (let k = 1; k <= LEVELS; k++) levels.push(fmin + (fmax - fmin) * (k / (LEVELS + 1)) ** 2);

  const paths = levels.map((L) => {
    let d = "";
    const interp = (x1: number, y1: number, v1: number, x2: number, y2: number, v2: number) => {
      const t = (L - v1) / (v2 - v1);
      return [cx(x1 + t * (x2 - x1)), cy(y1 + t * (y2 - y1))];
    };
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x0 = g(i);
        const x1 = g(i + 1);
        const y0 = g(j);
        const y1 = g(j + 1);
        const a = v[i][j]; // (x0, y0)
        const b = v[i + 1][j]; // (x1, y0)
        const c = v[i + 1][j + 1]; // (x1, y1)
        const e = v[i][j + 1]; // (x0, y1)
        const pts: number[][] = [];
        if (a >= L !== b >= L) pts.push(interp(x0, y0, a, x1, y0, b));
        if (b >= L !== c >= L) pts.push(interp(x1, y0, b, x1, y1, c));
        if (c >= L !== e >= L) pts.push(interp(x1, y1, c, x0, y1, e));
        if (e >= L !== a >= L) pts.push(interp(x0, y1, e, x0, y0, a));
        for (let k = 0; k + 1 < pts.length; k += 2) {
          d += `M${pts[k][0].toFixed(1)},${pts[k][1].toFixed(1)}L${pts[k + 1][0].toFixed(1)},${pts[k + 1][1].toFixed(1)}`;
        }
      }
    return d;
  });

  return { fmin, fmax, heat, paths, cellPx: (cell / (2 * DOM)) * S };
}

/** One 1-D slice of the hill with its tangent line at the current point. */
function SlicePanel({
  clipId,
  caption,
  sub,
  color,
  axis,
  curve,
  t0,
  slope,
  lo,
  hi,
}: {
  clipId: string;
  caption: string;
  sub: string;
  color: string;
  axis: "x" | "y";
  curve: (t: number) => number;
  t0: number;
  slope: number;
  lo: number;
  hi: number;
}) {
  const px = (t: number) => SL + ((t + DOM) / (2 * DOM)) * SPW;
  const py = (z: number) => ST + ((hi - z) / (hi - lo)) * SPH;
  const z0 = curve(t0);
  let d = "";
  for (let i = 0; i <= 160; i++) {
    const t = -DOM + (i / 160) * 2 * DOM;
    d += `${i === 0 ? "M" : "L"}${px(t).toFixed(2)},${py(curve(t)).toFixed(2)}`;
  }
  const span = 1.2;
  const yTicks = niceTicks(lo, hi, 3);
  const inside = Math.abs(t0) <= DOM;

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-sm)] border"
      style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
    >
      <svg viewBox={`0 0 ${SW} ${SH}`} className="block h-auto w-full" role="img" aria-label={caption}>
        <defs>
          <clipPath id={clipId}>
            <rect x={SL} y={ST} width={SPW} height={SPH} />
          </clipPath>
        </defs>
        <text x={8} y={15} fontSize="11.5" fontFamily="monospace" fill={color}>
          {caption}
        </text>
        <text x={8} y={29} fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
          {sub}
        </text>

        {[-3, -2, -1, 0, 1, 2, 3].map((t) => (
          <g key={t}>
            <line x1={px(t)} x2={px(t)} y1={ST} y2={ST + SPH} stroke="var(--line)" />
            <text
              x={px(t)}
              y={SH - 8}
              textAnchor="middle"
              fontSize="11"
              fontFamily="monospace"
              fill="var(--muted-2)"
            >
              {t}
            </text>
          </g>
        ))}
        {yTicks.map((z) => (
          <g key={z}>
            <line x1={SL} x2={SL + SPW} y1={py(z)} y2={py(z)} stroke="var(--line)" />
            <text
              x={SL - 4}
              y={py(z) + 4}
              textAnchor="end"
              fontSize="11"
              fontFamily="monospace"
              fill="var(--muted-2)"
            >
              {z}
            </text>
          </g>
        ))}
        <text
          x={SL + SPW - 2}
          y={ST + SPH - 5}
          textAnchor="end"
          fontSize="11"
          fontFamily="monospace"
          fill="var(--muted-2)"
        >
          {axis} →
        </text>

        <g clipPath={`url(#${clipId})`}>
          <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.25" />
          {inside ? (
            <>
              <line
                x1={px(t0 - span)}
                y1={py(z0 - slope * span)}
                x2={px(t0 + span)}
                y2={py(z0 + slope * span)}
                stroke={color}
                strokeWidth="2.25"
              />
              <circle cx={px(t0)} cy={py(z0)} r="5.5" fill={color} stroke="var(--ink-2)" strokeWidth="1.5" />
              <text
                x={px(t0) + 8}
                y={py(z0) + 16}
                fontSize="11.5"
                fontWeight="600"
                fill={color}
                style={halo}
              >
                P
              </text>
            </>
          ) : null}
        </g>
      </svg>
    </div>
  );
}

export default function PartialDerivatives() {
  const [surfId, setSurfId] = useState<SurfId>(DEFAULT_SURF);
  const [p, setP] = useState<[number, number]>(DEFAULT_P);
  const [lr, setLr] = useState(DEFAULT_LR);
  const [path, setPath] = useState<[number, number][]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragging = useRef(false);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const surf = SURFS[surfId];
  const map = useMemo(() => buildMap(surf), [surf]);

  /* A memoised element: React skips the 1,300 heat cells and contour paths on every drag. */
  const background = useMemo(
    () => (
      <g>
        {map.heat.map((c, i) => (
          <rect
            key={i}
            x={c.x}
            y={c.y}
            width={map.cellPx + 0.4}
            height={map.cellPx + 0.4}
            fill="var(--accent)"
            opacity={c.o}
          />
        ))}
        {map.paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--accent)" strokeOpacity="0.6" strokeWidth="1" />
        ))}
      </g>
    ),
    [map],
  );

  const [x0, y0] = p;
  const fval = surf.f(x0, y0);
  const gx = surf.fx(x0, y0);
  const gy = surf.fy(x0, y0);
  const gnorm = Math.hypot(gx, gy);
  const finite = Number.isFinite(x0) && Number.isFinite(y0) && Number.isFinite(fval);
  const onMap = finite && Math.abs(x0) <= DOM && Math.abs(y0) <= DOM;
  const steps = Math.max(0, path.length - 1);

  /* ---------- pointer / keyboard ---------- */
  const moveTo = (x: number, y: number) => {
    setP([Math.round(clamp(x, -DOM, DOM) * 100) / 100, Math.round(clamp(y, -DOM, DOM) * 100) / 100]);
    setPath([]);
  };

  const setFromPointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sxv = ((e.clientX - rect.left) / rect.width) * CW;
    const syv = ((e.clientY - rect.top) / rect.height) * CH;
    moveTo(((sxv - CL) / S) * 2 * DOM - DOM, DOM - ((syv - CT) / S) * 2 * DOM);
  };

  const onKey = (e: ReactKeyboardEvent) => {
    const st = e.shiftKey ? 0.5 : 0.1;
    const dirs: Record<string, [number, number]> = {
      ArrowRight: [st, 0],
      ArrowLeft: [-st, 0],
      ArrowUp: [0, st],
      ArrowDown: [0, -st],
    };
    const dv = dirs[e.key];
    if (!dv) return;
    e.preventDefault();
    const bx = onMap ? x0 : clamp(x0, -DOM, DOM);
    const by = onMap ? y0 : clamp(y0, -DOM, DOM);
    moveTo(bx + dv[0], by + dv[1]);
  };

  /* ---------- gradient descent ---------- */
  const runSteps = (n: number) => {
    const pts: [number, number][] = path.length ? [...path] : [p];
    let cur = pts[pts.length - 1];
    for (let i = 0; i < n; i++) {
      if (!Number.isFinite(cur[0]) || !Number.isFinite(cur[1])) break;
      if (Math.abs(cur[0]) > BLOWN || Math.abs(cur[1]) > BLOWN) break;
      cur = [cur[0] - lr * surf.fx(cur[0], cur[1]), cur[1] - lr * surf.fy(cur[0], cur[1])];
      pts.push(cur);
    }
    setPath(pts);
    setP(cur);
  };

  const reset = () => {
    setSurfId(DEFAULT_SURF);
    setP(DEFAULT_P);
    setLr(DEFAULT_LR);
    setPath([]);
  };

  /* ---------- arrows from P ---------- */
  // One uniform scale for the gradient and its components so the parallelogram stays honest.
  // Shrink it if needed so both arrow tips stay on the map (with a floor so they never vanish).
  const fitK = (dx: number, dy: number) => {
    const lim = DOM - 0.15;
    let out = Infinity;
    if (dx > 0) out = Math.min(out, (lim - x0) / dx);
    if (dx < 0) out = Math.min(out, (-lim - x0) / dx);
    if (dy > 0) out = Math.min(out, (lim - y0) / dy);
    if (dy < 0) out = Math.min(out, (-lim - y0) / dy);
    return out;
  };
  const kBase = gnorm > 1e-9 ? Math.min(0.3, 1.6 / gnorm) : 0;
  const k = Math.max(0.35 * kBase, Math.min(kBase, fitK(gx, gy), fitK(-gx, -gy)));
  const Px = cx(x0);
  const Py = cy(y0);
  const tip = (dx: number, dy: number) => ({ x: cx(x0 + k * dx), y: cy(y0 + k * dy) });
  const gTip = tip(gx, gy);
  const nTip = tip(-gx, -gy);
  const xTip = tip(gx, 0);
  const yTip = tip(0, gy);
  const showArrows = onMap && gnorm * k * (S / (2 * DOM)) > 10;
  const unit = gnorm > 0 ? { x: gx / gnorm, y: gy / gnorm } : { x: 0, y: 0 };
  /** Place an arrow label just past its tip, kept inside the map. */
  const labelAt = (tx: number, ty: number, ux: number, uy: number, width: number) => {
    const anchor: "start" | "end" = ux >= 0 ? "start" : "end";
    const x = tx + ux * 10;
    return {
      x: anchor === "start" ? Math.min(x, CL + S - width - 2) : Math.max(x, CL + width + 2),
      y: clamp(ty - uy * 10 + 4, CT + 12, CT + S - 4),
      textAnchor: anchor,
    };
  };
  const upLabel = labelAt(gTip.x, gTip.y, unit.x, unit.y, 18);
  const downLabel = labelAt(nTip.x, nTip.y, -unit.x, -unit.y, 26);
  const xCompPx = Math.abs(xTip.x - Px);
  const yCompPx = Math.abs(yTip.y - Py);
  const ySliceRight = Px + 5 + 125 <= CL + S;

  const ids = {
    clip: `pd-clip-${uid}`,
    up: `pd-up-${uid}`,
    down: `pd-down-${uid}`,
    ax: `pd-ax-${uid}`,
    ay: `pd-ay-${uid}`,
    sx: `pd-sx-${uid}`,
    sy: `pd-sy-${uid}`,
  };

  const marker = (id: string, color: string, size: number) => (
    <marker
      id={id}
      markerUnits="userSpaceOnUse"
      markerWidth={size}
      markerHeight={size}
      refX={size * 0.8}
      refY={size / 2}
      orient="auto"
    >
      <path d={`M0,0 L${size},${size / 2} L0,${size} Z`} fill={color} />
    </marker>
  );

  const sliceLo = map.fmin - 0.05 * (map.fmax - map.fmin);
  const sliceHi = map.fmax + 0.05 * (map.fmax - map.fmin);

  const pathPts = path.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) < 50 && Math.abs(b) < 50);

  return (
    <LabFrame
      title={LABS.partial.title}
      how={LABS.partial.how}
      notice="Each slice is an ordinary 1-D curve, so a partial derivative is just an ordinary derivative with the other variable frozen. The red gradient arrow is always perpendicular to the contour lines and points straight uphill; descent follows the green one. On the long valley, a big learning rate zig-zags across the steep y direction while crawling along x — this is why momentum and Adam exist."
      onReset={reset}
      stage={
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* ---------------- contour map ---------------- */}
          <div
            className="overflow-hidden rounded-[var(--radius-sm)] border md:row-span-2"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CW} ${CH}`}
              className="block h-auto w-full cursor-crosshair touch-none"
              role="application"
              aria-label={`Contour map of ${surf.fText}. Point P at (${fmt(x0, 2)}, ${fmt(y0, 2)}). Click or drag to move P.`}
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
                <clipPath id={ids.clip}>
                  <rect x={CL} y={CT} width={S} height={S} />
                </clipPath>
                {marker(ids.up, "var(--danger)", 10)}
                {marker(ids.down, "var(--good)", 10)}
                {marker(ids.ax, "var(--accent-2)", 8)}
                {marker(ids.ay, "var(--violet)", 8)}
              </defs>

              <text x={8} y={17} fontSize="12.5" fontFamily="monospace" fill="var(--text)">
                {surf.fText}
              </text>
              <text x={8} y={35} fontSize="11.5" fontFamily="monospace" fill="var(--accent-2)">
                {surf.gradText}
              </text>

              <g clipPath={`url(#${ids.clip})`}>
                {background}
                <line x1={CL} x2={CL + S} y1={cy(0)} y2={cy(0)} stroke="var(--line-strong)" />
                <line x1={cx(0)} x2={cx(0)} y1={CT} y2={CT + S} stroke="var(--line-strong)" />

                {/* minimum */}
                <g stroke="var(--text)" strokeWidth="1.5" opacity="0.7">
                  <line x1={cx(surf.min[0]) - 5} x2={cx(surf.min[0]) + 5} y1={cy(surf.min[1]) - 5} y2={cy(surf.min[1]) + 5} />
                  <line x1={cx(surf.min[0]) - 5} x2={cx(surf.min[0]) + 5} y1={cy(surf.min[1]) + 5} y2={cy(surf.min[1]) - 5} />
                </g>
                <text
                  x={cx(surf.min[0]) + 7}
                  y={cy(surf.min[1]) + 15}
                  fontSize="11"
                  fontFamily="monospace"
                  fill="var(--muted)"
                  style={halo}
                >
                  min
                </text>

                {/* slices through P */}
                {onMap ? (
                  <>
                    <line
                      x1={CL}
                      x2={CL + S}
                      y1={Py}
                      y2={Py}
                      stroke="var(--accent-2)"
                      strokeWidth="1.25"
                      strokeDasharray="5 4"
                    />
                    <line
                      x1={Px}
                      x2={Px}
                      y1={CT}
                      y2={CT + S}
                      stroke="var(--violet)"
                      strokeWidth="1.25"
                      strokeDasharray="5 4"
                    />
                    <text x={CL + 4} y={Py - 5 < CT + 12 ? Py + 14 : Py - 5} fontSize="11" fontFamily="monospace" fill="var(--accent-2)" style={halo}>
                      x slice (y = {fmt(y0, 2)})
                    </text>
                    <text
                      x={ySliceRight ? Px + 5 : Px - 5}
                      y={CT + 13}
                      textAnchor={ySliceRight ? "start" : "end"}
                      fontSize="11"
                      fontFamily="monospace"
                      fill="var(--violet)"
                      style={halo}
                    >
                      y slice (x = {fmt(x0, 2)})
                    </text>
                  </>
                ) : null}

                {/* descent path */}
                {pathPts.length > 1 ? (
                  <polyline
                    points={pathPts.map(([a, b]) => `${cx(a).toFixed(1)},${cy(b).toFixed(1)}`).join(" ")}
                    fill="none"
                    stroke="var(--warn)"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />
                ) : null}
                {pathPts.slice(0, -1).map(([a, b], i) => (
                  <circle key={i} cx={cx(a)} cy={cy(b)} r="3" fill="var(--warn)" />
                ))}

                {/* gradient arrows */}
                {showArrows ? (
                  <>
                    <line x1={xTip.x} y1={xTip.y} x2={gTip.x} y2={gTip.y} stroke="var(--muted-2)" strokeDasharray="2 3" />
                    <line x1={yTip.x} y1={yTip.y} x2={gTip.x} y2={gTip.y} stroke="var(--muted-2)" strokeDasharray="2 3" />
                    <line x1={Px} y1={Py} x2={xTip.x} y2={xTip.y} stroke="var(--accent-2)" strokeWidth="1.5" markerEnd={`url(#${ids.ax})`} />
                    <line x1={Px} y1={Py} x2={yTip.x} y2={yTip.y} stroke="var(--violet)" strokeWidth="1.5" markerEnd={`url(#${ids.ay})`} />
                    <line x1={Px} y1={Py} x2={gTip.x} y2={gTip.y} stroke="var(--danger)" strokeWidth="2.75" markerEnd={`url(#${ids.up})`} />
                    <line x1={Px} y1={Py} x2={nTip.x} y2={nTip.y} stroke="var(--good)" strokeWidth="2.75" markerEnd={`url(#${ids.down})`} />

                    {/* component labels sit at the middle of each leg, outside the parallelogram */}
                    {xCompPx > 34 ? (
                      <text
                        x={(Px + xTip.x) / 2}
                        y={Py + (gy >= 0 ? 15 : -7)}
                        textAnchor="middle"
                        fontSize="11"
                        fontFamily="monospace"
                        fill="var(--accent-2)"
                        style={halo}
                      >
                        ∂f/∂x
                      </text>
                    ) : null}
                    {yCompPx > 16 ? (
                      <text
                        x={Px + (gx >= 0 ? -6 : 6)}
                        y={(Py + yTip.y) / 2 + 4}
                        textAnchor={gx >= 0 ? "end" : "start"}
                        fontSize="11"
                        fontFamily="monospace"
                        fill="var(--violet)"
                        style={halo}
                      >
                        ∂f/∂y
                      </text>
                    ) : null}
                    <text
                      {...upLabel}
                      fontSize="11.5"
                      fontWeight="600"
                      fontFamily="monospace"
                      fill="var(--danger)"
                      style={halo}
                    >
                      ∇f
                    </text>
                    <text
                      {...downLabel}
                      fontSize="11.5"
                      fontWeight="600"
                      fontFamily="monospace"
                      fill="var(--good)"
                      style={halo}
                    >
                      −∇f
                    </text>
                  </>
                ) : null}

                {onMap ? (
                  <circle
                    cx={Px}
                    cy={Py}
                    r="7"
                    fill="var(--panel)"
                    stroke="var(--text)"
                    strokeWidth="2"
                    tabIndex={0}
                    role="slider"
                    aria-label="Point P. Arrow keys move it by 0.1, hold shift for 0.5."
                    aria-valuetext={`P = (${fmt(x0, 2)}, ${fmt(y0, 2)})`}
                    aria-valuenow={x0}
                    aria-valuemin={-3}
                    aria-valuemax={3}
                    style={{ cursor: "grab" }}
                    onKeyDown={onKey}
                  />
                ) : null}
              </g>

              {onMap && !showArrows ? (
                <text x={CL + S - 4} y={CT + S - 8} textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--good)" style={halo}>
                  ∇f ≈ 0 — you are at the bottom
                </text>
              ) : null}
              {!onMap ? (
                <text x={CL + S / 2} y={CT + S / 2} textAnchor="middle" fontSize="13" fontFamily="monospace" fill="var(--danger)" style={halo}>
                  P left the map — η is too big
                </text>
              ) : null}

              {/* axes labels */}
              {[-3, -2, -1, 0, 1, 2, 3].map((t) => (
                <g key={t} fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                  <text x={cx(t)} y={CT + S + 16} textAnchor="middle">
                    {t}
                  </text>
                  <text x={CL - 5} y={cy(t) + 4} textAnchor="end">
                    {t}
                  </text>
                </g>
              ))}
              <text
                x={CL + S - 3}
                y={cy(0) - 5}
                textAnchor="end"
                fontSize="11"
                fontFamily="monospace"
                fill="var(--muted-2)"
                style={halo}
              >
                x →
              </text>

              {/* legend */}
              <g fontSize="11" fontFamily="monospace">
                {(
                  [
                    [8, "var(--danger)", "∇f uphill", 2.75],
                    [100, "var(--good)", "−∇f downhill", 2.75],
                    [212, "var(--accent-2)", "∂f/∂x", 1.5],
                    [278, "var(--violet)", "∂f/∂y", 1.5],
                  ] as const
                ).map(([lx, col, txt, sw]) => (
                  <g key={txt}>
                    <line x1={lx} x2={lx + 16} y1={CH - 12} y2={CH - 12} stroke={col} strokeWidth={sw} />
                    <text x={lx + 21} y={CH - 8} fill={col}>
                      {txt}
                    </text>
                  </g>
                ))}
              </g>
              <text x={CL - 5} y={CT - 9} textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                y ↑
              </text>
            </svg>
          </div>

          {/* ---------------- slices ---------------- */}
          <SlicePanel
            clipId={ids.sx}
            caption={`slice at y = ${fmtC(y0)} → slope = ∂f/∂x = ${fmtC(gx)}`}
            sub="f(x, y₀): walk in x, y frozen"
            color="var(--accent-2)"
            axis="x"
            curve={(t) => surf.f(t, y0)}
            t0={x0}
            slope={gx}
            lo={sliceLo}
            hi={sliceHi}
          />
          <SlicePanel
            clipId={ids.sy}
            caption={`slice at x = ${fmtC(x0)} → slope = ∂f/∂y = ${fmtC(gy)}`}
            sub="f(x₀, y): walk in y, x frozen"
            color="var(--violet)"
            axis="y"
            curve={(t) => surf.f(x0, t)}
            t0={y0}
            slope={gy}
            lo={sliceLo}
            hi={sliceHi}
          />
        </div>
      }
      controls={
        <>
          <Choice<SurfId>
            label="Surface"
            value={surfId}
            options={SURF_OPTIONS}
            onChange={(id) => {
              setSurfId(id);
              setPath([]);
              if (!onMap) setP(DEFAULT_P);
            }}
          />
          <Slider
            label="Learning rate η"
            value={lr}
            min={0.01}
            max={0.6}
            step={0.01}
            onChange={setLr}
            display={`η = ${fmt(lr, 2)}`}
            hint="Long valley: above 0.125 it zig-zags across y; above 0.25 it blows up."
          />
          <div className="flex flex-wrap gap-2">
            <LabButton onClick={() => runSteps(1)} disabled={!finite || Math.abs(x0) > BLOWN || Math.abs(y0) > BLOWN}>
              One step downhill
            </LabButton>
            <LabButton tone="plain" onClick={() => runSteps(20)} disabled={!finite || Math.abs(x0) > BLOWN || Math.abs(y0) > BLOWN}>
              Run 20 steps
            </LabButton>
            <LabButton tone="plain" onClick={() => setPath([])} disabled={path.length === 0}>
              Clear path
            </LabButton>
          </div>
        </>
      }
      readout={
        <Readout
          items={[
            { label: "x₀", value: fmt(x0, 3) },
            { label: "y₀", value: fmt(y0, 3) },
            { label: "f(x₀, y₀)", value: fmt(fval, 3), tone: "warn" },
            { label: "∂f/∂x", value: fmt(gx, 3) },
            { label: "∂f/∂y", value: fmt(gy, 3) },
            { label: "|∇f| (steepness)", value: fmt(gnorm, 3), tone: onMap ? (gnorm < 1e-3 ? "good" : "accent") : "danger" },
            { label: "Steps taken", value: `${steps}` },
          ]}
        />
      }
    />
  );
}
