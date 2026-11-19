import type { Chapter } from "@/types/content";

export const vectors: Chapter = {
  slug: "vectors",
  title: "What a vector is, and the three operations",
  description:
    "List, point, arrow — three readings of one object; adding, scaling and subtracting, and where each shows up inside an AI system.",
  icon: "⟶",
  order: 1,
  moduleId: "m2",
  estimatedMinutes: 18,
  prerequisites: ["numpy-arrays"],
  sourceRefs: ["Module 1 ML Notebook.html § m2-vector, m2-ops"],
  islpChapters: ["Ch 2"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why bother drawing arrows",
      blocks: [
        {
          type: "bigIdea",
          content:
            "Everything in this module is built from two things you already do: multiply two numbers, then add the results. Draw it in 2D, trust it in 1,536D.",
        },
        {
          type: "prose",
          html: "Running example, and it is worth holding onto for the whole module: a support desk counts two words in each ticket, \"password\" and \"billing\". Those counts <i>are</i> the ticket's vector.",
        },
        {
          type: "table",
          headers: ["Ticket", "Text gist", "Vector [password, billing]"],
          rows: [
            ["T1", "reset link never arrives, password page times out", "[2, 0]"],
            ["T2", "billing page shows one charge, statement shows two", "[0, 2]"],
            ["T3", "password change failed, billing page rejects address", "[2, 2]"],
          ],
        },
        {
          type: "prose",
          html: "Nothing has been added to the tickets. The vector is the tickets, counted. Every embedding you will ever use is this move with a cleverer counter and more slots — and once a thing is a vector you can measure how close two of them are, which is the entire mechanism behind semantic search, recommendation and retrieval.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        { type: "heading", level: 3, content: "One object, three readings" },
        {
          type: "list",
          items: [
            "<b>List</b> [2, 2]: order gives each slot its meaning. Use this view when <i>computing</i>.",
            "<b>Point</b>: an address on graph paper. Use it when <i>plotting</i>.",
            "<b>Arrow</b> from the origin: direction (what it's about) + length (how strongly). Use it when <i>adding</i> and <i>comparing angles</i>.",
          ],
        },
        {
          type: "memoryHook",
          content: "L-P-A: List to compute, Point to plot, Arrow to add.",
          detail:
            "They are the same numbers. Switching reading is free, and picking the right one makes most linear-algebra questions obvious.",
        },
        {
          type: "prose",
          html: "The <b>dimension</b> is just the number of slots. Two here; a typical sentence embedding has 1,536. Nobody can picture 1,536D and nobody needs to: every formula works slot by slot. This is the single most useful thing to internalise in this module — you reason in 2D and the arithmetic carries over unchanged.",
        },
        { type: "heading", level: 3, content: "Adding, scaling, subtracting" },
        {
          type: "formula",
          title: "Slot by slot",
          lines: `m + a = [4, 1] + [1, 3] = [5, 4]        (tip to tail)
2 × [2, 1] = [4, 2]                    (same direction, longer)
w − ℓ = [6, 2] − [2, 3] = [4, −1]      (the trip from ℓ to w)`,
        },
        {
          type: "prose",
          html: "The parentheses are the geometry. Addition is tip-to-tail: walk along the first arrow, then along the second. Scaling stretches without turning. Subtraction gives you the arrow <i>from</i> one point <i>to</i> another, which is why error is always target minus prediction and never the other way round.",
        },
        {
          type: "list",
          items: [
            "<b>Physics:</b> a plane flying east at 500 km/h in a 60 km/h north wind actually travels 504 km/h, about 7° off course.",
            "<b>Recommender:</b> profile [1, 4] (years of camping gear) + query [4, 1] (just typed \"cookware\") = blend [5, 5]. Scale the query by 2 to say \"trust the search box more\".",
            "<b>Normalising:</b> divide a vector by its own length and it becomes length 1. [2,1] and [6,3] both land on [0.89, 0.45]: same subject, size removed.",
            "<b>Drift:</b> December [4,1] − June [1,4] = [3, −3]: tickets up 3, logins down 3. Churn monitors watch this difference arrow, not either endpoint.",
          ],
        },
        {
          type: "table",
          headers: ["Operation", "Ask yourself", "Where it lives in AI"],
          rows: [
            [
              "Add",
              '"Both influences acting together?"',
              "Residual connections, token + position embeddings, profile + query blending",
            ],
            [
              "Subtract",
              '"How do I get from b to a?"',
              "Error = target − prediction, task vectors, erasing a concept",
            ],
            [
              "Scale",
              '"Same direction, different strength?"',
              "Learning rate × gradient, guidance strength, attention ÷ √d",
            ],
          ],
        },
        {
          type: "prose",
          html: "That right-hand column is not decoration. When you meet <code>w ← w − η·∇L</code> in Module 4, it is scale-then-subtract. When you meet attention in a transformer, the <code>÷ √d</code> is a scale. Learning the three operations well here means those later formulas have no new ideas in them.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the three operations in NumPy",
            code: `import numpy as np
t, p = np.array([4, 3]), np.array([2, 4])

t + p, 2 * t, t - p        # add, scale, subtract

# normalise: same direction, length 1
unit = t / np.linalg.norm(t)
np.linalg.norm(unit)       # 1.0

# the same numbers, 1536 slots instead of 2 — nothing in the code changes
big_a, big_b = np.random.randn(1536), np.random.randn(1536)
(big_a + big_b).shape      # (1536,)`,
            caption:
              "The last two lines are the point: the code that works on two slots works on 1,536 with no edit. That is why the 2D picture is enough.",
          },
        },
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
            "<b>Adding vectors whose slots mean different things.</b> [years of service, salary] + [age, bonus] is arithmetic on nonsense. The slot order is the meaning; two vectors must share it.",
            "<b>Forgetting that length carries information.</b> Normalising throws away magnitude. For \"same subject, different length\" that is exactly right; for \"how strongly\" it destroys the signal.",
            "<b>Subtracting in the wrong order.</b> target − prediction and prediction − target differ by a sign, and that sign is the direction gradient descent will step in.",
            "<b>Mixing shapes.</b> In NumPy a <code>(3,)</code> and a <code>(3, 1)</code> look alike and broadcast into a <code>(3, 3)</code>. Print the shape.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 2",
          detail:
            "ISLP's notation section sets the convention this course follows — observations in rows, features in columns — which is what makes a row of the data matrix the vector for one example.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data",
      blocks: [
        { type: "datasetPreview", dataset: "cancer" },
        {
          type: "prose",
          html: "Each of the 569 tumours in the Wisconsin data is a 30-slot vector. That is already far past anything you can picture, and it does not matter: the row is a list when you compute, and in Module 4 a linear model will take its dot product with a weight vector of the same 30 slots.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "one tumour as a vector",
            code: `import pandas as pd, numpy as np

df = pd.read_csv("breast_cancer.csv").drop(columns=["Unnamed: 0", "id"], errors="ignore")
X = df.drop(columns="diagnosis").to_numpy()
X.shape                      # (569, 30) -> 569 vectors of 30 slots

a, b = X[0], X[1]            # two tumours
diff = a - b                 # the arrow from tumour 1 to tumour 0
np.abs(diff).argmax()        # which feature separates them most (by raw size)

# ...but raw size is misleading here: area_mean runs in the thousands and
# smoothness_mean in the hundredths. Scaling is coming in Module 3 for exactly this.
df.describe().loc[["min", "max"]].T.head(8)`,
            caption:
              "Run the last line and look at the ranges. `area_mean` spans ~140 to ~2500 while `smoothness_mean` spans ~0.05 to ~0.16. Any distance computed on these raw columns is a measure of area and nothing else.",
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
            "Build the three support tickets as arrays and compute T1 + T2, 2·T3, T3 − T1. <b>Success:</b> you can say in words what each result means about the tickets.",
            "Normalise [2, 1] and [6, 3] and confirm both give [0.89, 0.45]. <b>Success:</b> you can explain what information the normalisation threw away and when you would want that.",
            "Load the breast-cancer matrix and print its shape. <b>Success:</b> you get (569, 30) and can name what each axis is.",
            "Compute the difference vector between a malignant and a benign row, and find the feature with the largest absolute gap. <b>Success:</b> you noticed the answer is dominated by whichever column has the biggest units, and you can say why that is a problem.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Compute the mean malignant vector and the mean benign vector, then the arrow between them. Which slots have the largest components? Keep the answer — Module 4's logistic weights should agree with it.",
            "Repeat the difference exercise after dividing every column by its own standard deviation, and watch the \"most important feature\" answer change completely.",
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
            "L-P-A: List to compute, Point to plot, Arrow to add.",
            "Dimension is just the number of slots; every formula works slot by slot.",
            "Add = both influences together. Subtract = the trip from b to a. Scale = same direction, different strength.",
            "Normalising keeps the subject and throws away the size.",
            "Slot order is the meaning — two vectors must share it to be added.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Give the AI use of each of the three operations.",
              a: "Add: residual connections and token + position embeddings. Subtract: error = target − prediction, and task vectors. Scale: learning rate × gradient, and attention divided by √d.",
            },
            {
              q: "What does normalising a vector do, and what does it cost?",
              a: "Divides by its own length so it becomes length 1, keeping direction and discarding magnitude. That is right when size is noise (document length) and wrong when size is signal (intensity).",
            },
            {
              q: "Why is a 1,536-dimensional embedding not harder than a 2D vector?",
              a: "Every operation is defined slot by slot, so the arithmetic is identical. Only the visualisation fails, and the visualisation was never load-bearing.",
            },
          ],
        },
      ],
    },
  ],
};
