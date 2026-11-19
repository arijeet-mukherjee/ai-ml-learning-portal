import type { Chapter } from "@/types/content";

export const plottingAndEda: Chapter = {
  slug: "plotting-and-eda",
  title: "Plotting: pick the chart by the question",
  description:
    "A lookup table from question to chart, the matplotlib/seaborn split, the axes-versus-pyplot naming trap, and the six-step walkthrough of the Week 0 lab.",
  icon: "◫",
  order: 3,
  moduleId: "m0",
  estimatedMinutes: 20,
  prerequisites: ["pandas-tables"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m0-plots, m0-practice",
    "DAY_1/Python_Tool_Proficiency_Notebook.ipynb",
  ],
  islpChapters: ["Ch 2"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why plot before you model",
      blocks: [
        {
          type: "prose",
          html: "You can summarise a column to four numbers and still have no idea what it looks like. Anscombe's quartet is the famous demonstration: four datasets with identical means, identical variances, identical correlation and identical regression lines, which look nothing like each other once drawn. One is a clean line, one is a curve, one is a line plus a single outlier, one is a vertical stack.<br><br>Every model in this course assumes something about shape. A linear model assumes a straight-line relation. A z-score outlier check assumes a bell. PCA assumes the spread is along straight directions. Plotting is how you check the assumption <i>before</i> you spend an afternoon on a model that was never going to fit.",
        },
        {
          type: "world",
          html: "The practical version of this: you will be asked \"why did the model do badly?\" far more often than \"how does the algorithm work?\". Nine times out of ten the answer is visible in a histogram or a scatter plot you could have drawn in the first ten minutes.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "prose",
          html: "Stop choosing charts by taste. Choose them by the question you are asking, which has exactly one sensible answer each time.",
        },
        {
          type: "table",
          headers: ["Question", "Chart", "Call"],
          rows: [
            [
              "What does one column look like?",
              "Histogram",
              '<code>plt.hist(df.salary.dropna(), bins=20)</code>',
            ],
            [
              "How do two columns move together?",
              "Scatter",
              "<code>plt.scatter(df.years_experience, df.salary)</code>",
            ],
            [
              "How does a number differ across groups?",
              "Box plot",
              '<code>sns.boxplot(data=df, x="department", y="salary")</code>',
            ],
            [
              "How do many columns relate at once?",
              "Heatmap",
              '<code>sns.heatmap(df[num].corr(), annot=True, cmap="coolwarm")</code>',
            ],
            ["Several views side by side?", "Subplots", "<code>fig, axes = plt.subplots(1, 2)</code>"],
          ],
        },
        {
          type: "memoryHook",
          content: "1 column → hist. 2 columns → scatter. Groups → box. Grid of everything → heatmap.",
          detail:
            "Count the columns in your question first. That alone narrows it to one or two options every time.",
        },
        { type: "heading", level: 3, content: "matplotlib or seaborn?" },
        {
          type: "prose",
          html: "They are not competitors. <b>Seaborn is built on matplotlib</b> and knows about DataFrames: you pass <code>data=df, x=\"department\", y=\"salary\"</code> and it handles the grouping, the colours and the legend. Matplotlib is the layer underneath, where you control every element by hand.<br><br>Practical rule: reach for seaborn when the chart involves a <i>category</i> (box plots, bar plots by group, pair plots, heatmaps) and matplotlib when you are drawing raw numbers (histograms, scatters, lines, anything you are building up piece by piece). Then use matplotlib to adjust whatever seaborn produced, because the result is a matplotlib axes either way.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the Week 0 figure",
            code: `import matplotlib.pyplot as plt
import seaborn as sns

fig, axes = plt.subplots(1, 3, figsize=(15, 4))
axes[0].hist(df["salary"].dropna(), bins=20)
axes[0].set_title("Salary distribution")
axes[1].scatter(df["years_experience"], df["salary"], alpha=0.6)
axes[1].set_xlabel("Years of experience"); axes[1].set_ylabel("Salary")
sns.boxplot(data=df, x="department", y="salary", ax=axes[2])
axes[2].tick_params(axis="x", rotation=45)
plt.tight_layout(); plt.show()

num = df.select_dtypes("number").columns
sns.heatmap(df[num].corr(), annot=True, cmap="coolwarm", vmin=-1, vmax=1)
plt.title("Correlation heatmap"); plt.show()`,
            caption:
              "Three details that matter: `.dropna()` because hist cannot handle NaN, `alpha=0.6` because overlapping points hide density, and `vmin/vmax` on the heatmap so the colour scale means the same thing in every figure you ever draw.",
          },
        },
        {
          type: "trap",
          html: "With subplots you call methods on each <code>axes[i]</code>, and the names change: <code>plt.title()</code> becomes <code>ax.set_title()</code>, <code>plt.xlabel()</code> becomes <code>ax.set_xlabel()</code>. The rule is simple once you see it — the pyplot functions are verbs, the axes versions are <code>set_</code> plus the noun.",
        },
        {
          type: "prose",
          html: "Why the two interfaces exist at all: <code>plt.hist(...)</code> draws on whichever axes is \"current\", which is fine for one chart and unmanageable for six. <code>fig, axes = plt.subplots(...)</code> hands you the objects explicitly, so there is never any doubt about which panel you are drawing on. Use the explicit form as soon as you have more than one panel.",
        },
        { type: "heading", level: 3, content: "Reading a box plot" },
        {
          type: "prose",
          html: "The box plot is the densest of the five and the one most often misread. The box is Q1 to Q3 — the middle half of the data. The line inside it is the <b>median</b>, not the mean. The whiskers reach to the furthest point still inside the 1.5 × IQR fence, and anything beyond is drawn as an individual dot. So a box plot is really a five-number summary plus a flag for outliers, which is why it answers \"how does this differ across groups\" so well: you get centre, spread and tails for every group at once.",
        },
      ],
    },
    {
      id: "live",
      kind: "live",
      title: "Live: the fence behind the whiskers",
      blocks: [
        {
          type: "prose",
          html: "Those dots past the whiskers are not a judgement, they are an arithmetic rule with a multiplier in it. Drag the multiplier and watch the same column gain and lose \"outliers\" without a single value changing.",
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
            "<b>Too few or too many bins.</b> A histogram with 5 bins hides the shape; one with 200 bins on 240 rows shows noise. Start at 20 and move once you have looked.",
            "<b>Overplotting.</b> Thousands of scatter points become a solid blob. Fix with <code>alpha</code>, a smaller marker (<code>s=5</code>), or a hexbin. The study guide's Q3 does exactly this: 20,640 housing points plotted with <code>s=5, alpha=0.3</code>.",
            "<b>Truncated or inconsistent colour scales.</b> A correlation heatmap without <code>vmin=-1, vmax=1</code> rescales itself to whatever is in <i>this</i> matrix, so the same colour means different things in two figures side by side.",
            "<b>Forgetting the NaNs.</b> <code>plt.hist</code> raises on missing values; seaborn silently drops them. Either way, know how many went missing before you read anything off the chart.",
            "<b>Unlabelled axes.</b> Costs marks in the assessment and costs you time in six months. The rubric checks for it.",
          ],
        },
        {
          type: "gradedDetail",
          html: "Assignment-1 awards marks for the plot itself <i>and</i> for its labelling. Q3 wants a 2D scatter of input against target; Q5 wants that same scatter with the fitted line drawn over it in a distinguishable colour. Title, x-label and y-label on every figure.",
        },
        {
          type: "citation",
          source: "ISLP Ch 2",
          detail:
            "ISLP's chapter 2 lab covers the same plotting vocabulary, and its figures are a good model for what a publishable version of each of these charts looks like.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data: the six lecture steps",
      blocks: [
        {
          type: "prose",
          html: "240 employees, with deliberate missing salaries and performance scores. These are the six steps from the Week 0 lab, in order.",
        },
        { type: "datasetPreview", dataset: "employee" },
        {
          type: "list",
          ordered: true,
          items: [
            "Load and inspect: shape, dtypes, missing counts",
            "Select: Engineering staff earning above 100k, only name-like columns",
            "Aggregate: mean salary and headcount per department",
            "Histogram of salary",
            "Scatter of experience vs salary",
            "Heatmap of numeric correlations",
          ],
        },
        {
          type: "deepDive",
          summary: "Solution code for all six steps",
          blocks: [
            {
              type: "code",
              code: {
                language: "python",
                title: "m0 practice solution",
                code: `import pandas as pd, numpy as np
import matplotlib.pyplot as plt, seaborn as sns

# 1. load and inspect
df = pd.read_csv("employee_dataset.csv")
print(df.shape)
print(df.dtypes)
print(df.isna().sum())

# 2. select
eng = df[(df["department"] == "Engineering") & (df["salary"] > 100000)]
print(eng[["employee_id", "department", "salary"]])

# 3. aggregate
summary = df.groupby("department").agg(
    avg_salary=("salary", "mean"),
    headcount=("employee_id", "count"),
).sort_values("avg_salary", ascending=False)
print(summary)

# 4-6. the three charts
fig, axes = plt.subplots(1, 3, figsize=(15, 4))
axes[0].hist(df["salary"].dropna(), bins=20)
axes[0].set_title("Salary distribution")
axes[0].set_xlabel("Salary"); axes[0].set_ylabel("Employees")

axes[1].scatter(df["years_experience"], df["salary"], alpha=0.6)
axes[1].set_title("Experience vs salary")
axes[1].set_xlabel("Years of experience"); axes[1].set_ylabel("Salary")

sns.boxplot(data=df, x="department", y="salary", ax=axes[2])
axes[2].set_title("Salary by department")
axes[2].tick_params(axis="x", rotation=45)
plt.tight_layout(); plt.show()

num = df.select_dtypes("number").columns
sns.heatmap(df[num].corr(), annot=True, cmap="coolwarm", vmin=-1, vmax=1)
plt.title("Correlation heatmap"); plt.show()`,
              },
            },
            {
              type: "prose",
              html: "What to actually read off the output: the salary histogram has a long right tail (so median, not mean, for filling gaps); the experience-versus-salary scatter rises but with real spread (so a line will fit, imperfectly); and the heatmap shows experience and salary as the strongest pair, which is the relationship Module 4 will model properly.",
            },
          ],
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
            "Work the six steps above without looking at the solution. <b>Success:</b> every figure has a title and both axis labels, and you can say one sentence about what each chart told you.",
            "Box plot of salary by department. <b>Success:</b> you can name the department with the most outliers and say whether you would treat them as errors or as real high earners.",
            "Pick any two numeric columns and predict the sign of their correlation before computing it. <b>Success:</b> you were right about the sign on at least four of five pairs.",
            "Redraw the salary histogram with 5, 20 and 100 bins. <b>Success:</b> you can argue for one of them.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Build the same three-panel figure for <code>students_survey.csv</code>, which you will meet properly in Module 1. The code should barely change — that is the point of the lookup table.",
            "Recreate Anscombe's quartet with <code>sns.load_dataset(\"anscombe\")</code> and confirm for yourself that four identical summaries can describe four different pictures.",
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
            "1 column → hist. 2 columns → scatter. Groups → box. Grid of everything → heatmap.",
            "Seaborn for categories, matplotlib for raw numbers — and seaborn returns a matplotlib axes anyway.",
            "On an axes object, pyplot verbs become set_ plus the noun.",
            "The line in a box is the median; the whiskers stop at the 1.5 × IQR fence.",
            "Always pin a correlation heatmap to vmin=-1, vmax=1.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Which chart answers \"how does salary differ across departments\"?",
              a: "A box plot — one box per department gives centre, spread and outliers for every group in a single figure.",
            },
            {
              q: "With subplots, why does <code>axes[0].title(\"x\")</code> fail?",
              a: "Axes objects use <code>set_</code> methods: <code>set_title</code>, <code>set_xlabel</code>, <code>set_ylabel</code>. The bare verbs belong to the pyplot interface.",
            },
            {
              q: "Your scatter plot is a solid blob. What do you change?",
              a: "Reduce marker size and add transparency — <code>s=5, alpha=0.3</code> — or switch to a hexbin. The study guide's housing scatter uses exactly that for 20,640 points.",
            },
            {
              q: "Why plot before modelling at all?",
              a: "Every model assumes a shape. Anscombe's quartet shows four datasets with identical summary statistics and completely different shapes — only the plot distinguishes them.",
            },
          ],
        },
      ],
    },
  ],
};
