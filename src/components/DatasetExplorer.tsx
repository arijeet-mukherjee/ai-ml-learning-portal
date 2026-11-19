"use client";

import { useEffect, useMemo, useState } from "react";
import { Choice } from "./labs/LabKit";
import { DATASET_LIST, DATASETS } from "@/lib/datasets";
import { columnValues, loadDataset, missingCount, type Table } from "@/lib/csv";
import { asset } from "@/lib/basePath";
import { fmt, mean, quantile, std } from "@/lib/stats";
import type { DatasetId } from "@/types/content";

/**
 * Pick a CSV, pick a column: distribution, summary statistics, missing-value count
 * and a correlation heatmap. Everything is computed in the browser from the real
 * files in public/data, so the numbers match what pandas would print.
 */
export default function DatasetExplorer() {
  const [id, setId] = useState<DatasetId>("employee");
  // State is tagged with the file it belongs to, so a dataset switch makes the
  // previous load stale by derivation rather than by a setState in an effect.
  const [loaded, setLoaded] = useState<{ file: string; table: Table } | null>(null);
  const [failed, setFailed] = useState<{ file: string; message: string } | null>(null);
  const [picked, setPicked] = useState<{ file: string; column: string } | null>(null);

  const meta = DATASETS[id];
  const table = loaded?.file === meta.file ? loaded.table : null;
  const error = failed?.file === meta.file ? failed.message : null;

  useEffect(() => {
    let live = true;
    loadDataset(meta.file)
      .then((t) => live && setLoaded({ file: meta.file, table: t }))
      .catch((e: Error) => live && setFailed({ file: meta.file, message: e.message }));
    return () => {
      live = false;
    };
  }, [meta.file]);

  /**
   * ID columns are numbers but not measurements. The chapters tell the reader to
   * drop `student_id` before a correlation heatmap, so the explorer must not put
   * one on the axes or offer it as the default column.
   */
  const numericCols = useMemo(
    () => (table ? [...table.numeric].filter((c) => !/(^|_)id$/i.test(c)) : []),
    [table],
  );
  // Default to the first numeric column until the reader picks another.
  const column =
    picked?.file === meta.file && numericCols.includes(picked.column)
      ? picked.column
      : (numericCols[0] ?? null);
  const setColumn = (c: string) => setPicked({ file: meta.file, column: c });

  const stats = useMemo(() => {
    if (!table || !column) return null;
    const vals = columnValues(table, column);
    if (!vals.length) return null;
    const sorted = [...vals].sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);
    return {
      n: vals.length,
      missing: missingCount(table, column),
      mean: mean(vals),
      std: std(vals),
      min: sorted[0],
      q1,
      median: quantile(sorted, 0.5),
      q3,
      max: sorted[sorted.length - 1],
      iqr: q3 - q1,
      outliers: vals.filter((v) => v < q1 - 1.5 * (q3 - q1) || v > q3 + 1.5 * (q3 - q1)).length,
      vals,
      sorted,
    };
  }, [table, column]);

  /** 24-bin histogram of the selected column. */
  const bins = useMemo(() => {
    if (!stats) return [];
    const k = 24;
    const lo = stats.min;
    const hi = stats.max;
    const width = (hi - lo) / k || 1;
    const counts = new Array<number>(k).fill(0);
    for (const v of stats.vals) {
      counts[Math.min(k - 1, Math.floor((v - lo) / width))]++;
    }
    return counts;
  }, [stats]);

  /** Pearson correlation between every pair of numeric columns. */
  const corr = useMemo(() => {
    if (!table) return null;
    const cols = numericCols.slice(0, 12);
    const series = cols.map((c) => columnValues(table, c));
    const matrix = cols.map((_, a) =>
      cols.map((__, b) => {
        // Use only rows where both columns have a value.
        const ia = table.columns.indexOf(cols[a]);
        const ib = table.columns.indexOf(cols[b]);
        const pairs = table.rows
          .map((r) => [r[ia], r[ib]])
          .filter((p): p is [number, number] => typeof p[0] === "number" && typeof p[1] === "number");
        if (pairs.length < 3) return 0;
        const xs = pairs.map((p) => p[0]);
        const ys = pairs.map((p) => p[1]);
        const mx = mean(xs);
        const my = mean(ys);
        let num = 0;
        let dx = 0;
        let dy = 0;
        for (let i = 0; i < xs.length; i++) {
          num += (xs[i] - mx) * (ys[i] - my);
          dx += (xs[i] - mx) ** 2;
          dy += (ys[i] - my) ** 2;
        }
        return dx && dy ? num / Math.sqrt(dx * dy) : 0;
      }),
    );
    return { cols, matrix, series };
  }, [table, numericCols]);

  const BW = 620;
  const BH = 170;

  return (
    <div className="mt-8">
      <Choice<DatasetId>
        label="Dataset"
        value={id}
        onChange={setId}
        options={DATASET_LIST.map((d) => ({ value: d.id, label: d.title }))}
      />

      <div
        className="mt-4 rounded-[var(--radius)] border p-4"
        style={{ borderColor: "var(--line)", background: "var(--panel)" }}
      >
        <p className="text-[14.5px]" style={{ color: "var(--muted)" }}>
          {meta.about}
        </p>
        <p className="mt-2 font-mono text-[12px]" style={{ color: "var(--muted-2)" }}>
          {meta.file} · {meta.rows} rows · {meta.from}
        </p>
        <a
          href={asset(`/data/${meta.file}`)}
          download
          className="mt-3 inline-block rounded-md border px-3 py-1.5 text-[13px] font-medium"
          style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
        >
          Download CSV
        </a>
      </div>

      {error ? (
        <p className="mt-4 text-[14px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}

      {table ? (
        <>
          <div className="mt-6">
            <Choice<string>
              label="Explore a column"
              value={column ?? ""}
              onChange={setColumn}
              options={numericCols.map((c) => ({ value: c, label: c }))}
            />
          </div>

          {stats ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div
                className="overflow-hidden rounded-[var(--radius)] border"
                style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
              >
                <svg
                  viewBox={`0 0 ${BW} ${BH}`}
                  className="block h-auto w-full"
                  role="img"
                  aria-label={`Histogram of ${column}`}
                >
                  {bins.map((c, i) => {
                    const maxC = Math.max(...bins);
                    const h = (c / maxC) * (BH - 40);
                    const w = (BW - 40) / bins.length;
                    return (
                      <rect
                        key={i}
                        x={20 + i * w}
                        y={BH - 24 - h}
                        width={w - 2}
                        height={h}
                        rx="2"
                        fill="var(--accent)"
                        opacity="0.75"
                      />
                    );
                  })}
                  <line x1={20} x2={BW - 20} y1={BH - 24} y2={BH - 24} stroke="var(--line-strong)" />
                  <text x={20} y={BH - 8} fontSize="10.5" fontFamily="monospace" fill="var(--muted-2)">
                    {fmt(stats.min, 1)}
                  </text>
                  <text
                    x={BW - 20}
                    y={BH - 8}
                    textAnchor="end"
                    fontSize="10.5"
                    fontFamily="monospace"
                    fill="var(--muted-2)"
                  >
                    {fmt(stats.max, 1)}
                  </text>
                  <text x={20} y={16} fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
                    {column}
                  </text>
                </svg>
              </div>

              <dl
                className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-[var(--radius)] border p-4"
                style={{ borderColor: "var(--line)", background: "var(--panel)" }}
              >
                {(
                  [
                    ["count", `${stats.n}`],
                    ["missing", `${stats.missing}`],
                    ["mean", fmt(stats.mean, 2)],
                    ["std (ddof=1)", fmt(stats.std, 2)],
                    ["min", fmt(stats.min, 2)],
                    ["25%", fmt(stats.q1, 2)],
                    ["50% (median)", fmt(stats.median, 2)],
                    ["75%", fmt(stats.q3, 2)],
                    ["max", fmt(stats.max, 2)],
                    ["IQR", fmt(stats.iqr, 2)],
                    ["outliers (1.5×IQR)", `${stats.outliers}`],
                    ["skew hint", stats.mean > stats.median ? "right tail" : stats.mean < stats.median ? "left tail" : "symmetric"],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[12px]" style={{ color: "var(--muted-2)" }}>
                      {k}
                    </dt>
                    <dd className="font-mono text-[14.5px] tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {corr && corr.cols.length > 1 ? (
            <section className="mt-8">
              <h2 className="mb-3 text-[18px] font-semibold">Correlation heatmap</h2>
              <div className="overflow-x-auto">
                <table className="border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th />
                      {corr.cols.map((c) => (
                        <th
                          key={c}
                          className="px-1 pb-1 font-mono font-normal"
                          style={{ color: "var(--muted-2)", writingMode: "vertical-rl" }}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {corr.cols.map((rowName, a) => (
                      <tr key={rowName}>
                        <th
                          scope="row"
                          className="pr-2 text-right font-mono font-normal whitespace-nowrap"
                          style={{ color: "var(--muted-2)" }}
                        >
                          {rowName}
                        </th>
                        {corr.matrix[a].map((v, b) => (
                          <td
                            key={b}
                            title={`${rowName} vs ${corr.cols[b]}: ${fmt(v, 3)}`}
                            className="h-8 w-8 text-center font-mono"
                            style={{
                              background:
                                v >= 0
                                  ? `color-mix(in srgb, var(--accent) ${Math.abs(v) * 70}%, transparent)`
                                  : `color-mix(in srgb, var(--danger) ${Math.abs(v) * 70}%, transparent)`,
                              color: Math.abs(v) > 0.6 ? "var(--text)" : "var(--muted)",
                            }}
                          >
                            {fmt(v, 2).replace("0.", ".")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[13px]" style={{ color: "var(--muted-2)" }}>
                Pearson, computed on rows where both columns have a value. Blue rises
                together, red moves opposite.
              </p>
            </section>
          ) : null}

          <section className="mt-8 max-w-[var(--measure)]">
            <h2 className="mb-2 text-[18px] font-semibold">Practice tasks</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-[15px] marker:text-[var(--accent)]">
              {meta.tasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
