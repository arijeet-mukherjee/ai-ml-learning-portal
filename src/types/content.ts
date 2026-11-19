/**
 * The content model for the portal.
 *
 * Content is DATA, never JSX. A chapter is a typed object; `ContentRenderer` is the
 * only thing that knows how to draw a block. That separation is what lets a new module
 * be added by dropping one file in `src/content/chapters/` — see ADDING_NEW_MODULES.md.
 *
 * Block types mirror the markup conventions in the professor's own notebook
 * (bigidea / note+Memory hook / trap / world / genai / fix), so his material can be
 * carried across without flattening it into anonymous paragraphs.
 */

/** The six-part pedagogy arc every chapter follows, plus the closing recap. */
export type SectionKind =
  | "why"
  | "how"
  | "when"
  | "live"
  | "real"
  | "practice"
  | "recap";

export type LabId =
  | "axis"
  | "iqr"
  | "normal"
  | "bayes"
  | "vectors"
  | "pca"
  | "threshold"
  | "gd"
  | "poly"
  | "sigmoid"
  | "svm"
  | "kernel"
  | "darts"
  | "entropy"
  | "boot"
  | "derivative"
  | "partial"
  | "nnplay"
  | "backprop"
  | "optimizers"
  | "rbf"
  | "treesplit"
  | "forest"
  | "algoatlas";

export type DatasetId =
  | "employee"
  | "students"
  | "cancer"
  | "camera"
  | "churn";

export interface CodeSpec {
  language: "python" | "text";
  code: string;
  title?: string;
  /** One line under the block saying what to look at. */
  caption?: string;
}

export type ContentBlock =
  /** Prose. `html` carries only inline markup: <b> <i> <code> <a> <br> <small> <sup> <sub>. */
  | { type: "prose"; html: string }
  | { type: "heading"; level: 3 | 4; content: string }
  /** The module or chapter's one-sentence thesis. */
  | { type: "bigIdea"; content: string }
  /** A boxed formula. `lines` is pre-formatted text, rendered monospace. */
  | { type: "formula"; title?: string; lines: string }
  /** A mnemonic. `detail` is the smaller explanatory line under it. */
  | { type: "memoryHook"; content: string; detail?: string }
  /** A mistake that costs marks or silently produces a wrong answer. */
  | { type: "trap"; html: string }
  /** A real-world story that motivates the idea. */
  | { type: "world"; html: string }
  /** How the idea shows up inside Gen AI / agentic systems. */
  | { type: "genai"; html: string }
  /** A correction to the lecture slides, flagged by the professor himself. */
  | { type: "fix"; html: string }
  /** A detail the Assignment-1 rubric explicitly checks. */
  | { type: "gradedDetail"; html: string }
  | { type: "citation"; source: string; detail: string }
  | { type: "table"; headers: string[]; rows: string[][]; caption?: string }
  /** A results table of real, executed numbers. Rendered with emphasis on the figures. */
  | { type: "result"; headers: string[]; rows: string[][]; caption?: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "code"; code: CodeSpec }
  | { type: "widget"; lab: LabId; caption?: string }
  | { type: "datasetPreview"; dataset: DatasetId }
  | { type: "vivaQuestions"; items: { q: string; a: string }[] }
  | { type: "deepDive"; summary: string; blocks: ContentBlock[] };

export interface Section {
  id: string;
  kind: SectionKind;
  title: string;
  blocks: ContentBlock[];
}

export interface Chapter {
  slug: string;
  title: string;
  description: string;
  icon: string;
  /** Position within its module. */
  order: number;
  moduleId: string;
  estimatedMinutes: number;
  /** Slugs of chapters worth reading first. */
  prerequisites: string[];
  /** Which files in SOURCE_NOTES.md this chapter was built from. */
  sourceRefs: string[];
  /** ISLP chapters for further reading, e.g. ["Ch 3", "Ch 6"]. */
  islpChapters: string[];
  sections: Section[];
}

export interface ModuleDefinition {
  id: string;
  /** The professor's own module number: "0"–"7", or "★" for the master map. */
  number: string;
  title: string;
  tagline: string;
  /** Lecture date from the notebook metadata, e.g. "6 Sept". */
  date: string;
  /** Lecturer or session label from the notebook metadata. */
  who: string;
  icon: string;
  /** Drives the module hero animation. */
  motif: Motif;
  chapters: Chapter[];
}

/** Each module gets its own signature animated hero, derived from its subject. */
export type Motif =
  | "grid"
  | "scatter"
  | "axes"
  | "pixels"
  | "descent"
  | "margin"
  | "branch"
  | "map"
  | "network";
