/**
 * GitHub Pages serves the site from a sub-path. `next.config.ts` sets `basePath` for
 * routes and `assetPrefix` for bundled assets, but anything we fetch ourselves
 * (CSV files, the search index) needs the prefix applied by hand.
 *
 * Always build those URLs with `asset()` — a hard-coded "/data/x.csv" 404s on Pages.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${clean}`;
}
