"use client";

import { useMemo, useState } from "react";
import { Choice, LabFrame, Readout, Stage } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt } from "@/lib/stats";

/**
 * m0 · "The axis you name is the axis that disappears."
 * The matrix is np.arange(1, 13).reshape(3, 4) — the same one the lecture uses.
 */
const M = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
];

type Op = "sum" | "mean" | "max" | "min";
type Axis = "none" | "0" | "1";

const apply = (op: Op, xs: number[]): number => {
  switch (op) {
    case "sum":
      return xs.reduce((a, b) => a + b, 0);
    case "mean":
      return xs.reduce((a, b) => a + b, 0) / xs.length;
    case "max":
      return Math.max(...xs);
    case "min":
      return Math.min(...xs);
  }
};

export default function AxisExplorer() {
  const [op, setOp] = useState<Op>("sum");
  const [axis, setAxis] = useState<Axis>("0");
  const [hover, setHover] = useState<number | null>(null);

  const result = useMemo(() => {
    if (axis === "none") return [apply(op, M.flat())];
    if (axis === "0") return M[0].map((_, c) => apply(op, M.map((r) => r[c])));
    return M.map((row) => apply(op, row));
  }, [op, axis]);

  const groupOf = (r: number, c: number) =>
    axis === "none" ? 0 : axis === "0" ? c : r;

  const cell = 46;
  const pad = 14;
  const gridW = M[0].length * cell;
  const gridH = M.length * cell;

  return (
    <LabFrame
      title={LABS.axis.title}
      how={LABS.axis.how}
      notice="axis=0 squashes the rows away, so one answer comes out per column. axis=1 squashes the columns away, one per row. Hover an answer to see exactly which cells fed it."
      onReset={() => {
        setOp("sum");
        setAxis("0");
        setHover(null);
      }}
      stage={
        <Stage
          viewBox={`0 0 ${gridW + pad * 2 + 130} ${gridH + pad * 2 + 46}`}
          label={`A 3 by 4 matrix with np.${op} applied along axis ${axis}`}
        >
          <text x={pad} y={pad + 2} fontSize="11" fill="var(--muted-2)" fontFamily="monospace">
            {`m = np.arange(1, 13).reshape(3, 4)`}
          </text>

          {M.map((row, r) =>
            row.map((v, c) => {
              const g = groupOf(r, c);
              const lit = hover === null || hover === g;
              return (
                <g key={`${r}-${c}`}>
                  <rect
                    x={pad + c * cell}
                    y={pad + 14 + r * cell}
                    width={cell - 4}
                    height={cell - 4}
                    rx="7"
                    fill={lit ? "var(--accent-soft)" : "transparent"}
                    stroke={lit ? "var(--accent)" : "var(--line-strong)"}
                    strokeWidth="1"
                    opacity={lit ? 1 : 0.45}
                  />
                  <text
                    x={pad + c * cell + (cell - 4) / 2}
                    y={pad + 14 + r * cell + (cell - 4) / 2 + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontFamily="monospace"
                    fill={lit ? "var(--text)" : "var(--muted-2)"}
                  >
                    {v}
                  </text>
                </g>
              );
            }),
          )}

          {/* Arrow showing which way the collapse runs */}
          {axis === "0" ? (
            <text
              x={pad + gridW / 2}
              y={pad + 14 + gridH + 16}
              textAnchor="middle"
              fontSize="11"
              fill="var(--accent-2)"
              fontFamily="monospace"
            >
              ↓ rows collapse
            </text>
          ) : axis === "1" ? (
            <text
              x={pad + gridW + 8}
              y={pad + 14 + gridH / 2}
              fontSize="11"
              fill="var(--accent-2)"
              fontFamily="monospace"
            >
              → columns collapse
            </text>
          ) : null}

          {/* The answers */}
          {result.map((v, i) => {
            const x = axis === "1" ? pad + gridW + 26 : pad + i * cell;
            const y = axis === "1" ? pad + 14 + i * cell : pad + 14 + gridH + 24;
            return (
              <g
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={axis === "1" ? x + 24 : x}
                  y={axis === "1" ? y : y + 6}
                  width={cell - 4}
                  height={26}
                  rx="6"
                  fill="var(--accent-2-soft)"
                  stroke="var(--accent-2)"
                />
                <text
                  x={(axis === "1" ? x + 24 : x) + (cell - 4) / 2}
                  y={(axis === "1" ? y : y + 6) + 18}
                  textAnchor="middle"
                  fontSize="13"
                  fontFamily="monospace"
                  fill="var(--text)"
                >
                  {op === "mean" ? fmt(v, 1) : v}
                </text>
              </g>
            );
          })}
        </Stage>
      }
      controls={
        <>
          <Choice<Op>
            label="Operation"
            value={op}
            onChange={setOp}
            options={[
              { value: "sum", label: "np.sum" },
              { value: "mean", label: "np.mean" },
              { value: "max", label: "np.max" },
              { value: "min", label: "np.min" },
            ]}
          />
          <Choice<Axis>
            label="Axis"
            value={axis}
            onChange={setAxis}
            options={[
              { value: "none", label: "no axis" },
              { value: "0", label: "axis=0" },
              { value: "1", label: "axis=1" },
            ]}
          />
        </>
      }
      readout={
        <Readout
          items={[
            {
              label: "Call",
              value: `np.${op}(m${axis === "none" ? "" : `, axis=${axis}`})`,
            },
            {
              label: "Result shape",
              value: axis === "none" ? "()" : `(${result.length},)`,
            },
            {
              label: "Result",
              value: `[${result.map((v) => (op === "mean" ? fmt(v, 1) : v)).join(", ")}]`,
            },
            {
              label: "Axis removed",
              value: axis === "none" ? "both" : axis === "0" ? "rows (3)" : "columns (4)",
            },
          ]}
        />
      }
    />
  );
}
