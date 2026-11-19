/**
 * Builds public/search-index.json from the typed content in src/content.
 *
 * The index is GENERATED, never hand-written, so it cannot drift from the
 * chapters. Chapter files import only `import type { Chapter }` from "@/types",
 * and type-only imports are erased, so transpiling src/content on its own gives
 * a self-contained CommonJS tree we can require directly.
 *
 * Run by `npm run build:index`, which `prebuild` and `predeploy` both call.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = resolve(root, ".search-build");
const outFile = resolve(root, "public/search-index.json");

rmSync(buildDir, { recursive: true, force: true });

execFileSync(
  process.execPath,
  [
    resolve(root, "node_modules/typescript/bin/tsc"),
    "--project",
    resolve(root, "scripts/tsconfig.search.json"),
  ],
  { stdio: "inherit", cwd: root },
);

const require = createRequire(import.meta.url);
const { modules } = require(resolve(buildDir, "content/modules.js"));

/** Strip the inline markup content blocks carry so the index holds plain text. */
const text = (html) =>
  String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/** Everything searchable inside one block, flattened. */
function blockText(b) {
  switch (b.type) {
    case "prose":
    case "trap":
    case "world":
    case "genai":
    case "fix":
    case "gradedDetail":
      return text(b.html);
    case "heading":
    case "bigIdea":
      return text(b.content);
    case "formula":
      return `${b.title ?? ""} ${b.lines}`;
    case "memoryHook":
      return `${text(b.content)} ${text(b.detail)}`;
    case "citation":
      return `${b.source} ${text(b.detail)}`;
    case "table":
    case "result":
      return [...b.headers, ...b.rows.flat(), b.caption ?? ""].map(text).join(" ");
    case "list":
      return b.items.map(text).join(" ");
    case "code":
      return `${b.code.title ?? ""} ${b.code.code} ${b.code.caption ?? ""}`;
    case "widget":
      return `interactive lab ${b.lab} ${b.caption ?? ""}`;
    case "datasetPreview":
      return `dataset ${b.dataset}`;
    case "vivaQuestions":
      return b.items.map((i) => `${text(i.q)} ${text(i.a)}`).join(" ");
    case "deepDive":
      return `${b.summary} ${b.blocks.map(blockText).join(" ")}`;
    default:
      return "";
  }
}

/** What kind of thing a section is, so results can be grouped and badged. */
function kindsIn(blocks) {
  const kinds = new Set();
  for (const b of blocks) {
    if (b.type === "widget") kinds.add("lab");
    if (b.type === "formula") kinds.add("formula");
    if (b.type === "code") kinds.add("code");
    if (b.type === "memoryHook") kinds.add("hook");
    if (b.type === "gradedDetail") kinds.add("graded");
    if (b.type === "datasetPreview") kinds.add("dataset");
    if (b.type === "deepDive") for (const k of kindsIn(b.blocks)) kinds.add(k);
  }
  return kinds;
}

const docs = [];
for (const m of modules) {
  for (const c of m.chapters) {
    for (const s of c.sections) {
      docs.push({
        id: `${c.slug}#${s.id}`,
        chapterSlug: c.slug,
        chapterTitle: c.title,
        sectionId: s.id,
        sectionTitle: s.title,
        sectionKind: s.kind,
        moduleId: m.id,
        moduleTitle: m.title,
        moduleNumber: m.number,
        kinds: [...kindsIn(s.blocks)],
        text: s.blocks.map(blockText).filter(Boolean).join(" "),
      });
    }
  }
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), docs }));
rmSync(buildDir, { recursive: true, force: true });

const words = docs.reduce((a, d) => a + d.text.split(" ").length, 0);
console.log(
  `search index: ${docs.length} sections across ${modules.filter((m) => m.chapters.length).length} populated modules, ~${words.toLocaleString()} words → public/search-index.json`,
);
