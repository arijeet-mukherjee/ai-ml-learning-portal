# Adding a module or a chapter

This portal is built so new course content is a **content-only change**. You add one
file, register it in one place, and the routes, sidebar, master map, search index,
progress tracking and prev/next navigation all pick it up automatically.

If you find yourself editing a component to add content, stop — something has gone
wrong, or the content needs a new *block type* (see the last section).

---

## TL;DR

1. Create `src/content/chapters/<module>-<nn>-<slug>.ts` exporting a typed `Chapter`.
2. Import it in `src/content/modules.ts` and add it to the right module's `chapters` array.
3. `npm run build:index && npm run build`.

That's it. Nothing else in the codebase changes.

---

## 1. The file to create

**Path:** `src/content/chapters/<moduleId>-<order>-<slug>.ts`
e.g. `m2-05-svd.ts`, `m8-01-neural-networks.ts`.

The numbering in the filename is for humans reading the directory; the `order` field
inside the object is what the UI uses.

### Copy-pasteable skeleton

Every chapter follows the same six-part arc. Keep the section `id`s as they are —
search results, deep links and the arc labels in `ChapterView` all key off them.

```ts
import type { Chapter } from "@/types/content";

export const myChapter: Chapter = {
  slug: "my-chapter",                    // URL: /learn/my-chapter — must be unique
  title: "What this chapter is called",
  description: "One sentence, shown in the sidebar, module page and search.",
  icon: "◈",                             // a single glyph
  order: 1,                              // position within its module
  moduleId: "m2",                        // must match a module id in modules.ts
  estimatedMinutes: 20,
  prerequisites: ["vectors"],            // chapter slugs; rendered as links
  sourceRefs: [                          // which files on disk this came from
    "Module 1 ML Notebook.html § m2-svd",
    "DAY_2/Some_Notebook.ipynb",
  ],
  islpChapters: ["Ch 12"],               // further reading, shown in the header

  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why this matters",
      blocks: [
        { type: "bigIdea", content: "The one-sentence thesis." },
        { type: "prose", html: "Motivation. A real story, a question the reader has, or what breaks without this." },
        { type: "world", html: "Where this shows up outside a classroom." },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        { type: "prose", html: "Math intuition first — what the formula is <i>doing</i>, in words." },
        { type: "formula", title: "The formula", lines: "y = f(x)\nsecond line" },
        { type: "memoryHook", content: "A mnemonic.", detail: "The smaller line under it." },
        { type: "heading", level: 3, content: "Code mechanics" },
        {
          type: "code",
          code: {
            language: "python",
            title: "what this snippet does",
            code: "import numpy as np\n# line by line, explained in the caption",
            caption: "Point at the one line that matters.",
          },
        },
        { type: "widget", lab: "vectors", caption: "Optional one-liner above the lab." },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "When to use it, and what goes wrong",
      blocks: [
        { type: "table", headers: ["Reach for it when", "Avoid when"], rows: [["…", "…"]] },
        { type: "trap", html: "The mistake that costs marks or fails silently." },
        { type: "gradedDetail", html: "Anything the Assignment-1 rubric explicitly checks." },
        { type: "citation", source: "ISLP Ch 12", detail: "What to read there and why." },
      ],
    },
    {
      id: "live",
      kind: "live",
      title: "Live: the thing to play with",
      blocks: [
        { type: "prose", html: "What the reader should notice while fiddling." },
        { type: "widget", lab: "pca" },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data",
      blocks: [
        { type: "datasetPreview", dataset: "cancer" },
        {
          type: "result",
          headers: ["Setting", "Result"],
          rows: [["…", "<b>98.2%</b>"]],
          caption: "Where this number comes from.",
        },
        { type: "code", code: { language: "python", code: "# run it on the course data" } },
      ],
    },
    {
      id: "practice",
      kind: "practice",
      title: "Practice project",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: ["Do X. <b>Success:</b> the criterion that tells you it worked."],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        { type: "list", items: ["Something harder."] },
      ],
    },
    {
      id: "recap",
      kind: "recap",
      title: "Recap",
      blocks: [
        { type: "list", items: ["The memory hooks, one line each."] },
        {
          type: "vivaQuestions",
          items: [{ q: "A likely question?", a: "The answer, with the real number in it." }],
        },
      ],
    },
  ],
};
```

The `live` section is optional when a chapter has no lab, and `how` may carry the lab
inline instead. Everything else should be present.

---

## 2. The one place to register it

`src/content/modules.ts`:

```ts
import { myChapter } from "./chapters/m2-05-svd";   // 1. add the import

// 2. add it to the right module's chapters array, in reading order
{
  id: "m2",
  ...
  chapters: [vectors, dotProduct, normsAndDistance, eigenvectorsAndPca, myChapter],
},
```

### What updates by itself

| Surface | How |
|---|---|
| `/learn/<slug>` route | `generateStaticParams()` reads `getAllChapterSlugs()` |
| Sidebar entry + module progress bar | `Sidebar` maps over `modules` |
| Module page chapter list | `/modules/[id]` maps over `module.chapters` |
| Master map node count and progress ring | `MasterMap` reads `modules` |
| Prev/next links and ← → keyboard nav | `getNeighbours()` walks `allChapters` |
| Search index | `npm run build:index` walks the content tree |
| Home-page counts and reading time | `totalChapters` / `totalMinutes` |
| Progress tracking and "continue where you left off" | keyed by slug, no registration needed |

### Adding a whole new module

Add a `ModuleDefinition` to the `modules` array with a fresh `id` (`m8`, …), a `number`,
`title`, `tagline`, `date`, `who`, `icon` and a `motif`. The motif picks the animated
hero: `grid`, `scatter`, `axes`, `pixels`, `descent`, `margin`, `branch` or `map`.

A module with `chapters: []` renders a placeholder and still appears in the nav, so you
can add the module first and fill it later.

**The master map's node positions are hard-coded** in `src/components/MasterMap.tsx`
(`NODES` and `EDGES`). A ninth module needs a coordinate and its dependency edges added
there. That is the one exception to "content-only" — everything else is automatic.

---

## 3. Adding a lab

1. Write `src/components/labs/<LabName>.tsx` as a client component. Use `LabFrame`,
   `Slider`, `Choice`, `LabButton`, `Readout` and `Stage` from `./LabKit` so it matches
   every other lab.
2. Add its id to the `LabId` union in `src/types/content.ts`.
3. Add its metadata (title, owning module, "how to use it" line) to `LABS` in
   `src/lib/labs.ts`.
4. Add the lazy import to `REGISTRY` in `src/components/LabMount.tsx`, **with
   `ssr: false`** like the others. This is not optional: labs compute SVG
   coordinates through `Math.log` / `Math.exp`, which are not bit-identical
   across JavaScript engines, so server-rendering them produced attribute
   mismatches (`cx="126.31186390453591"` vs `126.3118639045359`) that React
   reported as hydration errors and would not patch up. Client-only rendering
   removes the whole class of problem, and there is nothing to gain from
   prerendering an interactive instrument.
5. Reference it from a chapter with `{ type: "widget", lab: "<id>" }`.

Requirements for a new lab, so the set stays coherent:

- Controls are real inputs, labelled, and operable from the keyboard alone.
- A live `Readout` showing the numbers that change — the point is control → picture → number.
- A "what to notice" line and a working reset.
- Deterministic randomness via `mulberry32` from `src/lib/rng.ts`.
- SVG for geometry, Canvas only when there are hundreds of points.
- Works at 375px wide.
- No `window`/`document` access during render.
- **Verify the numbers.** Check the headline figures against a hand calculation or a
  quick Python run before you ship it.
- Colours come from the tokens in `globals.css`. Every token clears WCAG AA (4.5:1)
  against both `--ink` and `--panel` in both themes; a new one must too.

---

## 4. Adding a dataset

1. Put the CSV in `public/data/`.
2. Add an entry to `DATASETS` in `src/lib/datasets.ts` (file, title, provenance, row
   count, blurb, practice tasks) and extend the `DatasetId` union in
   `src/types/content.ts`.
3. Reference it with `{ type: "datasetPreview", dataset: "<id>" }`, and it appears in the
   `/data` explorer automatically.

Always fetch data with `asset()` from `src/lib/basePath.ts`. A hard-coded `/data/x.csv`
404s on GitHub Pages.

---

## 5. Checklist before you commit

- [ ] Sources read, and listed in `sourceRefs`.
- [ ] Every number traced to a file in `SOURCE_NOTES.md`. **No invented figures.**
- [ ] ISLP chapter cited in `islpChapters` and in a `citation` block.
- [ ] All six sections present, with `id`s `why` / `how` / `when` / `live` / `real` /
      `practice` / `recap`.
- [ ] At least one memory hook and one trap.
- [ ] Viva questions written, with real numbers in the answers.
- [ ] Practice tasks each have a **Success:** criterion.
- [ ] `slug` is unique and URL-safe.
- [ ] `npm run build:index` — the section count went up.
- [ ] `npm run lint` and `npm run build` both clean.
- [ ] Read the page in the browser, in both themes, at 375px.

---

## 6. What must NOT change

Adding content never requires touching any of these. If it seems to, the content model
needs extending instead — see below.

- `src/components/` — `AppShell`, `Header`, `Sidebar`, `ChapterView`, `ContentRenderer`,
  `CodeBlock`, `Callout`, `DeepDive`, `SearchPalette`, `ReadingProgress`, `ModuleHero`.
- `src/app/` — the routing. Routes are generated from the registry.
- `src/app/globals.css` — the design tokens. Use the existing variables; do not add
  one-off colours.
- `src/lib/progress.ts`, `useProgress.ts`, `basePath.ts`, `csv.ts`, `stats.ts`, `rng.ts`.
- `scripts/build-search-index.mjs` — unless you added a block type (next section).

### Adding a new block type

Only when existing blocks genuinely cannot express the content. Three files, in order:

1. `src/types/content.ts` — add the variant to the `ContentBlock` union.
2. `src/components/ContentRenderer.tsx` — add a `case`. The `default` branch has an
   exhaustiveness guard, so TypeScript will fail the build until you do.
3. `scripts/build-search-index.mjs` — add a `case` to `blockText()` so the new content is
   searchable, and to `kindsIn()` if it should badge results.
