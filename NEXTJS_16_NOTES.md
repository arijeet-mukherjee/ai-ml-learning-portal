# Next.js 16 notes for this project

Read from `node_modules/next/dist/docs/01-app/` (`02-guides/static-exports.md`,
`02-guides/upgrading/version-16.md`, `03-api-reference/04-functions/generate-static-params.md`)
before any framework code was written. What actually affects this build:

1. **`params` is a Promise.** Synchronous access was removed in 16. Every dynamic page
   awaits it: `export default async function Page({ params }: { params: Promise<{ slug: string }> })`.
   The generated `PageProps<'/learn/[slug]'>` helper is also available via `next typegen`.
2. **Dynamic routes need `generateStaticParams`.** Under `output: "export"` a dynamic
   route without it is a build error — `/learn/[slug]` and `/modules/[id]` both provide one.
3. **No server features.** Route handlers, cookies, headers, rewrites, redirects, headers
   config, ISR, Server Actions and middleware/proxy are all unavailable. Everything
   interactive in this portal is a client component; all data is static JSON/CSV.
4. **`next/image` default loader needs a server** → `images: { unoptimized: true }`.
5. **Turbopack is the default bundler in 16** for both `dev` and `build`. No opt-out
   flags are used here.
6. **`scroll-behavior: smooth` is no longer overridden during navigation.** Since
   `globals.css` sets smooth scrolling for in-page anchor jumps, the root `<html>` carries
   `data-scroll-behavior="smooth"` so route changes still jump instantly to the top.
7. **ESLint flat config is the default** (`eslint.config.mjs`); `next lint` was removed, so
   the `lint` script calls `eslint` directly.
8. **`trailingSlash: true`** is set so the export emits `learn/<slug>/index.html`. GitHub
   Pages has no rewrite layer, and without it a hard refresh of a nested route 404s.
