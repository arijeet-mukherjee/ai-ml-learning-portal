"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { LabFrame, Readout } from "./LabKit";
import { LABS } from "@/lib/labs";
import { clamp, dot, fmt, norm1, norm2 } from "@/lib/stats";

/**
 * m2 · Drag two arrows; every quantity in the dot-product and cosine sections
 * updates at once. Defaults are the lecture's t = [4, 3] and p = [2, 4], whose
 * dot product is 20 and cosine 0.89.
 */
const W = 440;
const H = 320;
const PAD = 26;
const RANGE = 8; // axis spans -1 … 8

export default function VectorPlayground() {
  const [a, setA] = useState<[number, number]>([4, 3]);
  const [b, setB] = useState<[number, number]>([2, 4]);
  const [drag, setDrag] = useState<"a" | "b" | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const sx = (v: number) => PAD + ((v + 1) / (RANGE + 1)) * (W - PAD * 2);
  const sy = (v: number) => H - PAD - ((v + 1) / (RANGE + 1)) * (H - PAD * 2);

  const toData = useCallback((clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * W;
    const py = ((clientY - rect.top) / rect.height) * H;
    const x = ((px - PAD) / (W - PAD * 2)) * (RANGE + 1) - 1;
    const y = ((H - PAD - py) / (H - PAD * 2)) * (RANGE + 1) - 1;
    return [
      clamp(Math.round(x * 2) / 2, -1, RANGE),
      clamp(Math.round(y * 2) / 2, -1, RANGE),
    ];
  }, []);

  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const pt = toData(e.clientX, e.clientY);
    if (drag === "a") setA(pt);
    else setB(pt);
  };

  const m = useMemo(() => {
    const av = [a[0], a[1]];
    const bv = [b[0], b[1]];
    const d = dot(av, bv);
    const la = norm2(av);
    const lb = norm2(bv);
    const cos = la && lb ? d / (la * lb) : 0;
    const diff = [av[0] - bv[0], av[1] - bv[1]];
    return {
      d,
      la,
      lb,
      cos,
      angle: (Math.acos(clamp(cos, -1, 1)) * 180) / Math.PI,
      l2: norm2(diff),
      l1: norm1(diff),
    };
  }, [a, b]);

  const nudge = (which: "a" | "b", dx: number, dy: number) => {
    const set = which === "a" ? setA : setB;
    const cur = which === "a" ? a : b;
    set([clamp(cur[0] + dx, -1, RANGE), clamp(cur[1] + dy, -1, RANGE)]);
  };

  const handleKey = (which: "a" | "b") => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 1 : 0.5;
    const map: Record<string, [number, number]> = {
      ArrowRight: [step, 0],
      ArrowLeft: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    nudge(which, d[0], d[1]);
  };

  const arrow = (v: [number, number], color: string, label: string, which: "a" | "b") => (
    <g>
      <line
        x1={sx(0)}
        y1={sy(0)}
        x2={sx(v[0])}
        y2={sy(v[1])}
        stroke={color}
        strokeWidth="2.5"
        markerEnd={`url(#head-${which})`}
      />
      <circle
        cx={sx(v[0])}
        cy={sy(v[1])}
        r="9"
        fill={color}
        fillOpacity="0.25"
        stroke={color}
        strokeWidth="1.5"
        tabIndex={0}
        role="slider"
        aria-label={`Vector ${label} tip. Arrow keys move it by 0.5, hold shift for 1.`}
        aria-valuetext={`${label} = [${fmt(v[0], 1)}, ${fmt(v[1], 1)}]`}
        aria-valuenow={v[0]}
        style={{ cursor: "grab" }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture(e.pointerId);
          setDrag(which);
        }}
        onKeyDown={handleKey(which)}
      />
      <text
        x={sx(v[0]) + 13}
        y={sy(v[1]) - 8}
        fontSize="12.5"
        fontFamily="monospace"
        fill={color}
      >
        {label} [{fmt(v[0], 1)}, {fmt(v[1], 1)}]
      </text>
    </g>
  );

  return (
    <LabFrame
      title={LABS.vectors.title}
      how={LABS.vectors.how}
      notice="Scale one arrow up without turning it: the dot product and both distances grow, but the cosine does not move at all. That is the whole reason semantic search compares angles, not distances — a three-line ticket and a three-paragraph ticket about the same issue should score alike."
      onReset={() => {
        setA([4, 3]);
        setB([2, 4]);
      }}
      stage={
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div
            className="overflow-hidden rounded-[var(--radius-sm)] border"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="block h-auto w-full touch-none"
              onPointerMove={onMove}
              onPointerUp={() => setDrag(null)}
              onPointerCancel={() => setDrag(null)}
              role="application"
              aria-label="Two draggable vectors on a grid"
            >
              <defs>
                {(["a", "b"] as const).map((k) => (
                  <marker
                    key={k}
                    id={`head-${k}`}
                    markerWidth="9"
                    markerHeight="9"
                    refX="7"
                    refY="4.5"
                    orient="auto"
                  >
                    <path
                      d="M0,0 L9,4.5 L0,9 Z"
                      fill={k === "a" ? "var(--accent)" : "var(--accent-2)"}
                    />
                  </marker>
                ))}
              </defs>

              {Array.from({ length: RANGE + 2 }, (_, i) => i - 1).map((n) => (
                <g key={n}>
                  <line x1={sx(n)} x2={sx(n)} y1={PAD} y2={H - PAD} stroke="var(--line)" />
                  <line x1={PAD} x2={W - PAD} y1={sy(n)} y2={sy(n)} stroke="var(--line)" />
                </g>
              ))}
              <line x1={sx(0)} x2={W - PAD} y1={sy(0)} y2={sy(0)} stroke="var(--line-strong)" strokeWidth="1.5" />
              <line x1={sx(0)} x2={sx(0)} y1={PAD} y2={sy(0)} stroke="var(--line-strong)" strokeWidth="1.5" />

              {/* the angle between them */}
              <path
                d={`M${sx(0)},${sy(0)} L${sx(Math.cos(Math.atan2(a[1], a[0])) * 1.4)},${sy(Math.sin(Math.atan2(a[1], a[0])) * 1.4)} A ${(1.4 * (W - PAD * 2)) / (RANGE + 1)} ${(1.4 * (H - PAD * 2)) / (RANGE + 1)} 0 0 ${Math.atan2(b[1], b[0]) > Math.atan2(a[1], a[0]) ? 0 : 1} ${sx(Math.cos(Math.atan2(b[1], b[0])) * 1.4)},${sy(Math.sin(Math.atan2(b[1], b[0])) * 1.4)} Z`}
                fill="var(--warn-soft)"
                stroke="var(--warn)"
                strokeWidth="1"
              />

              {arrow(a, "var(--accent)", "a", "a")}
              {arrow(b, "var(--accent-2)", "b", "b")}
            </svg>
          </div>
        </div>
      }
      controls={
        <p className="text-[13.5px]" style={{ color: "var(--muted)" }}>
          Drag either arrow tip, or focus one with <kbd>Tab</kbd> and move it with the arrow
          keys (<kbd>Shift</kbd> for whole steps). The shaded wedge is the angle θ whose
          cosine you are reading.
        </p>
      }
      readout={
        <Readout
          items={[
            { label: "a · b", value: fmt(m.d, 2) },
            { label: "cos θ", value: fmt(m.cos, 3), tone: "good" },
            { label: "θ", value: `${fmt(m.angle, 1)}°`, tone: "warn" },
            { label: "|a|₂", value: fmt(m.la, 2) },
            { label: "|b|₂", value: fmt(m.lb, 2) },
            {
              label: "sign",
              value: m.d > 0.001 ? "same way" : m.d < -0.001 ? "opposing" : "perpendicular",
            },
            { label: "L2 distance", value: fmt(m.l2, 2) },
            { label: "L1 distance", value: fmt(m.l1, 2) },
          ]}
        />
      }
    />
  );
}
