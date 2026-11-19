"use client";

import { useReducedMotion } from "framer-motion";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Choice, LabButton, LabFrame, Readout, Slider } from "./LabKit";
import { LABS } from "@/lib/labs";
import { clamp, entropyBits, fmt, gini } from "@/lib/stats";
import { mulberry32 } from "@/lib/rng";

/**
 * m6 · Score one split by hand, then watch greedy CART grow the whole tree.
 *
 * 40 customers, two features (tenure, monthly charge), two classes (stay / churn).
 * Short-tenure, high-charge customers mostly churn; three labels are flipped so
 * no single cut is perfect, a depth-2/3 tree does well, and depth 4 hits 100%
 * training accuracy by carving boxes around the flipped rows.
 *
 * Convention throughout: a split "feature < t" sends rows LEFT ("yes"), the rest
 * RIGHT ("no"). Candidate thresholds are midpoints between consecutive distinct
 * values, exactly as sklearn's CART does.
 */

type Feat = 0 | 1;
type Crit = "gini" | "entropy";
type Mode = "score" | "grow";

interface Pt {
  v: [number, number]; // [tenure months, monthly charge $]
  churn: 0 | 1;
}

const SEED = 5;
const N_POINTS = 40;

const FEAT = [
  { name: "tenure (months)", short: "tenure", min: 0, max: 72, pre: "", ticks: [0, 12, 24, 36, 48, 60, 72], def: 24 },
  { name: "monthly charge ($)", short: "charge", min: 20, max: 120, pre: "$", ticks: [20, 40, 60, 80, 100, 120], def: 70 },
] as const;

const DEFAULTS = {
  mode: "score" as Mode,
  feat: 0 as Feat,
  threshold: 24,
  crit: "gini" as Crit,
  depth: 2,
  minLeaf: 1,
};

function buildCustomers(): Pt[] {
  const rand = mulberry32(SEED);
  const pts: Pt[] = [];
  const used = new Set<string>();
  while (pts.length < N_POINTS) {
    const tenure = Math.round(rand() * 70 + 1);
    const charge = Math.round(22 + rand() * 96);
    const key = `${tenure},${charge}`;
    if (used.has(key)) continue;
    used.add(key);
    const churn = (tenure < 20 && charge > 58) || (tenure < 42 && charge > 94);
    pts.push({ v: [tenure, charge], churn: churn ? 1 : 0 });
  }
  // A little label noise: real customers do not read the rulebook.
  const flip = mulberry32(SEED + 99);
  for (let k = 0; k < 3; k++) {
    const i = Math.floor(flip() * N_POINTS);
    pts[i].churn = pts[i].churn === 1 ? 0 : 1;
  }
  return pts;
}

const impurity = (counts: number[], crit: Crit) =>
  crit === "gini" ? gini(counts) : entropyBits(counts);

function countClasses(pts: Pt[]): [number, number] {
  let stay = 0;
  let churn = 0;
  for (const p of pts) {
    if (p.churn) churn++;
    else stay++;
  }
  return [stay, churn];
}

interface SplitScore {
  left: [number, number];
  right: [number, number];
  nL: number;
  nR: number;
  iP: number;
  iL: number;
  iR: number;
  weighted: number;
  gain: number;
}

function scoreSplit(pts: Pt[], f: Feat, t: number, crit: Crit): SplitScore {
  const L = pts.filter((p) => p.v[f] < t);
  const R = pts.filter((p) => p.v[f] >= t);
  const left = countClasses(L);
  const right = countClasses(R);
  const n = pts.length;
  const iP = impurity(countClasses(pts), crit);
  const iL = impurity(left, crit);
  const iR = impurity(right, crit);
  const weighted = n ? (L.length / n) * iL + (R.length / n) * iR : 0;
  return { left, right, nL: L.length, nR: R.length, iP, iL, iR, weighted, gain: iP - weighted };
}

/** Midpoints between consecutive distinct values of one feature. */
function candidateThresholds(pts: Pt[], f: Feat): number[] {
  const vals = [...new Set(pts.map((p) => p.v[f]))].sort((a, b) => a - b);
  const out: number[] = [];
  for (let i = 0; i + 1 < vals.length; i++) out.push((vals[i] + vals[i + 1]) / 2);
  return out;
}

interface Best {
  f: Feat;
  t: number;
  gain: number;
}

/** Greedy search: every feature × every midpoint; first strictly-better wins ties. */
function bestSplit(pts: Pt[], crit: Crit, minLeaf: number, feats: Feat[] = [0, 1]): Best | null {
  let best: Best | null = null;
  for (const f of feats) {
    for (const t of candidateThresholds(pts, f)) {
      const s = scoreSplit(pts, f, t, crit);
      if (s.nL < minLeaf || s.nR < minLeaf) continue;
      if (!best || s.gain > best.gain + 1e-12) best = { f, t, gain: s.gain };
    }
  }
  return best && best.gain > 1e-12 ? best : null;
}

interface TNode {
  id: string;
  depth: number;
  counts: [number, number];
  imp: number;
  bounds: [number, number, number, number]; // x0, x1, y0, y1 in data units
  split?: Best;
  left?: TNode;
  right?: TNode;
}

function growTree(pts: Pt[], crit: Crit, maxDepth: number, minLeaf: number): TNode {
  const rec = (sub: Pt[], depth: number, id: string, bounds: TNode["bounds"]): TNode => {
    const counts = countClasses(sub);
    const node: TNode = { id, depth, counts, imp: impurity(counts, crit), bounds };
    if (depth >= maxDepth || counts[0] === 0 || counts[1] === 0) return node;
    const b = bestSplit(sub, crit, minLeaf);
    if (!b) return node;
    node.split = b;
    const [x0, x1, y0, y1] = bounds;
    const lb: TNode["bounds"] = b.f === 0 ? [x0, b.t, y0, y1] : [x0, x1, y0, b.t];
    const rb: TNode["bounds"] = b.f === 0 ? [b.t, x1, y0, y1] : [x0, x1, b.t, y1];
    node.left = rec(sub.filter((p) => p.v[b.f] < b.t), depth + 1, `${id}L`, lb);
    node.right = rec(sub.filter((p) => p.v[b.f] >= b.t), depth + 1, `${id}R`, rb);
    return node;
  };
  return rec(pts, 0, "", [FEAT[0].min, FEAT[0].max, FEAT[1].min, FEAT[1].max]);
}

function allNodes(n: TNode): TNode[] {
  return n.left && n.right ? [n, ...allNodes(n.left), ...allNodes(n.right)] : [n];
}
const leavesOf = (n: TNode) => allNodes(n).filter((x) => !x.split);

function trainAccuracy(tree: TNode, total: number): number {
  return leavesOf(tree).reduce((a, l) => a + Math.max(l.counts[0], l.counts[1]), 0) / total;
}

const tLabel = (f: Feat, t: number) =>
  `${FEAT[f].pre}${Number.isInteger(t) ? t : t.toFixed(1)}`;

const critShort = (c: Crit) => (c === "gini" ? "Gini" : "H");

/* ---------- geometry ---------- */
const SW = 400;
const SH = 320;
const PL = 46;
const PR = 12;
const PT = 28;
const PB = 42;
const sx = (v: number) => PL + ((v - FEAT[0].min) / (FEAT[0].max - FEAT[0].min)) * (SW - PL - PR);
const sy = (v: number) => SH - PB - ((v - FEAT[1].min) / (FEAT[1].max - FEAT[1].min)) * (SH - PT - PB);
const STAY = "var(--accent-2)";
const CHURN = "var(--danger)";

function Marker({ p }: { p: Pt }) {
  const x = sx(p.v[0]);
  const y = sy(p.v[1]);
  return p.churn ? (
    <rect
      x={x - 4.6}
      y={y - 4.6}
      width="9.2"
      height="9.2"
      transform={`rotate(45 ${x} ${y})`}
      fill={CHURN}
      stroke="var(--ink-2)"
      strokeWidth="1.2"
    />
  ) : (
    <circle cx={x} cy={y} r="5" fill={STAY} stroke="var(--ink-2)" strokeWidth="1.2" />
  );
}

function Axes() {
  return (
    <g>
      {FEAT[0].ticks.map((t) => (
        <g key={`x${t}`}>
          <line x1={sx(t)} x2={sx(t)} y1={PT} y2={SH - PB} stroke="var(--line)" />
          <text x={sx(t)} y={SH - PB + 15} textAnchor="middle" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
            {t}
          </text>
        </g>
      ))}
      {FEAT[1].ticks.map((t) => (
        <g key={`y${t}`}>
          <line x1={PL} x2={SW - PR} y1={sy(t)} y2={sy(t)} stroke="var(--line)" />
          <text x={PL - 6} y={sy(t) + 4} textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
            {t}
          </text>
        </g>
      ))}
      <text x={(PL + SW - PR) / 2} y={SH - 8} textAnchor="middle" fontSize="11.5" fill="var(--muted)">
        tenure (months) →
      </text>
      <text
        x={13}
        y={(PT + SH - PB) / 2}
        textAnchor="middle"
        fontSize="11.5"
        fill="var(--muted)"
        transform={`rotate(-90 13 ${(PT + SH - PB) / 2})`}
      >
        monthly charge ($) →
      </text>
    </g>
  );
}

function Counts({ c, x, y, anchor = "middle", size = 11.5 }: { c: [number, number]; x: number; y: number; anchor?: "middle" | "start"; size?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontFamily="monospace">
      <tspan fill={STAY}>{c[0]} stay</tspan>
      <tspan fill="var(--muted-2)"> · </tspan>
      <tspan fill={CHURN}>{c[1]} churn</tspan>
    </text>
  );
}

/* ---------- tree diagram layout ---------- */
const SLOT = 124;
const LEVEL_H = 78;
const BOX_W = 114;
const BOX_H = 40;

interface Placed {
  node: TNode;
  x: number;
  y: number;
}

function layoutTree(root: TNode): { placed: Placed[]; width: number; height: number } {
  const leaves = leavesOf(root);
  const width = Math.max(620, leaves.length * SLOT + 16);
  const offset = (width - leaves.length * SLOT) / 2;
  const pos = new Map<string, number>();
  leaves.forEach((l, i) => pos.set(l.id, offset + (i + 0.5) * SLOT));
  const place = (n: TNode): number => {
    if (n.left && n.right) {
      const x = (place(n.left) + place(n.right)) / 2;
      pos.set(n.id, x);
      return x;
    }
    return pos.get(n.id) ?? 0;
  };
  place(root);
  const nodes = allNodes(root);
  const maxD = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  return {
    placed: nodes.map((node) => ({ node, x: pos.get(node.id) ?? 0, y: 16 + node.depth * LEVEL_H })),
    width,
    height: 16 + maxD * LEVEL_H + BOX_H + 14,
  };
}

/* =========================================================================== */

export default function TreeSplitter() {
  const reduce = useReducedMotion();
  const points = useMemo(() => buildCustomers(), []);

  const [mode, setMode] = useState<Mode>(DEFAULTS.mode);
  const [feat, setFeat] = useState<Feat>(DEFAULTS.feat);
  const [threshold, setThreshold] = useState(DEFAULTS.threshold);
  const [crit, setCrit] = useState<Crit>(DEFAULTS.crit);
  const [depth, setDepth] = useState(DEFAULTS.depth);
  const [minLeaf, setMinLeaf] = useState(DEFAULTS.minLeaf);
  const [dragging, setDragging] = useState(false);

  // Growth animation: nodes deeper than `anim.from` fade in as `progress` goes 0 → 1.
  const [anim, setAnim] = useState({ key: 0, from: DEFAULTS.depth });
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    if (anim.key === 0 || reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 650);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anim.key, reduce]);

  const changeDepth = (d: number) => {
    if (d > depth && !reduce) {
      setAnim((a) => ({ key: a.key + 1, from: depth }));
      setProgress(0);
    } else {
      setAnim((a) => ({ key: a.key, from: d }));
      setProgress(1);
    }
    setDepth(d);
  };

  /* ---- mode 1: one split ---- */
  const score = useMemo(() => scoreSplit(points, feat, threshold, crit), [points, feat, threshold, crit]);
  const bestHere = useMemo(() => bestSplit(points, crit, 1, [feat]), [points, crit, feat]);
  const bestAny = useMemo(() => bestSplit(points, crit, 1), [points, crit]);
  const curve = useMemo(() => {
    const { min, max } = FEAT[feat];
    const out: { t: number; g: number }[] = [];
    for (let t = min; t <= max + 1e-9; t += 0.5) out.push({ t, g: scoreSplit(points, feat, t, crit).gain });
    return out;
  }, [points, feat, crit]);

  /* ---- mode 2: greedy tree ---- */
  const tree = useMemo(() => growTree(points, crit, depth, minLeaf), [points, crit, depth, minLeaf]);
  const prevTree = useMemo(
    () => growTree(points, crit, Math.min(anim.from, depth), minLeaf),
    [points, crit, anim.from, depth, minLeaf],
  );
  const leaves = leavesOf(tree);
  const acc = trainAccuracy(tree, points.length);
  const pureLeaves = leaves.filter((l) => l.counts[0] === 0 || l.counts[1] === 0).length;
  const byDepth = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5].map((d) => {
        const t = growTree(points, crit, d, minLeaf);
        return { d, acc: trainAccuracy(t, points.length), leaves: leavesOf(t).length };
      }),
    [points, crit, minLeaf],
  );
  const layout = useMemo(() => layoutTree(tree), [tree]);

  const isNew = (n: TNode) => n.depth > anim.from;
  const fade = (n: TNode) => (isNew(n) ? progress : 1);

  /* ---- pointer: drag the threshold on the scatter, or click the curve ---- */
  const setFromPointer = (e: ReactPointerEvent<SVGSVGElement>, kind: "scatter" | "curve") => {
    const rect = e.currentTarget.getBoundingClientRect();
    const f = FEAT[feat];
    let v: number;
    if (kind === "curve" || feat === 0) {
      const vx = ((e.clientX - rect.left) / rect.width) * SW;
      const x0 = kind === "curve" ? CL : PL;
      const x1 = kind === "curve" ? SW - CR : SW - PR;
      v = f.min + ((vx - x0) / (x1 - x0)) * (f.max - f.min);
    } else {
      const vy = ((e.clientY - rect.top) / rect.height) * SH;
      v = f.min + ((SH - PB - vy) / (SH - PT - PB)) * (f.max - f.min);
    }
    setThreshold(clamp(Math.round(v * 2) / 2, f.min, f.max));
  };

  const reset = () => {
    setMode(DEFAULTS.mode);
    setFeat(DEFAULTS.feat);
    setThreshold(DEFAULTS.threshold);
    setCrit(DEFAULTS.crit);
    setDepth(DEFAULTS.depth);
    setMinLeaf(DEFAULTS.minLeaf);
    setAnim((a) => ({ key: a.key, from: DEFAULTS.depth }));
    setProgress(1);
  };

  const cs = critShort(crit);
  const f = FEAT[feat];
  const lineX = sx(threshold);
  const lineY = sy(threshold);

  /* ---------------- stage pieces ---------------- */

  const scatter = (
    <svg
      viewBox={`0 0 ${SW} ${SH}`}
      className="block h-auto w-full select-none"
      role="img"
      aria-label={
        mode === "score"
          ? `Scatter of 40 customers split at ${f.short} < ${tLabel(feat, threshold)}`
          : `Scatter of 40 customers carved into ${leaves.length} boxes by a depth-${depth} tree`
      }
      style={{ touchAction: mode === "score" ? "none" : "manipulation", cursor: mode === "score" ? (feat === 0 ? "ew-resize" : "ns-resize") : "default" }}
      onPointerDown={(e) => {
        if (mode !== "score") return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        setFromPointer(e, "scatter");
      }}
      onPointerMove={(e) => {
        if (mode === "score" && dragging) setFromPointer(e, "scatter");
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      {mode === "score" ? (
        feat === 0 ? (
          <>
            <rect x={PL} y={PT} width={Math.max(0, lineX - PL)} height={SH - PT - PB} fill="var(--accent-soft)" />
            <rect x={lineX} y={PT} width={Math.max(0, SW - PR - lineX)} height={SH - PT - PB} fill="var(--violet-soft)" />
          </>
        ) : (
          <>
            <rect x={PL} y={lineY} width={SW - PL - PR} height={Math.max(0, SH - PB - lineY)} fill="var(--accent-soft)" />
            <rect x={PL} y={PT} width={SW - PL - PR} height={Math.max(0, lineY - PT)} fill="var(--violet-soft)" />
          </>
        )
      ) : (
        <>
          {(progress < 1 ? leavesOf(prevTree) : []).map((l) => (
            <LeafRect key={`old${l.id}`} l={l} opacity={1 - progress} />
          ))}
          {leaves.map((l) => (
            <LeafRect key={l.id} l={l} opacity={isNew(l) ? progress : 1} />
          ))}
        </>
      )}
      <Axes />

      {mode === "grow"
        ? allNodes(tree)
            .filter((n) => n.split)
            .map((n) => {
              const s = n.split as Best;
              const [x0, x1, y0, y1] = n.bounds;
              const k = n.depth >= anim.from ? progress : 1;
              const ln =
                s.f === 0
                  ? { x1: sx(s.t), x2: sx(s.t), y1: sy(y0), y2: sy(y0) + (sy(y1) - sy(y0)) * k }
                  : { x1: sx(x0), x2: sx(x0) + (sx(x1) - sx(x0)) * k, y1: sy(s.t), y2: sy(s.t) };
              return <line key={`s${n.id}`} {...ln} stroke="var(--text)" strokeOpacity="0.7" strokeWidth={n.depth === 0 ? 2.4 : 1.6} />;
            })
        : null}

      {mode === "score" && feat === 1 ? (
        <g>
            {SH - PB - lineY > 20 ? <Tag x={SW - PR - 24} y={lineY + 16} text={`yes ↓ < ${tLabel(1, threshold)}`} color="var(--accent)" /> : null}
            {lineY - PT > 20 ? <Tag x={SW - PR - 24} y={lineY - 9} text="no ↑" color="var(--violet)" /> : null}
        </g>
      ) : null}

      {points.map((p, i) => (
        <Marker key={i} p={p} />
      ))}

      {mode === "score" ? (
        feat === 0 ? (
          <g>
            <line x1={lineX} x2={lineX} y1={PT - 13} y2={SH - PB} stroke="var(--warn)" strokeWidth="2.5" />
            <circle cx={lineX} cy={PT - 13} r="6" fill="var(--warn)" />
            {lineX - PL > 64 ? (
              <text x={lineX - 12} y={PT - 9} textAnchor="end" fontSize="11.5" fontFamily="monospace" fill="var(--accent)">
                yes ← &lt; {tLabel(0, threshold)}
              </text>
            ) : null}
            {SW - PR - lineX > 44 ? (
              <text x={lineX + 12} y={PT - 9} fontSize="11.5" fontFamily="monospace" fill="var(--violet)">
                ≥ → no
              </text>
            ) : null}
          </g>
        ) : (
          <g>
            <line x1={PL} x2={SW - PR} y1={lineY} y2={lineY} stroke="var(--warn)" strokeWidth="2.5" />
            <circle cx={SW - PR - 10} cy={lineY} r="6" fill="var(--warn)" />
          </g>
        )
      ) : null}
    </svg>
  );

  const splitPanel = (
    <div className="space-y-2">
      <svg viewBox="0 0 400 206" className="block h-auto w-full" role="img" aria-label={`Parent node and two children; gain ${fmt(score.gain, 3)}`}>
        <rect x="110" y="6" width="180" height="56" rx="8" fill="var(--panel-2)" stroke="var(--line-strong)" />
        <text x="200" y="24" textAnchor="middle" fontSize="11.5" fill="var(--muted)">
          parent · all {points.length}
        </text>
        <Counts c={countClasses(points)} x={200} y={40} />
        <text x="200" y="55" textAnchor="middle" fontSize="11.5" fontFamily="monospace" fill="var(--text)">
          {cs} = {fmt(score.iP, 3)}
        </text>

        <line x1="170" y1="62" x2="100" y2="88" stroke="var(--line-strong)" />
        <line x1="230" y1="62" x2="300" y2="88" stroke="var(--line-strong)" />

        {(
          [
            [100, `yes: ${f.short} < ${tLabel(feat, threshold)}`, score.left, score.nL, score.iL, "var(--accent)"],
            [300, `no: ${f.short} ≥ ${tLabel(feat, threshold)}`, score.right, score.nR, score.iR, "var(--violet)"],
          ] as [number, string, [number, number], number, number, string][]
        ).map(([x, title, c, n, imp, col]) => (
          <g key={title}>
            <rect x={x - 96} y="88" width="192" height="58" rx="8" fill="var(--panel-2)" stroke={col} />
            <text x={x} y="105" textAnchor="middle" fontSize="11.5" fontFamily="monospace" fill={col}>
              {title}
            </text>
            <Counts c={c} x={x} y={121} />
            <text x={x} y="138" textAnchor="middle" fontSize="11.5" fontFamily="monospace" fill="var(--text)">
              n={n} · {cs} = {fmt(imp, 3)}
            </text>
          </g>
        ))}

        <text x="200" y="168" textAnchor="middle" fontSize="11.5" fontFamily="monospace" fill="var(--muted)">
          weighted = {score.nL}/{points.length}×{fmt(score.iL, 3)} + {score.nR}/{points.length}×{fmt(score.iR, 3)} = {fmt(score.weighted, 3)}
        </text>
        <text x="200" y="190" textAnchor="middle" fontSize="12.5" fontFamily="monospace" fill="var(--good)">
          gain = {fmt(score.iP, 3)} − {fmt(score.weighted, 3)} = {fmt(score.gain, 3)}
        </text>
      </svg>
      <GainCurve
        curve={curve}
        feat={feat}
        threshold={threshold}
        best={bestHere}
        onPick={(e) => setFromPointer(e, "curve")}
        unit={crit === "gini" ? "Gini drop" : "info gain (bits)"}
      />
    </div>
  );

  const accChart = (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="block h-auto w-full" role="img" aria-label={`Training accuracy by depth; current depth ${depth} gives ${fmt(acc * 100, 1)}%`}>
      <text x="16" y="22" fontSize="12" fill="var(--muted)">
        training accuracy by depth (min leaf {minLeaf})
      </text>
      {[50, 75, 100].map((g) => {
        const y = 250 - ((g - 50) / 50) * 190;
        return (
          <g key={g}>
            <line x1="44" x2="388" y1={y} y2={y} stroke="var(--line)" />
            <text x="38" y={y + 4} textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
              {g}%
            </text>
          </g>
        );
      })}
      <text x="38" y="284" textAnchor="end" fontSize="11" fill="var(--muted-2)">
        leaves
      </text>
      {byDepth.map((b) => {
        const x = 52 + b.d * 56;
        const h = Math.max(2, ((b.acc * 100 - 50) / 50) * 190);
        const on = b.d === depth;
        const perfect = b.acc >= 1 - 1e-9;
        return (
          <g
            key={b.d}
            onClick={() => changeDepth(b.d)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={x}
              y={250 - h}
              width="42"
              height={h}
              rx="4"
              fill={on ? (perfect ? "var(--warn)" : "var(--accent)") : perfect ? "var(--warn-soft)" : "var(--accent-soft)"}
              stroke={perfect ? "var(--warn)" : "var(--accent)"}
              strokeOpacity={on ? 1 : 0.5}
            />
            <text x={x + 21} y={244 - h} textAnchor="middle" fontSize="11" fontFamily="monospace" fill={on ? "var(--text)" : "var(--muted-2)"}>
              {Number((b.acc * 100).toFixed(1))}%
            </text>
            <text x={x + 21} y="268" textAnchor="middle" fontSize="11.5" fontFamily="monospace" fill={on ? "var(--text)" : "var(--muted)"}>
              d{b.d}
            </text>
            <text x={x + 21} y="284" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
              {b.leaves}
            </text>
          </g>
        );
      })}
      <text x="200" y="308" textAnchor="middle" fontSize="11" fill="var(--warn)">
        100% here only means the tree memorised these 40 rows.
      </text>
    </svg>
  );

  const treeDiagram = (
    <div
      className="overflow-x-auto rounded-[var(--radius-sm)] border"
      style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
    >
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="block h-auto w-full"
        style={{ minWidth: `${Math.round(layout.width * 0.72)}px` }}
        role="img"
        aria-label={`Tree diagram with ${leaves.length} leaves`}
      >
        {layout.placed.map(({ node, x, y }) =>
          node.left && node.right
            ? ([node.left, node.right] as TNode[]).map((ch, i) => {
                const c = layout.placed.find((p) => p.node.id === ch.id);
                if (!c) return null;
                const x1 = x;
                const y1 = y + BOX_H;
                const mx = (x1 + c.x) / 2;
                const my = (y1 + c.y) / 2;
                return (
                  <g key={`e${ch.id}`} opacity={fade(ch)}>
                    <line x1={x1} y1={y1} x2={c.x} y2={c.y} stroke="var(--line-strong)" strokeWidth="1.4" />
                    <text
                      x={mx + (i === 0 ? -6 : 6)}
                      y={my}
                      textAnchor={i === 0 ? "end" : "start"}
                      fontSize="11"
                      fontFamily="monospace"
                      fill={i === 0 ? "var(--good)" : "var(--muted)"}
                    >
                      {i === 0 ? "yes" : "no"}
                    </text>
                  </g>
                );
              })
            : null,
        )}
        {layout.placed.map(({ node, x, y }) => {
          const leaf = !node.split;
          const maj: 0 | 1 = node.counts[1] > node.counts[0] ? 1 : 0;
          const col = maj ? CHURN : STAY;
          const k = fade(node);
          return (
            <g key={`n${node.id}`} opacity={k} transform={`translate(0 ${(1 - k) * -12})`}>
              <rect
                x={x - BOX_W / 2}
                y={y}
                width={BOX_W}
                height={BOX_H}
                rx="7"
                fill={leaf ? (maj ? "var(--danger-soft)" : "var(--accent-2-soft)") : "var(--panel-2)"}
                stroke={leaf ? col : "var(--accent)"}
                strokeWidth={leaf ? 1.4 : 1.2}
              />
              <text x={x} y={y + 16} textAnchor="middle" fontSize="11.5" fontFamily="monospace" fill={leaf ? col : "var(--text)"}>
                {node.split ? `${FEAT[node.split.f].short} < ${tLabel(node.split.f, node.split.t)}?` : `→ ${maj ? "churn" : "stay"}`}
              </text>
              <text x={x} y={y + 32} textAnchor="middle" fontSize="11" fontFamily="monospace">
                <tspan fill={STAY}>{node.counts[0]}</tspan>
                <tspan fill="var(--muted-2)">/</tspan>
                <tspan fill={CHURN}>{node.counts[1]}</tspan>
                <tspan fill="var(--muted-2)">
                  {"  "}
                  {cs} {fmt(node.imp, 2)}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );

  const panel = "overflow-hidden rounded-[var(--radius-sm)] border";
  const panelStyle = { borderColor: "var(--line)", background: "var(--ink-2)" };

  const stage = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
        {(
          [
            ["gini", "Gini = 1 − Σ pₖ²"],
            ["entropy", "Entropy = −Σ pₖ log₂ pₖ"],
          ] as [Crit, string][]
        ).map(([c, txt]) => (
          <span
            key={c}
            className="rounded-full border px-2.5 py-0.5 font-mono"
            style={{
              borderColor: crit === c ? "var(--accent)" : "var(--line)",
              background: crit === c ? "var(--accent-soft)" : "transparent",
              color: crit === c ? "var(--text)" : "var(--muted-2)",
            }}
          >
            {txt}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-3" style={{ color: "var(--muted)" }}>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STAY }} aria-hidden /> stay
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rotate-45" style={{ background: CHURN }} aria-hidden /> churn
          </span>
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className={panel} style={panelStyle}>
          {scatter}
        </div>
        <div className={`${panel} ${mode === "score" ? "p-2" : ""}`} style={panelStyle}>
          {mode === "score" ? splitPanel : accChart}
        </div>
      </div>
      {mode === "grow" ? treeDiagram : null}
    </div>
  );

  const controls = (
    <>
      <Choice<Mode>
        label="Mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: "score", label: "Score a split yourself" },
          { value: "grow", label: "Let the algorithm grow it" },
        ]}
      />
      <Choice<Crit>
        label="Impurity criterion"
        value={crit}
        onChange={setCrit}
        options={[
          { value: "gini", label: "Gini" },
          { value: "entropy", label: "Entropy (bits)" },
        ]}
      />
      {mode === "score" ? (
        <>
          <Choice<"0" | "1">
            label="Feature to split on"
            value={String(feat) as "0" | "1"}
            onChange={(v) => {
              const nf = Number(v) as Feat;
              setFeat(nf);
              setThreshold(FEAT[nf].def);
            }}
            options={[
              { value: "0", label: "tenure (months)" },
              { value: "1", label: "monthly charge ($)" },
            ]}
          />
          <Slider
            label={`Threshold: ${f.short} < t goes left`}
            value={threshold}
            min={f.min}
            max={f.max}
            step={0.5}
            onChange={setThreshold}
            display={tLabel(feat, threshold)}
            hint="You can also drag the orange line on the scatter, or tap the curve."
          />
          <LabButton
            onClick={() => {
              if (!bestAny) return;
              setFeat(bestAny.f);
              setThreshold(bestAny.t);
            }}
          >
            Snap to best split
          </LabButton>
        </>
      ) : (
        <>
          <Slider
            label="Maximum depth"
            value={depth}
            min={0}
            max={5}
            step={1}
            onChange={changeDepth}
            display={`${depth}`}
            hint="Depth 0 is a single leaf that predicts the majority class for everyone."
          />
          <Slider
            label="Minimum samples per leaf"
            value={minLeaf}
            min={1}
            max={10}
            step={1}
            onChange={setMinLeaf}
            display={`${minLeaf}`}
            hint="A split is only allowed if both children keep at least this many customers."
          />
        </>
      )}
    </>
  );

  const readout =
    mode === "score" ? (
      <Readout
        items={[
          { label: `Parent ${cs}`, value: fmt(score.iP, 3) },
          { label: `Left (yes) ${cs}`, value: fmt(score.iL, 3), tone: "accent" },
          { label: `Right (no) ${cs}`, value: fmt(score.iR, 3), tone: "accent" },
          { label: "Weighted children", value: fmt(score.weighted, 3), tone: "warn" },
          { label: "Gain (impurity drop)", value: fmt(score.gain, 3), tone: "good" },
          {
            label: "Best gain, any split",
            value: bestAny ? `${fmt(bestAny.gain, 3)} @ ${FEAT[bestAny.f].short} < ${tLabel(bestAny.f, bestAny.t)}` : "—",
            tone: bestAny && Math.abs(bestAny.gain - score.gain) < 1e-9 ? "good" : undefined,
          },
        ]}
      />
    ) : (
      <Readout
        items={[
          { label: "Depth reached", value: `${allNodes(tree).reduce((m, n) => Math.max(m, n.depth), 0)} (max ${depth})` },
          { label: "Leaves", value: `${leaves.length}`, tone: "accent" },
          { label: "Training accuracy", value: `${fmt(acc * 100, 1)}%`, tone: acc >= 1 - 1e-9 ? "warn" : "good" },
          { label: "Pure leaves", value: `${pureLeaves} of ${leaves.length}` },
        ]}
      />
    );

  return (
    <LabFrame
      title={LABS.treesplit.title}
      how={LABS.treesplit.how}
      notice="The algorithm tries every feature and every threshold and keeps the one with the biggest impurity drop — greedily, one node at a time, never looking ahead. Grow it deeper and the boxes get smaller until every leaf is pure: 100% training accuracy is a warning, not a victory."
      onReset={reset}
      stage={stage}
      controls={controls}
      readout={readout}
    />
  );
}

/** A right-aligned label on a small backing pill so it stays legible over points. */
function Tag({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  const w = text.length * 7 + 10;
  return (
    <g>
      <rect x={x - w} y={y - 12} width={w} height="17" rx="4" fill="var(--panel-2)" fillOpacity="0.92" />
      <text x={x - 5} y={y} textAnchor="end" fontSize="11.5" fontFamily="monospace" fill={color}>
        {text}
      </text>
    </g>
  );
}

function LeafRect({ l, opacity }: { l: TNode; opacity: number }) {
  const [x0, x1, y0, y1] = l.bounds;
  const n = l.counts[0] + l.counts[1];
  const maj = l.counts[1] > l.counts[0] ? 1 : 0;
  const purity = n ? Math.max(l.counts[0], l.counts[1]) / n : 0.5; // 0.5 … 1
  return (
    <rect
      x={sx(x0)}
      y={sy(y1)}
      width={sx(x1) - sx(x0)}
      height={sy(y0) - sy(y1)}
      fill={maj ? CHURN : STAY}
      fillOpacity={(0.06 + (purity - 0.5) * 0.44) * opacity}
    />
  );
}

/* ---------- impurity-drop curve ---------- */
const CH = 150;
const CL = 46;
const CR = 12;
const CT = 22;
const CB = 30;

function GainCurve({
  curve,
  feat,
  threshold,
  best,
  onPick,
  unit,
}: {
  curve: { t: number; g: number }[];
  feat: Feat;
  threshold: number;
  best: Best | null;
  onPick: (e: ReactPointerEvent<SVGSVGElement>) => void;
  unit: string;
}) {
  const { min, max, ticks } = FEAT[feat];
  const gMax = Math.max(0.05, ...curve.map((c) => c.g)) * 1.18;
  const cx = (t: number) => CL + ((t - min) / (max - min)) * (SW - CL - CR);
  const cy = (g: number) => CH - CB - (Math.max(0, g) / gMax) * (CH - CT - CB);
  let d = "";
  curve.forEach((c, i) => {
    d += i === 0 ? `M${cx(c.t)},${cy(c.g)}` : `H${cx(c.t)}V${cy(c.g)}`;
  });
  const cur = curve.reduce((a, c) => (Math.abs(c.t - threshold) < Math.abs(a.t - threshold) ? c : a), curve[0]);
  return (
    <svg
      viewBox={`0 0 ${SW} ${CH}`}
      className="block h-auto w-full cursor-crosshair"
      role="img"
      aria-label={`Impurity drop for every threshold on ${FEAT[feat].short}`}
      onPointerDown={onPick}
    >
      <text x={CL} y="13" fontSize="11.5" fill="var(--muted)">
        {unit} vs threshold on {FEAT[feat].short}
      </text>
      <line x1={CL} x2={SW - CR} y1={CH - CB} y2={CH - CB} stroke="var(--line-strong)" />
      {ticks.map((t) => (
        <text key={t} x={cx(t)} y={CH - CB + 14} textAnchor="middle" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
          {t}
        </text>
      ))}
      <text x={CL - 6} y={cy(0) + 4} textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--muted-2)">
        0
      </text>
      <path d={`${d}V${cy(0)}H${cx(curve[0].t)}Z`} fill="var(--good-soft)" />
      <path d={d} fill="none" stroke="var(--good)" strokeWidth="1.6" />
      {best ? (
        <g>
          <circle cx={cx(best.t)} cy={cy(best.gain)} r="4.5" fill="var(--good)" />
          <text
            x={clamp(cx(best.t), CL + 50, SW - CR - 50)}
            y={cy(best.gain) - 8}
            textAnchor="middle"
            fontSize="11"
            fontFamily="monospace"
            fill="var(--good)"
          >
            best {tLabel(feat, best.t)} → {fmt(best.gain, 3)}
          </text>
        </g>
      ) : null}
      <line x1={cx(threshold)} x2={cx(threshold)} y1={CT} y2={CH - CB} stroke="var(--warn)" strokeWidth="1.6" strokeDasharray="4 3" />
      <circle cx={cx(threshold)} cy={cy(cur.g)} r="4.5" fill="var(--warn)" stroke="var(--ink-2)" strokeWidth="1.2" />
    </svg>
  );
}
