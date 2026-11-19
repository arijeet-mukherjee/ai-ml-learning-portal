import type { Chapter } from "@/types/content";

export const numpyArrays: Chapter = {
  slug: "numpy-arrays",
  title: "NumPy: arrays that do maths",
  description:
    "Why a grid of numbers beats a Python list, how slicing and broadcasting work, and the one rule that makes axis= stop being confusing.",
  icon: "▦",
  order: 1,
  moduleId: "m0",
  estimatedMinutes: 18,
  prerequisites: [],
  sourceRefs: ["Module 1 ML Notebook.html § m0-numpy", "DAY_1/Python_Tool_Proficiency_Notebook.ipynb"],
  islpChapters: ["Ch 2"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why bother with arrays at all?",
      blocks: [
        {
          type: "bigIdea",
          content:
            "Every ML notebook you will ever write starts the same way: load a table, poke at it, clean it, plot it. This module makes those moves automatic.",
        },
        {
          type: "prose",
          html: "You already know Python lists. So why learn a second container that looks almost identical?<br><br>Because of what happens when the data gets big. In the lecture, doubling two million numbers took <span class=\"mark\">0.42 s with a Python loop and 0.015 s with NumPy</span> — roughly 28 times faster. That gap is not NumPy being clever about arithmetic. It is <i>where the loop runs</i>. A Python <code>for</code> loop steps through boxed objects one at a time in the interpreter; NumPy hands the whole block to compiled C and gets out of the way.",
        },
        {
          type: "memoryHook",
          content:
            "A Python loop is walking to office. NumPy is the metro. Same destination, one of them doesn't make you stop at every house.",
        },
        {
          type: "prose",
          html: "The 28× matters for a different reason than impatience. A model fit is the same arithmetic repeated thousands of times. At Python-loop speed, cross-validating twenty hyperparameter settings is an overnight job; at NumPy speed it is a coffee break. Speed is what lets you <i>try things</i>, and trying things is how you actually learn which model fits.",
        },
        {
          type: "world",
          html: "The scikit-learn models you will use for the rest of this course are NumPy underneath. When <code>LinearRegression().fit(X, y)</code> solves <code>(XᵀX)⁻¹Xᵀy</code> in one shot, that is NumPy calling the same LAPACK routines your university's physics department uses. You are not learning a toy — you are learning the interface to forty years of numerical computing.",
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
          html: "A NumPy array is a grid of numbers <b>of one type</b>, stored as one contiguous block of memory. That single sentence explains almost everything that follows: the speed (no pointer-chasing), the strictness (no mixing strings and floats), and the shape rules.",
        },
        { type: "heading", level: 3, content: "Creating arrays" },
        {
          type: "code",
          code: {
            language: "python",
            title: "creating arrays",
            code: `import numpy as np

a     = np.array([1, 2, 3, 4, 5])      # from a list
zeros = np.zeros((2, 3))               # 2 rows x 3 cols of 0.0
ones  = np.ones((3, 3))
r     = np.arange(0, 10, 2)            # [0 2 4 6 8]  start, stop(excluded), step
lin   = np.linspace(0, 1, 5)           # [0. .25 .5 .75 1.] start, stop(included), num
m     = np.arange(1, 13).reshape(3, 4) # 3x4 grid of 1..12
print(m.shape, m.dtype)`,
            caption:
              "Read the last line out loud on every array you make: shape tells you the grid, dtype tells you whether your numbers are secretly strings.",
          },
        },
        {
          type: "trap",
          html: "<code>np.arange(0, 10, 2)</code> stops <b>before</b> 10 → [0 2 4 6 8]. <code>np.linspace(0, 1, 5)</code> <b>includes</b> 1 → [0, .25, .5, .75, 1]. arange counts by a <i>step</i>, linspace counts by a <i>number of points</i>.",
        },
        {
          type: "memoryHook",
          content:
            "a-RANGE = range with a step, end excluded.<br>LIN-space = a LINE cut into N points, both ends kept.",
          detail:
            "Which is why you reach for linspace when you want a smooth x-axis to plot a curve over: you ask for 200 points and you get exactly 200, both ends included.",
        },
        { type: "heading", level: 3, content: "Indexing and slicing" },
        {
          type: "code",
          code: {
            language: "python",
            title: "indexing and slicing",
            code: `arr1d = np.arange(10)
arr1d[3]        # single element -> 3
arr1d[2:7]      # slice -> [2 3 4 5 6]
arr1d[::-1]     # reversed

arr2d = np.arange(1, 13).reshape(3, 4)
arr2d[1, 2]     # row 1, col 2 -> 7
arr2d[:, 1]     # whole column 1 -> [2 6 10]
arr2d[0:2, 1:3] # sub-matrix rows 0-1, cols 1-2

safe = arr2d[0:2].copy()   # independent copy, edits won't leak back`,
          },
        },
        {
          type: "prose",
          html: "Line by line: <code>arr2d[1, 2]</code> is <b>one</b> bracket with a comma inside, not <code>arr2d[1][2]</code>. Both happen to work, but the comma form is the one NumPy is built around and the only one that generalises to slices on both axes. A bare colon means \"everything along this axis\", so <code>arr2d[:, 1]</code> reads as \"every row, column 1\".",
        },
        {
          type: "trap",
          html: "Slices are <b>views</b>, not copies. <code>b = a[0:2]; b[0] = 99</code> also changes <code>a</code>. When you want an independent piece, write <code>a[0:2].copy()</code>. This is the single most common source of \"my data changed and I don't know why\" in a notebook.",
        },
        { type: "heading", level: 3, content: "Element-wise maths and broadcasting" },
        {
          type: "prose",
          html: "<code>+ - * / **</code> work slot by slot. A single number \"broadcasts\" across every slot, so <code>x + 100</code> adds 100 everywhere. Two arrays must either have the same shape, or shapes NumPy can stretch to match — a <code>(3, 4)</code> array and a <code>(4,)</code> array combine fine, because the <code>(4,)</code> is reused for each of the three rows.",
        },
        {
          type: "trap",
          html: "<code>A * B</code> is element-wise. <code>A @ B</code> is matrix multiplication. Mixing them up gives a valid-looking but wrong answer, <b>with no error</b> — which is far worse than a crash. If a result looks plausible but your accuracy is strange, check your stars and ats first.",
        },
        { type: "heading", level: 3, content: "Aggregation across an axis" },
        {
          type: "prose",
          html: "<code>axis=</code> is where most beginners stall, and it has exactly one rule.",
        },
        {
          type: "memoryHook",
          content: "The axis you name is the axis that disappears.",
          detail:
            "axis=0 squashes the rows away, so you get one answer per column. axis=1 squashes the columns away, one answer per row. Say it to yourself before every call and you will never get it backwards again.",
        },
        {
          type: "widget",
          lab: "axis",
          caption:
            "Pick an operation and an axis, then hover an answer to see exactly which cells were squashed into it.",
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "When to use it, and what goes wrong",
      blocks: [
        {
          type: "table",
          headers: ["Reach for NumPy when", "Reach for something else when"],
          rows: [
            [
              "You have numbers of one type and want maths on all of them",
              "Your data has named columns and mixed types — that is Pandas",
            ],
            [
              "You need speed: fitting, simulating, image or signal work",
              "You need to append repeatedly in a loop — a Python list is better, convert once at the end",
            ],
            [
              "A library asks for an array of shape (n_samples, n_features)",
              "You are holding text, categories or anything heterogeneous",
            ],
          ],
        },
        {
          type: "prose",
          html: "Three failure modes are worth recognising on sight:",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "<b>Silent dtype promotion.</b> Put one string in an integer array and the whole thing becomes <code>&lt;U21</code> strings. Your arithmetic then concatenates instead of adding. <code>print(a.dtype)</code> is the two-second check.",
            "<b>Shape mismatch that doesn't error.</b> Broadcasting is helpful right up until it quietly stretches something you meant to keep separate. If a result has a shape you didn't expect, stop and print the shapes of both operands.",
            "<b>Views leaking edits.</b> The <code>.copy()</code> trap above. It bites hardest when you slice a training set out of a bigger array and then normalise it in place.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 2",
          detail:
            "The ISLP lab sections for chapter 2 cover exactly this ground — array creation, indexing and the shape conventions — with the same <code>(n_samples, n_features)</code> discipline that scikit-learn enforces from Module 3 onwards.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data",
      blocks: [
        {
          type: "prose",
          html: "The arithmetic above is not abstract. Here it is on the course's own employee table — 240 rows, with deliberate gaps in <code>salary</code>, which is what makes it a realistic first dataset rather than a tidy one.",
        },
        { type: "datasetPreview", dataset: "employee" },
        {
          type: "code",
          code: {
            language: "python",
            title: "the same moves, on the course data",
            code: `import numpy as np
import pandas as pd

df = pd.read_csv("employee_dataset.csv")
salary = df["salary"].to_numpy()        # a (240,) float array, NaN where missing

salary.shape        # (240,)
np.isnan(salary).sum()                  # how many gaps NumPy sees

# NaN is contagious: one gap poisons the whole aggregate.
salary.mean()                           # nan
np.nanmean(salary)                      # the mean of the values we do have

# Element-wise maths, no loop in sight
raise_pct = (salary * 1.07) - salary    # what a 7% rise would cost per head
np.nansum(raise_pct).round(2)           # total cost of the rise`,
            caption:
              "Run this and `salary.mean()` prints `nan`. That is NumPy being honest: it will not invent a number for a gap. Handling the gap is a decision you make, in the next chapter.",
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
          type: "prose",
          html: "Open a notebook next to <code>employee_dataset.csv</code> and work these without looking anything up. The goal is for the syntax to stop costing you attention.",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Build <code>np.arange(1, 13).reshape(3, 4)</code>. Before running anything, write down what <code>np.sum(m, axis=0)</code> and <code>np.sum(m, axis=1)</code> will be. Then check. <b>Success:</b> you predicted both shapes and both sets of values.",
            "Pull <code>years_experience</code> into an array. Compute its mean, std, min and max with NumPy, then again with the Pandas <code>.describe()</code> you will meet next chapter. <b>Success:</b> the numbers agree — except std, and you can say why (ddof).",
            "Take <code>a = np.arange(10)</code>, slice <code>b = a[2:5]</code>, set <code>b[0] = 99</code>, and print <code>a</code>. <b>Success:</b> you can explain the result to someone else in one sentence.",
            "Normalise the salary array to the 0–1 range using only broadcasting: <code>(x - nanmin) / (nanmax - nanmin)</code>. <b>Success:</b> the result's min is 0.0 and max is 1.0.",
          ],
        },
        {
          type: "heading",
          level: 3,
          content: "Stretch goals",
        },
        {
          type: "list",
          items: [
            "Time the 28× yourself: double two million numbers with a list comprehension and with an array, using <code>%%timeit</code> in Jupyter. See how close you get to the lecture's 0.42 s versus 0.015 s.",
            "Write <code>np.sum(m, axis=1)</code> using only <code>m.shape</code> and a Python loop, then convince yourself the vectorised version is doing the same thing — just not in Python.",
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
            "A Python loop is walking to office. NumPy is the metro.",
            "a-RANGE = range with a step, end excluded. LIN-space = a LINE cut into N points, both ends kept.",
            "The axis you name is the axis that disappears.",
            "Slices are windows, not photocopies.",
            "Star multiplies slot by slot. At multiplies matrices.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Matrix <code>m</code> is 2×3. What does <code>np.sum(m, axis=1)</code> return?",
              a: "Two numbers, one per row. <code>axis=1</code> removes the column axis, so each row collapses to a single sum. For <code>[[1,2,3],[4,5,6]]</code> that is <code>[6, 15]</code>.",
            },
            {
              q: "Why is NumPy faster than a Python list for the same arithmetic?",
              a: "The elements are one dtype in one contiguous block, so the loop runs in compiled C rather than stepping through boxed Python objects in the interpreter. The lecture measured 0.42 s versus 0.015 s on two million doublings.",
            },
            {
              q: "Is <code>a[0:2]</code> a copy?",
              a: "No — a view. Editing it edits the original. Use <code>.copy()</code> when you need an independent piece.",
            },
            {
              q: "What is the difference between <code>A * B</code> and <code>A @ B</code>?",
              a: "<code>*</code> is element-wise, slot by slot. <code>@</code> is matrix multiplication, rows against columns. Confusing them produces a wrong answer with no error.",
            },
          ],
        },
      ],
    },
  ],
};
