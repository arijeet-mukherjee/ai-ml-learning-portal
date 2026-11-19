import type { Chapter } from "@/types/content";

export const describingData: Chapter = {
  slug: "describing-data",
  title: "Where is the middle, and how spread out?",
  description:
    "Mean, median and mode and when each lies; variance and standard deviation; percentiles, the IQR and the 1.5× fence that every course notebook uses.",
  icon: "◉",
  order: 1,
  moduleId: "m1",
  estimatedMinutes: 20,
  prerequisites: ["pandas-tables"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m1-centre, m1-spread",
    "DAY_2/Probability_Statistics_Foundations_Notebook.ipynb",
    "DAY_2/students_survey.csv",
  ],
  islpChapters: ["Ch 2"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why the average can be a lie",
      blocks: [
        {
          type: "bigIdea",
          content:
            "Statistics describes the data you have. Probability reasons about data you haven't seen yet. Every ML model is a mix of the two.",
        },
        {
          type: "world",
          html: "Nine people at a Kolkata tea stall earn ₹30k a month each. A billionaire sits down. The <b>mean</b> income at the stall jumps to crores; the <b>median</b> barely moves. That is why salary reports quote the median.",
        },
        {
          type: "prose",
          html: "This is not a trick question about tea stalls. It is the reason you will be asked, in Module 3, to fill a missing salary with a median rather than a mean, and the reason a single mislabelled sensor reading can wreck a model trained on squared error.<br><br>\"Where is the middle\" and \"how spread out\" are the two questions you answer about every column before you do anything else. Get them wrong and every later decision inherits the error.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        { type: "heading", level: 3, content: "Three kinds of middle" },
        {
          type: "table",
          headers: ["Measure", "What it is", "Outliers?", "Use when"],
          rows: [
            ["Mean", "Sum ÷ count", "Very sensitive", "Symmetric data (heights, exam scores)"],
            [
              "Median",
              "Middle value after sorting",
              "Robust",
              "Skewed data (income, house prices, wait times)",
            ],
            ["Mode", "Most frequent value", "Robust", "Categories (most common department)"],
          ],
        },
        {
          type: "prose",
          html: "Lecture data <code>[4, 8, 15, 16, 23, 42, 8, 8, 15]</code>: mean = 15.4, median = 15, mode = 8. Notice how close mean and median are here — and then notice that 42 is the only thing pulling them apart. Remove it and the mean drops to 11.1 while the median moves to 15 → 15. That asymmetry of response <i>is</i> robustness.",
        },
        {
          type: "memoryHook",
          content:
            "The Mean is mean to outliers. The Median stays in the middle of the road. The Mode is the most popular kid.",
        },
        { type: "heading", level: 3, content: "Two kinds of spread" },
        {
          type: "formula",
          title: "Variance and standard deviation",
          lines: `variance σ² = average of (x − mean)²
std σ = √variance   ← same units as the data`,
        },
        {
          type: "prose",
          html: "Variance squares distances so negatives don't cancel positives. Standard deviation undoes the square so you can say \"salaries vary by about ₹12k\" instead of \"₹144M²\".<br><br>It is worth being precise about why we square rather than taking absolute values. Squaring is differentiable everywhere, which matters enormously from Module 4 onward: mean squared error has a clean gradient, and that gradient is what gradient descent follows. Absolute error does not, at zero. The choice of square is partly about outliers and largely about calculus.",
        },
        {
          type: "trap",
          html: "<code>np.std(x)</code> divides by n (population). <code>df[\"col\"].std()</code> divides by n − 1 (sample). On small data they differ noticeably. Use <code>np.std(x, ddof=1)</code> to match Pandas. If your NumPy and Pandas standard deviations disagree, this is always why.",
        },
        { type: "heading", level: 3, content: "Percentiles, IQR and the outlier fence" },
        {
          type: "prose",
          html: "The p-th percentile has p% of values below it. Q1 = 25th, Q3 = 75th. <span class=\"mark\">IQR = Q3 − Q1</span> is the spread of the middle half, and unlike the range it ignores extreme values entirely — which is exactly what you want when the extremes are what you are trying to find.",
        },
        {
          type: "formula",
          title: "IQR outlier rule (used in every course notebook)",
          lines: `lower fence = Q1 − 1.5 × IQR
upper fence = Q3 + 1.5 × IQR
anything outside a fence → flag as an outlier`,
        },
        {
          type: "memoryHook",
          content: '"One and a half boxes out, and you\'re out."',
          detail:
            "The box in a box plot is the IQR. Step 1.5 box-lengths beyond either edge: that's the fence.",
        },
        {
          type: "prose",
          html: "Where does 1.5 come from? It is a convention, not a theorem. For normally distributed data the fences sit at roughly ±2.7σ, so about 0.7% of genuine values fall outside them. Tukey picked it because it flags few enough points to be worth looking at and enough to be useful. Knowing it is a convention is the point: it means the number of \"outliers\" in your data is partly a choice you made.",
        },
        { type: "widget", lab: "iqr" },
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
            "<b>Quoting a mean on skewed data.</b> If mean and median disagree by much, say which one you are using and why. A mean salary that no employee earns is not a useful summary.",
            "<b>Comparing standard deviations across units.</b> ₹12k of salary spread and 12 marks of exam spread are not comparable. Divide by the mean to get a coefficient of variation, or standardise.",
            "<b>Treating the fence as truth.</b> The fence flags candidates for inspection, not errors. In fraud detection the flagged points are the entire product.",
            "<b>Population versus sample std.</b> The ddof trap above — it will also explain a mismatch between your answer and the solution notebook.",
          ],
        },
        {
          type: "trap",
          html: "Don't delete flagged points on reflex. First ask whether it is an <i>error</i> in the raw data (a typo, a broken sensor — fix or drop) or a <i>rare-but-real</i> event (keep, and sometimes it is the whole point). Module 3 makes this a formal step in the pipeline.",
        },
        {
          type: "citation",
          source: "ISLP Ch 2",
          detail:
            "ISLP chapter 2 sets up exactly this vocabulary before any model appears, and its treatment of variance as the thing bias–variance decomposition is built from is worth reading before Module 5.",
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
          type: "code",
          code: {
            language: "python",
            title: "the lecture's own numbers, then the real survey",
            code: `import numpy as np, pandas as pd
from scipy import stats

data = np.array([4, 8, 15, 16, 23, 42, 8, 8, 15])
np.mean(data), np.median(data), stats.mode(data, keepdims=False).mode
np.var(data), np.std(data), np.std(data, ddof=1)     # population vs sample

q1, q3 = np.percentile(data, [25, 75])
iqr = q3 - q1
lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
outliers = data[(data < lower) | (data > upper)]     # -> [42]

df = pd.read_csv("students_survey.csv")
df[["study_hours_per_week", "exam_score"]].describe()`,
            caption:
              "On the lecture array the fence flags exactly one value, 42 — the same number that was dragging the mean up. That is the fence doing its job.",
          },
        },
        {
          type: "prose",
          html: "Run <code>.describe()</code> on the survey and read the gap between <code>mean</code> and <code>50%</code> for each column. Where they are close, the column is roughly symmetric and a mean is honest. Where they diverge, you have found skew without drawing anything.",
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
            "Compute mean, median, std and IQR for every numeric column in <code>students_survey.csv</code>. <b>Success:</b> one tidy table, and you can name the most skewed column from the mean-versus-median gap alone.",
            "Reproduce the lecture array's outlier detection by hand: percentiles, IQR, both fences, the flagged values. <b>Success:</b> you get <code>[42]</code> and your numbers match <code>np.percentile</code>.",
            "For <code>exam_score</code>, count how many points the 1.5 fence flags and how many the 3.0 fence flags. <b>Success:</b> you can say which you would use for a grading appeal and which for a data-quality check.",
            "Show the ddof trap: print <code>np.std(x)</code> and <code>df['x'].std()</code> for a 9-element column. <b>Success:</b> you can state the ratio between them before running it.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Add one extreme value to <code>exam_score</code> and watch what happens to mean, median, std and IQR. Rank the four by how much they moved — that ranking is what \"robust\" means.",
            "Write your own <code>quantile(sorted, q)</code> with linear interpolation and check it against <code>np.percentile</code> on several columns.",
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
            "The Mean is mean to outliers. The Median stays in the middle of the road.",
            "Variance squares so negatives don't cancel; std un-squares so the units make sense.",
            "One and a half boxes out, and you're out.",
            "np.std divides by n, pandas .std() divides by n − 1.",
            "1.5 is a convention, so the outlier count is partly your choice.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Mean or median for a typical income, and why?",
              a: "Median. Income is right-skewed; a few very large values drag the mean up, so the mean describes nobody.",
            },
            {
              q: "Why does variance square the deviations?",
              a: "So negative and positive deviations do not cancel — and, more importantly for later, because the squared loss is differentiable everywhere, which is what gradient descent needs.",
            },
            {
              q: "Where do the IQR fences sit, and is 1.5 principled?",
              a: "Q1 − 1.5·IQR and Q3 + 1.5·IQR. The 1.5 is a convention, not a theorem; for normal data it corresponds to roughly ±2.7σ, flagging about 0.7% of genuine values.",
            },
            {
              q: "<code>np.std(x)</code> and <code>df['x'].std()</code> disagree. Why?",
              a: "Different denominators: NumPy uses n (population) and pandas uses n − 1 (sample). Pass <code>ddof=1</code> to NumPy to match.",
            },
          ],
        },
      ],
    },
  ],
};
