import type { Chapter } from "@/types/content";

export const correlation: Chapter = {
  slug: "correlation",
  title: "Correlation, read honestly",
  description:
    "Pearson versus Spearman, what r = 0 does and does not mean, confounders, and the heatmap you will draw on every dataset.",
  icon: "⤢",
  order: 4,
  moduleId: "m1",
  estimatedMinutes: 16,
  prerequisites: ["describing-data"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m1-corr, m1-practice",
    "DAY_2/Probability_Statistics_Foundations_Notebook.ipynb",
  ],
  islpChapters: ["Ch 3"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why r is the most over-read number in statistics",
      blocks: [
        {
          type: "prose",
          html: "Correlation is the number people quote when they want to sound quantitative, and it is the number most often quoted wrongly. It measures one specific thing — how well a <i>straight line</i> describes the relation between two columns — and says nothing at all about cause, about curves, or about whether the relationship holds outside the range you measured.<br><br>You will still draw a correlation heatmap on every dataset in this course, because it is the fastest way to find the pairs worth looking at. The discipline is in what you do next: look at the scatter plot before you believe the number.",
        },
        {
          type: "world",
          html: "In Module 3's pipeline you will drop features whose absolute correlation exceeds 0.9, because two columns saying the same thing give a linear model two ways to express one idea and make its coefficients unstable. That is correlation used correctly: as a redundancy detector, not a causality detector.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "table",
          headers: ["", "Pearson r", "Spearman ρ"],
          rows: [
            ["Measures", "Straight-line relationship", "Monotonic (always up or always down) relationship"],
            ["Computed on", "Raw values", "Ranks of the values"],
            ["Outliers", "Sensitive", "Robust"],
            ["Pandas", "<code>.corr()</code> (default)", '<code>.corr(method="spearman")</code>'],
          ],
        },
        {
          type: "formula",
          title: "Pearson, written out",
          lines: `r = Σ(xᵢ − x̄)(yᵢ − ȳ) / √[ Σ(xᵢ − x̄)² · Σ(yᵢ − ȳ)² ]
  = covariance(x, y) / (σₓ · σᵧ)
range −1 … +1`,
        },
        {
          type: "prose",
          html: "The numerator is the covariance you met in the spread chapter: it is large and positive when x and y are above their means together. The denominator divides out both columns' own spread, which is what makes r unitless and comparable across pairs. Correlation is covariance with the units cancelled.",
        },
        {
          type: "memoryHook",
          content:
            "Pearson is a perfectionist about straight lines. Spearman only checks that the staircase keeps going up.",
        },
        {
          type: "prose",
          html: "Range is −1 to +1. +1 perfect rise together, −1 one rises as the other falls, 0 no <i>linear</i> relation (a perfect U-shape can still have r ≈ 0). That parenthetical is the whole lesson: r = 0 means \"no straight line fits\", not \"no relationship\".",
        },
        {
          type: "prose",
          html: "When to reach for Spearman: when the relation is clearly monotonic but bent (diminishing returns — study hours against marks flattens out at the top), when either column is ordinal rather than interval (a 1–10 confidence rating is a rank, not a measurement), or when a couple of extreme values are dominating Pearson.",
        },
        {
          type: "trap",
          html: "Correlation never tells you why. Ice-cream sales and drownings both rise in summer: heat is the hidden <b>confounder</b>. Attendance and exam score correlate, but motivation may drive both.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "both coefficients, then the heatmap",
            code: `r   = df["study_hours_per_week"].corr(df["exam_score"])                  # Pearson
rho = df["exam_score"].corr(df["confidence_rating"], method="spearman")  # Spearman

num = df.select_dtypes("number").drop(columns="student_id")
sns.heatmap(num.corr(), annot=True, cmap="coolwarm", vmin=-1, vmax=1); plt.show()`,
            caption:
              "Dropping student_id matters: an ID is a number but not a measurement, and leaving it in puts a meaningless row and column in every heatmap you draw.",
          },
        },
      ],
    },
    {
      id: "live",
      kind: "live",
      title: "Live: correlation as an angle",
      blocks: [
        {
          type: "prose",
          html: "There is a geometric reading of Pearson worth having: once both columns are centred, r <i>is</i> the cosine of the angle between them as vectors. Perfectly aligned → cos = 1. Perpendicular → cos = 0 → uncorrelated. Opposed → −1. Module 2 builds this properly, but the lab is here because seeing it once makes r stop feeling arbitrary.",
        },
        { type: "widget", lab: "vectors" },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "When it goes wrong",
      blocks: [
        {
          type: "list",
          items: [
            "<b>Reading causation into it.</b> The classic. Always ask what third thing could drive both.",
            "<b>Trusting r on a curve.</b> A strong U-shape gives r ≈ 0. Plot it.",
            "<b>Trusting r with outliers.</b> One extreme pair can create or destroy a correlation on its own. Compare against Spearman as a cheap robustness check — a big gap between them means something is dragging Pearson.",
            "<b>Restriction of range.</b> Correlating height and basketball ability among professional players gives nearly zero, because everybody is tall. The relationship is real; your sample removed it.",
            "<b>Correlating an ID or an index.</b> Meaningless, and it clutters the heatmap.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 3",
          detail:
            "ISLP chapter 3 covers multicollinearity properly — what happens to a regression's coefficients and standard errors when two predictors are strongly correlated. That is the theory behind the |r| > 0.9 feature-dropping rule you will apply in Module 3.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data",
      blocks: [
        { type: "datasetPreview", dataset: "students" },
        {
          type: "prose",
          html: "The survey's interesting pair is <code>confidence_rating</code> against <code>exam_score</code>. Confidence is a 1–10 self-rating — an ordinal scale with no guarantee that the gap from 7 to 8 equals the gap from 2 to 3. That is precisely the case Spearman was built for, and comparing the two coefficients on this pair is the practice task the professor set.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "Pearson vs Spearman, side by side",
            code: `pairs = [("study_hours_per_week", "exam_score"),
         ("confidence_rating", "exam_score"),
         ("attendance_pct", "exam_score"),
         ("sleep_hours_per_night", "exam_score")]

for a, b in pairs:
    r   = df[a].corr(df[b])
    rho = df[a].corr(df[b], method="spearman")
    print(f"{a:24s} r={r:+.3f}  rho={rho:+.3f}  gap={abs(r - rho):.3f}")`,
            caption:
              "Sort by that last column. The pair with the biggest gap is the one where Pearson is being pulled by outliers or by a bend, and the one whose scatter plot you should open first.",
          },
        },
      ],
    },
    {
      id: "practice",
      kind: "practice",
      title: "Practice",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            "Draw the full correlation heatmap for the survey, with <code>student_id</code> dropped and the scale pinned to −1…+1. <b>Success:</b> you can name the strongest positive pair and the strongest negative pair.",
            "Compute Pearson and Spearman for <code>confidence_rating</code> against <code>exam_score</code>. <b>Success:</b> you can argue which one to report, in one sentence, and it mentions the word <i>ordinal</i>.",
            "Pick the pair with the largest Pearson–Spearman gap and plot it. <b>Success:</b> you can point at what is causing the gap.",
            "For the strongest correlated pair, write down one plausible confounder. <b>Success:</b> your confounder is a third variable, not a restatement of either column.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Construct a column with r ≈ 0 against <code>exam_score</code> that is nonetheless perfectly predictable from it (hint: a U-shape). Then show Spearman is also near zero, and say why neither coefficient caught it.",
            "Add one extreme outlier to the survey and recompute every Pearson coefficient. Rank the pairs by how far they moved — that is your sensitivity audit.",
          ],
        },
      ],
    },
    {
      id: "recap",
      kind: "recap",
      title: "Recap",
      blocks: [
        {
          type: "list",
          items: [
            "Pearson is a perfectionist about straight lines. Spearman only checks the staircase keeps going up.",
            "Correlation is covariance with the units cancelled — and, geometrically, the cosine between two centred columns.",
            "r = 0 means no straight line fits, not no relationship.",
            "A large Pearson–Spearman gap is a cheap outlier or curvature detector.",
            "Always pin the heatmap to vmin=−1, vmax=+1, and drop the ID columns first.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "A dataset has r ≈ 0 between two columns. Can they still be related?",
              a: "Yes. r measures linear association only; a perfect U-shape or any symmetric non-monotonic relation gives r near zero.",
            },
            {
              q: "When would you report Spearman instead of Pearson?",
              a: "When the relation is monotonic but bent, when a column is ordinal rather than interval (a 1–10 rating), or when a few extreme values are dominating Pearson.",
            },
            {
              q: "Ice-cream sales correlate with drownings. What is going on?",
              a: "A confounder — heat drives both. Correlation never identifies the direction or the existence of a causal path.",
            },
            {
              q: "Why drop features with |r| > 0.9 before fitting a linear model?",
              a: "Multicollinearity: two columns carrying the same information give the model two ways to express one effect, which makes the individual coefficients unstable and uninterpretable.",
            },
          ],
        },
      ],
    },
  ],
};
