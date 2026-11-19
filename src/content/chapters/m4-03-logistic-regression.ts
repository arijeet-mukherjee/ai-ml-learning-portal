import type { Chapter } from "@/types/content";

export const logisticRegression: Chapter = {
  slug: "logistic-regression",
  title: "Logistic regression and the decision threshold",
  description:
    "The sigmoid, odds and log-odds, why a classifier is called a regression, and moving the threshold to trade missed tumours against false alarms.",
  icon: "∫",
  order: 3,
  moduleId: "m4",
  estimatedMinutes: 24,
  prerequisites: ["the-artificial-neuron", "grading-a-classifier"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m4-logistic, m4-threshold",
    "Assesments/Module_1/LinearLogisticRegSVM.ipynb",
    "Module_1_Study_Guide.md § Part 2",
  ],
  islpChapters: ["Ch 4"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why a linear model is not quite enough",
      blocks: [
        {
          type: "prose",
          html: "The Module 3 pipeline classified tumours with plain linear regression on a −1/+1 label, and it worked — 98.2%. So why learn another model?<br><br>Because the output is not a probability. A prediction of 2.4 is not \"140% malignant\". There is no sensible way to say \"flag this one for review if the model is at least 80% sure\", because the model is not expressing certainty at all. And as soon as the cost of a miss differs from the cost of a false alarm — which is always, in medicine — you need that dial.",
        },
        {
          type: "prose",
          html: "Logistic regression keeps the linear score and adds one step: squash it into (0, 1). That one step buys calibrated probabilities, a principled loss, and a threshold you can move on purpose.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "formula",
          title: "Sigmoid squashes any number into (0, 1)",
          lines: `z = w·x + b
P(y = 1 | x) = σ(z) = 1 / (1 + e⁻ᶻ)
σ(0) = 0.5     σ(large +) → 1     σ(large −) → 0`,
        },
        {
          type: "prose",
          html: "Read the formula at three points and it stops being mysterious. At z = 0 the exponent is e⁰ = 1, so σ = 1/2 — maximum uncertainty. At large positive z, e⁻ᶻ collapses to nearly zero, so σ → 1. At large negative z, e⁻ᶻ explodes, so σ → 0. The S-shape is just those three facts joined smoothly.",
        },
        { type: "widget", lab: "sigmoid" },
        {
          type: "prose",
          html: "<b>Odds</b> = P / (1 − P). A 0.8 chance means odds of 4 to 1. Take the log and something neat appears: <span class=\"mark\">log(odds) = z = w·x + b</span>. Logistic regression is a linear model of the log-odds, which is why it's still called \"regression\".",
        },
        {
          type: "formula",
          title: "The three readings of the same model",
          lines: `log-odds:    log(p / (1 − p)) = w·x + b      ← linear in x
odds:        p / (1 − p)       = e^(w·x + b)     ← multiplicative
probability: p                 = 1/(1 + e^−(w·x+b))  ← the S-curve`,
        },
        {
          type: "prose",
          html: "The middle line is how you interpret a coefficient. A weight of 1.73 on petal length means: each extra unit of petal length multiplies the <i>odds</i> of the positive class by e^1.73 ≈ 5.6. Not the probability — the odds. That distinction is what makes logistic coefficients reportable to a domain expert.",
        },
        {
          type: "memoryHook",
          content:
            "Linear regression draws the line. Logistic regression bends it into an S and reads it as a probability.",
        },
        { type: "heading", level: 3, content: "The boundary is still straight" },
        {
          type: "prose",
          html: "<b>Boundary:</b> predict class 1 when σ(z) ≥ 0.5, i.e. when z ≥ 0. Since z is linear, the boundary is a straight line. Want a circle? Make z quadratic: z = w₀ + w₁x₁² + w₂x₂². Feature engineering changes the boundary shape.",
        },
        {
          type: "prose",
          html: "This is the point people miss: the sigmoid is not what makes the model flexible. It only converts a score to a probability. The <i>shape</i> of the decision boundary is decided entirely by what goes into z — which is why logistic regression is a linear classifier despite its curve.",
        },
        {
          type: "prose",
          html: "Loss: log-loss (binary cross-entropy). sklearn adds an L2 penalty by default (C = 1.0) and solves with <code>lbfgs</code>, a faster cousin of gradient descent, because there's no closed form.",
        },
        {
          type: "trap",
          html: "scikit-learn's <code>LogisticRegression</code> is regularised <b>by default</b>, at C = 1.0. It is not plain maximum-likelihood logistic regression unless you ask for it. If your coefficients disagree with a statistics textbook's, this is usually why.",
        },
        { type: "heading", level: 3, content: "Moving the decision threshold" },
        {
          type: "prose",
          html: "<code>predict()</code> uses 0.5. In cancer screening a miss is far worse than a false alarm, so lower it: recall rises, precision falls. Use <code>predict_proba(X)[:, 1]</code> and pick the threshold on <b>validation</b> data, never on test.",
        },
        { type: "widget", lab: "threshold" },
        {
          type: "prose",
          html: "0.5 is not a law of nature. It is the point where the two classes are equally probable, which is only the right operating point if the two mistakes cost the same. They almost never do. Choosing the threshold is a separate decision from fitting the model, and it belongs to whoever owns the cost — not to the default argument of a function.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "fit, then sweep the threshold",
            code: `from sklearn.linear_model import LogisticRegression
import numpy as np

lr = LogisticRegression(max_iter=500, C=1.0).fit(X_train, y_train01)
probs = lr.predict_proba(X_test)[:, 1]          # P(malignant) for each patient

for t in [0.5, 0.4, 0.3, 0.2, 0.1]:
    pred = (probs >= t).astype(int)
    missed = ((pred == 0) & (y_test01 == 1)).sum()
    alarms = ((pred == 1) & (y_test01 == 0)).sum()
    print(t, "missed", missed, "false alarms", alarms)

# Reading a coefficient as an odds multiplier
import pandas as pd
pd.Series(np.exp(lr.coef_[0]), index=X_train.columns) \\
  .sort_values(ascending=False).head(5).round(3)`,
            caption:
              "`predict_proba` returns two columns, one per class; `[:, 1]` takes the positive class. The last block exponentiates the coefficients so they read as 'multiplies the odds by'.",
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
            "<b>Perfect separation.</b> If a feature separates the classes exactly, the likelihood is maximised by driving its weight to infinity. You get huge coefficients and a convergence warning. The default L2 penalty is what normally prevents it.",
            "<b>Reading a coefficient as a probability change.</b> It is a log-odds change. Exponentiate it to get an odds multiplier.",
            "<b>Unscaled features.</b> The solver converges badly and the coefficients are not comparable. Scale first — and with the default penalty, scaling is required for the penalty to be fair.",
            "<b>Tuning the threshold on test.</b> The threshold is a parameter. Pick it on validation.",
            "<b>Trusting the probabilities without checking calibration.</b> Logistic regression is usually well calibrated, but a regularised model on imbalanced data may not be. Plot predicted probability against observed frequency before you promise anyone a percentage.",
            "<b><code>max_iter</code> too low.</b> The default 100 is often not enough. 500 or 1000 costs nothing here.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 4",
          detail:
            "ISLP chapter 4 derives logistic regression from maximum likelihood, explains the odds interpretation carefully, and contrasts it with LDA and naive Bayes — which make distributional assumptions logistic regression does not.",
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
          html: "Two real results from the course, on two different datasets.",
        },
        {
          type: "result",
          headers: ["Where", "Setting", "Result"],
          rows: [
            ["Week 1 notebook, breast cancer", "Logistic regression on 25 cleaned, scaled features", "train 97.1%, test <b>98.2%</b>"],
            [
              "Assignment Q10, iris (setosa vs virginica)",
              "Four features, 80/20 split, <code>random_state=42</code>",
              "<code>coef_</code> = [0.46, −0.31, <b>1.73</b>, 0.81], <code>intercept_</code> = −8.35, accuracy <b>1.0</b>",
            ],
          ],
        },
        {
          type: "prose",
          html: "<b>Why the iris accuracy is 1.0:</b> setosa and virginica are the two most different species, so they are linearly separable in these four features. Petal length has the largest weight (1.73), which is consistent with what the pairplot shows — petal features separate the species best. Exponentiate that weight and each extra centimetre of petal length multiplies the odds of virginica by about 5.6.",
        },
        {
          type: "gradedDetail",
          html: "Assignment-1 Part 2 (Q6–Q10) builds exactly this. The graded details: <code>LabelEncoder</code> maps classes alphabetically (setosa 0, versicolor 1, virginica 2), so you drop versicolor with <code>data[data.Species != 1]</code> and relabel virginica with <code>.replace(2, 1)</code> to get a binary problem with 50 of each class. The split is <code>test_size=0.2, random_state=42</code> → train (80, 4), test (20, 4). Print the weights and the bias, not just the accuracy.",
        },
        { type: "datasetPreview", dataset: "cancer" },
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
            "Reproduce Assignment Q6–Q10 on iris: encode labels, drop versicolor, relabel, split 80/20 with <code>random_state=42</code>, fit, print <code>coef_</code> and <code>intercept_</code> and accuracy. <b>Success:</b> coefficients ≈ [0.46, −0.31, 1.73, 0.81], intercept ≈ −8.35, accuracy 1.0.",
            "Draw the pairplot with <code>hue=\"Species\"</code> and confirm by eye that petal features separate best. <b>Success:</b> your explanation of the 1.73 weight cites the plot.",
            "Fit logistic regression on the cleaned breast-cancer features and sweep the threshold 0.5 → 0.1. <b>Success:</b> a table of missed tumours against false alarms, and a recommended threshold with a one-sentence justification.",
            "Exponentiate the breast-cancer coefficients and report the top five as odds multipliers. <b>Success:</b> you can phrase one of them as a sentence a doctor would understand.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Some tumours stay missed even at threshold 0.2, because the model gives them near-zero probability. Find them and look at their features — they look benign in these measurements, so only better features or a different model would help.",
            "Plot a calibration curve: bucket the predicted probabilities and plot each bucket's mean prediction against its observed malignant rate. A well-calibrated model sits on the diagonal.",
            "Fit a polynomial logistic regression with <code>PolynomialFeatures(degree=2)</code> and sweep C from 1 → 0.1 → 0.01, watching the train/test gap close.",
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
            "Linear regression draws the line; logistic bends it into an S and reads it as a probability.",
            "log(odds) = w·x + b — which is why a classifier is called a regression.",
            "A coefficient is a log-odds change; exponentiate it for an odds multiplier.",
            "The boundary is still straight, because z is still linear. Only feature engineering bends it.",
            "0.5 is a default, not a law. Pick the threshold from the cost, on validation data.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: 'Why is logistic "regression" a classifier?',
              a: "It regresses a linear score on the log-odds scale, then the sigmoid converts that score into a class probability. The regression is of log(p/(1−p)), which is linear in x.",
            },
            {
              q: "What happens to precision and recall as you lower the threshold?",
              a: "Recall rises and precision falls — you flag more cases, catching more true positives and more false alarms. There is no threshold that improves both.",
            },
            {
              q: "A coefficient is 1.73. What does that mean?",
              a: "Each one-unit increase in that feature adds 1.73 to the log-odds, which multiplies the odds of the positive class by e^1.73 ≈ 5.6. It is not a change in probability.",
            },
            {
              q: "Why is the decision boundary straight even though the sigmoid is curved?",
              a: "The boundary is where σ(z) = 0.5, i.e. z = 0, and z = w·x + b is linear in x. The sigmoid only maps scores to probabilities; it does not change the boundary's shape.",
            },
          ],
        },
      ],
    },
  ],
};
