"use client";

import { useCallback, useMemo, useState } from "react";
import { Choice, LabButton, LabFrame, Readout, Slider, Stage } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt } from "@/lib/stats";

/**
 * m4 · w ← w − η · dL/dw, one step at a time.
 *
 * "bowl" is L(w) = w², so the update is w(1 − 2η): it converges for η < 1 and
 * blows up above it, which is the divergence the lecture asks you to trigger.
 * "wavy" has several dips, so a bad start lands in a local minimum.
 */
type Surface = "bowl" | "wavy";

const SURFACE: Record<Surface, { L: (w: number) => number; dL: (w: number) => number; label: string; lo: number; hi: number }> = {
  bowl: {
    L: (w) => w * w,
    dL: (w) => 2 * w,
    label: "L(w) = w²  ·  convex, one global minimum",
    lo: -5,
    hi: 5,
  },
  wavy: {
    L: (w) => 0.12 * w * w + 2 * Math.sin(w),
    dL: (w) => 0.24 * w + 2 * Math.cos(w),
    label: "L(w) = 0.12w² + 2·sin(w)  ·  several dips",
    lo: -9,
    hi: 9,
  },
};

const W = 620;
const H = 260;
const PAD = 36;

export default function GradientDescent() {
  const [surface, setSurface] = useState<Surface>("bowl");
  const [eta, setEta] = useState(0.2);
  const [start, setStart] = useState(4);
  const [path, setPath] = useState<number[]>([4]);

  const fn = SURFACE[surface];
  const w = path[path.length - 1];
  const grad = fn.dL(w);
  const loss = fn.L(w);
  const diverged = !Number.isFinite(loss) || Math.abs(w) > 1e4;

  const reset = useCallback(() => setPath([start]), [start]);

  const step = useCallback(() => {
    setPath((p) => {
      const cur = p[p.length - 1];
      const next = cur - eta * fn.dL(cur);
      return [...p, next];
    });
  }, [eta, fn]);

  const run = useCallback(() => {
    setPath((p) => {
      let cur = p[p.length - 1];
      const out = [...p];
      for (let i = 0; i < 25; i++) {
        cur = cur - eta * fn.dL(cur);
        out.push(cur);
        if (!Number.isFinite(cur) || Math.abs(cur) > 1e4) break;
      }
      return out;
    });
  }, [eta, fn]);

  const lossRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i <= 200; i++) {
      const v = fn.lo + ((fn.hi - fn.lo) * i) / 200;
      const l = fn.L(v);
      min = Math.min(min, l);
      max = Math.max(max, l);
    }
    return { min, max };
  }, [fn]);

  const sx = useCallback(
    (v: number) => PAD + ((v - fn.lo) / (fn.hi - fn.lo)) * (W - PAD * 2),
    [fn.lo, fn.hi],
  );
  const sy = useCallback(
    (l: number) =>
      H - PAD - ((l - lossRange.min) / (lossRange.max - lossRange.min)) * (H - PAD * 2),
    [lossRange.min, lossRange.max],
  );

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 240; i++) {
      const v = fn.lo + ((fn.hi - fn.lo) * i) / 240;
      pts.push(`${i === 0 ? "M" : "L"}${sx(v).toFixed(2)},${sy(fn.L(v)).toFixed(2)}`);
    }
    return pts.join(" ");
  }, [fn, sx, sy]);

  const visible = path.filter((v) => Number.isFinite(v) && v >= fn.lo && v <= fn.hi);

  return (
    <LabFrame
      title={LABS.gd.title}
      how={LABS.gd.how}
      notice="On the bowl, η below 1 walks in; η above 1 overshoots further every step until the loss explodes. On the wavy surface the same η finds a different minimum depending on where you start — which is exactly why a neural network's result depends on its initialisation."
      onReset={() => {
        setEta(0.2);
        setStart(4);
        setSurface("bowl");
        setPath([4]);
      }}
      stage={
        <Stage
          viewBox={`0 0 ${W} ${H}`}
          label={`Loss curve with ${path.length - 1} gradient-descent steps taken; current w is ${fmt(w, 3)}`}
        >
          <text x={PAD} y={18} fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
            {fn.label}
          </text>

          <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="var(--line-strong)" />
          <path d={curve} fill="none" stroke="var(--accent)" strokeWidth="2" />

          {/* the walk */}
          {visible.slice(0, -1).map((v, i) => {
            const nxt = visible[i + 1];
            return (
              <line
                key={i}
                x1={sx(v)}
                y1={sy(fn.L(v))}
                x2={sx(nxt)}
                y2={sy(fn.L(nxt))}
                stroke="var(--warn)"
                strokeWidth="1.5"
                opacity={0.55}
              />
            );
          })}
          {visible.map((v, i) => (
            <circle
              key={i}
              cx={sx(v)}
              cy={sy(fn.L(v))}
              r={i === visible.length - 1 ? 6 : 3}
              fill={i === visible.length - 1 ? "var(--warn)" : "var(--warn-soft)"}
              stroke="var(--warn)"
              strokeWidth="1.5"
            />
          ))}

          {/* tangent at the current point, which is what the step follows */}
          {!diverged && visible.length ? (
            <line
              x1={sx(Math.max(fn.lo, w - 1))}
              y1={sy(fn.L(w) + grad * Math.max(fn.lo, w - 1) - grad * w)}
              x2={sx(Math.min(fn.hi, w + 1))}
              y2={sy(fn.L(w) + grad * Math.min(fn.hi, w + 1) - grad * w)}
              stroke="var(--accent-2)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          ) : null}

          {diverged ? (
            <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="15" fill="var(--danger)">
              diverged — the step overshot the valley
            </text>
          ) : null}
        </Stage>
      }
      controls={
        <>
          <Choice<Surface>
            label="Loss surface"
            value={surface}
            onChange={(s) => {
              setSurface(s);
              setPath([start]);
            }}
            options={[
              { value: "bowl", label: "bowl (convex)" },
              { value: "wavy", label: "wavy (local dips)" },
            ]}
          />
          <Slider
            label="Learning rate η"
            value={eta}
            min={0.01}
            max={1.4}
            step={0.01}
            onChange={setEta}
            display={fmt(eta, 2)}
            hint="On the bowl, anything above 1.0 diverges."
          />
          <Slider
            label="Starting w"
            value={start}
            min={fn.lo}
            max={fn.hi}
            step={0.1}
            onChange={(v) => {
              setStart(v);
              setPath([v]);
            }}
            display={fmt(start, 1)}
          />
          <div className="flex flex-wrap gap-2">
            <LabButton onClick={step}>Take one step</LabButton>
            <LabButton tone="plain" onClick={run}>
              Run 25 steps
            </LabButton>
            <LabButton tone="plain" onClick={reset}>
              Back to start
            </LabButton>
          </div>
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Steps taken", value: `${path.length - 1}` },
            { label: "Current w", value: diverged ? "∞" : fmt(w, 4) },
            { label: "Loss L(w)", value: diverged ? "∞" : fmt(loss, 4), tone: "warn" },
            { label: "Gradient dL/dw", value: diverged ? "∞" : fmt(grad, 4), tone: "accent" },
            { label: "Next step size", value: diverged ? "—" : fmt(-eta * grad, 4) },
            {
              label: "Status",
              value: diverged
                ? "diverged"
                : Math.abs(grad) < 1e-3
                  ? "at a minimum"
                  : "still descending",
              tone: diverged ? "danger" : Math.abs(grad) < 1e-3 ? "good" : "accent",
            },
          ]}
        />
      }
    />
  );
}
