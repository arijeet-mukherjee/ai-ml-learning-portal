import type { ContentBlock } from "@/types/content";

/**
 * Verbatim revision material.
 *
 * CHEAT_SHEET and VIVA come from Module_1_Study_Guide.md; FORMULA_SHEET comes from
 * the notebook's m7-formulas section. Both are reproduced as written — this page
 * exists so Arijeet can read the originals, not a paraphrase. See SOURCE_NOTES.md.
 */

export const CHEAT_SHEET: ContentBlock[] = [
  {
    type: "prose",
    html: "From <code>Module_1_Study_Guide.md</code>, the companion to the Assignment-1 solution notebook.",
  },
  {
    type: "table",
    headers: ["Topic", "One-liner", "sklearn call"],
    rows: [
      [
        "Linear regression",
        "line minimising squared error",
        "<code>LinearRegression()</code> → <code>coef_</code>, <code>intercept_</code>",
      ],
      [
        "Logistic regression",
        "linear score → sigmoid → probability; classifier",
        "<code>LogisticRegression()</code>",
      ],
      [
        "SVM",
        "max-margin line, <code>C</code> trades margin vs violations",
        "<code>LinearSVC(C=, loss='hinge')</code>",
      ],
      [
        "Bagging",
        "bootstrap + average → lowers variance",
        "manual: <code>rng.choice(n, n, replace=True)</code>",
      ],
      ["K-means", "assign to nearest centroid, recompute means, repeat", "from scratch"],
      ["Elbow", "pick k where SSE curve bends", "plot SSE vs k"],
      [
        "Split",
        "hold out test data to measure generalisation",
        "<code>train_test_split(test_size=0.2, random_state=…)</code>",
      ],
      [
        "Metrics",
        "accuracy (classification), MSE (regression)",
        "<code>accuracy_score</code>, <code>mean_squared_error</code>",
      ],
    ],
  },
  {
    type: "heading",
    level: 3,
    content: "The executed results, for checking your own run",
  },
  {
    type: "result",
    headers: ["Where", "What", "Value"],
    rows: [
      ["Q4", "Linear regression on California housing, <code>MedHouseVal → MedInc</code>", "slope <b>1.1328</b>, intercept <b>1.5274</b>"],
      ["Q10", "Logistic regression, setosa vs virginica", "<code>coef_</code> [0.46, −0.31, 1.73, 0.81], <code>intercept_</code> −8.35, accuracy <b>1.0</b>"],
      ["Q14–15", "LinearSVC margin width", "<b>0.639</b> at C=1, <b>0.243</b> at C=1000"],
      ["Q17–21", "Bagging over linear regression, test MSE", "0.5566 → 0.5569 → 0.5535 → 0.5538, flat <b>0.553–0.558</b>"],
      ["Q16", "Unique rows in a bootstrap sample", "10,449 / 16,512 = <b>63.3%</b>"],
      ["Q27", "K-means SSE", "k=1 <b>492.6</b>, k=2 <b>86.3</b>, k=3 <b>41.0</b>, k=4 <b>27.5</b> → elbow k=2"],
      ["Week 1 lab", "Breast-cancer linear classifier with outlier imputation", "accuracy <b>98.2%</b>, precision 1.00, recall 0.95, F1 0.98"],
    ],
    caption:
      "Your decimals match these only if you keep the same seeds; any seed gives figures of the same size.",
  },
  {
    type: "gradedDetail",
    html: "The details the rubric checks: <code>LinearSVC</code> needs <code>loss='hinge'</code> passed explicitly (it defaults to squared hinge); K-means must be written from scratch, not <code>sklearn.cluster.KMeans</code>; Q2 deliberately inverts the usual direction (input <code>MedHouseVal</code>, target <code>MedInc</code>); Q27 awards marks for <i>printing</i> every SSE; bagging must average the <b>predictions</b> and then compute MSE once, with new random indices per model and per loop iteration, and the test set never resampled.",
  },
];

export const FORMULA_SHEET: ContentBlock[] = [
  {
    type: "formula",
    title: "Statistics",
    lines: `mean = Σx/n   var = Σ(x−μ)²/n (sample: n−1)   std = √var
IQR = Q3 − Q1   fences = Q1 − 1.5·IQR, Q3 + 1.5·IQR
z = (x − μ)/σ    68 / 95 / 99.7% within 1 / 2 / 3σ`,
  },
  {
    type: "formula",
    title: "Probability",
    lines: `P(A|B) = P(A∩B)/P(B)    independent ⇔ P(A|B) = P(A)
Bayes: P(A|B) = P(B|A)P(A) / [P(B|A)P(A) + P(B|¬A)P(¬A)]`,
  },
  {
    type: "formula",
    title: "Linear algebra",
    lines: `a·b = Σaᵢbᵢ = |a||b|cosθ    |a|₂ = √Σaᵢ²   |a|₁ = Σ|aᵢ|
cos sim = a·b / (|a||b|)    Av = λv ⇔ det(A − λI) = 0   det[[a,b],[c,d]] = ad − bc
explained variance of PC k = λₖ / Σλ`,
  },
  {
    type: "formula",
    title: "Models",
    lines: `linear: ŷ = w·x + b        logistic: p = 1/(1 + e^−(w·x+b)), log(p/(1−p)) = w·x + b
ridge: + α Σw²   lasso: + α Σ|w|      GD: w ← w − η ∂L/∂w
SVM: min ½‖w‖² + CΣξᵢ, margin = 2/‖w‖, hinge = max(0, 1 − y f(x))
RBF: K(a,b) = exp(−γ‖a − b‖²)`,
  },
  {
    type: "formula",
    title: "Losses and metrics",
    lines: `MSE = Σ(y − ŷ)²/n     cross-entropy = −Σ y log p
precision = TP/(TP+FP)   recall = TP/(TP+FN)   F1 = 2PR/(P+R)`,
  },
  {
    type: "formula",
    title: "Trees and ensembles",
    lines: `entropy = −Σ p log p    gini = 1 − Σp²    IG = H(parent) − Σ (nₖ/n) H(childₖ)
OvO models = K(K−1)/2    OvA models = K    P(out of bag) = (1 − 1/N)ᴺ ≈ 0.368
class weight = n / (k · n_c)`,
  },
  {
    type: "memoryHook",
    content: "α and C point opposite ways. α is the penalty; C is the patience for data.",
    detail:
      "Raise α and the model gets simpler. Raise C and it gets more complex. They are the same knob read from opposite ends.",
  },
];

export const VIVA: ContentBlock[] = [
  {
    type: "vivaQuestions",
    items: [
      {
        q: 'Why is logistic "regression" a classifier?',
        a: "It regresses a linear score, then the sigmoid turns that score into a class probability. The model of the log-odds is linear, which is where the name comes from.",
      },
      {
        q: "What happens to the margin when C increases?",
        a: "It narrows; the model fits the training data more tightly. Our own run: margin 0.639 at C=1 versus 0.243 at C=1000.",
      },
      {
        q: "Why did bagging not improve linear regression?",
        a: "Linear regression is a low-variance, stable model, and bagging only reduces variance. Bootstrap resamples barely move the fitted line, so test MSE stayed flat at 0.553–0.558 from 1 to 30 models. That flat curve is the correct answer, not a bug.",
      },
      {
        q: "Why ~63% unique rows in a bootstrap sample?",
        a: "1 − (1 − 1/n)ⁿ → 1 − 1/e ≈ 0.632. We measured 10,449 of 16,512 = 63.3%.",
      },
      {
        q: "Why can K-means give different answers on different runs?",
        a: "Random initialisation; it converges to a local minimum of SSE, not a global one. That is why the seed is fixed.",
      },
      {
        q: "Why is SSE alone a bad way to choose k?",
        a: "It decreases monotonically with k — at k = n points SSE is zero — so you look for the elbow instead. Ours bends hard at k=2: 492.6 → 86.3 → 41.0 → 27.5.",
      },
    ],
  },
];
