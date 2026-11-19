"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { modules } from "@/content/modules";
import { useProgress } from "@/lib/useProgress";

/**
 * The portal's signature screen: all nine modules as nodes on one map, with
 * dependency edges, progress rings and a hover preview. Laid out on a fixed
 * viewBox so the geometry is identical at every width; on narrow screens the
 * cards below the map carry the same information in a readable form.
 */
const NODES: { id: string; x: number; y: number }[] = [
  { id: "m0", x: 110, y: 230 },
  { id: "m1", x: 290, y: 120 },
  { id: "m2", x: 290, y: 340 },
  { id: "m3", x: 480, y: 230 },
  { id: "m4", x: 670, y: 120 },
  { id: "m5", x: 670, y: 340 },
  { id: "m6", x: 860, y: 230 },
  { id: "m7", x: 1040, y: 120 },
  { id: "m8", x: 1040, y: 340 },
];

const EDGES: [string, string][] = [
  ["m0", "m1"],
  ["m0", "m2"],
  ["m1", "m3"],
  ["m2", "m3"],
  ["m3", "m4"],
  ["m3", "m5"],
  ["m4", "m5"],
  ["m4", "m6"],
  ["m5", "m6"],
  ["m6", "m7"],
  ["m4", "m8"],
  ["m6", "m8"],
];

const pos = (id: string) => NODES.find((n) => n.id === id)!;

export default function MasterMap() {
  const { progress } = useProgress();
  const [hover, setHover] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const completion = (id: string) => {
    const m = modules.find((x) => x.id === id);
    if (!m || !m.chapters.length) return 0;
    const done = m.chapters.filter((c) => progress.chapters[c.slug]?.completed).length;
    return done / m.chapters.length;
  };

  const R = 40;
  const C = 2 * Math.PI * (R - 4);

  return (
    <div>
      <div
        className="overflow-x-auto rounded-[var(--radius)] border"
        style={{
          borderColor: "var(--line)",
          background:
            "radial-gradient(90% 120% at 50% 0%, var(--accent-soft), transparent 60%), var(--panel)",
        }}
      >
        <svg
          viewBox="0 0 1150 460"
          className="block h-auto w-full min-w-[720px]"
          role="img"
          aria-label="Map of the nine course modules and how they depend on each other"
        >
          {EDGES.map(([a, b]) => {
            const pa = pos(a);
            const pb = pos(b);
            const lit = hover === a || hover === b;
            return (
              <line
                key={`${a}-${b}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={lit ? "var(--accent)" : "var(--line-strong)"}
                strokeWidth={lit ? 2 : 1.3}
                opacity={hover && !lit ? 0.35 : 1}
              />
            );
          })}

          {NODES.map((n, i) => {
            const m = modules.find((x) => x.id === n.id)!;
            const pct = completion(n.id);
            const lit = hover === n.id;
            return (
              <motion.g
                key={n.id}
                initial={reduce ? undefined : { opacity: 0, scale: 0.88 }}
                animate={reduce ? undefined : { opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: `${n.x}px ${n.y}px`, cursor: "pointer" }}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={R}
                  fill={lit ? "var(--accent-soft)" : "var(--panel-2)"}
                  stroke={lit ? "var(--accent)" : "var(--line-strong)"}
                  strokeWidth="1.8"
                />
                {/* progress ring */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={R - 4}
                  fill="none"
                  stroke="var(--good)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${pct * C} ${C}`}
                  transform={`rotate(-90 ${n.x} ${n.y})`}
                  opacity={pct ? 0.9 : 0}
                />
                <text
                  x={n.x}
                  y={n.y - 2}
                  textAnchor="middle"
                  fontSize="20"
                  fontFamily="monospace"
                  fontWeight="600"
                  fill={lit ? "var(--accent)" : "var(--text)"}
                >
                  M{m.number}
                </text>
                <text
                  x={n.x}
                  y={n.y + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="var(--muted-2)"
                >
                  {m.chapters.length ? `${m.chapters.length} ch` : "soon"}
                </text>
                <text
                  x={n.x}
                  y={n.y + R + 18}
                  textAnchor="middle"
                  fontSize="12.5"
                  fill={lit ? "var(--text)" : "var(--muted)"}
                >
                  {m.title.split(":")[0].slice(0, 26)}
                </text>
                <a href={`#module-${m.id}`} aria-label={`Go to ${m.title}`}>
                  <circle cx={n.x} cy={n.y} r={R} fill="transparent" />
                </a>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Hover preview / fallback list */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((m) => {
          const pct = completion(m.id);
          return (
            <Link
              key={m.id}
              id={`module-${m.id}`}
              href={`/modules/${m.id}`}
              onMouseEnter={() => setHover(m.id)}
              onMouseLeave={() => setHover(null)}
              className="panel group scroll-mt-24 p-4 transition-colors"
              style={{
                background: hover === m.id ? "var(--panel-2)" : "var(--panel)",
                borderColor: hover === m.id ? "var(--accent)" : "var(--line)",
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[12px]" style={{ color: "var(--accent)" }}>
                  M{m.number}
                </span>
                <span className="font-mono text-[11px]" style={{ color: "var(--muted-2)" }}>
                  {m.date}
                </span>
              </div>
              <h3 className="mt-1 text-[15px] leading-snug font-semibold group-hover:underline">
                {m.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-snug" style={{ color: "var(--muted)" }}>
                {m.tagline}
              </p>
              <div
                className="mt-3 h-[3px] overflow-hidden rounded-full"
                style={{ background: "var(--line)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct * 100}%`, background: "var(--good)" }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
