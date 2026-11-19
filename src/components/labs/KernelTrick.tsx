"use client";

import { useMemo, useState } from "react";
import { LabFrame, Readout, Slider } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt } from "@/lib/stats";
import { mulberry32 } from "@/lib/rng";

/**
 * m5 · The lecture's φ(x) = (x₁, x₂, x₁² + x₂²) lift, drawn as two panels: the
 * flat rings on the left, the lifted side view on the right. The cut is a plane
 * in 3D, which is a horizontal line once you look at it edge-on.
 */
const SEED = 20241004;

interface Pt {
  x: number;
  y: number;
  inner: boolean;
}

function buildRings(): Pt[] {
  const rand = mulberry32(SEED);
  const out: Pt[] = [];
  for (let i = 0; i < 70; i++) {
    const t = rand() * Math.PI * 2;
    const r = 0.9 + rand() * 0.55;
    out.push({ x: Math.cos(t) * r, y: Math.sin(t) * r, inner: true });
  }
  for (let i = 0; i < 90; i++) {
    const t = rand() * Math.PI * 2;
    const r = 2.3 + rand() * 0.7;
    out.push({ x: Math.cos(t) * r, y: Math.sin(t) * r, inner: false });
  }
  return out;
}

const PW = 290;
const PH = 290;
const PAD = 22;

export default function KernelTrick() {
  const [cut, setCut] = useState(4);
  const points = useMemo(() => buildRings(), []);

  const lifted = useMemo(
    () => points.map((p) => ({ ...p, z: p.x * p.x + p.y * p.y })),
    [points],
  );

  const maxZ = 10;

  const flatX = (v: number) => PAD + ((v + 3.2) / 6.4) * (PW - PAD * 2);
  const flatY = (v: number) => PH - PAD - ((v + 3.2) / 6.4) * (PH - PAD * 2);
  const liftR = (r: number) => PAD + (r / 3.2) * (PW - PAD * 2);
  const liftZ = (z: number) => PH - PAD - (z / maxZ) * (PH - PAD * 2);

  const correct = lifted.filter((p) => (p.z < cut) === p.inner).length;
  const accuracy = correct / lifted.length;
  const radiusOfCut = Math.sqrt(Math.max(0, cut));

  return (
    <LabFrame
      title={LABS.kernel.title}
      how={LABS.kernel.how}
      notice="The left panel never changes — no straight line will ever split those rings. Lifting does not move the data, it adds a third reading of it, and in that reading a flat cut is enough. The kernel's trick is computing this separation without ever building the third coordinate."
      onReset={() => setCut(4)}
      stage={
        <div className="grid gap-3 sm:grid-cols-2">
          <div
            className="overflow-hidden rounded-[var(--radius-sm)] border"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
          >
            <svg viewBox={`0 0 ${PW} ${PH}`} className="block h-auto w-full" role="img" aria-label="Two concentric rings of points in two dimensions">
              <text x={PAD} y={16} fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                original (x₁, x₂)
              </text>
              <line x1={flatX(-3.2)} x2={flatX(3.2)} y1={flatY(0)} y2={flatY(0)} stroke="var(--line)" />
              <line x1={flatX(0)} x2={flatX(0)} y1={flatY(-3.2)} y2={flatY(3.2)} stroke="var(--line)" />
              {/* where the cut lands back in 2D: a circle */}
              <circle
                cx={flatX(0)}
                cy={flatY(0)}
                r={(radiusOfCut / 6.4) * (PW - PAD * 2)}
                fill="none"
                stroke="var(--good)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={flatX(p.x)}
                  cy={flatY(p.y)}
                  r="3.4"
                  fill={p.inner ? "var(--danger)" : "var(--accent-2)"}
                  opacity="0.85"
                />
              ))}
            </svg>
          </div>

          <div
            className="overflow-hidden rounded-[var(--radius-sm)] border"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
          >
            <svg viewBox={`0 0 ${PW} ${PH}`} className="block h-auto w-full" role="img" aria-label={`The same points lifted by z equals x1 squared plus x2 squared, with a cut at ${fmt(cut, 1)}`}>
              <text x={PAD} y={16} fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                lifted — z = x₁² + x₂²
              </text>
              <line x1={PAD} x2={PW - PAD} y1={liftZ(0)} y2={liftZ(0)} stroke="var(--line-strong)" />
              <line x1={PAD} x2={PAD} y1={liftZ(maxZ)} y2={liftZ(0)} stroke="var(--line-strong)" />

              <rect
                x={PAD}
                y={liftZ(maxZ)}
                width={PW - PAD * 2}
                height={Math.max(0, liftZ(cut) - liftZ(maxZ))}
                fill="var(--accent-2-soft)"
              />
              <line
                x1={PAD}
                x2={PW - PAD}
                y1={liftZ(cut)}
                y2={liftZ(cut)}
                stroke="var(--good)"
                strokeWidth="2.5"
              />
              <text
                x={PW - PAD}
                y={liftZ(cut) - 6}
                textAnchor="end"
                fontSize="10.5"
                fontFamily="monospace"
                fill="var(--good)"
              >
                cut z = {fmt(cut, 1)}
              </text>

              {lifted.map((p, i) => {
                const r = Math.hypot(p.x, p.y);
                const right = (p.z < cut) === p.inner;
                return (
                  <circle
                    key={i}
                    cx={liftR(r)}
                    cy={liftZ(Math.min(p.z, maxZ))}
                    r={right ? 3.4 : 4.6}
                    fill={p.inner ? "var(--danger)" : "var(--accent-2)"}
                    stroke={right ? "none" : "var(--warn)"}
                    strokeWidth="2"
                    opacity={right ? 0.85 : 1}
                  />
                );
              })}
              <text x={PW - PAD} y={PH - 6} textAnchor="end" fontSize="10" fontFamily="monospace" fill="var(--muted-2)">
                distance from centre →
              </text>
            </svg>
          </div>
        </div>
      }
      controls={
        <Slider
          label="Height of the cut"
          value={cut}
          min={0.2}
          max={9}
          step={0.1}
          onChange={setCut}
          display={`z = ${fmt(cut, 1)}`}
          hint="The flat cut in the lifted space is a circle of radius √z back in the original one."
        />
      }
      readout={
        <Readout
          items={[
            { label: "Accuracy after lifting", value: `${fmt(accuracy * 100, 1)}%`, tone: "good" },
            { label: "Misclassified", value: `${lifted.length - correct}`, tone: "warn" },
            { label: "Cut radius √z", value: fmt(radiusOfCut, 2) },
            { label: "Best achievable with a line in 2D", value: "≈ 56%", tone: "danger" },
            { label: "Inner ring (class 1)", value: `${points.filter((p) => p.inner).length}` },
            { label: "Outer ring (class 0)", value: `${points.filter((p) => !p.inner).length}` },
          ]}
        />
      }
    />
  );
}
