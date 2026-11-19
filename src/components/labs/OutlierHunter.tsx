"use client";

import { useEffect, useMemo, useState } from "react";
import { Choice, LabFrame, Readout, Slider, Stage } from "./LabKit";
import { LABS } from "@/lib/labs";
import { DATASETS } from "@/lib/datasets";
import { columnValues, loadDataset, type Table } from "@/lib/csv";
import { fmt, quantile } from "@/lib/stats";

/**
 * m1 · The IQR fence, run against the real course CSVs so the outliers found here
 * are the same rows the notebook flags.
 */
type Source = "employee.salary" | "students.exam_score" | "employee.years_experience";

const SOURCES: Record<Source, { file: string; column: string; label: string; unit: string }> = {
  "employee.salary": {
    file: DATASETS.employee.file,
    column: "salary",
    label: "Employees · salary",
    unit: "",
  },
  "employee.years_experience": {
    file: DATASETS.employee.file,
    column: "years_experience",
    label: "Employees · years_experience",
    unit: " yrs",
  },
  "students.exam_score": {
    file: DATASETS.students.file,
    column: "exam_score",
    label: "Students · exam_score",
    unit: "",
  },
};

export default function OutlierHunter() {
  const [source, setSource] = useState<Source>("employee.salary");
  const [mult, setMult] = useState(1.5);
  // Tagged with the file it belongs to: switching columns makes the old load
  // stale by derivation, so the effect never resets state synchronously.
  const [loaded, setLoaded] = useState<{ file: string; table: Table } | null>(null);
  const [failed, setFailed] = useState<{ file: string; message: string } | null>(null);

  const spec = SOURCES[source];
  const table = loaded?.file === spec.file ? loaded.table : null;
  const error = failed?.file === spec.file ? failed.message : null;

  useEffect(() => {
    let live = true;
    loadDataset(spec.file)
      .then((t) => live && setLoaded({ file: spec.file, table: t }))
      .catch((e: Error) => live && setFailed({ file: spec.file, message: e.message }));
    return () => {
      live = false;
    };
  }, [spec.file]);

  const stats = useMemo(() => {
    if (!table) return null;
    const vals = columnValues(table, spec.column);
    if (!vals.length) return null;
    const sorted = [...vals].sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const lo = q1 - mult * iqr;
    const hi = q3 + mult * iqr;
    const out = vals.filter((v) => v < lo || v > hi);
    return {
      vals,
      sorted,
      q1,
      q3,
      iqr,
      lo,
      hi,
      out,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: quantile(sorted, 0.5),
    };
  }, [table, spec.column, mult]);

  const W = 620;
  const H = 180;
  const padX = 30;

  const scale = (v: number) => {
    if (!stats) return padX;
    const lo = Math.min(stats.min, stats.lo);
    const hi = Math.max(stats.max, stats.hi);
    return padX + ((v - lo) / (hi - lo || 1)) * (W - padX * 2);
  };

  return (
    <LabFrame
      title={LABS.iqr.title}
      how={LABS.iqr.how}
      notice="At 1.5 the fences sit one and a half box-lengths beyond each edge — the rule every course notebook uses. Drag it to 3 and almost everything comes back inside; drag it to 0 and half the data is suddenly an 'outlier'."
      onReset={() => {
        setMult(1.5);
        setSource("employee.salary");
      }}
      stage={
        <Stage viewBox={`0 0 ${W} ${H}`} label={`Box plot of ${spec.label} with IQR fences`}>
          {error ? (
            <text x={padX} y={H / 2} fontSize="13" fill="var(--danger)">
              {error}
            </text>
          ) : !stats ? (
            <text x={padX} y={H / 2} fontSize="13" fill="var(--muted-2)">
              Loading {spec.file}…
            </text>
          ) : (
            <>
              {/* fences */}
              {[stats.lo, stats.hi].map((f, i) => (
                <g key={i}>
                  <line
                    x1={scale(f)}
                    x2={scale(f)}
                    y1={26}
                    y2={H - 42}
                    stroke="var(--danger)"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                  />
                  <text
                    x={scale(f)}
                    y={20}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontFamily="monospace"
                    fill="var(--danger)"
                  >
                    {i === 0 ? "lower fence" : "upper fence"}
                  </text>
                </g>
              ))}

              {/* whiskers + box */}
              <line
                x1={scale(stats.min)}
                x2={scale(stats.max)}
                y1={72}
                y2={72}
                stroke="var(--line-strong)"
                strokeWidth="1.5"
              />
              <rect
                x={scale(stats.q1)}
                y={52}
                width={Math.max(2, scale(stats.q3) - scale(stats.q1))}
                height={40}
                rx="4"
                fill="var(--accent-soft)"
                stroke="var(--accent)"
              />
              <line
                x1={scale(stats.median)}
                x2={scale(stats.median)}
                y1={52}
                y2={92}
                stroke="var(--accent-2)"
                strokeWidth="2"
              />
              <text
                x={scale(stats.q1)}
                y={46}
                textAnchor="middle"
                fontSize="10.5"
                fontFamily="monospace"
                fill="var(--accent)"
              >
                Q1
              </text>
              <text
                x={scale(stats.q3)}
                y={46}
                textAnchor="middle"
                fontSize="10.5"
                fontFamily="monospace"
                fill="var(--accent)"
              >
                Q3
              </text>

              {/* every value as a tick, outliers picked out */}
              {stats.vals.map((v, i) => {
                const isOut = v < stats.lo || v > stats.hi;
                return (
                  <circle
                    key={i}
                    cx={scale(v)}
                    cy={112 + ((i * 7919) % 17)}
                    r={isOut ? 3 : 1.8}
                    fill={isOut ? "var(--danger)" : "var(--muted-2)"}
                    opacity={isOut ? 0.95 : 0.4}
                  />
                );
              })}

              <text x={padX} y={H - 8} fontSize="10.5" fontFamily="monospace" fill="var(--muted-2)">
                {fmt(Math.min(stats.min, stats.lo), 0)}
              </text>
              <text
                x={W - padX}
                y={H - 8}
                textAnchor="end"
                fontSize="10.5"
                fontFamily="monospace"
                fill="var(--muted-2)"
              >
                {fmt(Math.max(stats.max, stats.hi), 0)}
              </text>
            </>
          )}
        </Stage>
      }
      controls={
        <>
          <Choice<Source>
            label="Column"
            value={source}
            onChange={setSource}
            options={(Object.keys(SOURCES) as Source[]).map((k) => ({
              value: k,
              label: SOURCES[k].label,
            }))}
          />
          <Slider
            label="IQR multiplier"
            value={mult}
            min={0}
            max={3}
            step={0.1}
            onChange={setMult}
            display={`${fmt(mult, 1)} × IQR`}
            hint="1.5 is the standard fence."
          />
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Q1", value: stats ? fmt(stats.q1, 1) : "—" },
            { label: "Q3", value: stats ? fmt(stats.q3, 1) : "—" },
            { label: "IQR = Q3 − Q1", value: stats ? fmt(stats.iqr, 1) : "—" },
            { label: "Median", value: stats ? fmt(stats.median, 1) : "—" },
            { label: "Lower fence", value: stats ? fmt(stats.lo, 1) : "—", tone: "danger" },
            { label: "Upper fence", value: stats ? fmt(stats.hi, 1) : "—", tone: "danger" },
            {
              label: "Flagged outliers",
              value: stats ? `${stats.out.length} of ${stats.vals.length}` : "—",
              tone: "warn",
            },
            {
              label: "Share flagged",
              value: stats ? `${fmt((100 * stats.out.length) / stats.vals.length, 1)}%` : "—",
              tone: "warn",
            },
          ]}
        />
      }
    />
  );
}
