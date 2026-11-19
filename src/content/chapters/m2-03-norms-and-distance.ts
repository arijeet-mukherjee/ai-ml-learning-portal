import type { Chapter } from "@/types/content";

export const normsAndDistance: Chapter = {
  slug: "norms-and-distance",
  title: "Norms and distance",
  description:
    "L1 versus L2, the diamond and the circle, and why the diamond's corners are the reason Lasso sets weights to exactly zero.",
  icon: "◇",
  order: 3,
  moduleId: "m2",
  estimatedMinutes: 15,
  prerequisites: ["dot-product-and-cosine"],
  sourceRefs: ["Module 1 ML Notebook.html § m2-norms"],
  islpChapters: ["Ch 6"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why there is more than one kind of distance",
      blocks: [
        {
          type: "prose",
          html: "\"How far apart are these two things\" has more than one correct answer, and the choice is not arbitrary — it changes what your model does.<br><br>This chapter looks like a detour into geometry. It is actually the setup for one of the most practically useful facts in Module 4: Ridge shrinks every weight a little, Lasso sets most of them to exactly zero, and the <i>reason</i> is the shape of these two distances.",
        },
        {
          type: "world",
          html: "Genetic research: tens of thousands of gene expression levels, a few hundred patients. You need a model that says \"these eleven genes matter and the rest do not\". Only one of these two penalties can produce that answer, and which one is decided by the shape below.",
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
          headers: ["", "L1 (Manhattan / taxicab)", "L2 (Euclidean / crow flies)"],
          rows: [
            ["Formula", "|x₁| + |x₂| + …", "√(x₁² + x₂² + …)"],
            ["[4, 3]", "7 (blocks by road)", "5 (straight through the air)"],
            ['Shape of "all points at distance 3"', "Diamond", "Circle"],
            ["Outliers", "More tolerant", "Squares them, so one big error dominates"],
            [
              "As a training penalty",
              "Pushes weights exactly to 0 → Lasso",
              "Shrinks all weights a bit → Ridge / weight decay",
            ],
          ],
        },
        {
          type: "formula",
          title: "Distance = subtract, then pick a norm",
          lines: `a = [6,2], b = [2,5]  →  a − b = [4, −3]
L2 distance = 5     L1 distance = 7`,
        },
        {
          type: "prose",
          html: "Distance is a two-step operation and it is worth keeping them separate in your head: first <i>subtract</i> to get the arrow between the points, then <i>measure</i> that arrow with a norm. The subtraction is the same either way; only the ruler changes.",
        },
        {
          type: "memoryHook",
          content:
            "L1 = taxi in Kolkata traffic, only along streets. L2 = a crow over the rooftops.",
          detail:
            "And the diamond has sharp corners sitting on the axes. That's why L1 lands weights exactly on zero.",
        },
        { type: "heading", level: 3, content: "Why the corners matter" },
        {
          type: "prose",
          html: "Here is the argument in full, because it is the one that makes Module 4's Ridge-versus-Lasso table stop being a thing to memorise.<br><br>Both penalties say: find the weights that fit the data well, <i>subject to</i> the weight vector being no bigger than some budget. The set of weight vectors inside the budget is a circle for L2 and a diamond for L1. The best-fitting solution is wherever the data's own contours first touch that boundary.<br><br>A circle is smooth, so the contours generally touch it at some ordinary point where both coordinates are non-zero — every weight shrinks, none vanishes. A diamond has <b>corners, and the corners sit exactly on the axes</b>. A corner on the w₁ axis means w₂ = 0. Contours touch corners disproportionately often, because a corner sticks out. That is the whole mechanism: Lasso produces zeros because its constraint region has points on the axes, and Ridge does not because its does not.",
        },
        {
          type: "prose",
          html: "The same fact read through the gradient: near zero, L2's push (gradient 2w) fades away to nothing, so a small weight is left alone. L1's push stays the same size however small w gets, so it shoves small weights all the way to zero and holds them there. Two tellings of one story.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "both norms, and the shapes they describe",
            code: `import numpy as np

a, b = np.array([6, 2]), np.array([2, 5])
d = a - b                              # [4, -3]

np.linalg.norm(d)                      # L2 -> 5.0
np.linalg.norm(d, ord=1)               # L1 -> 7.0
np.linalg.norm(d, ord=np.inf)          # L-infinity -> 4.0 (the biggest single step)

# "all points at L1 distance 3" is a diamond; at L2 distance 3, a circle.
theta = np.linspace(0, 2 * np.pi, 400)
circle = np.c_[3 * np.cos(theta), 3 * np.sin(theta)]        # L2 ball
diamond = np.array([[3, 0], [0, 3], [-3, 0], [0, -3], [3, 0]])  # L1 ball`,
            caption:
              "Plot those last two on the same axes. The diamond's four vertices are exactly the points where one coordinate is zero — the geometry of feature selection in four points.",
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
            "<b>Unscaled features.</b> Any distance on [salary, years of service] is a measure of salary. Standardise before computing distance, k-NN, SVM, PCA or a clustering assignment — all of them are distance underneath.",
            "<b>L2 with outliers.</b> Squaring means one bad point can dominate the total. If outliers are errors you cannot remove, L1 is more forgiving.",
            "<b>Expecting Lasso to pick the \"right\" feature from a correlated pair.</b> Given two near-identical columns it keeps one, more or less arbitrarily, and zeroes the other. The choice is not evidence about which matters.",
            "<b>High dimensions.</b> As dimension grows, all pairwise L2 distances converge towards each other and \"nearest\" stops meaning much. This is one face of the curse of dimensionality in Module 3.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 6",
          detail:
            "ISLP chapter 6 draws this exact picture — the circular and diamond constraint regions with the residual-sum-of-squares contours touching them — in its Ridge and Lasso section. It is the clearest single figure in the book for this idea.",
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
          html: "The Wisconsin features are a textbook case for why scaling must come first: <code>area_worst</code> runs into the thousands while <code>fractal_dimension_mean</code> sits around 0.06. Compute a distance on the raw columns and you are ranking tumours by area. Below, the same pair of rows measured both ways.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the same distance, before and after scaling",
            code: `from sklearn.preprocessing import StandardScaler

Xr = df.drop(columns="diagnosis").to_numpy()
Xs = StandardScaler().fit_transform(Xr)

raw_gap    = np.abs(Xr[0] - Xr[1])
scaled_gap = np.abs(Xs[0] - Xs[1])
cols = df.drop(columns="diagnosis").columns

print("raw says the biggest difference is   :", cols[raw_gap.argmax()])
print("scaled says the biggest difference is:", cols[scaled_gap.argmax()])
print("L2 raw:", np.linalg.norm(Xr[0] - Xr[1]).round(1),
      "| L2 scaled:", np.linalg.norm(Xs[0] - Xs[1]).round(2))`,
            caption:
              "The two `argmax` lines print different columns. Only one of them is a statement about the tumours; the other is a statement about units.",
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
            "Compute L1 and L2 for [4, −3] by hand and with NumPy. <b>Success:</b> 7 and 5, and you can say which is which without checking.",
            "Plot the L1 diamond and the L2 circle of radius 3 on the same axes. <b>Success:</b> you can point at the four places the diamond touches an axis and say what each means for a weight.",
            "Run the scaling comparison above on the breast-cancer data. <b>Success:</b> you can name both \"most different\" features and explain why they disagree.",
            "Find the pair of tumours with the largest scaled L2 distance, then check whether they have different diagnoses. <b>Success:</b> you have an opinion on whether that is reassuring.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Demonstrate the high-dimensional distance collapse: for d = 2, 10, 100, 1000, draw 500 random points and plot the ratio of the largest to the smallest pairwise L2 distance. Watch it fall towards 1.",
            "Implement L-infinity (the largest single coordinate gap) and find the tumour pair it ranks furthest apart. Compare with the L2 answer.",
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
            "L1 = taxi along streets. L2 = a crow over the rooftops.",
            "Distance is subtract, then measure. Only the ruler changes.",
            "L1's ball is a diamond with corners on the axes — that is why Lasso zeroes weights.",
            "L2's push fades near zero; L1's push does not.",
            "Every distance-based method needs scaling first.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "L1 and L2 of [4, 3]?",
              a: "L1 = 7, L2 = 5. L1 adds absolute values; L2 is the square root of the sum of squares.",
            },
            {
              q: "Why does Lasso set weights to exactly zero and Ridge does not?",
              a: "L1's constraint region is a diamond whose corners sit on the axes, and a corner means one weight is zero; the fit's contours touch those corners often. L2's region is a smooth circle with no such points. Equivalently: L1's gradient keeps its magnitude near zero, L2's fades.",
            },
            {
              q: "Which norm is more tolerant of outliers, and why?",
              a: "L1. L2 squares each deviation, so one large error contributes disproportionately to the total.",
            },
            {
              q: "Name three methods that silently depend on scaling.",
              a: "k-NN, SVM and PCA — all are distance or variance based. Linear and logistic regression with a penalty also qualify, because the penalty is a norm on the weights.",
            },
          ],
        },
      ],
    },
  ],
};
