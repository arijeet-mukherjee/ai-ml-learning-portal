/** Shared maths for the labs. Kept framework-free so it can be unit-reasoned about. */

export const mean = (xs: number[]): number =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/** Sample standard deviation (ddof = 1), matching pandas' `.std()`. */
export function std(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

/** Linear-interpolation quantile, matching numpy's default. */
export function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function median(xs: number[]): number {
  return quantile([...xs].sort((a, b) => a - b), 0.5);
}

/** Φ(z) — standard normal CDF, Abramowitz & Stegun 7.1.26 via erf. */
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

export function normalPdf(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

/** Shannon entropy in bits. `counts` need not be normalised. */
export function entropyBits(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return -counts.reduce((acc, c) => {
    if (c <= 0) return acc;
    const p = c / total;
    return acc + p * Math.log2(p);
  }, 0);
}

/** Natural-log entropy — the base the lecture slides use. */
export function entropyNats(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return -counts.reduce((acc, c) => {
    if (c <= 0) return acc;
    const p = c / total;
    return acc + p * Math.log(p);
  }, 0);
}

/** Gini impurity: the chance a random guess drawn from the node's own mix is wrong. */
export function gini(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return 1 - counts.reduce((acc, c) => acc + (c / total) ** 2, 0);
}

export const dot = (a: number[], b: number[]): number =>
  a.reduce((acc, v, i) => acc + v * b[i], 0);

export const norm2 = (a: number[]): number => Math.sqrt(dot(a, a));
export const norm1 = (a: number[]): number =>
  a.reduce((acc, v) => acc + Math.abs(v), 0);

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

/** Round for display without trailing noise: fmt(0.1 + 0.2, 2) === "0.30". */
export const fmt = (v: number, dp = 2): string =>
  Number.isFinite(v) ? v.toFixed(dp) : "—";

/**
 * Solve a small linear system by Gauss–Jordan with partial pivoting.
 * Used by the polynomial/Ridge lab to fit (XᵀX + λI)w = Xᵀy directly.
 */
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    }
    if (Math.abs(M[piv][col]) < 1e-12) continue;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}
