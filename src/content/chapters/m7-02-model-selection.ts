import type { Chapter } from "@/types/content";

export const modelSelection: Chapter = {
  slug: "model-and-metric-selection",
  title: "Which model when, which metric when, which way each knob turns",
  description:
    "The three lookup tables worth memorising, plus the train/test gap diagnosis that tells you which direction to move.",
  icon: "⌸",
  order: 2,
  moduleId: "m7",
  estimatedMinutes: 18,
  prerequisites: ["the-project-pipeline"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m7-models, m7-metrics, m7-knobs, m7-overfit",
  ],
  islpChapters: ["Ch 2", "Ch 6", "Ch 8", "Ch 9"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why three tables and not a flowchart",
      blocks: [
        {
          type: "prose",
          html: "There is no decision tree for choosing a model, and anyone who gives you one has hidden the judgement rather than removed it. What there is: a handful of properties worth checking (how many rows, how many features, is the boundary curved, does a human need to read the result, what does a mistake cost) and a reliable sense of which knob moves complexity in which direction.<br><br>These three tables are that sense, written down. They are the densest page in the portal and the one to read the night before anything.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "Which model when",
      blocks: [
        {
          type: "table",
          headers: ["Model", "Reach for it when", "Avoid when", "Needs scaling?"],
          rows: [
            [
              "Linear regression",
              "Numeric target, roughly linear, need interpretability",
              "Strong curves, many outliers",
              "For regularised versions",
            ],
            [
              "Ridge / Lasso",
              "Many features, overfitting; Lasso to select features",
              "Few features, no overfitting",
              "Yes",
            ],
            [
              "Logistic regression",
              "Binary classification baseline, probabilities, explainable coefficients",
              "Complex non-linear boundaries (without feature engineering)",
              "Yes",
            ],
            ["Linear SVM", "High-dimensional data (text), clear margin", "Need calibrated probabilities", "Yes"],
            ["RBF SVM", "Medium-sized data with curved boundaries", "Hundreds of thousands of rows (slow)", "Yes, essential"],
            [
              "Decision tree",
              "Need rules a manager can read; mixed feature types",
              "Need stable accuracy (high variance)",
              "No",
            ],
            [
              "Random forest",
              "Strong tabular default with little tuning",
              "Need a tiny, fast, explainable model",
              "No",
            ],
            [
              "Gradient boosting / XGBoost",
              "Best accuracy on tabular data",
              "Very small or noisy data without tuning",
              "No",
            ],
            [
              "PCA (preprocessing)",
              "Too many correlated features, visualise in 2D, compress embeddings",
              "Need to keep named features",
              "Yes, essential",
            ],
          ],
        },
        {
          type: "prose",
          html: "A shorter version for when you are under time pressure: <b>start with logistic regression or linear regression</b>, because it is fast, interpretable and tells you the floor. <b>Then try a random forest</b>, because it is the strongest thing you can get with almost no tuning. If the forest barely beats the linear model, the relationship is close to linear and you should keep the linear model. If it beats it by a lot, there is structure worth pursuing with boosting.",
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "Which metric when, and which way each knob turns",
      blocks: [
        {
          type: "table",
          headers: ["Situation", "Metric"],
          rows: [
            ["Balanced classes, mistakes cost the same", "Accuracy"],
            ["Missing a positive is costly (disease, fraud, churn, missile)", "Recall"],
            ["False alarms are costly (spam, unnecessary surgery, legal flags)", "Precision"],
            ["Imbalanced, both matter", "F1 (or PR-AUC)"],
            ["Regression, big errors very bad", "MSE / RMSE"],
            ["Regression, robust to outliers", "MAE"],
          ],
        },
        { type: "heading", level: 3, content: "Which way does each knob turn complexity?" },
        {
          type: "table",
          headers: ["Knob", "More complex (risk overfit) when…"],
          rows: [
            ["Polynomial degree", "higher"],
            ["Ridge / Lasso α", "lower"],
            ["C (logistic, SVM)", "higher"],
            ["RBF γ", "higher"],
            ["Tree max_depth", "higher"],
            ["min_samples_split / min_samples_leaf", "lower"],
            ["Number of PCA components", "higher"],
            ["Random forest n_estimators", "(more trees doesn't overfit; it just costs time)"],
            ["Learning rate (GD, boosting)", "(too high diverges; too low is slow)"],
          ],
        },
        {
          type: "memoryHook",
          content: "α and C point opposite ways. α is the penalty; C is the patience for data.",
        },
        {
          type: "prose",
          html: "The two parenthesised rows are the exceptions worth knowing, because they are the ones people get wrong in interviews. <code>n_estimators</code> in a <i>bagging</i> ensemble is free — more trees never overfits, it only costs time. In a <i>boosting</i> ensemble it is not free, because each tree fits the previous ensemble's errors. And the learning rate does not trade complexity at all: it trades convergence against stability.",
        },
        { type: "heading", level: 3, content: "Diagnose from the train / test gap" },
        {
          type: "table",
          headers: ["Train score", "Test score", "Diagnosis", "Do"],
          rows: [
            ["Low", "Low", "Underfitting (high bias)", "More features, more complex model, less regularisation"],
            [
              "High",
              "Much lower",
              "Overfitting (high variance)",
              "More data, regularise, simpler model, bagging, feature selection",
            ],
            ["High", "Close to train", "Good fit", "Tune threshold, ship"],
          ],
        },
        {
          type: "prose",
          html: "Put the three tables together and you have a loop: read the gap, decide bias or variance, then look up which knob moves in which direction and turn it. That loop is most of practical machine learning.",
        },
        {
          type: "trap",
          html: "A small gap is not a good model. Ridge at α = 10⁴ on the breast-cancer data had a gap of 0.1 points and was eight points worse than plain linear regression. You need a small gap <i>and</i> a high level — row 3 of the diagnosis table, not just row 3's second column.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "Every course result in one table",
      blocks: [
        {
          type: "result",
          headers: ["Dataset", "Model", "Train", "Test", "Reading"],
          rows: [
            ["Breast cancer", "Linear, degree 1", "95.8%", "<b>98.2%</b>", "Good fit"],
            ["Breast cancer", "Linear, degree 3", "100.0%", "75.4%", "High variance"],
            ["Breast cancer", "Ridge α=10⁴, degree 3", "90.5%", "90.4%", "High bias"],
            ["Breast cancer", "Lasso, 40 active weights", "96.9%", "96.5%", "Good fit, fewer features"],
            ["Breast cancer", "Logistic regression", "97.1%", "<b>98.2%</b>", "Good fit"],
            ["Iris 0 vs 1", "LinearSVC C=1 (margin 0.639)", "—", "100%", "Easy data"],
            ["Iris 0 vs 1", "LinearSVC C=1000 (margin 0.243)", "—", "100%", "C narrowed the street, nothing else"],
            ["Iris 0 vs 2", "Logistic regression", "—", "100%", "Linearly separable"],
            ["California housing", "Bagged linear regression, n=1→30", "—", "MSE 0.553–0.558", "Flat: no variance to reduce"],
            ["Churn", "Hard-margin RBF SVM", "F1 0.90", "F1 0.50", "High variance"],
            ["Churn", "Soft-margin RBF SVM (C=1)", "F1 0.65", "F1 <b>0.60</b>", "Best honest result"],
            ["Housing (Q27 data)", "K-means, k=1…4", "—", "SSE 492.6 → 86.3 → 41.0 → 27.5", "Elbow at k=2"],
          ],
          caption:
            "Every figure here is traceable to the course notebooks or the study guide — see SOURCE_NOTES.md.",
        },
        {
          type: "prose",
          html: "Scan the Reading column and a pattern appears: of twelve results, two are high variance, one is high bias, and the rest are either good fits or easy data. In practice variance is the failure mode you will meet most, which is why most of the tooling — regularisation, bagging, cross-validation — is built to fight it.",
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
            "Cover the right-hand column of the knobs table and recite which direction increases complexity for each. <b>Success:</b> nine out of nine, including both exceptions.",
            "For each of the five course datasets, write down the model you would start with and the metric you would report. <b>Success:</b> each choice has a one-sentence reason drawn from the first table.",
            "Take three of the results in the big table, cover the Reading column, and diagnose them from the numbers. <b>Success:</b> you put Ridge α=10⁴ in the high-bias box despite its tiny gap.",
            "Write out, from memory, what you would do first for each of the three diagnosis rows. <b>Success:</b> you do not suggest more data for underfitting.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Build a validation curve for each knob in the table on one dataset — degree, α, C, γ, max_depth — and confirm each curve bends in the direction the table claims.",
            "Pick a dataset from outside this course, fill in the Frame / Metric / Scaling / Baseline row for it, and then run the two-model shortcut: linear first, forest second. Compare and decide.",
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
            "Start linear, then random forest. If the forest barely wins, keep the linear model.",
            "The metric comes from the cost of the mistake, not from the data.",
            "α and C point opposite ways; n_estimators is free for bagging and not for boosting.",
            "Read the gap, decide bias or variance, then turn the matching knob.",
            "A small gap is not a good model — you need a small gap and a high level.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Which way does complexity move for α, C, γ and max_depth?",
              a: "Complexity rises as α falls, as C rises, as γ rises and as max_depth rises. α is a penalty; C is the inverse of one.",
            },
            {
              q: "Which metric for an imbalanced problem where both error types matter?",
              a: "F1, or PR-AUC if you want it across all thresholds. Accuracy is misleading and precision or recall alone is gameable.",
            },
            {
              q: "Does adding trees to a random forest risk overfitting?",
              a: "No — it only costs time. Boosting is the opposite: each tree fits the ensemble's remaining errors, so too many trees can overfit.",
            },
            {
              q: "Train and test are both 90% and close together. Good model?",
              a: "Not necessarily. A small gap means low variance, not a good model — Ridge at α=10⁴ had a 0.1-point gap and was eight points worse than a plain linear fit. You need the level as well as the gap.",
            },
          ],
        },
      ],
    },
  ],
};
