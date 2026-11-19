"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Database } from "lucide-react";
import type { DatasetId } from "@/types/content";
import { DATASETS } from "@/lib/datasets";
import { asset } from "@/lib/basePath";
import { loadDataset, missingCount, type Table } from "@/lib/csv";

/** A compact card: what the dataset is, the first rows, and the practice tasks. */
export default function DatasetPreview({ dataset }: { dataset: DatasetId }) {
  const meta = DATASETS[dataset];
  const [table, setTable] = useState<Table | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    loadDataset(meta.file)
      .then((t) => live && setTable(t))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [meta.file]);

  const cols = table ? table.columns.slice(0, 6) : [];
  const gaps = table
    ? table.columns.filter((c) => missingCount(table, c) > 0)
    : [];

  return (
    <section
      className="my-7 w-full min-w-0 overflow-hidden rounded-[var(--radius)] border"
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
    >
      <header
        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3"
        style={{ borderColor: "var(--line)", background: "var(--panel-2)" }}
      >
        <Database size={15} aria-hidden style={{ color: "var(--accent-2)" }} />
        <h4 className="text-[16px] font-semibold">{meta.title}</h4>
        <span className="font-mono text-[12px]" style={{ color: "var(--muted-2)" }}>
          {meta.rows} rows · {meta.file}
        </span>
        {meta.synthetic ? (
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.12em]"
            style={{ background: "var(--warn-soft)", color: "var(--warn)" }}
          >
            rebuilt for practice
          </span>
        ) : null}
      </header>

      <div className="px-4 py-3">
        <p className="text-[14.5px]" style={{ color: "var(--muted)" }}>
          {meta.about}
        </p>

        {error ? (
          <p className="mt-3 text-[13.5px]" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        ) : null}

        {table ? (
          <>
            <div
              className="mt-3 overflow-x-auto rounded-[var(--radius-sm)] border"
              style={{ borderColor: "var(--line)" }}
            >
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {cols.map((c) => (
                      <th
                        key={c}
                        scope="col"
                        className="border-b px-2.5 py-1.5 text-left font-mono font-medium whitespace-nowrap"
                        style={{ borderColor: "var(--line)", color: "var(--muted)" }}
                      >
                        {c}
                      </th>
                    ))}
                    {table.columns.length > cols.length ? (
                      <th
                        className="border-b px-2.5 py-1.5 text-left font-mono font-normal"
                        style={{ borderColor: "var(--line)", color: "var(--muted-2)" }}
                      >
                        +{table.columns.length - cols.length} more
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.slice(0, 4).map((row, ri) => (
                    <tr key={ri}>
                      {cols.map((c, ci) => {
                        const v = row[table.columns.indexOf(c)];
                        return (
                          <td
                            key={ci}
                            className="border-t px-2.5 py-1.5 font-mono whitespace-nowrap"
                            style={{
                              borderColor: "var(--line)",
                              color: v === null ? "var(--danger)" : "var(--text)",
                            }}
                          >
                            {v === null ? "NaN" : String(v)}
                          </td>
                        );
                      })}
                      {table.columns.length > cols.length ? (
                        <td className="border-t px-2.5" style={{ borderColor: "var(--line)" }} />
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {gaps.length ? (
              <p className="mt-2 text-[13px]" style={{ color: "var(--muted-2)" }}>
                Missing values in{" "}
                {gaps.map((c) => (
                  <code key={c} className="mr-1">
                    {c}
                  </code>
                ))}
                — deliberate, and the first thing to handle.
              </p>
            ) : null}
          </>
        ) : null}

        <h5 className="mt-4 mb-1.5 text-[13px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--muted-2)" }}>
          Practice tasks
        </h5>
        <ul className="list-disc space-y-1 pl-5 text-[14.5px] marker:text-[var(--accent)]">
          {meta.tasks.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={asset(`/data/${meta.file}`)}
            download
            className="rounded-md border px-3 py-1.5 text-[13px] font-medium"
            style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
          >
            Download CSV
          </a>
          <Link
            href="/data"
            className="rounded-md border px-3 py-1.5 text-[13px]"
            style={{ borderColor: "var(--line-strong)", color: "var(--muted)" }}
          >
            Open in the explorer
          </Link>
        </div>
      </div>
    </section>
  );
}
