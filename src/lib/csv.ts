import { asset } from "./basePath";

export interface Table {
  columns: string[];
  rows: (string | number | null)[][];
  /** Column indices whose values parsed as numbers (ignoring blanks). */
  numeric: Set<string>;
}

/**
 * Minimal CSV parser. The course datasets have no quoted commas or embedded
 * newlines, so a split is honest here — but blanks matter: `employee_dataset.csv`
 * has deliberate gaps in `salary` and `performance_score`, and those must come
 * through as null rather than 0.
 */
export function parseCsv(text: string): Table {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n").filter(Boolean);
  const columns = lines[0].split(",").map((c) => c.trim());
  const rows = lines.slice(1).map((line) =>
    line.split(",").map((cell) => {
      const v = cell.trim();
      if (v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) && v !== "" ? n : v;
    }),
  );
  const numeric = new Set<string>();
  columns.forEach((col, i) => {
    const vals = rows.map((r) => r[i]).filter((v) => v !== null);
    if (vals.length && vals.every((v) => typeof v === "number")) numeric.add(col);
  });
  return { columns, rows, numeric };
}

export function columnValues(table: Table, column: string): number[] {
  const i = table.columns.indexOf(column);
  if (i < 0) return [];
  return table.rows
    .map((r) => r[i])
    .filter((v): v is number => typeof v === "number");
}

export function missingCount(table: Table, column: string): number {
  const i = table.columns.indexOf(column);
  if (i < 0) return 0;
  return table.rows.filter((r) => r[i] === null).length;
}

const cache = new Map<string, Promise<Table>>();

/** Fetch and parse a dataset from public/data, memoised per file. */
export function loadDataset(file: string): Promise<Table> {
  const existing = cache.get(file);
  if (existing) return existing;
  const p = fetch(asset(`/data/${file}`))
    .then((r) => {
      if (!r.ok) throw new Error(`Could not load ${file} (${r.status})`);
      return r.text();
    })
    .then(parseCsv);
  cache.set(file, p);
  return p;
}
