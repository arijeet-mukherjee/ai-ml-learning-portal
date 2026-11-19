import type { Chapter } from "@/types/content";

export const projectPipeline: Chapter = {
  slug: "the-project-pipeline",
  title: "The pipeline every project follows",
  description:
    "Nine steps from framing the problem to choosing an operating point, in the order that keeps the test set honest.",
  icon: "⇥",
  order: 1,
  moduleId: "m7",
  estimatedMinutes: 16,
  prerequisites: ["the-cancer-pipeline"],
  sourceRefs: ["Module 1 ML Notebook.html § m7-pipe"],
  islpChapters: ["Ch 2", "Ch 5"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why the order is the content",
      blocks: [
        {
          type: "bigIdea",
          content:
            "Use this page the night before an exam or an interview. Every line points back to a module.",
        },
        {
          type: "prose",
          html: "You now know nine or ten algorithms. The thing that separates somebody who can use them from somebody who has read about them is not knowing another one — it is running the same nine steps in the same order, every time, without skipping the boring ones.<br><br>Most of the ways a project goes wrong are ordering mistakes, not modelling mistakes.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "The nine steps",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            "<b>Frame</b>: classification or regression? What mistake is costlier (FP or FN)? That fixes the metric.",
            "<b>Load and inspect</b>: shape, dtypes, info, describe, head. Fix numbers-stored-as-text.",
            "<b>EDA</b>: duplicates, missing values, class balance, histograms (skew), box plots (outliers), correlation heatmap.",
            "<b>Split</b> (stratified for classification). From here on, the test set is sealed.",
            "<b>Preprocess on train only</b>: impute, cap or impute outliers, encode categories (one-hot), scale (for linear models, SVM, PCA, k-NN; trees don't need it), drop redundant features.",
            "<b>Baseline</b>: majority class or a simple linear / logistic model.",
            "<b>Model + tune</b> with cross-validation inside a Pipeline.",
            "<b>Evaluate once</b> on test: the right metric, the train/test gap, the confusion matrix.",
            "<b>Threshold and explain</b>: choose the operating point; feature importance or coefficients.",
          ],
        },
        {
          type: "memoryHook",
          content: '"Fresh Lemons Excite Sour People But Make Excellent Tea"',
          detail: "Frame, Load, EDA, Split, Preprocess, Baseline, Model, Evaluate, Threshold.",
        },
        { type: "heading", level: 3, content: "Why each step sits where it does" },
        {
          type: "prose",
          html: "<b>Frame first, because the metric decides what \"better\" means.</b> If you choose the metric after seeing results you will choose the one that flatters them. Deciding that a missed tumour is worse than a false alarm takes one sentence and must happen before any code.",
        },
        {
          type: "prose",
          html: "<b>Split fourth, before any statistic is computed.</b> Every preprocessing step in step 5 — medians, fences, means, standard deviations, correlation matrices, PCA components, encodings — is learnt from data. Learn any of them from all the rows and the test set has influenced your model. This is the single rule that matters most, and Module 3 made it a graded point.",
        },
        {
          type: "prose",
          html: "<b>Baseline sixth, before anything complicated.</b> It costs two minutes and tells you the floor. On churn the majority baseline is 73% accurate — knowing that <i>before</i> you build an SVM is what stops you from celebrating 75%.",
        },
        {
          type: "prose",
          html: "<b>Evaluate once, eighth.</b> The test set is a measuring instrument and it is consumed by use. Every time you look at it and change something in response, the number it gives you drifts further from the truth.",
        },
        {
          type: "prose",
          html: "<b>Threshold last, ninth.</b> The operating point is a business decision made on validation data, and it is separable from fitting the model. Doing it last means you can change it later without retraining.",
        },
        {
          type: "table",
          headers: ["Step", "Where it was taught", "The mistake it prevents"],
          rows: [
            ["Frame", "Grading a classifier (M3)", "Choosing the metric that flatters the result"],
            ["Load &amp; inspect", "Pandas tables (M0)", "Modelling a column that is secretly text"],
            ["EDA", "Plotting (M0), Describing data (M1)", "Assuming a shape the data does not have"],
            ["Split", "The cancer pipeline (M3)", "Leakage — the big one"],
            ["Preprocess on train only", "Data challenges (M3)", "Leakage through a median or a scaler"],
            ["Baseline", "Class imbalance (M5)", "Celebrating a score the majority class already gets"],
            ["Model + tune in a Pipeline", "Model complexity (M3), Imbalance (M5)", "Leakage inside the cross-validation fold"],
            ["Evaluate once", "Model complexity (M3)", "Tuning on test"],
            ["Threshold &amp; explain", "Logistic regression (M4)", "Shipping 0.5 because it was the default"],
          ],
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "When people skip a step",
      blocks: [
        {
          type: "list",
          items: [
            "<b>Skipping Frame.</b> The commonest and the most expensive. You get a model that optimises accuracy on a problem where accuracy is meaningless.",
            "<b>Skipping Baseline.</b> You have no idea whether your model is good, only what number it produced.",
            "<b>Splitting late.</b> Everything downstream is contaminated and nothing warns you — the score just comes out a little too high.",
            "<b>Preprocessing outside the Pipeline.</b> Cross-validated scores become optimistic by an amount you cannot estimate.",
            "<b>Evaluating on test repeatedly.</b> Each look spends a little of the test set's value.",
            "<b>Stopping at step 8.</b> A model with no chosen operating point is not deployable; somebody downstream will pick 0.5 for you.",
          ],
        },
        {
          type: "trap",
          html: "Trees do not need scaling; linear models, SVMs, PCA, k-NN and K-means all do. Putting a scaler in front of a random forest is harmless but tells a reviewer you were following a recipe rather than thinking. Leaving it out of an SVM is a real bug.",
        },
        {
          type: "citation",
          source: "ISLP Ch 5",
          detail:
            "ISLP chapter 5 is the authority on step 7 — why cross-validation inside the training set is the right way to choose between models, and what goes wrong when the selection step sees the data it is later validated on.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "The pipeline on each course dataset",
      blocks: [
        {
          type: "table",
          headers: ["Dataset", "Frame", "Metric", "Needs scaling?", "Baseline"],
          rows: [
            [
              "Breast cancer (569)",
              "Binary classification; a miss is a missed tumour",
              "Recall, then F1",
              "Yes — linear, logistic, SVM, PCA",
              "62.7% (always benign)",
            ],
            [
              "Telco churn (7,043)",
              "Binary classification; a miss is a lost customer",
              "F1 on the churn class",
              "Yes for SVM, no for trees",
              "73% (nobody leaves)",
            ],
            [
              "Camera ratings (100)",
              "Binary classification, readable rules wanted",
              "Accuracy — balanced enough, and the tree is the deliverable",
              "No — it is a tree",
              "63% (always LOW)",
            ],
            [
              "Employees (240)",
              "Regression on salary, or EDA only",
              "MSE / MAE",
              "Only if regularised",
              "Mean salary",
            ],
            [
              "Students (300)",
              "Binary classification on pass, or EDA only",
              "Accuracy, classes are near-balanced",
              "Yes for logistic",
              "Majority of <code>passed</code>",
            ],
          ],
          caption:
            "Filling this table in for a new dataset is steps 1 to 3. It takes ten minutes and saves a day.",
        },
        { type: "datasetPreview", dataset: "churn" },
      ],
    },
    {
      id: "practice",
      kind: "practice",
      title: "Practice project",
      blocks: [
        {
          type: "prose",
          html: "Run all nine steps end to end on a dataset you have not used yet in this course — the student survey, predicting <code>passed</code>.",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Frame it in writing before any code: classification, which error is worse, which metric. <b>Success:</b> three sentences, committed to before you look at a score.",
            "Load, inspect and do EDA. <b>Success:</b> you can state the class balance and name the most skewed column.",
            "Split stratified, then build everything else inside a <code>Pipeline</code>. <b>Success:</b> no statistic is computed outside the fold.",
            "Establish the majority baseline. <b>Success:</b> you have a number to beat before you fit anything.",
            "Fit logistic regression and a random forest, tuned by cross-validation. <b>Success:</b> you report cross-validated scores, not test scores, for the comparison.",
            "Evaluate the winner on test exactly once, then choose a threshold on validation and justify it. <b>Success:</b> one test number, one defended operating point.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Deliberately break step 4: scale and impute before splitting, run the whole thing, and compare the test score with the honest version. The difference is what leakage buys you, and it is why reviewers look for it.",
            "Write the nine steps as a reusable function skeleton with the dataset-specific parts as arguments. Then run it on two course datasets without editing the body.",
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
            "Fresh Lemons Excite Sour People But Make Excellent Tea.",
            "Frame first: the metric comes from the cost of the mistake, decided before any code.",
            "Split fourth: every statistic afterwards is learnt from train only.",
            "Baseline sixth: know the floor before you celebrate a number.",
            "Evaluate once: the test set is a measuring instrument consumed by use.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Name the nine steps in order.",
              a: "Frame, Load and inspect, EDA, Split, Preprocess on train only, Baseline, Model and tune with cross-validation, Evaluate once on test, Threshold and explain.",
            },
            {
              q: "Why does the split come before preprocessing?",
              a: "Imputation values, outlier fences, scaler statistics, correlation matrices and PCA components are all learnt from data. Learning them from all rows lets the test set influence the model, which is leakage.",
            },
            {
              q: "Why bother with a baseline?",
              a: "It tells you the floor. On churn, 'nobody leaves' is 73% accurate, so a 75% model is almost worthless — and you cannot know that without the baseline.",
            },
            {
              q: "Which models in this course do not need scaling?",
              a: "Decision trees and their ensembles. Linear and logistic regression with a penalty, SVMs, PCA, k-NN and K-means all do.",
            },
          ],
        },
      ],
    },
  ],
};
