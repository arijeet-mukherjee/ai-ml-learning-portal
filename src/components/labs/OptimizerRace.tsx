"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { Choice, LabButton, LabFrame, Readout, Slider, Stage } from "./LabKit";
import { LABS } from "@/lib/labs";
import { clamp, fmt } from "@/lib/stats";
import { gaussian, mulberry32 } from "@/lib/rng";

/**
 * m8 · Four optimizers on one long, narrow, tilted valley.
 *
 * L(x, y) = ½·(A·u² + B·v²), where (u, v) are (x, y) rotated by 25° about the
 * minimum. u runs along the valley floor, v across the steep wall. B / A = 100,
 * so the wall is a hundred times steeper than the floor: a step size that is
 * safe for the wall (η < 2/B = 1) is painfully small for the floor. That is
 * the whole story of why plain GD zig-zags and crawls.
 *
 * SGD, Momentum and Adam all see the same noisy gradient each step:
 * ∇L + N(0, σ²/batch) per coordinate, drawn from one seeded stream so a race is
 * exactly repeatable.
 */
const TILT = (25 * Math.PI) / 180;
const COS = Math.cos(TILT);
const SIN = Math.sin(TILT);
const A_FLOOR = 0.02;
const B_WALL = 2;
const MIN: Vec = [0.9, 0.6];
const DEFAULT_START: Vec = [-2.7, -0.6];
const DEFAULT_ETA = 0.8;
const SIGMA_ONE = 0.2; // gradient noise of a single example
const STEPS = 120;
const SEED = 4242;
const BETA = 0.9;
const BETA1 = 0.9;
const BETA2 = 0.999;
const EPS = 1e-8;
const BLOWN = 1e3; // past this a racer is frozen and called diverged

type Vec = [number, number];
type RacerId = "gd" | "sgd" | "mom" | "adam";
type Batch = "1" | "16" | "128" | "full";

const RACERS: { id: RacerId; name: string; color: string; rule: string }[] = [
  { id: "gd", name: "GD", color: "var(--warn)", rule: "w ← w − η∇L  (exact gradient)" },
  { id: "sgd", name: "SGD", color: "var(--danger)", rule: "same rule, ∇L from a mini-batch (noisy)" },
  { id: "mom", name: "Momentum", color: "var(--accent-2)", rule: "v ← βv + ∇L;  w ← w − ηv   (β = 0.9)" },
  { id: "adam", name: "Adam", color: "var(--violet)", rule: "m, v running averages;  w ← w − η·m̂/(√v̂+ε)" },
];

function loss([x, y]: Vec): number {
  const dx = x - MIN[0];
  const dy = y - MIN[1];
  const u = dx * COS + dy * SIN;
  const v = -dx * SIN + dy * COS;
  return 0.5 * (A_FLOOR * u * u + B_WALL * v * v);
}

function grad([x, y]: Vec): Vec {
  const dx = x - MIN[0];
  const dy = y - MIN[1];
  const u = dx * COS + dy * SIN;
  const v = -dx * SIN + dy * COS;
  const gu = A_FLOOR * u;
  const gv = B_WALL * v;
  // rotate (∂L/∂u, ∂L/∂v) back into (x, y)
  return [gu * COS - gv * SIN, gu * SIN + gv * COS];
}

const noiseSd = (batch: Batch) => (batch === "full" ? 0 : SIGMA_ONE / Math.sqrt(Number(batch)));
const blown = (p: Vec) => !Number.isFinite(p[0]) || Math.abs(p[0]) > BLOWN || Math.abs(p[1]) > BLOWN;

/** All four trajectories for STEPS steps. Pure: same inputs → same race. */
function simulate(start: Vec, eta: number, batch: Batch): Record<RacerId, Vec[]> {
  const normal = gaussian(mulberry32(SEED));
  const sd = noiseSd(batch);
  const out: Record<RacerId, Vec[]> = { gd: [start], sgd: [start], mom: [start], adam: [start] };
  let gd: Vec = start;
  let sgd: Vec = start;
  let mom: Vec = start;
  let adam: Vec = start;
  let vel: Vec = [0, 0];
  const m: Vec = [0, 0];
  const s: Vec = [0, 0];

  for (let t = 1; t <= STEPS; t++) {
    const n: Vec = [normal() * sd, normal() * sd];

    if (!blown(gd)) {
      const g = grad(gd);
      gd = [gd[0] - eta * g[0], gd[1] - eta * g[1]];
    }
    if (!blown(sgd)) {
      const g = grad(sgd);
      sgd = [sgd[0] - eta * (g[0] + n[0]), sgd[1] - eta * (g[1] + n[1])];
    }
    if (!blown(mom)) {
      const g = grad(mom);
      vel = [BETA * vel[0] + g[0] + n[0], BETA * vel[1] + g[1] + n[1]];
      mom = [mom[0] - eta * vel[0], mom[1] - eta * vel[1]];
    }
    if (!blown(adam)) {
      const g = grad(adam);
      const next: Vec = [adam[0], adam[1]];
      for (let i = 0; i < 2; i++) {
        const gi = g[i] + n[i];
        m[i] = BETA1 * m[i] + (1 - BETA1) * gi;
        s[i] = BETA2 * s[i] + (1 - BETA2) * gi * gi;
        const mHat = m[i] / (1 - BETA1 ** t);
        const vHat = s[i] / (1 - BETA2 ** t);
        next[i] -= (eta * mHat) / (Math.sqrt(vHat) + EPS);
      }
      adam = next;
    }

    out.gd.push(gd);
    out.sgd.push(sgd);
    out.mom.push(mom);
    out.adam.push(adam);
  }
  return out;
}

/* ---- geometry ---------------------------------------------------------- */
const MAP = 360;
const LO = -3;
const HI = 3;
const PX = MAP / (HI - LO);
const sx = (x: number) => clamp((x - LO) * PX, -3000, 3000);
const sy = (y: number) => clamp(MAP - (y - LO) * PX, -3000, 3000);

const CW = 360;
const CH = 210;
const CL = 44; // left gutter for the log labels
const CR = 10;
const CT = 14;
const CB = 26;
const LOG_LO = -6;
const LOG_HI = 2;
const cx = (k: number) => CL + (k / STEPS) * (CW - CL - CR);
const cy = (l: number) => {
  const lg = clamp(Math.log10(Math.max(l, 1e-12)), LOG_LO, LOG_HI);
  return CT + ((LOG_HI - lg) / (LOG_HI - LOG_LO)) * (CH - CT - CB);
};

/** Level sets of a quadratic are ellipses, so the contour map is exact, not sampled. */
const LEVELS = Array.from({ length: 15 }, (_, k) => 0.001 * 2 ** k).reverse();

const etaFromSlider = (s: number) => 10 ** s;
const ETA_MIN = Math.log10(0.02);
const ETA_MAX = Math.log10(1.2);

function fmtLoss(l: number): string {
  if (!Number.isFinite(l) || l > 1e5) return "diverged";
  if (l < 0.01) return l.toExponential(2).replace("e-", "e−");
  return fmt(l, 3);
}

export default function OptimizerRace() {
  const [etaLog, setEtaLog] = useState(Math.log10(DEFAULT_ETA));
  const [batch, setBatch] = useState<Batch>("128");
  const [start, setStart] = useState<Vec>(DEFAULT_START);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [raceId, setRaceId] = useState(0); // restarts the loop if Race is pressed mid-race
  const reduceMotion = useReducedMotion();
  const mapRef = useRef<SVGSVGElement | null>(null);

  const eta = etaFromSlider(etaLog);
  const paths = useMemo(() => simulate(start, eta, batch), [start, eta, batch]);

  // Animated race: ~55 steps a second, a step or two per frame. A race always
  // starts from step 0 (see race()), so the loop can count locally.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let cur = 0;
    const tick = (now: number) => {
      acc += ((now - last) / 1000) * 55;
      last = now;
      const whole = Math.floor(acc);
      if (whole > 0) {
        acc -= whole;
        cur = Math.min(STEPS, cur + whole);
        setStep(cur);
        if (cur >= STEPS) {
          setRunning(false);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, raceId]);

  const race = () => {
    if (reduceMotion) {
      setRunning(false);
      setStep(STEPS);
      return;
    }
    setStep(0);
    setRunning(true);
    setRaceId((id) => id + 1);
  };

  const stepOnce = () => {
    setRunning(false);
    setStep((s) => Math.min(STEPS, s + 1));
  };

  const reset = () => {
    setRunning(false);
    setEtaLog(Math.log10(DEFAULT_ETA));
    setBatch("128");
    setStart(DEFAULT_START);
    setStep(0);
  };

  const placeStart = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = mapRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * MAP;
    const py = ((e.clientY - r.top) / r.height) * MAP;
    const x = clamp(LO + px / PX, LO + 0.1, HI - 0.1);
    const y = clamp(LO + (MAP - py) / PX, LO + 0.1, HI - 0.1);
    setRunning(false);
    setStart([Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
    setStep(0);
  };

  const losses = RACERS.map((r) => loss(paths[r.id][step]));
  const finite = losses.filter((l) => Number.isFinite(l) && l <= 1e5);
  const best = step > 0 && finite.length ? Math.min(...finite) : NaN;
  const sd = noiseSd(batch);

  return (
    <LabFrame
      title={LABS.optimizers.title}
      how={LABS.optimizers.how}
      notice="GD zig-zags across the steep wall and crawls along the flat floor. Momentum piles up speed in the direction the gradient keeps pointing, so the back-and-forth averages out and it surges along the floor. Adam divides each coordinate by its own typical gradient size, so the steep and the flat direction move at similar speed. Small batches make every path jittery, but each step costs a tiny fraction of a full pass — which is why deep learning trains on mini-batches of 32–256."
      onReset={reset}
      stage={
        <div className="grid gap-3 md:grid-cols-2">
          <div
            className="overflow-hidden rounded-[var(--radius-sm)] border"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
          >
            <svg
              ref={mapRef}
              viewBox={`0 0 ${MAP} ${MAP}`}
              className="block h-auto w-full cursor-crosshair"
              style={{ touchAction: "manipulation" }}
              role="img"
              aria-label={`Contour map of a narrow tilted valley with four optimizer paths after ${step} steps. Click to move the start point.`}
              onPointerDown={placeStart}
            >
              <defs>
                <clipPath id="opt-race-clip">
                  <rect x="0" y="0" width={MAP} height={MAP} />
                </clipPath>
              </defs>
              <g clipPath="url(#opt-race-clip)">
                {/* filled bands: stacked translucent ellipses get brighter toward the floor */}
                {LEVELS.map((c) => (
                  <ellipse
                    key={`f${c}`}
                    cx={sx(MIN[0])}
                    cy={sy(MIN[1])}
                    rx={Math.sqrt((2 * c) / A_FLOOR) * PX}
                    ry={Math.sqrt((2 * c) / B_WALL) * PX}
                    transform={`rotate(-25 ${sx(MIN[0])} ${sy(MIN[1])})`}
                    fill="var(--accent)"
                    fillOpacity={0.065}
                  />
                ))}
                {LEVELS.map((c) => (
                  <ellipse
                    key={`l${c}`}
                    cx={sx(MIN[0])}
                    cy={sy(MIN[1])}
                    rx={Math.sqrt((2 * c) / A_FLOOR) * PX}
                    ry={Math.sqrt((2 * c) / B_WALL) * PX}
                    transform={`rotate(-25 ${sx(MIN[0])} ${sy(MIN[1])})`}
                    fill="none"
                    stroke="var(--accent)"
                    strokeOpacity={0.4}
                    strokeWidth={0.8}
                  />
                ))}

                {RACERS.map((r) => {
                  const pts = paths[r.id].slice(0, step + 1);
                  return (
                    <polyline
                      key={r.id}
                      points={pts.map((p) => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ")}
                      fill="none"
                      stroke={r.color}
                      strokeWidth={r.id === "gd" ? 2 : 1.6}
                      strokeLinejoin="round"
                      strokeDasharray={r.id === "sgd" ? "5 3" : undefined}
                      opacity={0.95}
                    />
                  );
                })}

                {/* the minimum */}
                <g stroke="var(--text)" strokeWidth={2.2} strokeLinecap="round">
                  <line x1={sx(MIN[0]) - 6} y1={sy(MIN[1]) - 6} x2={sx(MIN[0]) + 6} y2={sy(MIN[1]) + 6} />
                  <line x1={sx(MIN[0]) - 6} y1={sy(MIN[1]) + 6} x2={sx(MIN[0]) + 6} y2={sy(MIN[1]) - 6} />
                </g>

                {/* start */}
                <circle cx={sx(start[0])} cy={sy(start[1])} r={6} fill="none" stroke="var(--text)" strokeWidth={1.6} />

                {RACERS.map((r) => {
                  const p = paths[r.id][step];
                  if (blown(p)) return null;
                  return (
                    <circle
                      key={`h${r.id}`}
                      cx={sx(p[0])}
                      cy={sy(p[1])}
                      r={5}
                      fill={r.color}
                      stroke="var(--ink-2)"
                      strokeWidth={1.5}
                    />
                  );
                })}
              </g>
              <text x={10} y={20} fontSize="11" fontFamily="monospace" fill="var(--muted)">
                tap / click to move the start ○
              </text>
              <text x={MAP - 10} y={MAP - 10} textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--muted)">
                ✕ minimum · wall 100× steeper than floor
              </text>
            </svg>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <Stage viewBox={`0 0 ${CW} ${CH}`} label={`Loss versus step on a log scale for the four optimizers, step ${step} of ${STEPS}`}>
              {Array.from({ length: LOG_HI - LOG_LO + 1 }, (_, i) => LOG_LO + i).map((lg) => (
                <g key={lg}>
                  <line x1={CL} x2={CW - CR} y1={cy(10 ** lg)} y2={cy(10 ** lg)} stroke="var(--line)" />
                  {lg % 2 === 0 ? (
                    <text x={CL - 6} y={cy(10 ** lg) + 4} textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                      {lg === 0 ? "1" : `1e${lg}`.replace("-", "−")}
                    </text>
                  ) : null}
                </g>
              ))}
              <line x1={cx(step)} x2={cx(step)} y1={CT} y2={CH - CB} stroke="var(--line-strong)" strokeDasharray="3 3" />
              {RACERS.map((r) => (
                <polyline
                  key={r.id}
                  points={paths[r.id]
                    .slice(0, step + 1)
                    .map((p, k) => `${cx(k).toFixed(1)},${cy(loss(p)).toFixed(1)}`)
                    .join(" ")}
                  fill="none"
                  stroke={r.color}
                  strokeWidth={1.7}
                  strokeLinejoin="round"
                  strokeDasharray={r.id === "sgd" ? "5 3" : undefined}
                />
              ))}
              <text x={CL} y={CH - 7} fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                0
              </text>
              <text x={CW - CR} y={CH - 7} textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                step {STEPS}
              </text>
              <text x={(CL + CW) / 2} y={CH - 7} textAnchor="middle" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                loss (log scale) vs step
              </text>
            </Stage>

            <ul className="space-y-1.5 text-[13px]" aria-label="Update rules">
              {RACERS.map((r) => (
                <li key={r.id} className="flex items-start gap-2">
                  <span
                    className="mt-[5px] inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: r.color }}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="font-semibold" style={{ color: "var(--text)" }}>
                      {r.name}
                      {r.id === "sgd" && batch === "full" ? " (= GD at full batch)" : ""}:
                    </span>{" "}
                    <span className="font-mono text-[12.5px]" style={{ color: "var(--muted)" }}>
                      {r.rule}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="Learning rate η"
            value={etaLog}
            min={ETA_MIN}
            max={ETA_MAX}
            step={0.01}
            onChange={setEtaLog}
            display={fmt(eta, eta < 0.1 ? 3 : 2)}
            hint="Log scale. GD and SGD blow up above η = 1: the wall's curvature is 2, and 2/2 = 1."
          />
          <Choice<Batch>
            label="Batch size (gradient noise ∝ 1/√batch)"
            value={batch}
            onChange={setBatch}
            options={[
              { value: "1", label: "1" },
              { value: "16", label: "16" },
              { value: "128", label: "128" },
              { value: "full", label: "full batch" },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <LabButton onClick={race}>{running ? "Racing…" : "Race"}</LabButton>
            <LabButton tone="plain" onClick={stepOnce} disabled={step >= STEPS}>
              Step ×1
            </LabButton>
            <LabButton tone="plain" onClick={reset}>
              Reset
            </LabButton>
          </div>
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Step", value: `${step} / ${STEPS}` },
            ...RACERS.map((r, i) => {
              const l = losses[i];
              const dead = !Number.isFinite(l) || l > 1e5;
              return {
                label: `${r.name} loss`,
                value: fmtLoss(l),
                tone: dead ? ("danger" as const) : l === best ? ("good" as const) : undefined,
              };
            }),
            { label: "Gradient noise σ", value: sd === 0 ? "0 (exact)" : fmt(sd, 3) },
          ]}
        />
      }
    />
  );
}
