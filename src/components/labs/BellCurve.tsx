"use client";

import { useCallback, useMemo, useState } from "react";
import { LabFrame, Readout, Slider, Stage } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt, normalCdf, normalPdf } from "@/lib/stats";

/** m1 · 68-95-99.7. Exam scores, so μ and σ mean something concrete. */
export default function BellCurve() {
  const [mu, setMu] = useState(70);
  const [sigma, setSigma] = useState(10);
  const [k, setK] = useState(1);

  const W = 620;
  const H = 240;
  const padX = 34;
  const padY = 24;

  const lo = mu - 4 * sigma;
  const hi = mu + 4 * sigma;
  const peak = normalPdf(mu, mu, sigma);

  const x = useCallback(
    (v: number) => padX + ((v - lo) / (hi - lo)) * (W - padX * 2),
    [lo, hi],
  );
  const y = useCallback(
    (d: number) => H - padY - (d / peak) * (H - padY * 2),
    [peak],
  );

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const v = lo + ((hi - lo) * i) / 200;
      pts.push(`${i === 0 ? "M" : "L"}${x(v).toFixed(2)},${y(normalPdf(v, mu, sigma)).toFixed(2)}`);
    }
    return pts.join(" ");
  }, [mu, sigma, lo, hi, x, y]);

  const shade = useMemo(() => {
    const a = mu - k * sigma;
    const b = mu + k * sigma;
    const pts: string[] = [`M${x(a).toFixed(2)},${(H - padY).toFixed(2)}`];
    for (let i = 0; i <= 120; i++) {
      const v = a + ((b - a) * i) / 120;
      pts.push(`L${x(v).toFixed(2)},${y(normalPdf(v, mu, sigma)).toFixed(2)}`);
    }
    pts.push(`L${x(b).toFixed(2)},${(H - padY).toFixed(2)}Z`);
    return pts.join(" ");
  }, [mu, sigma, k, x, y]);

  const area = normalCdf(k) - normalCdf(-k);
  const reference = k === 1 ? "68%" : k === 2 ? "95%" : k === 3 ? "99.7%" : "—";

  return (
    <LabFrame
      title={LABS.normal.title}
      how={LABS.normal.how}
      notice="At k = 1, 2 and 3 the shaded area lands on 68.3%, 95.4% and 99.7% whatever μ and σ you pick — that invariance is the whole reason the rule is worth memorising. A score beyond 3σ is a 3-in-1000 event, which is what a z-score outlier check is really testing."
      onReset={() => {
        setMu(70);
        setSigma(10);
        setK(1);
      }}
      stage={
        <Stage
          viewBox={`0 0 ${W} ${H}`}
          label={`Normal curve with mean ${mu} and standard deviation ${sigma}, shaded between plus and minus ${k} sigma`}
        >
          <line
            x1={padX}
            x2={W - padX}
            y1={H - padY}
            y2={H - padY}
            stroke="var(--line-strong)"
          />
          <path d={shade} fill="var(--accent-soft)" />
          <path d={curve} fill="none" stroke="var(--accent)" strokeWidth="2" />

          {/* sigma gridlines */}
          {[-3, -2, -1, 0, 1, 2, 3].map((n) => (
            <g key={n}>
              <line
                x1={x(mu + n * sigma)}
                x2={x(mu + n * sigma)}
                y1={padY}
                y2={H - padY}
                stroke={n === 0 ? "var(--accent-2)" : "var(--line)"}
                strokeWidth={n === 0 ? 1.5 : 1}
                strokeDasharray={n === 0 ? undefined : "3 5"}
              />
              <text
                x={x(mu + n * sigma)}
                y={H - padY + 14}
                textAnchor="middle"
                fontSize="10.5"
                fontFamily="monospace"
                fill={n === 0 ? "var(--accent-2)" : "var(--muted-2)"}
              >
                {n === 0 ? "μ" : `${n > 0 ? "+" : ""}${n}σ`}
              </text>
              <text
                x={x(mu + n * sigma)}
                y={H - 4}
                textAnchor="middle"
                fontSize="10"
                fontFamily="monospace"
                fill="var(--muted-2)"
              >
                {fmt(mu + n * sigma, 0)}
              </text>
            </g>
          ))}

          {/* the k band edges */}
          {[-k, k].map((n, i) => (
            <line
              key={i}
              x1={x(mu + n * sigma)}
              x2={x(mu + n * sigma)}
              y1={padY}
              y2={H - padY}
              stroke="var(--accent)"
              strokeWidth="1.5"
            />
          ))}

          <text x={padX} y={padY - 8} fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
            {`μ ± ${fmt(k, 1)}σ  →  ${fmt(area * 100, 1)}% of students`}
          </text>
        </Stage>
      }
      controls={
        <>
          <Slider label="Mean μ" value={mu} min={40} max={95} step={1} onChange={setMu} display={`${mu} marks`} />
          <Slider label="Spread σ" value={sigma} min={3} max={25} step={1} onChange={setSigma} display={`${sigma} marks`} />
          <Slider
            label="Band width k"
            value={k}
            min={0.1}
            max={3.5}
            step={0.1}
            onChange={setK}
            display={`± ${fmt(k, 1)}σ`}
            hint="Try exactly 1, 2 and 3."
          />
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Band", value: `${fmt(mu - k * sigma, 1)} … ${fmt(mu + k * sigma, 1)}` },
            { label: "Area inside", value: `${fmt(area * 100, 2)}%`, tone: "good" },
            { label: "Area outside", value: `${fmt((1 - area) * 100, 2)}%`, tone: "warn" },
            { label: "Rule of thumb", value: reference },
            { label: "P(X ≤ μ + kσ)", value: fmt(normalCdf(k), 4) },
            { label: "1 in how many outside", value: area >= 1 ? "—" : `${fmt(1 / (1 - area), 0)}` },
          ]}
        />
      }
    />
  );
}
