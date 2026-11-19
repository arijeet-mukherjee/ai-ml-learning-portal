import path from "node:path";
import type { NextConfig } from "next";

/**
 * GitHub Pages serves this project from a sub-path, so every asset and data URL
 * has to be prefixed. Keep the sub-path in ONE place: this constant, and the
 * NEXT_PUBLIC_BASE_PATH env var it feeds (see src/lib/basePath.ts).
 *
 * Change GH_PAGES_BASE to match the repository the site is published from.
 */
const GH_PAGES_BASE = "/ml-learning-portal";
const isGHPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGHPages ? GH_PAGES_BASE : "",
  assetPrefix: isGHPages ? `${GH_PAGES_BASE}/` : undefined,
  // GitHub Pages has no rewrite layer, so emit /learn/foo/index.html instead of
  // /learn/foo.html — otherwise nested routes 404 on a hard refresh.
  trailingSlash: true,
  // next/image's default loader needs a server; a static export has none.
  images: { unoptimized: true },
  // A stray package-lock.json in the home directory makes Turbopack guess the wrong
  // workspace root, which breaks asset resolution. Pin it to this project.
  turbopack: { root: path.resolve(process.cwd()) },
  env: {
    NEXT_PUBLIC_BASE_PATH: isGHPages ? GH_PAGES_BASE : "",
  },
};

export default nextConfig;
