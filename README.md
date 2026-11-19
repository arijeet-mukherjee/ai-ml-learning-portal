# IIT Kharagpur ML & AI — Module 1 study portal

A personal, interactive portal for Arijeet's IIT Kharagpur PG Certificate in Machine
Learning & AI. Eight modules from NumPy to random forests, 34 chapters, 15 interactive
labs rebuilt from the course notebook, and the real course datasets underneath.

Every fact and figure traces to a file listed in [`SOURCE_NOTES.md`](SOURCE_NOTES.md).
Nothing here is invented.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build:index` | Regenerates `public/search-index.json` from the content |
| `npm run build` | Static export to `out/` (runs `build:index` first via `prebuild`) |
| `npm run lint` | ESLint |
| `npm run deploy` | Builds with the GitHub Pages base path and publishes `out/` with `gh-pages` |

## What's in it

- **34 chapters** across modules 0–7, each following the same arc: **why** → **how** →
  **when** → **live example** → **real example** → **practice project** → **recap**, closing
  with memory hooks, viva questions and an ISLP citation.
- **15 interactive labs** — axis explorer, IQR outlier hunter, the bell curve, Bayes with
  1,000 people, vector playground, first principal component, decision threshold,
  gradient descent, overfitting with Ridge, logistic regression in 1D, perceptron versus
  SVM, the kernel trick, the bias–variance dartboard, entropy and information gain, and
  bootstrap sampling. All rebuilt as React components with live readouts and seeded
  randomness.
- **The professor's own 42 quiz questions** with his explanations, and 89 flashcards.
- **A dataset explorer** over the five real course CSVs, with per-column statistics,
  missing-value counts and a correlation heatmap computed in the browser.
- **⌘K search** across every section, from a build-generated index.
- **A revision page** with the study guide's cheat sheet, the formula sheet and every viva
  question in one place.

## Where things live

```
src/
  app/                  routes: /, /learn/[slug], /modules/[id], /labs, /data, /quiz, /revision
  components/           AppShell, Sidebar, ChapterView, ContentRenderer, SearchPalette, MasterMap
  components/labs/      the 15 labs, plus LabKit (shared frame and controls)
  content/
    modules.ts          THE REGISTRY — modules and their chapters
    chapters/*.ts       one typed Chapter object per file
    quiz.ts, cards.ts   the professor's questions and flashcards, verbatim
    revision.ts         cheat sheet, formula sheet, viva questions
  lib/                  datasets, labs metadata, CSV loading, stats, seeded RNG, progress
  types/content.ts      the content model
public/data/            the five course CSVs
scripts/                the search-index generator
```

## Adding content

Read [`ADDING_NEW_MODULES.md`](ADDING_NEW_MODULES.md). Adding a chapter is one new file
plus one import and one array entry in `src/content/modules.ts` — routes, navigation,
the master map, search and progress all follow automatically. Content is typed data,
never JSX, and the core components stay untouched.

## Deploying to GitHub Pages

The project is wired but **not yet deployed**. Two things to do:

1. **Check the base path.** `next.config.ts` has `GH_PAGES_BASE = "/ml-learning-portal"`.
   It must match the path the site is served from. If the repository is published at
   `https://<user>.github.io/<repo>/`, set it to `/<repo>`. For an enterprise Pages
   instance the path may look like `/pages/<user>/<repo>` instead.

2. **Publish.** Either push to `main` with GitHub Pages set to *Build and deployment →
   Source: GitHub Actions* (the workflow in `.github/workflows/deploy-pages.yml` takes
   over), or publish the branch by hand:

   ```bash
   npm run deploy
   ```

   which builds with the base path, adds `.nojekyll` and pushes `out/` to `gh-pages`.

The export is checked for base-path correctness: run `GITHUB_ACTIONS=true npx next build`
and every asset, data and route URL in `out/` carries the prefix.

## Notes

- Next.js 16 specifics that affected this build are in [`NEXTJS_16_NOTES.md`](NEXTJS_16_NOTES.md).
- Progress is kept in `localStorage` on each device, and the site renders correctly when
  storage is unavailable. There is a reset button on the home page.
- Dark is the default theme; light is a full theme, and both meet AA contrast for body text.
- `prefers-reduced-motion` is honoured — reveals become instant and the hero loops stop.
