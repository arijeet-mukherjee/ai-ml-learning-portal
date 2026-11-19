"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Choice, LabButton, LabFrame, Readout, Slider } from "./LabKit";
import { LABS } from "@/lib/labs";
import { fmt } from "@/lib/stats";
import { gaussian, mulberry32 } from "@/lib/rng";

/**
 * m6 · One deep CART tree against a vote of many.
 *
 * Noisy "two moons": 150 training points, 150 held-out test points. Every tree is
 * a plain Gini CART on the two features. The forest's two sources of diversity:
 *   - bootstrap rows: each tree sees N draws with replacement from the N rows;
 *   - feature randomness: at every split, only ONE randomly chosen feature of the
 *     two is searched (max_features = 1, the 2-D cousin of √p). If that feature
 *     has no useful cut, the other one is tried, as sklearn does.
 * The forest predicts the average of the trees' leaf probabilities (soft vote).
 * Turn both switches off and every tree is the same tree, so the vote is too.
 */

type Cls = 0 | 1;
type OnOff = "on" | "off";

interface FPt {
  x: number;
  y: number;
  c: Cls;
}

type FNode = { leaf: true; p: number } | { leaf: false; f: 0 | 1; t: number; l: FNode; r: FNode };

const DATA_SEED = 20241018;
const FOREST_SEED = 7331;
const N_TRAIN = 150;
const N_TEST = 150;
const NOISE = 0.28;
const MAX_T = 60;

const DEFAULTS = { trees: 25, depth: 10, boot: "on" as OnOff, feats: "on" as OnOff, seed: 0 };

// Plot domain and heatmap grid (aspect matches the domain so cells are square).
const X0 = -1.7;
const X1 = 2.7;
const Y0 = -1.35;
const Y1 = 1.85;
const GW = 132;
const GH = 96;

function makeMoons(n: number, rand: () => number): FPt[] {
  const g = gaussian(rand);
  const out: FPt[] = [];
  for (let i = 0; i < n; i++) {
    const c: Cls = i % 2 === 0 ? 0 : 1;
    const th = rand() * Math.PI;
    const x = c === 0 ? Math.cos(th) : 1 - Math.cos(th);
    const y = c === 0 ? Math.sin(th) : 0.5 - Math.sin(th);
    out.push({ x: x + g() * NOISE, y: y + g() * NOISE, c });
  }
  return out;
}

function buildData(): { train: FPt[]; test: FPt[] } {
  const rand = mulberry32(DATA_SEED);
  return { train: makeMoons(N_TRAIN, rand), test: makeMoons(N_TEST, rand) };
}

const val = (p: FPt, f: 0 | 1) => (f === 0 ? p.x : p.y);

/** Best Gini split of the rows `idx` (a multiset) on one feature, or null. */
function bestOnFeature(X: FPt[], idx: number[], f: 0 | 1): { t: number; gain: number } | null {
  const sorted = [...idx].sort((a, b) => val(X[a], f) - val(X[b], f));
  const n = sorted.length;
  let tot1 = 0;
  for (const i of sorted) tot1 += X[i].c;
  const parent = 1 - (tot1 / n) ** 2 - ((n - tot1) / n) ** 2;
  let best: { t: number; gain: number } | null = null;
  let l1 = 0;
  for (let k = 0; k < n - 1; k++) {
    l1 += X[sorted[k]].c;
    const a = val(X[sorted[k]], f);
    const b = val(X[sorted[k + 1]], f);
    if (a === b) continue;
    const nl = k + 1;
    const nr = n - nl;
    const r1 = tot1 - l1;
    const gl = 1 - (l1 / nl) ** 2 - ((nl - l1) / nl) ** 2;
    const gr = 1 - (r1 / nr) ** 2 - ((nr - r1) / nr) ** 2;
    const gain = parent - (nl / n) * gl - (nr / n) * gr;
    if (!best || gain > best.gain + 1e-12) best = { t: (a + b) / 2, gain };
  }
  return best && best.gain > 1e-12 ? best : null;
}

function fitTree(X: FPt[], idx: number[], maxDepth: number, featRand: boolean, rand: () => number): FNode {
  const rec = (rows: number[], depth: number): FNode => {
    let ones = 0;
    for (const i of rows) ones += X[i].c;
    const p = ones / rows.length;
    if (depth >= maxDepth || ones === 0 || ones === rows.length) return { leaf: true, p };
    let split: { f: 0 | 1; t: number; gain: number } | null = null;
    if (featRand) {
      const first: 0 | 1 = rand() < 0.5 ? 0 : 1;
      for (const f of [first, (1 - first) as 0 | 1]) {
        const b = bestOnFeature(X, rows, f);
        if (b) {
          split = { f, ...b };
          break;
        }
      }
    } else {
      for (const f of [0, 1] as const) {
        const b = bestOnFeature(X, rows, f);
        if (b && (!split || b.gain > split.gain + 1e-12)) split = { f, ...b };
      }
    }
    if (!split) return { leaf: true, p };
    const s = split;
    const L = rows.filter((i) => val(X[i], s.f) < s.t);
    const R = rows.filter((i) => val(X[i], s.f) >= s.t);
    return { leaf: false, f: s.f, t: s.t, l: rec(L, depth + 1), r: rec(R, depth + 1) };
  };
  return rec(idx, 0);
}

function predict(node: FNode, x: number, y: number): number {
  let n = node;
  while (!n.leaf) n = (n.f === 0 ? x : y) < n.t ? n.l : n.r;
  return n.p;
}

interface TreeFit {
  inBag: Uint8Array; // 1 if the training row was drawn at least once
  unique: number;
  train: Float32Array; // leaf P(class 1) for each training row
  test: Float32Array;
  grid: Float32Array;
}

function gridX(i: number) {
  return X0 + ((i + 0.5) / GW) * (X1 - X0);
}
function gridY(j: number) {
  return Y1 - ((j + 0.5) / GH) * (Y1 - Y0);
}

function growForest(train: FPt[], test: FPt[], depth: number, boot: boolean, featRand: boolean, seed: number): TreeFit[] {
  const n = train.length;
  const fits: TreeFit[] = [];
  for (let k = 0; k < MAX_T; k++) {
    const rand = mulberry32(FOREST_SEED + seed * 1009 + k * 7919);
    const idx: number[] = [];
    const inBag = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const r = boot ? Math.floor(rand() * n) : i;
      idx.push(r);
      inBag[r] = 1;
    }
    const tree = fitTree(train, idx, depth, featRand, rand);
    const grid = new Float32Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) grid[j * GW + i] = predict(tree, gridX(i), gridY(j));
    fits.push({
      inBag,
      unique: inBag.reduce((a, b) => a + b, 0),
      train: Float32Array.from(train, (p) => predict(tree, p.x, p.y)),
      test: Float32Array.from(test, (p) => predict(tree, p.x, p.y)),
      grid,
    });
  }
  return fits;
}

const label = (p: number): Cls => (p > 0.5 ? 1 : 0);

function accuracy(probs: ArrayLike<number>, pts: FPt[]): number {
  let ok = 0;
  for (let i = 0; i < pts.length; i++) if (label(probs[i]) === pts[i].c) ok++;
  return ok / pts.length;
}

function average(fits: TreeFit[], key: "train" | "test" | "grid"): Float32Array {
  const out = new Float32Array(fits[0][key].length);
  for (const f of fits) {
    const a = f[key];
    for (let i = 0; i < a.length; i++) out[i] += a[i];
  }
  for (let i = 0; i < out.length; i++) out[i] /= fits.length;
  return out;
}

/** Each training row is judged only by the trees that never saw it. */
function oobAccuracy(fits: TreeFit[], train: FPt[]): { acc: number; covered: number } {
  let ok = 0;
  let covered = 0;
  for (let i = 0; i < train.length; i++) {
    let s = 0;
    let m = 0;
    for (const f of fits) {
      if (f.inBag[i]) continue;
      s += f.train[i];
      m++;
    }
    if (!m) continue;
    covered++;
    if (label(s / m) === train[i].c) ok++;
  }
  return { acc: covered ? ok / covered : NaN, covered };
}

/* ---------------- canvas ---------------- */

type RGB = [number, number, number];

function readColor(ctx: CanvasRenderingContext2D, css: string, fallback: RGB): RGB {
  ctx.fillStyle = "#000000";
  ctx.fillStyle = css || "#000000";
  const s = String(ctx.fillStyle);
  if (s.startsWith("#") && s.length === 7) {
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  }
  const m = s.match(/[\d.]+/g);
  return m && m.length >= 3 ? [Number(m[0]), Number(m[1]), Number(m[2])] : fallback;
}

function useThemeTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const mo = new MutationObserver(() => setTick((t) => t + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => mo.disconnect();
  }, []);
  return tick;
}

function HeatCanvas({
  probs,
  train,
  test,
  theme,
  label: aria,
  points = true,
}: {
  probs: Float32Array;
  train: FPt[];
  test: FPt[];
  theme: number;
  label: string;
  points?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const cssW = canvas.clientWidth;
      if (!cssW) return;
      const cssH = (cssW * GH) / GW;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const root = getComputedStyle(document.documentElement);
      const v = (name: string) => root.getPropertyValue(name).trim();
      const bg = readColor(ctx, v("--ink-2"), [10, 12, 20]);
      const c0 = readColor(ctx, v("--accent-2"), [63, 217, 228]);
      const c1 = readColor(ctx, v("--danger"), [255, 112, 137]);
      const txt = readColor(ctx, v("--text"), [232, 236, 248]);

      // Heat: blend the two class colours by vote, fade toward the background when unsure.
      const off = document.createElement("canvas");
      off.width = GW;
      off.height = GH;
      const octx = off.getContext("2d");
      if (!octx) return;
      const img = octx.createImageData(GW, GH);
      for (let j = 0; j < GH; j++) {
        for (let i = 0; i < GW; i++) {
          const k = j * GW + i;
          const p = probs[k];
          const conf = Math.abs(2 * p - 1);
          const a = 0.16 + 0.42 * conf;
          let r = bg[0] + ((c0[0] + (c1[0] - c0[0]) * p) - bg[0]) * a;
          let g = bg[1] + ((c0[1] + (c1[1] - c0[1]) * p) - bg[1]) * a;
          let b = bg[2] + ((c0[2] + (c1[2] - c0[2]) * p) - bg[2]) * a;
          const lab = label(p);
          const edge =
            (i + 1 < GW && label(probs[k + 1]) !== lab) || (j + 1 < GH && label(probs[k + GW]) !== lab);
          if (edge) {
            r += (txt[0] - r) * 0.55;
            g += (txt[1] - g) * 0.55;
            b += (txt[2] - b) * 0.55;
          }
          img.data[k * 4] = r;
          img.data[k * 4 + 1] = g;
          img.data[k * 4 + 2] = b;
          img.data[k * 4 + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, cssW, cssH);

      if (!points) return;
      const px = (x: number) => ((x - X0) / (X1 - X0)) * cssW;
      const py = (y: number) => ((Y1 - y) / (Y1 - Y0)) * cssH;
      const rad = Math.max(2.2, cssW / 125);
      const col = (c: Cls) => `rgb(${(c ? c1 : c0).join(",")})`;
      const bgc = `rgb(${bg.join(",")})`;
      for (const p of test) {
        ctx.beginPath();
        ctx.arc(px(p.x), py(p.y), rad, 0, Math.PI * 2);
        ctx.strokeStyle = col(p.c);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      for (const p of train) {
        ctx.beginPath();
        ctx.arc(px(p.x), py(p.y), rad, 0, Math.PI * 2);
        ctx.fillStyle = col(p.c);
        ctx.fill();
        ctx.strokeStyle = bgc;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [probs, train, test, theme, points]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={aria}
      className="block w-full"
      style={{ aspectRatio: `${GW} / ${GH}` }}
    />
  );
}

/* =========================================================================== */

export default function ForestVote() {
  const theme = useThemeTick();
  const { train, test } = useMemo(() => buildData(), []);

  const [trees, setTrees] = useState(DEFAULTS.trees);
  const [depth, setDepth] = useState(DEFAULTS.depth);
  const [boot, setBoot] = useState<OnOff>(DEFAULTS.boot);
  const [feats, setFeats] = useState<OnOff>(DEFAULTS.feats);
  const [seed, setSeed] = useState(DEFAULTS.seed);

  const fits = useMemo(
    () => growForest(train, test, depth, boot === "on", feats === "on", seed),
    [train, test, depth, boot, feats, seed],
  );

  const stats = useMemo(() => {
    const used = fits.slice(0, trees);
    const one = fits[0];
    const fTrain = average(used, "train");
    const fTest = average(used, "test");
    const grid = average(used, "grid");
    const oob = oobAccuracy(used, train);
    const uniq = used.reduce((a, f) => a + f.unique, 0) / used.length / train.length;
    const allSame = used.every((f) => f.grid.every((v, i) => v === one.grid[i]));
    return {
      grid,
      treeTrain: accuracy(one.train, train),
      treeTest: accuracy(one.test, test),
      forestTrain: accuracy(fTrain, train),
      forestTest: accuracy(fTest, test),
      oob,
      uniq,
      allSame,
    };
  }, [fits, trees, train, test]);

  const pct = (v: number) => (Number.isFinite(v) ? `${fmt(v * 100, 1)}%` : "—");
  const lift = stats.forestTest - stats.treeTest;
  const thumbs = fits.slice(0, Math.min(trees, 8));

  const panel = "overflow-hidden rounded-[var(--radius-sm)] border";
  const panelStyle = { borderColor: "var(--line)", background: "var(--ink-2)" };

  const caption = (title: string, right: string, tone: string) => (
    <div className="flex items-baseline justify-between gap-2 px-3 py-2 text-[12.5px]">
      <span className="font-mono" style={{ color: "var(--muted)" }}>
        {title}
      </span>
      <span className="font-mono" style={{ color: tone }}>
        {right}
      </span>
    </div>
  );

  return (
    <LabFrame
      title={LABS.forest.title}
      how={LABS.forest.how}
      notice="One deep tree is jagged: with both switches off it memorises every training row (100% train) yet gets only 87.3% of the hollow test rows. Averaging many differently-wrong trees smooths the boundary and lifts test accuracy to 92.0% at the defaults. More trees never make the forest overfit — from about 10 trees on the test score only wobbles between 90% and 93%, and extra trees just cost time. With bootstrap and feature randomness both off, every tree is the same tree and voting gains nothing: diversity is the whole trick."
      onReset={() => {
        setTrees(DEFAULTS.trees);
        setDepth(DEFAULTS.depth);
        setBoot(DEFAULTS.boot);
        setFeats(DEFAULTS.feats);
        setSeed(DEFAULTS.seed);
      }}
      stage={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]" style={{ color: "var(--muted)" }}>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent-2)" }} aria-hidden />
              class A
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--danger)" }} aria-hidden />
              class B
            </span>
            <span>● filled = training row</span>
            <span>○ hollow = held-out test row</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className={panel} style={panelStyle}>
              {caption("Tree #1 alone", `test ${pct(stats.treeTest)}`, "var(--warn)")}
              <HeatCanvas
                probs={fits[0].grid}
                train={train}
                test={test}
                theme={theme}
                label={`Decision regions of a single depth-${depth} tree; test accuracy ${pct(stats.treeTest)}`}
              />
            </div>
            <div className={panel} style={panelStyle}>
              {caption(`Forest vote of ${trees} tree${trees === 1 ? "" : "s"}`, `test ${pct(stats.forestTest)}`, "var(--good)")}
              <HeatCanvas
                probs={stats.grid}
                train={train}
                test={test}
                theme={theme}
                label={`Averaged vote of ${trees} trees; test accuracy ${pct(stats.forestTest)}`}
              />
            </div>
          </div>
          {stats.allSame && trees > 1 ? (
            <p
              className="rounded-[var(--radius-sm)] border px-3 py-2 text-[13px]"
              style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "var(--text)" }}
            >
              All {trees} trees are identical — same rows, same features, same greedy choices — so the forest is just
              Tree #1 again. Turn a randomness switch back on.
            </p>
          ) : null}
          <div>
            <div className="mb-1.5 font-mono text-[11.5px]" style={{ color: "var(--muted-2)" }}>
              the first {thumbs.length} tree{thumbs.length === 1 ? "" : "s"} of the vote — each one wrong in its own way
            </div>
            <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
              {thumbs.map((f, k) => (
                <div key={k} className={panel} style={panelStyle}>
                  <HeatCanvas probs={f.grid} train={train} test={test} theme={theme} points={false} label={`Tree ${k + 1} decision regions`} />
                  <div className="px-1.5 py-0.5 font-mono text-[11px]" style={{ color: "var(--muted-2)" }}>
                    #{k + 1} · {fmt((100 * f.unique) / train.length, 0)}% rows
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="Number of trees, T"
            value={trees}
            min={1}
            max={MAX_T}
            step={1}
            onChange={setTrees}
            display={`${trees}`}
          />
          <Slider
            label="Maximum depth of every tree"
            value={depth}
            min={1}
            max={12}
            step={1}
            onChange={setDepth}
            display={`${depth}`}
            hint="Deep trees overfit on their own; the forest is built from them on purpose."
          />
          <Choice<OnOff>
            label="Bootstrap rows (N draws with replacement)"
            value={boot}
            onChange={setBoot}
            options={[
              { value: "on", label: "on" },
              { value: "off", label: "off — every tree sees all rows" },
            ]}
          />
          <Choice<OnOff>
            label="Feature randomness (1 random feature per split)"
            value={feats}
            onChange={setFeats}
            options={[
              { value: "on", label: "on" },
              { value: "off", label: "off — search both features" },
            ]}
          />
          <LabButton onClick={() => setSeed((s) => s + 1)}>Re-sample the trees</LabButton>
        </>
      }
      readout={
        <Readout
          items={[
            { label: "Tree #1 · train acc", value: pct(stats.treeTrain) },
            { label: "Tree #1 · test acc", value: pct(stats.treeTest), tone: "warn" },
            { label: "Forest · train acc", value: pct(stats.forestTrain) },
            {
              label: "Forest · test acc",
              value: `${pct(stats.forestTest)}${Math.abs(lift) > 1e-9 ? ` (${lift > 0 ? "+" : "−"}${fmt(Math.abs(lift) * 100, 1)})` : ""}`,
              tone: "good",
            },
            {
              label: "Out-of-bag accuracy",
              value: boot === "on" ? `${pct(stats.oob.acc)} (${stats.oob.covered} rows)` : "— needs bootstrap",
              tone: "accent",
            },
            { label: "Unique rows per sample", value: pct(stats.uniq) },
          ]}
        />
      }
    />
  );
}
