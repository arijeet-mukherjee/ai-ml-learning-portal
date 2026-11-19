"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { LabButton, LabFrame, Readout, Slider } from "./LabKit";
import { LABS } from "@/lib/labs";
import { clamp, fmt } from "@/lib/stats";
import { mulberry32 } from "@/lib/rng";

/**
 * m5 · The perceptron stops at the first line that works; the SVM centres the
 * widest street.
 *
 * Perceptron: the lecture's rule verbatim — if yᵢ(W·Xᵢ) ≤ 0 then W += yᵢXᵢ.
 * SVM: subgradient descent on ½‖W‖² + C Σ max(0, 1 − yᵢ f(Xᵢ)) (Pegasos). That is
 * the soft-margin objective itself, so C behaves exactly as the slides describe:
 * large C narrows the street, small C widens it.
 */
interface Pt {
  x: number;
  y: number;
  label: 1 | -1;
}

const SEED = 20241004;
const W = 460;
const H = 330;
const PAD = 26;
const SPAN = 10;

function seedPoints(): Pt[] {
  const rand = mulberry32(SEED);
  const out: Pt[] = [];
  for (let i = 0; i < 9; i++) {
    out.push({ x: 1.6 + rand() * 3, y: 5.4 + rand() * 3.4, label: 1 });
    out.push({ x: 5.4 + rand() * 3.2, y: 1.4 + rand() * 3, label: -1 });
  }
  return out;
}

type Model = { w: [number, number]; b: number } | null;

export default function PerceptronVsSvm() {
  const [points, setPoints] = useState<Pt[]>(seedPoints);
  const [addLabel, setAddLabel] = useState<1 | -1>(1);
  const [logC, setLogC] = useState(0); // C = 1
  const [perceptron, setPerceptron] = useState<Model>(null);
  const [perceptronPasses, setPerceptronPasses] = useState(0);
  const [svm, setSvm] = useState<Model>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const C = 10 ** logC;

  const sx = (v: number) => PAD + (v / SPAN) * (W - PAD * 2);
  const sy = (v: number) => H - PAD - (v / SPAN) * (H - PAD * 2);

  const addPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    const x = clamp(((px - PAD) / (W - PAD * 2)) * SPAN, 0, SPAN);
    const y = clamp(((H - PAD - py) / (H - PAD * 2)) * SPAN, 0, SPAN);
    setPoints((p) => [...p, { x, y, label: addLabel }]);
    setPerceptron(null);
    setSvm(null);
    setPerceptronPasses(0);
  };

  /** One full pass of the lecture's perceptron update. */
  const runPerceptron = useCallback(() => {
    setPerceptron((prev) => {
      let w: [number, number] = prev ? [...prev.w] : [0, 0];
      let b = prev ? prev.b : 0;
      let passes = 0;
      for (let pass = 0; pass < 60; pass++) {
        let mistakes = 0;
        for (const p of points) {
          const score = w[0] * p.x + w[1] * p.y + b;
          if (p.label * score <= 0) {
            w = [w[0] + p.label * p.x, w[1] + p.label * p.y];
            b += p.label;
            mistakes++;
          }
        }
        passes = pass + 1;
        if (mistakes === 0) break;
      }
      setPerceptronPasses(passes);
      return { w, b };
    });
  }, [points]);

  const fitSvm = useCallback(() => {
    let w: [number, number] = [0, 0];
    let b = 0;
    const n = points.length;
    const iterations = 4000;
    const lambda = 1 / (C * n);
    for (let t = 1; t <= iterations; t++) {
      const eta = 1 / (lambda * t);
      const p = points[t % n];
      const score = w[0] * p.x + w[1] * p.y + b;
      if (p.label * score < 1) {
        w = [
          (1 - eta * lambda) * w[0] + eta * lambda * n * p.label * p.x,
          (1 - eta * lambda) * w[1] + eta * lambda * n * p.label * p.y,
        ];
        b += eta * lambda * n * p.label;
      } else {
        w = [(1 - eta * lambda) * w[0], (1 - eta * lambda) * w[1]];
      }
    }
    setSvm({ w, b });
  }, [points, C]);

  const lineFor = (m: Model, offset: number) => {
    if (!m) return null;
    const [w1, w2] = m.w;
    if (Math.abs(w2) < 1e-9 && Math.abs(w1) < 1e-9) return null;
    // w1·x + w2·y + b = offset  →  y = (offset − b − w1·x) / w2
    if (Math.abs(w2) < 1e-6) {
      const x = (offset - m.b) / w1;
      return { x1: sx(x), y1: sy(0), x2: sx(x), y2: sy(SPAN) };
    }
    const yAt = (x: number) => (offset - m.b - w1 * x) / w2;
    return { x1: sx(0), y1: sy(yAt(0)), x2: sx(SPAN), y2: sy(yAt(SPAN)) };
  };

  const stats = useMemo(() => {
    const normW = svm ? Math.hypot(svm.w[0], svm.w[1]) : 0;
    const supports = svm
      ? points.filter((p) => {
          const score = svm.w[0] * p.x + svm.w[1] * p.y + svm.b;
          return p.label * score <= 1.02;
        }).length
      : 0;
    const err = (m: Model) =>
      m
        ? points.filter((p) => p.label * (m.w[0] * p.x + m.w[1] * p.y + m.b) <= 0).length
        : null;
    return {
      normW,
      margin: normW ? 2 / normW : 0,
      supports,
      perceptronErrors: err(perceptron),
      svmErrors: err(svm),
    };
  }, [svm, perceptron, points]);

  return (
    <LabFrame
      title={LABS.svm.title}
      how={LABS.svm.how}
      notice="Run the perceptron twice from different states and it stops at different lines — any line that works will do, often one scraping a point. The SVM always returns the same line, centred. Then drop C to 0.1 and watch the street widen until it tolerates a point inside it."
      onReset={() => {
        setPoints(seedPoints());
        setPerceptron(null);
        setSvm(null);
        setPerceptronPasses(0);
        setLogC(0);
      }}
      stage={
        <div
          className="overflow-hidden rounded-[var(--radius-sm)] border"
          style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            onClick={addPoint}
            role="application"
            aria-label="Two classes of points with a perceptron line and an SVM margin. Click to add a point."
            style={{ cursor: "crosshair" }}
          >
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <g key={n}>
                <line x1={sx(n)} x2={sx(n)} y1={PAD} y2={H - PAD} stroke="var(--line)" />
                <line x1={PAD} x2={W - PAD} y1={sy(n)} y2={sy(n)} stroke="var(--line)" />
              </g>
            ))}

            {/* SVM street */}
            {svm
              ? ([1, -1] as const).map((k) => {
                  const l = lineFor(svm, k);
                  return l ? (
                    <line
                      key={k}
                      {...l}
                      stroke="var(--good)"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      opacity="0.8"
                    />
                  ) : null;
                })
              : null}
            {svm
              ? (() => {
                  const l = lineFor(svm, 0);
                  return l ? <line {...l} stroke="var(--good)" strokeWidth="2.5" /> : null;
                })()
              : null}

            {/* perceptron line */}
            {perceptron
              ? (() => {
                  const l = lineFor(perceptron, 0);
                  return l ? (
                    <line {...l} stroke="var(--warn)" strokeWidth="2.5" strokeDasharray="8 5" />
                  ) : null;
                })()
              : null}

            {points.map((p, i) => {
              const isSupport =
                svm && p.label * (svm.w[0] * p.x + svm.w[1] * p.y + svm.b) <= 1.02;
              return (
                <circle
                  key={i}
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={isSupport ? 7 : 5}
                  fill={p.label === 1 ? "var(--danger)" : "var(--accent-2)"}
                  stroke={isSupport ? "var(--good)" : "none"}
                  strokeWidth="2.5"
                />
              );
            })}
          </svg>
        </div>
      }
      controls={
        <>
          <div className="flex flex-wrap items-center gap-2">
            <LabButton onClick={runPerceptron}>Run perceptron</LabButton>
            <LabButton tone="plain" onClick={fitSvm}>
              Fit the SVM
            </LabButton>
          </div>
          <Slider
            label="C — how cranky about mistakes"
            value={logC}
            min={-1}
            max={3}
            step={0.25}
            onChange={(v) => {
              setLogC(v);
              setSvm(null);
            }}
            display={`C = ${C < 1 ? fmt(C, 2) : fmt(C, 0)}`}
            hint="Refit after changing C. Large C → narrow street; small C → wide."
          />
          <fieldset>
            <legend className="mb-1.5 text-[13.5px]" style={{ color: "var(--muted)" }}>
              Click the plot to add a point as
            </legend>
            <div className="flex gap-1.5">
              {([1, -1] as const).map((lbl) => (
                <label
                  key={lbl}
                  className="cursor-pointer rounded-full border px-3 py-1 text-[13px]"
                  style={{
                    borderColor: addLabel === lbl ? "var(--accent)" : "var(--line-strong)",
                    background: addLabel === lbl ? "var(--accent-soft)" : "transparent",
                    color: lbl === 1 ? "var(--danger)" : "var(--accent-2)",
                  }}
                >
                  <input
                    type="radio"
                    name="svm-add"
                    className="sr-only"
                    checked={addLabel === lbl}
                    onChange={() => setAddLabel(lbl)}
                  />
                  {lbl === 1 ? "class +1" : "class −1"}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Points", value: `${points.length}` },
            { label: "Perceptron passes", value: perceptronPasses ? `${perceptronPasses}` : "—" },
            {
              label: "Perceptron mistakes",
              value: stats.perceptronErrors === null ? "—" : `${stats.perceptronErrors}`,
              tone: "warn",
            },
            { label: "‖W‖", value: svm ? fmt(stats.normW, 3) : "—" },
            {
              label: "Margin 2/‖W‖",
              value: svm ? fmt(stats.margin, 3) : "—",
              tone: "good",
            },
            {
              label: "Support vectors",
              value: svm ? `${stats.supports}` : "—",
              tone: "good",
            },
          ]}
        />
      }
    />
  );
}
