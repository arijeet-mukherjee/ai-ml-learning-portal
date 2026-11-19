"use client";

import { useMemo, useState } from "react";
import { LabButton, LabFrame, Readout, Slider, Stage } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt } from "@/lib/stats";

/**
 * m2 · Rotate a line and watch the variance of the projections.
 *
 * The points are the lecture's five accounts (sessions S, features F), whose
 * covariance matrix is [[10, 8], [8, 10]]. At 45° the projected variance is
 * exactly 18 and at 135° exactly 2 — the eigenvalues worked out on the slide.
 */
const POINTS: [number, number][] = [
  [2, 6],
  [4, 4],
  [6, 8],
  [8, 12],
  [10, 10],
];

const MEAN_X = 6;
const MEAN_Y = 8;

const W = 460;
const H = 300;
const PAD = 34;

export default function FirstComponent() {
  const [deg, setDeg] = useState(0);

  const u = useMemo<[number, number]>(() => {
    const rad = (deg * Math.PI) / 180;
    return [Math.cos(rad), Math.sin(rad)];
  }, [deg]);

  const centred = useMemo(
    () => POINTS.map(([x, y]) => [x - MEAN_X, y - MEAN_Y] as [number, number]),
    [],
  );

  const proj = useMemo(
    () => centred.map(([x, y]) => x * u[0] + y * u[1]),
    [centred, u],
  );

  /** Sample variance (n − 1), the convention the lecture's table uses. */
  const variance = useMemo(
    () => proj.reduce((a, t) => a + t * t, 0) / (proj.length - 1),
    [proj],
  );

  const totalVariance = 20; // var S 10 + var F 10, the trace of the covariance matrix

  const sx = (v: number) => PAD + ((v + 2) / 16) * (W - PAD * 2);
  const sy = (v: number) => H - PAD - ((v + 2) / 16) * (H - PAD * 2);

  const lineLen = 9;

  return (
    <LabFrame
      title={LABS.pca.title}
      how={LABS.pca.how}
      notice="The projected variance peaks at 45° with the value 18 and bottoms out at 135° with 2 — exactly the eigenvalues of [[10, 8], [8, 10]] from the lecture. PC1 is not chosen by a formula you have to trust: it is simply the direction where this number is largest."
      onReset={() => setDeg(0)}
      stage={
        <Stage
          viewBox={`0 0 ${W} ${H}`}
          label={`Five data points with a projection line at ${deg} degrees; projected variance ${fmt(variance, 2)}`}
        >
          {/* axes through the mean */}
          <line x1={PAD} x2={W - PAD} y1={sy(MEAN_Y - MEAN_Y)} y2={sy(0)} stroke="var(--line)" />
          <line x1={sx(0)} x2={sx(0)} y1={PAD} y2={H - PAD} stroke="var(--line)" />

          {/* candidate direction */}
          <line
            x1={sx(-lineLen * u[0])}
            y1={sy(-lineLen * u[1])}
            x2={sx(lineLen * u[0])}
            y2={sy(lineLen * u[1])}
            stroke="var(--accent)"
            strokeWidth="2"
          />

          {/* dropped perpendiculars + projected positions */}
          {centred.map(([x, y], i) => {
            const t = proj[i];
            const px = t * u[0];
            const py = t * u[1];
            return (
              <g key={i}>
                <line
                  x1={sx(x)}
                  y1={sy(y)}
                  x2={sx(px)}
                  y2={sy(py)}
                  stroke="var(--muted-2)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle cx={sx(px)} cy={sy(py)} r="4.5" fill="var(--accent)" />
                <circle
                  cx={sx(x)}
                  cy={sy(y)}
                  r="5.5"
                  fill="var(--accent-2-soft)"
                  stroke="var(--accent-2)"
                  strokeWidth="1.5"
                />
                <text
                  x={sx(x) + 9}
                  y={sy(y) - 7}
                  fontSize="10.5"
                  fontFamily="monospace"
                  fill="var(--muted-2)"
                >
                  A{i + 1}
                </text>
              </g>
            );
          })}

          <circle cx={sx(0)} cy={sy(0)} r="3" fill="var(--warn)" />
          <text x={sx(0) + 7} y={sy(0) + 14} fontSize="10.5" fontFamily="monospace" fill="var(--warn)">
            mean (6, 8)
          </text>
          <text x={PAD} y={PAD - 12} fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
            {`direction [${fmt(u[0], 2)}, ${fmt(u[1], 2)}] · variance ${fmt(variance, 2)}`}
          </text>
        </Stage>
      }
      controls={
        <>
          <Slider
            label="Rotate the line"
            value={deg}
            min={0}
            max={179}
            step={1}
            onChange={setDeg}
            display={`${deg}°`}
            hint="Sweep slowly through 45° and 135°."
          />
          <div className="flex flex-wrap gap-2">
            <LabButton onClick={() => setDeg(45)}>Snap to PC1 (45°)</LabButton>
            <LabButton tone="plain" onClick={() => setDeg(135)}>
              Snap to PC2 (135°)
            </LabButton>
          </div>
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Projected variance", value: fmt(variance, 2), tone: "good" },
            {
              label: "Share of total (20)",
              value: `${fmt((variance / totalVariance) * 100, 1)}%`,
              tone: "good",
            },
            { label: "λ₁ at 45°", value: "18.00" },
            { label: "λ₂ at 135°", value: "2.00" },
            { label: "Projections", value: proj.map((t) => fmt(t, 1)).join(", ") },
            {
              label: "At PC1?",
              value: Math.abs(variance - 18) < 0.01 ? "yes — maximum" : "not yet",
              tone: Math.abs(variance - 18) < 0.01 ? "good" : "warn",
            },
          ]}
        />
      }
    />
  );
}
