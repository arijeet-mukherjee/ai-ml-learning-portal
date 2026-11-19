import type { Chapter } from "@/types/content";

export const pandasTables: Chapter = {
  slug: "pandas-tables",
  title: "Pandas: tables with labels",
  description:
    "The five calls to run on every new file, loc versus iloc, boolean masks, missing values, and groupby as split–apply–combine.",
  icon: "▤",
  order: 2,
  moduleId: "m0",
  estimatedMinutes: 22,
  prerequisites: ["numpy-arrays"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m0-pandas",
    "DAY_1/Python_Tool_Proficiency_Notebook.ipynb",
    "DAY_1/employee_dataset.csv",
  ],
  islpChapters: ["Ch 2"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why labels change everything",
      blocks: [
        {
          type: "prose",
          html: "A DataFrame is a NumPy grid with row labels and column names attached. Same maths, but the labels travel with the data.<br><br>That sounds like a convenience. It is actually the difference between code you can read in six months and code you cannot. Compare <code>X[:, 4]</code> with <code>df[\"salary\"]</code>. Both fetch the same numbers. Only one of them survives a colleague inserting a column.",
        },
        {
          type: "world",
          html: "Every data role runs on this. \"Average salary per department\", \"tickets closed per agent\", \"revenue per region\" — every dashboard KPI you have ever seen is a <code>groupby</code> plus an aggregation underneath, and somebody wrote it in about four lines.",
        },
        {
          type: "prose",
          html: "There is a second, quieter reason. Real data is <i>dirty</i>. It has gaps, wrong types, duplicates and surprises. NumPy will happily compute a mean over a column of strings-pretending-to-be-numbers and give you nonsense. Pandas gives you the tools to find out <i>before</i> you model anything — which is the entire job of the first hour on any dataset.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        { type: "heading", level: 3, content: "The first five calls on any dataset" },
        {
          type: "table",
          headers: ["Call", "Answers"],
          rows: [
            ["<code>df.head()</code> / <code>df.tail()</code>", "What do the rows look like?"],
            ["<code>df.shape</code>", "How many rows and columns? (no brackets — it's an attribute)"],
            [
              "<code>df.dtypes</code>",
              "Is every column the type I expect? (numbers stored as text is a classic)",
            ],
            [
              "<code>df.describe()</code>",
              "count, mean, std, min, quartiles, max for numeric columns",
            ],
            [
              "<code>df.info()</code>",
              "types + non-null counts + memory: spots missing values fast",
            ],
          ],
        },
        {
          type: "memoryHook",
          content: '"Hey, Show Data In Detail"',
          detail:
            "head → shape → dtypes → info → describe. Run them in this order on every new file. The order matters: you want to see the rows before you trust any summary of them.",
        },
        {
          type: "prose",
          html: "Why this order, concretely. <code>head()</code> tells you whether the file even parsed — a shifted header or a stray index column shows up immediately. <code>shape</code> tells you whether you loaded all of it. <code>dtypes</code> catches the number-stored-as-text problem while it is still cheap to fix. <code>info()</code> then shows non-null counts, which is where missing values first become visible. Only then does <code>describe()</code> mean anything, because by that point you know what it is describing.",
        },
        { type: "heading", level: 3, content: "Selecting rows and columns" },
        {
          type: "code",
          code: {
            language: "python",
            title: "selection",
            code: `import pandas as pd
df = pd.read_csv("employee_dataset.csv")

df["department"]                         # one column -> Series
df[["department", "salary"]]             # several columns -> DataFrame

df.loc[0:4, ["department", "salary"]]    # by LABEL, end included (5 rows)
df.iloc[0:5, 1:4]                        # by POSITION, end excluded

df[df["salary"] > 90000]                 # boolean mask
df[(df["department"] == "Sales") & (df["salary"] > 60000)]
df[~df["remote"].eq("Yes")]              # ~ means NOT
df.query("department == 'Sales' and salary > 60000")   # same, readable`,
          },
        },
        {
          type: "prose",
          html: "Two details in there are worth slowing down for.<br><br><b>One bracket or two.</b> <code>df[\"salary\"]</code> gives a Series (1D); <code>df[[\"salary\"]]</code> gives a DataFrame (2D). This looks like trivia until Module 3, where scikit-learn demands <code>X</code> as 2D <code>(n_samples, n_features)</code> and <code>y</code> as 1D <code>(n_samples,)</code>. The double bracket is how you produce the 2D one. It is the single most common beginner error in the whole course.<br><br><b>Masks are arrays, not conditions.</b> <code>df[\"salary\"] > 90000</code> evaluates to a Series of True/False, one per row. Putting that inside <code>df[...]</code> keeps the True rows. Nothing clever is happening — you are indexing with a boolean array, exactly as in NumPy.",
        },
        {
          type: "memoryHook",
          content: "loc = Labels. iloc = Integer location.",
          detail:
            "loc slices include the end label (0:4 gives 5 rows). iloc slices exclude the end, like normal Python. On a default index the two look identical, which is exactly why the difference catches people out later.",
        },
        {
          type: "trap",
          html: "Combine conditions with <code>&</code>, <code>|</code>, <code>~</code> and wrap <b>each</b> condition in brackets. Python's <code>and</code>/<code>or</code> raise <i>\"truth value of a Series is ambiguous\"</i> — they want a single True or False, and you handed them 240 of them.",
        },
        { type: "heading", level: 3, content: "Missing values" },
        {
          type: "code",
          code: {
            language: "python",
            title: "finding and filling gaps",
            code: `df.isna().sum()                     # missing count per column
df.isna().mean().round(3) * 100     # missing % per column
df.dropna()                         # drop rows with ANY missing value
df.dropna(subset=["salary"])        # only rows missing salary
df = df.fillna({
    "salary": df["salary"].median(),                     # skewed -> median
    "performance_score": df["performance_score"].mean()  # symmetric -> mean
})`,
          },
        },
        {
          type: "prose",
          html: "Which strategy to pick: drop rows when very few are missing and they look random; fill with the <b>median</b> for skewed numbers (salary), the <b>mean</b> for symmetric ones, and the <b>mode</b> for categories.",
        },
        {
          type: "trap",
          html: "From Week 1 onward, compute those fill values on the <b>training split only</b>. A median is a statistic; if you compute it over all the rows, your test rows have influenced how the training rows were cleaned. That is leakage, and it quietly inflates every score you report afterwards. This becomes a graded point in Module 3.",
        },
        { type: "heading", level: 3, content: "Group, sort, count" },
        {
          type: "code",
          code: {
            language: "python",
            title: "split, apply, combine",
            code: `df.groupby("department")["salary"].mean()

df.groupby("department").agg(
    avg_salary=("salary", "mean"),
    headcount=("employee_id", "count"),
    max_exp=("years_experience", "max"),
).sort_values("avg_salary", ascending=False)

df.sort_values("salary", ascending=False).head(10)
df["department"].value_counts()                  # counts
df["department"].value_counts(normalize=True)    # proportions`,
            caption:
              "The named-aggregation form in the middle is the one worth memorising: it produces readable column names instead of a MultiIndex you then have to flatten.",
          },
        },
        {
          type: "memoryHook",
          content:
            "groupby is a laundry SAC: Split the clothes by colour, Apply the wash, Combine them back in the basket.",
          detail:
            "Split–Apply–Combine is the actual name of the pattern, and it is the same idea as SQL's GROUP BY and a spreadsheet pivot table.",
        },
      ],
    },
    {
      id: "live",
      kind: "live",
      title: "Live: gaps and fences on the real column",
      blocks: [
        {
          type: "prose",
          html: "Before filling a gap you have to know the shape of the column you are filling it in. Salary in this dataset is right-skewed with a long upper tail, which is exactly the case where the mean and the median disagree — and the case where the median is the honest choice.",
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
            "<b>SettingWithCopyWarning.</b> You sliced a DataFrame and then assigned into the slice. Pandas cannot tell whether you meant to edit the original. Fix it by slicing with <code>.loc</code> in one statement, or by taking an explicit <code>.copy()</code> first — the same view-versus-copy issue as NumPy slices.",
            "<b>Numbers stored as text.</b> <code>df.dtypes</code> says <code>object</code> where you expected <code>float64</code>. One stray space or currency symbol does it. <code>pd.to_numeric(col, errors=\"coerce\")</code> converts what it can and turns the rest into NaN, which you can then count.",
            "<b>Chained indexing.</b> <code>df[\"a\"][0] = 5</code> may or may not stick. <code>df.loc[0, \"a\"] = 5</code> always does.",
            "<b>Dropping too much.</b> <code>df.dropna()</code> with no arguments removes a row if <i>any</i> column is missing. On a wide table that can delete most of your data. Always check <code>.shape</code> before and after.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 2",
          detail:
            "ISLP's chapter 2 lab walks the same loading-and-inspecting routine on its own datasets, and its treatment of the index and of boolean selection is worth reading alongside this chapter.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data",
      blocks: [
        { type: "datasetPreview", dataset: "employee" },
        {
          type: "code",
          code: {
            language: "python",
            title: "the first hour on employee_dataset.csv",
            code: `df = pd.read_csv("employee_dataset.csv")

df.shape                # (240, 8)
df.dtypes               # salary is float64 because of the NaNs
df.isna().sum()         # salary and performance_score have gaps

# Fill salary with the median of its own department, not the global median:
# a Sales median and an Engineering median are different numbers.
df["salary"] = df.groupby("department")["salary"].transform(
    lambda s: s.fillna(s.median())
)

df.groupby("department").agg(
    avg_salary=("salary", "mean"),
    headcount=("employee_id", "count"),
).sort_values("avg_salary", ascending=False)`,
            caption:
              "`transform` is the one to know here: it returns a result the same length as the original, so it can be assigned straight back into the column.",
          },
        },
        {
          type: "prose",
          html: "Notice what the per-department fill buys you. The global median ignores that departments pay differently, so filling an Engineering gap with the company-wide median pulls that row towards Support. Grouping first keeps the structure you already know is there.",
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
            "Run the five calls in order on <code>employee_dataset.csv</code>. <b>Success:</b> you can state the shape, name every column whose dtype surprised you, and give the missing count per column from memory.",
            "Select Engineering staff earning above 100k, using a mask and again with <code>.query()</code>. <b>Success:</b> both return the same number of rows.",
            "Count missing values per column, then fill salary with the <b>median per department</b> (the <code>transform</code> above). <b>Success:</b> <code>df.isna().sum()</code> is zero for salary and the departmental means moved only slightly.",
            "Produce mean salary and headcount per department, sorted by mean salary descending. <b>Success:</b> one table, readable column names, no MultiIndex to flatten.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Does remote work relate to satisfaction? Group by <code>remote</code> and compare <code>satisfaction_score</code>. Then ask yourself whether a difference in means is enough to claim anything — you will have the tools to answer that properly in Module 1.",
            "Rebuild your departmental summary with <code>pivot_table</code> instead of <code>groupby().agg()</code> and decide which one you would rather read next year.",
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
            '"Hey, Show Data In Detail" — head, shape, dtypes, info, describe.',
            "loc = Labels (end included). iloc = Integer location (end excluded).",
            "Pandas logic speaks & | ~, and every condition needs its own brackets.",
            "groupby is a laundry SAC: Split, Apply, Combine.",
            "One bracket gives a Series, two give a DataFrame — and sklearn wants the DataFrame.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "<code>df.loc[0:4]</code> and <code>df.iloc[0:4]</code> on a default index return how many rows?",
              a: "Five and four. <code>loc</code> slices by label and includes the end label; <code>iloc</code> slices by position and excludes it, like normal Python.",
            },
            {
              q: "Why does <code>df[df.a > 1 and df.b < 2]</code> fail?",
              a: "Python's <code>and</code> needs a single True or False and was handed a whole Series. Use <code>(df.a > 1) &amp; (df.b &lt; 2)</code>, each condition in its own brackets.",
            },
            {
              q: "Median or mean to fill a missing salary, and why?",
              a: "Median. Salary is right-skewed — a few very high values drag the mean up, so the mean is not representative of a typical row.",
            },
            {
              q: "Why must fill values be computed on the training split only?",
              a: "A median is a statistic learnt from data. Computing it over all rows lets test rows influence how training rows were cleaned, which is data leakage and makes the reported score optimistic.",
            },
          ],
        },
      ],
    },
  ],
};
