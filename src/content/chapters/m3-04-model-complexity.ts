import type { Chapter } from "@/types/content";

export const modelComplexity: Chapter = {
  slug: "model-complexity",
  title: "Model complexity, and how to hold data back",
  description:
    "Von Neumann's elephant, what overfitting actually looks like, train/validation/test, K-fold cross-validation and inductive bias.",
  icon: "∿",
  order: 4,
  moduleId: "m3",
  estimatedMinutes: 20,
  prerequisites: ["the-four-step-recipe"],
  sourceRefs: ["Module 1 ML Notebook.html § m3-complex"],
  islpChapters: ["Ch 2", "Ch 5"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why a better fit can be a worse model",
      blocks: [
        {
          type: "prose",
          html: "Von Neumann teased Fermi: \"With four parameters I can fit an elephant, and with five I can make him wiggle his trunk.\" Physicists later did exactly that, with four complex parameters. The joke is the whole lesson: a model with enough knobs can fit anything, including the noise.<br><br>Which means fitting the data you have is not evidence of anything. The only question that matters is how the model behaves on data it has never seen — and the only way to find out is to deliberately refuse to look at some of your data until the very end.",
        },
        {
          type: "prose",
          html: "Fitting a polynomial of degree 1, 10 and 40 to the same points: degree 1 underfits, degree 40 threads every point and goes wild between them. Both are wrong, in opposite directions, and only one of them looks wrong on the training set.",
        },
      ],
    },
    {
      id: "live",
      kind: "live",
      title: "Live: watch it memorise",
      blocks: [
        {
          type: "prose",
          html: "Raise the degree with no penalty and watch the two error numbers come apart. Training error falling while test error climbs <i>is</i> overfitting — not a metaphor for it, the definition.",
        },
        { type: "widget", lab: "poly" },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        { type: "heading", level: 3, content: "Train, validation, test" },
        {
          type: "memoryHook",
          content:
            "Training set = homework. Validation set = mock test. Test set = the board exam: sit it once, at the very end.",
        },
        {
          type: "prose",
          html: "Three sets because there are three different jobs, and using one set for two of them corrupts it.<br><br><b>Training</b> fits the weights. <b>Validation</b> chooses between models — which degree, which α, which C. <b>Test</b> estimates how the chosen model will behave in the world. The moment you use the test set to make a choice, it has become a validation set and your estimate is optimistic. Every \"we tried a few thresholds on the test set\" is this mistake.",
        },
        { type: "heading", level: 3, content: "K-fold cross-validation" },
        {
          type: "prose",
          html: "Split training data into K folds; train on K − 1, validate on the remaining one; rotate so every fold is validation once; average the K scores. Gives a steadier estimate than one split and uses all data for both roles.",
        },
        {
          type: "formula",
          title: "Why K-fold is steadier",
          lines: `one split:   one estimate, from one arbitrary 20% of the data
5-fold:      five estimates, averaged → lower variance
             every row is validated exactly once
             every row trains in K − 1 of the K fits

cost: K model fits instead of 1`,
        },
        {
          type: "prose",
          html: "How to choose K: 5 or 10 are the conventions. Larger K means each model trains on more data (less bias in the estimate) but the K estimates are more correlated and it costs more fits. K = n is leave-one-out, which is unbiased and expensive and noisy.",
        },
        { type: "heading", level: 3, content: "Inductive bias" },
        {
          type: "prose",
          html: "The assumptions a model makes <i>before</i> seeing data: a linear model assumes straight-line relations; a CNN assumes nearby pixels matter together; a decision tree assumes the answer can be reached by axis-aligned questions. No model learns without some.<br><br>This is not a flaw to be minimised. A model with no assumptions cannot generalise at all — it has no basis for preferring one explanation of the training data over another. Choosing a model <i>is</i> choosing an inductive bias, and the right one is the one whose assumptions match your problem.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the three splits, and K-fold inside the training half",
            code: `from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.linear_model import Ridge
import numpy as np

# 1. seal the test set, once, and never touch it again
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

# 2. choose alpha using cross-validation INSIDE the training half
kf = KFold(n_splits=5, shuffle=True, random_state=42)
for alpha in [0.01, 0.1, 1, 10, 100]:
    scores = cross_val_score(Ridge(alpha=alpha), X_train, y_train, cv=kf,
                             scoring="neg_mean_squared_error")
    print(alpha, round(-scores.mean(), 4), "+/-", round(scores.std(), 4))

# 3. refit the winner on all the training data, then score test ONCE
best = Ridge(alpha=1).fit(X_train, y_train)
print("test MSE", round(((best.predict(X_test) - y_test) ** 2).mean(), 4))`,
            caption:
              "The structure is the point: the test set appears on the first line and the last line and nowhere in between.",
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
          type: "trap",
          html: "<b>Preprocessing outside the fold.</b> If you scale or impute before cross-validating, every fold's \"validation\" rows have already influenced the scaler. The fix is a <code>Pipeline</code>, which refits the preprocessing inside each fold. Module 5's churn lab makes this a graded point.",
        },
        {
          type: "list",
          items: [
            "<b>Tuning on the test set.</b> The commonest sin, and it is invisible — the number just comes out too good. Once used for a decision, a test set is spent.",
            "<b>Not stratifying.</b> On an imbalanced label, a random split can give folds with very different class balances, making the K scores noisy for the wrong reason. <code>stratify=y</code> and <code>StratifiedKFold</code>.",
            "<b>Shuffling time series.</b> If rows are ordered in time, a random fold trains on the future to predict the past. Use a forward-chaining split instead.",
            "<b>Leaky duplicates.</b> If the same entity appears in several rows, random splitting puts it on both sides and the model recognises rather than generalises. Group the split by entity.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 5",
          detail:
            "ISLP chapter 5 is cross-validation and the bootstrap in full — including the bias–variance trade-off of choosing K, and why leave-one-out is not automatically the best choice.",
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
          type: "result",
          headers: ["Model", "Train", "Test"],
          rows: [
            ["Linear, degree 1", "95.8%", "<b>98.2%</b>"],
            ["Linear, degree 3 (thousands of features)", "100.0%", "75.4%"],
            ["Ridge, degree 3 (α = 10⁴)", "90.5%", "90.4%"],
            ["Lasso, degree 3 (40 active weights)", "96.9%", "96.5%"],
            ["Logistic regression", "97.1%", "<b>98.2%</b>"],
          ],
          caption:
            "From the Module 4 notebook on this dataset. 100% train with 75% test is the textbook signature of overfitting: the model memorised.",
        },
        {
          type: "prose",
          html: "Read that table as a diagnosis exercise rather than a results table. Row 1: train below test — no overfitting at all, and arguably room to add complexity. Row 2: a 24.6-point gap — memorising. Rows 3 and 4: the gap closed by a penalty, at a cost in row 3 and almost free in row 4. Row 5: the best of both, which is why logistic regression is the baseline you should always try.",
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
            "Split the breast-cancer data 80/20 with <code>stratify=y</code> and confirm both halves keep the 62.7/37.3 balance. <b>Success:</b> the class proportions match to within a point.",
            "Run 5-fold cross-validation over five values of Ridge's α inside the training half. <b>Success:</b> you report mean and standard deviation per α and pick a winner on the mean.",
            "Score the chosen model on test exactly once. <b>Success:</b> you can state why re-running this with a different α would invalidate the number.",
            "Reproduce the degree-1 versus degree-3 gap from the table. <b>Success:</b> you see train rise to ~100% and test fall, and you can say how many features degree 3 created.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Build the same α sweep twice — once with <code>StandardScaler</code> fitted outside the folds and once inside a <code>Pipeline</code> — and compare the cross-validated scores. The gap between them is the size of the leak.",
            "Plot a validation curve: training and cross-validated score against polynomial degree, on the same axes. Mark the degree where they diverge; that point is the capacity this dataset can support.",
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
            "Training = homework, validation = mock test, test = the board exam, sat once.",
            "Overfitting is not a metaphor: it is training error falling while test error rises.",
            "K-fold averages K estimates so the number stops depending on one arbitrary split.",
            "Preprocessing belongs inside the fold, which means inside a Pipeline.",
            "Inductive bias is not a flaw — without assumptions there is no generalisation.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Train 100%, test 75%. What is happening and what do you do?",
              a: "Overfitting — the model has memorised. Reduce complexity, add regularisation, get more data, or select features. The gap, not either number alone, is the diagnosis.",
            },
            {
              q: "Why have a validation set as well as a test set?",
              a: "Validation chooses between models; test estimates real-world performance. Making a choice using the test set turns it into a validation set and makes the estimate optimistic.",
            },
            {
              q: "What does K-fold buy you over a single split?",
              a: "A lower-variance estimate: every row is validated exactly once and the K scores are averaged, so the result stops depending on which arbitrary 20% you held out. It costs K fits.",
            },
            {
              q: "Why must scaling happen inside the cross-validation loop?",
              a: "A scaler fitted on all the training data has seen each fold's validation rows, so the validation score is contaminated. A Pipeline refits it per fold.",
            },
          ],
        },
      ],
    },
  ],
};
