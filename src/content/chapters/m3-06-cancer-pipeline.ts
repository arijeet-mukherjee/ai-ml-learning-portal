import type { Chapter } from "@/types/content";

export const cancerPipeline: Chapter = {
  slug: "the-cancer-pipeline",
  title: "Notebook: the breast-cancer linear classifier",
  description:
    "The seven-step workflow you will reuse on every project, split-before-you-fit, and why imputing outliers moved accuracy from 95.6% to 98.2%.",
  icon: "⚕",
  order: 6,
  moduleId: "m3",
  estimatedMinutes: 26,
  prerequisites: ["grading-a-classifier", "data-challenges"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m3-lab",
    "DAY3/dataset.csv",
    "Module_1_Study_Guide.md",
  ],
  islpChapters: ["Ch 3", "Ch 4"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why this one notebook is worth memorising",
      blocks: [
        {
          type: "prose",
          html: "Everything in Module 3 so far has been a piece. This is the assembly — the workflow you will reuse, in this order, on every project for the rest of the course and after it.<br><br>569 patients, 30 numeric cell-nucleus features, label Benign (62.7%) / Malignant (37.3%). Nothing exotic. What makes it worth studying is the <i>order</i> of the steps, because getting the order wrong is how you produce a model that scores well and does not work.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "The seven steps",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            "<b>EDA</b>: shape, drop <code>id</code>, duplicates, missing values, class balance, histograms, IQR outliers.",
            "<b>Split first</b> (80/20, <code>stratify=y</code>), so the test set never leaks into any statistic.",
            "<b>Impute outliers</b> with the training median (non-outlier values only); apply the same fences and value to test.",
            "<b>Scale</b> with StandardScaler: fit on train, transform test.",
            "<b>Drop redundant features</b> with |correlation| &gt; 0.9.",
            "<b>Model</b>: LinearRegression on labels −1/+1, then predict Malignant if output &gt; 0.",
            "<b>Evaluate</b>: accuracy, precision, recall, F1, confusion matrix.",
          ],
        },
        {
          type: "memoryHook",
          content: '"Split before you fit."',
          detail:
            "Any number computed from data (median, mean, std, correlation, fences) must be learnt on train only. Otherwise the test set has leaked into your model.",
        },
        {
          type: "prose",
          html: "Step 2 being second is the entire discipline. Notice what it forces: the IQR fences in step 3, the mean and standard deviation in step 4, and the correlation matrix in step 5 are <i>all</i> statistics, and all three are learnt from the training half and then applied unchanged to test. If you reorder step 2 to the end, every one of those three is contaminated.",
        },
        { type: "heading", level: 3, content: "Why −1/+1 and a threshold of zero" },
        {
          type: "prose",
          html: "Linear regression predicts a number, not a class. Encoding the label as −1 and +1 rather than 0 and 1 means the <i>sign</i> of the prediction is the class: anything above zero leans malignant, anything below leans benign. The decision boundary is <code>w·x + b = 0</code>, which is also exactly the boundary a linear classifier and an SVM will use in Module 5. Using 0/1 would put the boundary at 0.5 and change nothing of substance — but the sign convention makes the geometry visible.",
        },
        {
          type: "trap",
          html: "This is a <i>regression</i> model doing <i>classification</i>, and the output is not a probability. A prediction of 2.4 does not mean \"more malignant than\" a prediction of 1.1 in any calibrated sense. Logistic regression, in Module 4, fixes exactly this.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the whole pipeline, in order",
            code: `import numpy as np, pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix

df = pd.read_csv("breast_cancer.csv", index_col=0).drop(columns="id")
print(df.duplicated().sum(), df.isna().sum().sum())
print(df["diagnosis"].value_counts(normalize=True))     # B 0.627, M 0.373

X = df.drop(columns="diagnosis")
y = np.where(df["diagnosis"] == "M", 1, -1)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)   # SPLIT FIRST
X_train, X_test = X_train.copy(), X_test.copy()

for col in X.columns:                                    # IQR outliers -> train median
    q1, q3 = X_train[col].quantile([0.25, 0.75]); iqr = q3 - q1
    lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    mask = (X_train[col] < lo) | (X_train[col] > hi)
    if mask.any():
        med = X_train.loc[~mask, col].median()
        X_train.loc[mask, col] = med
        X_test.loc[(X_test[col] < lo) | (X_test[col] > hi), col] = med

scaler = StandardScaler()
X_train[:] = scaler.fit_transform(X_train)               # fit on train only
X_test[:]  = scaler.transform(X_test)

corr = X_train.corr().abs()
upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
drop = [c for c in upper.columns if (upper[c] > 0.9).any()]
X_train, X_test = X_train.drop(columns=drop), X_test.drop(columns=drop)

model = LinearRegression().fit(X_train, y_train)
y_pred = np.where(model.predict(X_test) > 0, 1, -1)       # threshold 0 between -1 and +1

print("acc", (y_pred == y_test).mean())
print("P", precision_score(y_test, y_pred), "R", recall_score(y_test, y_pred), "F1", f1_score(y_test, y_pred))
print(confusion_matrix(y_test, y_pred, labels=[1, -1]))`,
            caption:
              "Three details worth copying: `fit_transform` on train and bare `transform` on test; the fences computed from train and reused on test; and `np.triu` to read only the upper half of the correlation matrix so each pair is considered once.",
          },
        },
        {
          type: "prose",
          html: "The <code>np.triu</code> line deserves a sentence. A correlation matrix is symmetric, so every pair appears twice. Masking to the strictly upper triangle (<code>k=1</code>, which also removes the diagonal of 1.0s) means each pair is tested once and a feature is dropped once rather than both members of a pair being dropped.",
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
            "<b>Scaling before splitting.</b> The mean and std then include test rows. The score comes out slightly too good and nothing warns you.",
            "<b>Computing fences on all the data.</b> Same problem, less obvious — the fences are quantiles, which are statistics.",
            "<b>Forgetting <code>.copy()</code>.</b> <code>train_test_split</code> returns views into the original frame, so assigning into <code>X_train</code> can raise <code>SettingWithCopyWarning</code> or silently edit <code>X</code>.",
            "<b>Dropping both members of a correlated pair.</b> Without the triangular mask you remove the information entirely instead of removing the duplication.",
            "<b>Skipping <code>stratify=y</code>.</b> With a 63/37 split a random draw can hand you an unrepresentative test set, and the score moves for a reason that has nothing to do with your model.",
          ],
        },
        {
          type: "gradedDetail",
          html: "The Assignment-1 rubric checks this order. Preprocessing computed on the full dataset, or a test set used more than once, costs marks even when the final number looks right.",
        },
        {
          type: "citation",
          source: "ISLP Ch 4",
          detail:
            "ISLP chapter 4 explains why regressing a 0/1 or −1/+1 label works but is not ideal — the fitted values are not constrained to a probability range, and with more than two classes the arbitrary numeric ordering of the labels starts to matter.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "The results, and what they mean",
      blocks: [
        { type: "datasetPreview", dataset: "cancer" },
        {
          type: "result",
          headers: ["Impute outliers", "Features kept", "Accuracy", "Precision", "Recall", "F1"],
          rows: [
            ["No", "20", "95.6%", "1.00", "0.88", "0.94"],
            ["Yes", "25", "<b>98.2%</b>", "1.00", "<b>0.95</b>", "0.98"],
          ],
        },
        {
          type: "prose",
          html: "Precision 1.00 means no benign patient was flagged; every error is a missed cancer, so recall is the metric to chase. Imputing outliers rather than leaving them raised recall from 0.88 to 0.95 — in a test set of 114 patients that is roughly three fewer missed tumours.",
        },
        {
          type: "prose",
          html: "The feature count also moved, 20 → 25, and that is a second-order effect worth understanding: capping extreme values changes the correlations between columns, so fewer pairs cross the 0.9 threshold and fewer features get dropped. The two preprocessing steps are not independent.",
        },
        {
          type: "deepDive",
          summary: "Take-home answers (from the notebook)",
          blocks: [
            {
              type: "prose",
              html: "<b>1. Why impute outliers after splitting?</b> The fences (Q1, Q3) and the replacement median are statistics. If you compute them on all 569 rows, test rows influence the values used to clean training rows: that's data leakage, and your test score becomes optimistic.",
            },
            {
              type: "prose",
              html: "<b>2. Which datasets can a linear classifier separate?</b> Those where one straight line (a hyperplane in higher D) puts every point of one class on one side. Two blobs: yes. Concentric rings, XOR checkerboards, spirals: no, unless you transform the features first.",
            },
            {
              type: "prose",
              html: "<b>3. Skewed features?</b> Spot with <code>df.skew()</code> (|skew| &gt; 1 is strong), histograms with a long tail, or mean far from median. Fix with log (<code>np.log1p</code>), square-root, Box-Cox / Yeo-Johnson (<code>PowerTransformer</code>), or use tree models that don't care.",
            },
            {
              type: "prose",
              html: "<b>4. Vary corr_threshold 0.8 → 0.4</b>: lower thresholds drop more features. Performance usually holds steady until you start removing genuinely informative features, then recall falls. Plot threshold vs F1 to see the knee.",
            },
          ],
        },
      ],
    },
    {
      id: "practice",
      kind: "practice",
      title: "Practice project",
      blocks: [
        {
          type: "prose",
          html: "Rebuild the pipeline from scratch, in order, without copying the code above. This is the project that makes Module 3 stick.",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Load, drop <code>id</code> and the index column, check duplicates and missing values, print the class balance. <b>Success:</b> (569, 31), zero duplicates, zero missing, 62.7/37.3.",
            "Split 80/20 stratified before touching anything else. <b>Success:</b> both halves keep the balance, and you can say what would break if you split last.",
            "Impute outliers with the training median of non-outlier values, applying the same fences to test. <b>Success:</b> you can name how many values were replaced per column.",
            "Scale, then drop features with |r| &gt; 0.9 using a triangular mask. <b>Success:</b> you keep 25 features, matching the notebook.",
            "Fit <code>LinearRegression</code> on −1/+1 labels, predict with threshold 0, and report all four metrics plus the confusion matrix. <b>Success:</b> accuracy ≈ 98.2%, precision 1.00, recall ≈ 0.95.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Run the whole thing twice, with and without step 3, and reproduce the 95.6% versus 98.2% gap. Then count the missed tumours in each confusion matrix and state the difference in patients.",
            "Sweep the correlation threshold from 0.9 down to 0.4, recording features kept and F1 at each. Plot it and find the knee.",
            "Rebuild steps 3–6 as a scikit-learn <code>Pipeline</code> so the whole thing can be cross-validated without leaking. This is the form Module 5 will require.",
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
            "Split before you fit — every statistic afterwards is learnt from train only.",
            "fit_transform on train, bare transform on test. Always.",
            "−1/+1 labels make the sign of the prediction the class, and the boundary w·x + b = 0.",
            "Impute the outlier value, keep the row: 95.6% → 98.2%.",
            "Precision 1.00 means every error is a miss, so recall is the headline.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Why impute outliers after splitting rather than before?",
              a: "The fences and the replacement median are statistics. Computing them on all 569 rows lets test rows influence how training rows are cleaned — leakage, which makes the test score optimistic.",
            },
            {
              q: "What kind of dataset can a linear classifier separate?",
              a: "One where a single hyperplane puts every point of one class on one side. Two blobs, yes; concentric rings, XOR or a spiral, no — unless you transform the features first.",
            },
            {
              q: "Why does the feature count change from 20 to 25 when you impute outliers?",
              a: "Capping extreme values changes the correlations between columns, so fewer pairs exceed the 0.9 threshold and fewer features are dropped. The preprocessing steps interact.",
            },
            {
              q: "Why is this model's output not a probability?",
              a: "It is linear regression on a −1/+1 label, so the fitted value is unbounded and uncalibrated. Logistic regression applies a sigmoid precisely to make the output a probability.",
            },
          ],
        },
      ],
    },
  ],
};
