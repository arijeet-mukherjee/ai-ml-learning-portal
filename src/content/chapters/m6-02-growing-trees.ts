import type { Chapter } from "@/types/content";

export const growingTrees: Chapter = {
  slug: "growing-decision-trees",
  title: "Growing a tree, regression trees, multi-class and voting",
  description:
    "The five-step growth loop, the camera tree traced to a prediction, variance reduction for numeric targets, one-vs-one versus one-vs-all, and weighted voting.",
  icon: "⑃",
  order: 2,
  moduleId: "m6",
  estimatedMinutes: 24,
  prerequisites: ["entropy-and-information-gain"],
  sourceRefs: ["Module 1 ML Notebook.html § m6-tree, m6-multi, m6-vote"],
  islpChapters: ["Ch 8"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why anyone still uses trees",
      blocks: [
        {
          type: "prose",
          html: "A single decision tree is rarely the most accurate model you can build. It is often the most <i>useful</i>, because it is the only model in this course whose reasoning a manager can read off a page: \"C2 brand, under $500, predict HIGH\". No coefficients, no scaling, no probability calibration — just nested questions.<br><br>And it is the foundation of random forests and gradient boosting, which <i>are</i> the most accurate models for tabular data. Learning the tree is learning the building block.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            "Find the feature (and threshold) with maximum information gain.",
            "Split the data on it.",
            "For each child, check whether any further split gives information gain.",
            "If yes, split again; if no, stop and make it a leaf.",
            "Repeat from step 3.",
            "A leaf predicts the <b>mode</b> label of its training examples.",
          ],
        },
        {
          type: "prose",
          html: "Camera tree: root (63 L / 37 H) → C1 (43/11) and C2 (20/26) → then Price &lt; 500 inside each. Test camera: Company C2, price 350 → C2 branch → price &lt; 500 leaf (15 L / 25 H) → predict <b>HIGH</b>. A one-split tree is called a <b>decision stump</b> (69% training accuracy here).",
        },
        { type: "heading", level: 3, content: "From zero: how “the best split” is scored" },
        {
          type: "prose",
          html: "A tree needs a number that says how <b>mixed</b> a group is. A bag of 10 blue marbles is perfectly pure; 5 blue + 5 red is as mixed as two classes can get. Two standard scores, where pₖ is the fraction of class k in the node:<br>• <b>Gini impurity</b> = 1 − Σ pₖ². Reading: pick two items at random (with replacement); Gini is the chance they have <i>different</i> labels. Pure → 0, 50/50 → 0.5.<br>• <b>Entropy</b> = −Σ pₖ log₂ pₖ. Reading: how many yes/no questions you need on average to guess the label. Pure → 0, 50/50 → 1 bit.",
        },
        {
          type: "formula",
          title: "Worked example: scoring the Company split on the 100 cameras",
          lines: `root      63 LOW / 37 HIGH     Gini = 1 − (0.63² + 0.37²)           = 0.466
C1        43 / 11  (54 cams)   Gini = 1 − (43/54)² − (11/54)²        = 0.324
C2        20 / 26  (46 cams)   Gini = 1 − (20/46)² − (26/46)²        = 0.491

weighted child impurity = 0.54 × 0.324 + 0.46 × 0.491 = 0.401
Gini decrease (gain)    = 0.466 − 0.401                = 0.065

same split with entropy (log₂): root 0.951 → children 0.848 → gain 0.103 bits
(with natural log, as on the slides: 0.659 → gain ≈ 0.07)`,
        },
        {
          type: "prose",
          html: "The algorithm computes this gain for <b>every feature and every possible threshold</b> — for a numeric column, every midpoint between consecutive sorted values — and keeps the single best. Then it repeats inside each child. That is the entire training procedure. Gini and entropy almost always choose the same split; Gini is a little faster because it has no logarithm, which is why it is sklearn's default.",
        },
        {
          type: "widget",
          lab: "treesplit",
          caption:
            "Score splits yourself first: drag the threshold and watch the weighted impurity and the gain change, then press “Snap to best split”. Then switch to “Let the algorithm grow it” and raise the depth until every leaf is pure — and notice what that does to the boxes.",
        },
        {
          type: "prose",
          html: "Trace that prediction and notice what the model is actually doing: it has partitioned the feature space into rectangular boxes, and every point in a box gets the same answer. That is the tree's inductive bias — <b>axis-aligned rectangles</b>. A boundary at 45° has to be approximated by a staircase of them, which is why a tree struggles with exactly the data a linear model handles easily, and vice versa.",
        },
        {
          type: "table",
          headers: ["Advantages", "Disadvantages"],
          rows: [
            [
              "Easy to read and explain; fast predictions; ranks features by usefulness; handles mixed and categorical features; no scaling needed",
              "Greedy heuristic, no optimal guarantee; a deep tree memorises (high variance); small data changes can reshape the whole tree",
            ],
          ],
        },
        {
          type: "prose",
          html: "\"Greedy\" is doing real work in that sentence. The tree picks the best <i>single</i> split at each step and never reconsiders. There may be a worse first split that enables two excellent second splits, and the algorithm will never find it — searching all trees is NP-hard, so every practical tree is greedy. This is also why a tree cannot discover a pure interaction: neither feature in an XOR pair has any gain on its own.",
        },
        {
          type: "prose",
          html: "Control depth with <code>max_depth</code>, <code>min_samples_split</code>, <code>min_samples_leaf</code>, or prune afterwards (<code>ccp_alpha</code>).",
        },
        { type: "heading", level: 3, content: "Regression trees" },
        {
          type: "prose",
          html: "Predicting the average rating (a real number)? Swap entropy for <b>variance</b>, information gain for <b>variance reduction</b>, and the leaf mode for the leaf <b>mean</b>.",
        },
        {
          type: "formula",
          title: "Variance reduction",
          lines: `Company:       1.1 − (0.54 × 1.5 + 0.46 × 0.5) = 0.06
Video ≥ 30fps: 1.1 − (0.70 × 1.2 + 0.30 × 0.4) = 0.14   ← split on video rate`,
        },
        {
          type: "memoryHook",
          content:
            "Classification tree: entropy → gain → mode. Regression tree: variance → reduction → mean.",
          detail:
            "Three substitutions and the same algorithm. Notice that the best split changed — Company won on the classification target, video rate wins on the numeric one.",
        },
        { type: "heading", level: 3, content: "Multi-class with binary classifiers" },
        {
          type: "prose",
          html: "A single line splits space into two halves, so a linear classifier is binary. For K classes:",
        },
        {
          type: "table",
          headers: ["", "One-vs-one", "One-vs-all (rest)"],
          rows: [
            ["Train", "every pair of classes", "each class vs everyone else"],
            ["Number of models", "K(K − 1)/2  (3 classes → 3, 10 → 45)", "K"],
            ["Decide", "each model votes; most votes wins", 'the class whose model says "yes" (most confidently)'],
          ],
        },
        {
          type: "memoryHook",
          content: 'One-vs-one is a round-robin tournament. One-vs-all is "you against the world".',
        },
        {
          type: "prose",
          html: "The trade is between count and balance. One-vs-all trains only K models but each one faces a deliberately imbalanced problem — one class against K−1 of them. One-vs-one trains K(K−1)/2 models, which grows quadratically, but each is a small balanced two-class problem. For K = 3 the difference is 3 versus 3; for K = 10 it is 10 versus 45.<br><br>A decision tree needs neither, because a leaf can hold any label.",
        },
        { type: "heading", level: 3, content: "Voting" },
        {
          type: "prose",
          html: "Simple voting: classification takes the <b>mode</b>, regression the <b>mean</b>. Weighted voting gives reliable models more say (weights from validation accuracy).",
        },
        {
          type: "table",
          headers: ["Model", "f1", "f2", "f3", "f4", "f5", "f6"],
          rows: [
            ["Predicted label", "1", "1", "2", "1", "3", "2"],
            ["Weight", "7", "5", "9", "5", "7", "9"],
          ],
        },
        {
          type: "prose",
          html: "Simple vote: label 1 wins 3–2–1. Weighted: label 1 = 7 + 5 + 5 = 17, label 2 = 9 + 9 = 18, label 3 = 7 → <b>label 2</b> wins. Weights can flip the decision.",
        },
        {
          type: "fix",
          html: "In the weighted regression example the slide multiplies f6 by 6 instead of its weight 9. With 9: (7.7 + 4.0 + 20.7 + 7.5 + 21.7 + 24.3) / 42 = 85.9 / 42 ≈ 2.05. The conclusion (≈ 2) holds either way.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the camera tree, printed as rules",
            code: `import pandas as pd
from sklearn.tree import DecisionTreeClassifier, export_text

df = pd.read_csv("camera_ratings_lecture.csv")
X = pd.get_dummies(df[["company", "color", "resolution_mp", "video_fps", "price_usd"]],
                   drop_first=True)
tree = DecisionTreeClassifier(criterion="entropy", max_depth=2).fit(X, df.rating_band)
print(export_text(tree, feature_names=list(X.columns)))

# The lecture's test camera: C2, Black, 15 MP, 30 fps, $350
test = pd.DataFrame([{"company_C2": 1, "color_White": 0,
                      "resolution_mp": 15, "video_fps": 30, "price_usd": 350}])
print(tree.predict(test[X.columns]))          # -> HIGH

# A stump, for comparison
stump = DecisionTreeClassifier(criterion="entropy", max_depth=1).fit(X, df.rating_band)
print("stump training accuracy", stump.score(X, df.rating_band).round(3))   # ~0.69`,
            caption:
              "`export_text` is the reason to reach for a tree at all — the model prints itself as readable rules, which no other model in this course can do.",
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
            "<b>Unconstrained depth.</b> A tree grown to purity memorises. Near-perfect train, weak test. Always set <code>max_depth</code> or <code>min_samples_leaf</code>, or prune.",
            "<b>Instability.</b> Change a few rows and the root split can change, reshaping the entire tree. Never present a single tree's structure as \"the\" explanation — the next module's forest exists partly because of this.",
            "<b>Diagonal boundaries.</b> Axis-aligned rectangles approximate a 45° line with a staircase, needing many splits for something a linear model does with two weights.",
            "<b>Pure interactions.</b> Greedy single-feature gain cannot find an XOR pair, because neither feature has any gain alone.",
            "<b>Extrapolation.</b> A regression tree's leaf predicts a mean, so it can never predict outside the range of its training targets. Linear models extrapolate; trees cannot.",
            "<b>Reading feature importances as causes.</b> They measure how much each feature reduced impurity in this fitted tree, and correlated features split the credit arbitrarily.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 8",
          detail:
            "ISLP chapter 8 builds regression trees first and classification trees second, covers cost-complexity pruning properly, and gives the clearest statement of trees-versus-linear-models: whichever one's assumption matches the true boundary wins.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data",
      blocks: [
        { type: "datasetPreview", dataset: "camera" },
        {
          type: "result",
          headers: ["Model", "What it does", "Result"],
          rows: [
            ["Decision stump (depth 1)", "Splits once, on Company", "69% training accuracy"],
            ["Depth-2 tree", "Company, then Price &lt; 500 inside each branch", "Test camera C2/$350 → <b>HIGH</b>"],
            ["Regression tree (1–5 rating)", "Variance reduction instead of IG", "Splits on video rate (0.14 &gt; 0.06)"],
          ],
        },
        {
          type: "prose",
          html: "The stump's 69% is worth holding onto as a baseline. The majority class is 63%, so one question buys six percentage points. That is a modest return, and it is honest — this dataset has a weak signal, which is exactly why the information gains were all small.",
        },
      ],
    },
    {
      id: "practice",
      kind: "practice",
      title: "Practice project",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            "Fit a depth-2 tree with <code>criterion=\"entropy\"</code> on the camera data and print its rules. <b>Success:</b> the root splits on company and you can read the four leaves.",
            "Predict the lecture's test camera — C2, Black, 15 MP, 30 fps, $350. <b>Success:</b> HIGH, and you can trace the path by hand.",
            "Fit a stump and report its training accuracy against the majority-class baseline. <b>Success:</b> ~69% versus 63%.",
            "Build a regression tree on the raw 1–5 rating and find which feature it splits on first. <b>Success:</b> video rate, matching the variance-reduction numbers.",
            "Work the weighted-voting example by hand, including the corrected f6 weight. <b>Success:</b> label 2 wins 18–17, and the regression average is ≈ 2.05.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Grow the camera tree to full depth and compare train and test accuracy against the depth-2 version. The gap is the instability the next chapter fixes.",
            "Fit one-vs-one and one-vs-rest logistic regression on all three iris species and count the models each strategy trained. Then check whether they agree on every prediction.",
            "Demonstrate the diagonal problem: generate two classes separated by a 45° line and compare a depth-10 tree with logistic regression. Plot both boundaries.",
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
            "Find the best split, split, repeat, stop when no split gains anything; a leaf predicts the mode.",
            "A tree's inductive bias is axis-aligned rectangles — a staircase for a diagonal.",
            "Classification: entropy → gain → mode. Regression: variance → reduction → mean.",
            "One-vs-one is a round-robin, K(K−1)/2 models. One-vs-all is you against the world, K models.",
            "Weighted voting can flip the simple-majority answer: 18 beats 17.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "What does a leaf predict in a classification tree, and in a regression tree?",
              a: "The mode of its training labels for classification, the mean of its training targets for regression. The split criterion changes the same way: entropy/gain becomes variance/variance-reduction.",
            },
            {
              q: "How many models does one-vs-one need for 10 classes?",
              a: "K(K − 1)/2 = 45. One-vs-all needs only 10, but each faces an imbalanced one-against-nine problem.",
            },
            {
              q: "Why can a greedy tree not learn XOR?",
              a: "Neither feature has any information gain on its own, so the first split finds nothing to pick. The pattern only exists in the interaction, and greedy single-feature search never evaluates it.",
            },
            {
              q: "Why can a regression tree not extrapolate?",
              a: "Every leaf predicts the mean of its training targets, so no prediction can ever fall outside the range of the training labels. A linear model has no such limit.",
            },
          ],
        },
      ],
    },
  ],
};
