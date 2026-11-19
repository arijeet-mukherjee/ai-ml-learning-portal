import type { Chapter } from "@/types/content";

export const baggingAndForest: Chapter = {
  slug: "bagging-and-random-forest",
  title: "Bagging and random forest",
  description:
    "Why averaging halves variance, the bootstrap and the 36.8% rule, feature bagging, and the result that bagging linear regression does nothing.",
  icon: "⊞",
  order: 3,
  moduleId: "m6",
  estimatedMinutes: 24,
  prerequisites: ["growing-decision-trees", "bias-and-variance"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m6-bag, m6-rf, m6-nb",
    "Module_1_Study_Guide.md § Part 4",
  ],
  islpChapters: ["Ch 5", "Ch 8"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why a committee beats an expert",
      blocks: [
        {
          type: "prose",
          html: "A deep decision tree is a high-variance model: change a few training rows and the whole tree reshapes. The previous chapter listed that as a disadvantage. This chapter turns it into the engine of the best tabular models in use.<br><br>The insight is that instability is only a problem for <i>one</i> tree. Train many trees that are each unstable in a <i>different</i> way, and their individual errors are partly random — so averaging cancels them.",
        },
        {
          type: "memoryHook",
          content:
            "Bagging = a committee of slightly different experts. Each overfits in its own way, the vote cancels the quirks.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        { type: "heading", level: 3, content: "Why averaging helps" },
        {
          type: "formula",
          title: "The variance of an average",
          lines: `Var((X₁ + X₂)/2) = ¼Var(X₁) + ¼Var(X₂) + ½Cov(X₁, X₂)

with zero covariance:  = ½ Var   → half the variance
with high covariance:  → barely any reduction at all`,
        },
        {
          type: "prose",
          html: "That one line explains everything else in the chapter. Average K <i>independent</i> predictions and variance falls by a factor of K. But the covariance term does not vanish on its own, and if the models are similar it dominates — which is exactly what happens to bagged trees when one feature is overwhelmingly predictive, and exactly what random forests fix.",
        },
        { type: "heading", level: 3, content: "Bootstrap" },
        {
          type: "prose",
          html: "But we only have one training set. <b>Bootstrap</b>: draw N rows <i>with replacement</i> from the N we have. Some rows appear twice or three times, others not at all. Repeat to get K different training sets, train a model on each, vote.",
        },
        { type: "widget", lab: "boot" },
        {
          type: "formula",
          title: "The 36.8% rule",
          lines: `P(a given row is never picked in N draws) = (1 − 1/N)ᴺ → 1/e ≈ 0.368
so each bootstrap sample leaves out ~1/3 of the rows: the "out-of-bag" (OOB) set,
a free validation set`,
        },
        {
          type: "prose",
          html: "Derive it once and it stops being a magic number. One draw misses a given row with probability (1 − 1/N). N independent draws all miss it with probability (1 − 1/N)ᴺ, and that expression converges to 1/e as N grows. So roughly 36.8% of rows are left out of each bootstrap sample and 63.2% are included — which is the <b>10,449 / 16,512 = 63.3%</b> the study guide measured.",
        },
        {
          type: "prose",
          html: "The practical payoff is the out-of-bag score. Each tree has a third of the data it never saw, so you can evaluate it on that third — and averaging over all trees gives a validation estimate without holding anything out. <code>oob_score=True</code> gets it for free.",
        },
        { type: "heading", level: 3, content: "Random forest" },
        {
          type: "prose",
          html: "Bagged trees still look alike if one feature (contract type, tenure) dominates every split. Their errors correlate, so the ½Cov term keeps variance high. Random forest adds <b>feature bagging</b>: at each split, a tree may only look at a random subset of features (typically √p for classification). Trees disagree more, the vote cancels more noise.",
        },
        {
          type: "table",
          headers: ["Method", "Randomises", "Mainly reduces"],
          rows: [
            ["Single deep tree", "nothing", "(high variance)"],
            ["Bagging", "rows", "variance"],
            ["Random forest", "rows + features at every split", "variance, more strongly"],
            [
              "Boosting (next: AdaBoost, Gradient Boosting, XGBoost)",
              "focuses on previous mistakes, trains sequentially",
              "bias",
            ],
          ],
        },
        {
          type: "memoryHook",
          content:
            "Bagging is a Parallel Panel (variance ↓). Boosting is Sequential Tutoring: each new tree studies the last one's mistakes (bias ↓).",
        },
        {
          type: "prose",
          html: "Feature bagging is deliberately <i>handicapping</i> each tree, which sounds perverse. The point is in the covariance term: a tree forbidden from using the dominant feature at a split has to find a different question, so it makes different mistakes. Each tree is individually worse and the ensemble is better.<br><br><b>The whole algorithm, in plain steps</b> — for t = 1 … T: (1) draw a bootstrap sample of N rows with replacement; (2) grow a deep tree on it, but at every split only consider a random subset of max_features columns; (3) keep the tree. To predict: run the new point down all T trees and take the majority vote (or the average probability). No tree is pruned; the averaging does the job pruning would have done.",
        },
        {
          type: "widget",
          lab: "forest",
          caption:
            "Start with 1 tree, then slide to 25 and compare the two panels: the single tree's jagged islands around noisy points versus the forest's smooth vote. Then switch both randomness options off — every tree becomes identical and the forest is no better than one tree. At the defaults, tree #1 alone scores 84.0% on the held-out points and the 25-tree forest 92.0%; with both switches off, every tree (and so the forest) scores 87.3%.",
        },
        {
          type: "prose",
          html: "Why voting works, with numbers: suppose each of 25 independent trees is right 65% of the time on some hard point. The majority (13 or more) is right whenever at least 13 of the 25 are right, which happens about <b>94%</b> of the time — a binomial sum. Real trees are not independent, so the gain is smaller, and that is exactly why the forest works so hard (bootstrap rows, random features) to make them disagree.",
        },
        {
          type: "trap",
          html: "More trees never overfits a random forest — it only costs time. <code>n_estimators</code> is the one knob in this course that does not trade off against anything, which is why it does not appear in the complexity table in Module 7.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "tree, bagging, forest, compared",
            code: `import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import BaggingClassifier, RandomForestClassifier
from sklearn.metrics import f1_score
import matplotlib.pyplot as plt

def report(name, m):
    m.fit(X_train, y_train)
    tr, te = f1_score(y_train, m.predict(X_train)), f1_score(y_test, m.predict(X_test))
    print(f"{name:<28} train F1 {tr:.3f}  test F1 {te:.3f}  gap {tr - te:.3f}")
    return m

report("Tree (gini, unconstrained)", DecisionTreeClassifier(class_weight="balanced", random_state=42))
report("Tree (entropy)", DecisionTreeClassifier(criterion="entropy", class_weight="balanced", random_state=42))
report("Tree (max_depth=5)", DecisionTreeClassifier(max_depth=5, class_weight="balanced", random_state=42))
report("Bagging (200 trees)", BaggingClassifier(
    estimator=DecisionTreeClassifier(min_samples_split=10, class_weight="balanced"),
    n_estimators=200, max_samples=0.7, bootstrap=True, oob_score=True, random_state=42))
rf = report("Random forest", RandomForestClassifier(
    n_estimators=200, min_samples_split=10, class_weight="balanced",
    max_features="sqrt", random_state=42, n_jobs=-1))

imp = pd.Series(rf.feature_importances_, index=X_train.columns).nlargest(10)
imp.plot(kind="barh"); plt.title("Top 10 features"); plt.show()`,
            caption:
              "`max_features=\"sqrt\"` is the feature bagging. Remove it and a RandomForestClassifier becomes plain bagging — which is a one-line experiment worth running.",
          },
        },
        {
          type: "prose",
          html: "<code>class_weight=\"balanced\"</code> inside a tree does something concrete to the split criterion. In an 8-stay / 2-churn node, the weights are 10/(2×8) = 0.625 and 10/(2×2) = 2.5, so the effective counts become 5 and 5 and the node's Gini rises from 0.32 to 0.50. The tree now has a reason to separate the churners.",
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "When bagging does nothing",
      blocks: [
        {
          type: "prose",
          html: "This is the most instructive result in the whole assessment, and it looks like a bug the first time you see it.",
        },
        {
          type: "result",
          headers: ["Models averaged", "Test MSE"],
          rows: [
            ["1", "0.5566"],
            ["2", "0.5569"],
            ["3", "0.5535"],
            ["4", "0.5538"],
            ["2 → 30 (every even n)", "flat, <b>0.553–0.558</b> throughout"],
          ],
          caption:
            "Bagging over linear regression on California housing. Study guide Part 4, Q17–Q21.",
        },
        {
          type: "prose",
          html: "<b>Why the curve is flat:</b> the base learner is linear regression — a low-variance, stable model. Bootstrap resamples barely change its fitted line, so the thirty models are nearly identical. The covariance term in the variance formula is almost as large as the variance itself, so averaging cancels nothing. <b>Bagging only reduces variance, and there was no variance to reduce.</b>",
        },
        {
          type: "prose",
          html: "That flat curve is the <i>correct</i> answer, not a mistake in your code. Swap in a deep decision tree and the curve drops clearly, because a deep tree is exactly the unstable learner bagging was designed for. Be ready to say this in a viva.",
        },
        {
          type: "gradedDetail",
          html: "Assignment-1 Part 4 (Q16–Q21) graded details: write <code>get_random_indices</code> with <code>rng.choice(n, size=n, replace=True)</code> and the test set is <b>never</b> resampled. Average the <b>predictions</b> and then compute MSE once — that is different from averaging the individual MSEs, and the solution notebook prints both for Q21 to cover either reading. Each model and each loop iteration needs <b>new</b> random indices (the rubric says \"new models trained\" per iteration). Q21 loops <code>range(2, 31, 2)</code> and plots train and test MSE against n.",
        },
        {
          type: "list",
          items: [
            "<b>Bagging a stable learner.</b> As above — no variance, no benefit, and you have paid K times the compute.",
            "<b>Reading feature importances as causes.</b> They measure impurity reduction in this forest; correlated features split the credit arbitrarily, and a feature can look unimportant simply because a correlated twin absorbed the splits.",
            "<b>Trusting OOB when the data is tiny.</b> With few rows each tree's out-of-bag set is small and the estimate is noisy.",
            "<b>Expecting a forest to extrapolate.</b> Every leaf still predicts a mean, so a regression forest is still bounded by its training targets.",
            "<b>Losing interpretability silently.</b> A forest is 200 trees. If someone needs rules they can read, a shallow tree is the deliverable and the forest is the benchmark.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 8",
          detail:
            "ISLP chapter 8 covers bagging, random forests, out-of-bag error and boosting in sequence, with the same √p default for classification and the same explanation of why decorrelating the trees matters more than averaging more of them.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data",
      blocks: [
        { type: "datasetPreview", dataset: "churn" },
        {
          type: "list",
          items: [
            "<b>Unconstrained tree:</b> near-perfect train F1, weak test F1. High variance.",
            "<b>Bagging (200 trees, 70% samples, min_samples_split=10):</b> train F1 drops, test F1 rises, gap shrinks.",
            "<b>Random forest:</b> same idea plus decorrelated trees, usually the most stable.",
          ],
        },
        {
          type: "prose",
          html: "Note what happens to the <i>training</i> score: it falls. An ensemble is not a way to fit the training data better — it is a way to fit it less and generalise more. If your ensemble's training score goes up, something is wrong.",
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
            "Reproduce Assignment Q16–Q21: write <code>get_random_indices</code>, train n models for n = 2, 4, …, 30, average the predictions, and plot train and test MSE against n. <b>Success:</b> a flat curve around 0.553–0.558, and you can explain why that is correct.",
            "Count the unique rows in one bootstrap sample of the training set. <b>Success:</b> about 63%, matching 10,449 / 16,512.",
            "Swap the base learner for <code>DecisionTreeRegressor(max_depth=None)</code> and redraw the curve. <b>Success:</b> it drops clearly, and you can say which term in the variance formula moved.",
            "On the churn data, run tree / bagging / forest and tabulate train F1, test F1 and the gap. <b>Success:</b> the gap shrinks left to right while test F1 rises.",
            "Set <code>max_features=None</code> on the forest to turn off feature bagging. <b>Success:</b> it performs like plain bagging, demonstrating what the decorrelation was buying.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Verify the 36.8% rule empirically: for N = 10, 100, 1000, draw 2,000 bootstrap samples each and plot the average left-out fraction converging on 1/e.",
            "Compare the forest's <code>oob_score_</code> with a proper 5-fold cross-validated score on the same data. They should be close — that closeness is why OOB is useful.",
            "Fit <code>GradientBoostingClassifier</code> on churn and compare its train/test gap with the forest's. Boosting should reduce bias and show a different failure mode.",
          ],
        },
        {
          type: "deepDive",
          summary: "Go deeper: boosting and XGBoost (post-read preview)",
          blocks: [
            {
              type: "prose",
              html: "<b>AdaBoost</b> trains small trees (often stumps) one after another, increasing the weight of examples the previous tree got wrong. The final vote weights each tree by its accuracy.",
            },
            {
              type: "prose",
              html: "<b>Gradient boosting</b> fits each new tree to the <i>residuals</i> (errors) of the ensemble so far, a form of gradient descent in function space. A learning rate shrinks each tree's contribution.",
            },
            {
              type: "prose",
              html: "<b>XGBoost / LightGBM</b> are fast, regularised gradient-boosting libraries. On tabular business data (churn, credit risk, demand), they are usually the model to beat.",
            },
            {
              type: "prose",
              html: "Key knobs: <code>n_estimators</code> (more trees), <code>learning_rate</code> (smaller = slower but safer), <code>max_depth</code> (3–8 typical), <code>subsample</code> and <code>colsample_bytree</code> (bagging-style randomness).",
            },
            {
              type: "trap",
              html: "Unlike a random forest, boosting <i>can</i> overfit with too many trees, because each one is fitted to the previous ensemble's errors. <code>n_estimators</code> stops being a free knob the moment you switch from bagging to boosting.",
            },
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
            "Bagging is a Parallel Panel (variance ↓). Boosting is Sequential Tutoring (bias ↓).",
            "Averaging halves variance only when the models are uncorrelated — the covariance term is the whole story.",
            "(1 − 1/N)ᴺ → 1/e ≈ 0.368 left out, 63.2% in. Measured: 10,449 / 16,512.",
            "Feature bagging handicaps each tree so the ensemble disagrees more and cancels more.",
            "Bagging linear regression does nothing: there was no variance to reduce. The flat curve is correct.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Why did bagging not improve linear regression?",
              a: "Linear regression is low-variance and stable, so bootstrap resamples barely change the fitted line and all the models are nearly identical. Bagging only reduces variance, and there was almost none. Test MSE stayed flat at 0.553–0.558 from 1 to 30 models.",
            },
            {
              q: "Why about 63% unique rows in a bootstrap sample?",
              a: "The chance a given row is never picked in N draws is (1 − 1/N)ᴺ, which tends to 1/e ≈ 0.368. So 63.2% are included — measured as 10,449 of 16,512.",
            },
            {
              q: "What does a random forest add to bagging, and why?",
              a: "Feature bagging — only a random subset of features (typically √p) is considered at each split. Bagged trees correlate when one feature dominates, and the covariance term then blocks the variance reduction; restricting features decorrelates them.",
            },
            {
              q: "Does adding more trees overfit a random forest?",
              a: "No — it only costs time. Boosting is different: each tree fits the previous ensemble's errors, so too many trees can overfit there.",
            },
          ],
        },
      ],
    },
  ],
};
