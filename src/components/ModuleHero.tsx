"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import type { Motif } from "@/types/content";
import { mulberry32 } from "@/lib/rng";

/**
 * Each module gets its own animated header, derived from its subject rather than
 * decoration for its own sake: drifting points for statistics, rotating axes for
 * linear algebra, a descending ball for gradient descent, a splitting tree for
 * ensembles. SVG with transform-only animation, so nothing triggers layout.
 */
export default function ModuleHero({
  motif,
  height = 180,
}: {
  motif: Motif;
  height?: number;
}) {
  const reduce = useReducedMotion();
  const W = 1200;
  const H = 240;

  const rnd = useMemo(() => mulberry32(motif.length * 7919 + 13), [motif]);
  const dots = useMemo(
    () =>
      Array.from({ length: 46 }, () => ({
        x: rnd() * W,
        y: rnd() * H,
        r: 1 + rnd() * 2.6,
        d: rnd() * 6,
      })),
    [rnd],
  );

  const anim = (dur: number, delay = 0) =>
    reduce
      ? undefined
      : ({
          animation: `drift ${dur}s var(--ease-in-out) ${delay}s infinite alternate`,
        } as const);

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius)] border"
      style={{
        height,
        borderColor: "var(--line)",
        background:
          "radial-gradient(120% 140% at 10% 0%, var(--accent-soft), transparent 55%), var(--panel)",
      }}
      aria-hidden
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id={`fade-${motif}`} x1="0" x2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {motif === "grid" ? (
          <g stroke="var(--line-strong)">
            {Array.from({ length: 13 }, (_, i) => (
              <line key={`v${i}`} x1={i * 100} x2={i * 100} y1={0} y2={H} style={anim(7, i * 0.08)} />
            ))}
            {Array.from({ length: 5 }, (_, i) => (
              <line key={`h${i}`} x1={0} x2={W} y1={i * 60} y2={i * 60} opacity="0.5" />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <rect
                key={`c${i}`}
                x={120 + i * 100}
                y={70 + (i % 3) * 40}
                width="54"
                height="34"
                rx="6"
                fill="var(--accent-soft)"
                stroke="var(--accent)"
                style={anim(5 + i * 0.3, i * 0.12)}
              />
            ))}
          </g>
        ) : null}

        {motif === "scatter" ? (
          <g>
            <path
              d={`M0,${H - 30} ${Array.from({ length: 60 }, (_, i) => {
                const x = (i / 59) * W;
                const z = (x / W - 0.5) * 6;
                return `L${x},${H - 30 - Math.exp(-0.5 * z * z) * 150}`;
              }).join(" ")}`}
              fill="none"
              stroke="url(#fade-scatter)"
              strokeWidth="2.5"
            />
            {dots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={d.r}
                fill="var(--accent-2)"
                opacity="0.55"
                style={anim(4 + d.d, d.d * 0.3)}
              />
            ))}
          </g>
        ) : null}

        {motif === "axes" ? (
          <g>
            {[0, 30, 60, 90, 120, 150].map((deg, i) => {
              const r = (deg * Math.PI) / 180;
              return (
                <line
                  key={deg}
                  x1={W / 2 - Math.cos(r) * 400}
                  y1={H / 2 + Math.sin(r) * 90}
                  x2={W / 2 + Math.cos(r) * 400}
                  y2={H / 2 - Math.sin(r) * 90}
                  stroke={i === 1 ? "var(--accent)" : "var(--line-strong)"}
                  strokeWidth={i === 1 ? 2.5 : 1}
                  style={anim(6 + i, i * 0.2)}
                />
              );
            })}
            {dots.slice(0, 28).map((d, i) => (
              <circle key={i} cx={d.x} cy={H / 2 + (d.x / W - 0.5) * 110 + (d.y - H / 2) * 0.25} r="3.4" fill="var(--accent-2)" opacity="0.7" style={anim(5 + d.d, i * 0.1)} />
            ))}
          </g>
        ) : null}

        {motif === "pixels" ? (
          <g>
            {Array.from({ length: 180 }, (_, i) => {
              const c = i % 30;
              const r = Math.floor(i / 30);
              const v = rnd();
              return (
                <rect
                  key={i}
                  x={c * 40}
                  y={r * 40}
                  width="36"
                  height="36"
                  rx="3"
                  fill="var(--accent)"
                  opacity={v * 0.35}
                  style={anim(4 + v * 5, (i % 11) * 0.09)}
                />
              );
            })}
          </g>
        ) : null}

        {motif === "descent" ? (
          <g>
            <path
              d={`M0,30 ${Array.from({ length: 80 }, (_, i) => {
                const x = (i / 79) * W;
                const t = (x / W) * 2 - 1;
                return `L${x},${40 + t * t * 160}`;
              }).join(" ")}`}
              fill="none"
              stroke="url(#fade-descent)"
              strokeWidth="2.5"
            />
            {[0.08, 0.2, 0.33, 0.43, 0.48].map((t, i) => (
              <circle
                key={i}
                cx={t * W}
                cy={40 + (t * 2 - 1) ** 2 * 160}
                r={7 - i}
                fill="var(--warn)"
                opacity={0.4 + i * 0.14}
                style={anim(3 + i * 0.6, i * 0.25)}
              />
            ))}
          </g>
        ) : null}

        {motif === "margin" ? (
          <g>
            <line x1="0" y1="200" x2={W} y2="40" stroke="var(--accent)" strokeWidth="2.5" />
            <line x1="0" y1="150" x2={W} y2="-10" stroke="var(--good)" strokeWidth="1.5" strokeDasharray="10 8" />
            <line x1="0" y1="250" x2={W} y2="90" stroke="var(--good)" strokeWidth="1.5" strokeDasharray="10 8" />
            {dots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r="4.5"
                fill={d.y < 200 - (d.x / W) * 160 ? "var(--danger)" : "var(--accent-2)"}
                opacity="0.75"
                style={anim(5 + d.d, i * 0.07)}
              />
            ))}
          </g>
        ) : null}

        {motif === "branch" ? (
          <g stroke="var(--line-strong)" fill="none">
            {[
              [600, 20, 300, 100],
              [600, 20, 900, 100],
              [300, 100, 150, 190],
              [300, 100, 450, 190],
              [900, 100, 750, 190],
              [900, 100, 1050, 190],
            ].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" style={anim(6, i * 0.15)} />
            ))}
            {[
              [600, 20],
              [300, 100],
              [900, 100],
              [150, 190],
              [450, 190],
              [750, 190],
              [1050, 190],
            ].map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={i === 0 ? 13 : 9}
                fill={i === 0 ? "var(--accent-soft)" : "var(--panel-2)"}
                stroke="var(--accent)"
                strokeWidth="1.8"
                style={anim(4 + i * 0.4, i * 0.1)}
              />
            ))}
          </g>
        ) : null}

        {motif === "network" ? (
          <g>
            {(() => {
              const layers = [3, 5, 5, 2];
              const xs = [180, 460, 740, 1020];
              const nodes = layers.map((n, li) =>
                Array.from({ length: n }, (_, k) => ({ x: xs[li], y: 120 + (k - (n - 1) / 2) * 42 })),
              );
              return (
                <>
                  {nodes.slice(0, -1).flatMap((col, li) =>
                    col.flatMap((a, ai) =>
                      nodes[li + 1].map((b, bi) => (
                        <line
                          key={`${li}-${ai}-${bi}`}
                          x1={a.x}
                          y1={a.y}
                          x2={b.x}
                          y2={b.y}
                          stroke={(ai + bi + li) % 3 === 0 ? "var(--accent-2)" : "var(--line-strong)"}
                          strokeWidth={(ai + bi) % 2 === 0 ? 1.6 : 0.9}
                          opacity={0.75}
                          style={anim(5 + ((ai + bi) % 4) * 0.6, (ai + bi + li) * 0.12)}
                        />
                      )),
                    ),
                  )}
                  {nodes.flatMap((col, li) =>
                    col.map((n, k) => (
                      <circle
                        key={`n-${li}-${k}`}
                        cx={n.x}
                        cy={n.y}
                        r={li === 0 || li === layers.length - 1 ? 12 : 10}
                        fill={li === layers.length - 1 ? "var(--accent-soft)" : "var(--panel-2)"}
                        stroke="var(--accent)"
                        strokeWidth="1.8"
                        style={anim(4 + k * 0.35, li * 0.2 + k * 0.08)}
                      />
                    )),
                  )}
                </>
              );
            })()}
          </g>
        ) : null}

        {motif === "map" ? (
          <g>
            {Array.from({ length: 9 }, (_, i) => {
              const x = 70 + i * 132;
              const y = 60 + ((i * 53) % 110);
              return (
                <g key={i}>
                  {i < 8 ? (
                    <line
                      x1={x}
                      y1={y}
                      x2={70 + (i + 1) * 132}
                      y2={60 + (((i + 1) * 53) % 110)}
                      stroke="var(--line-strong)"
                      strokeWidth="1.5"
                    />
                  ) : null}
                  <circle
                    cx={x}
                    cy={y}
                    r="15"
                    fill="var(--accent-soft)"
                    stroke="var(--accent)"
                    strokeWidth="1.8"
                    style={anim(5 + i * 0.3, i * 0.14)}
                  />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="13" fontFamily="monospace" fill="var(--accent)">
                    {i}
                  </text>
                </g>
              );
            })}
          </g>
        ) : null}
      </svg>
    </div>
  );
}
