import type { Chapter } from "@/types/content";

export const biasAndVariance: Chapter = {
  slug: "bias-and-variance",
  title: "Bias and variance",
  description:
    "The dartboard, the formal definitions, the lecture's worked example with its arithmetic corrected, and the four quadrants you diagnose from.",
  icon: "◎",
  order: 4,
  moduleId: "m5",
  estimatedMinutes: 20,
  prerequisites: ["model-complexity"],
  sourceRefs: ["Module 1 ML Notebook.html § m5-bv"],
  islpChapters: ["Ch 2"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why one number cannot tell you what is wrong",
      blocks: [
        {
          type: "prose",
          html: "Your model scores 72%. That number does not tell you what to do next, and the two possible problems need opposite fixes.<br><br>If the model is <i>consistently</i> wrong — it would give nearly the same wrong answer however you resampled the training data — then the model family cannot express the pattern and you need more complexity. If the model is wrong <i>differently every time</i> — right on average but unstable — then it is fitting noise and you need less complexity, or more data, or an ensemble.<br><br>Bias and variance are the names of those two failures, and telling them apart is the most practically useful diagnostic in the course.",
        },
      ],
    },
    {
      id: "live",
      kind: "live",
      title: "Live: the dartboard",
      blocks: [
        {
          type: "prose",
          html: "Each dart is one model trained on a different sample, all predicting the same point. The bullseye is the truth. Tight cluster off-centre is bias; scattered around the centre is variance.",
        },
        { type: "widget", lab: "darts" },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "prose",
          html: "Imagine training the same kind of model on many different training sets D₁…D_M and predicting the same point X. Let g(X) be the average prediction.",
        },
        {
          type: "formula",
          title: "Definitions",
          lines: `Bias(X)     = Y − g(X)                     (how far the average guess is from truth)
Variance(X) = (1/M) Σₘ (fₘ(X) − g(X))²      (how much the guesses disagree)
Expected error ≈ Bias² + Variance  (+ irreducible noise)`,
        },
        {
          type: "prose",
          html: "Notice what each definition does and does not need. <b>Bias</b> compares the average prediction with the truth, so you need to know the truth. <b>Variance</b> compares the predictions with each other, so you do not. That asymmetry is why variance is the one you can actually estimate in practice — resample, refit, and look at the spread — while bias generally has to be inferred from the train/test gap.",
        },
        {
          type: "prose",
          html: "The third line is the decomposition that matters. Total error splits into a part from being systematically off, a part from being unstable, and a part that is irreducible — the noise in the data itself, which no model can remove. Chasing zero error is chasing that third term, which is why a perfect score should make you suspicious rather than pleased.",
        },
        {
          type: "table",
          headers: ["", "Low variance", "High variance"],
          rows: [
            ["<b>Low bias</b>", "Ideal", "Overfitting: right on average, unstable"],
            ["<b>High bias</b>", "Underfitting: consistently wrong", "Worst of both"],
          ],
        },
        {
          type: "memoryHook",
          content: "High Bias = Blind to the pattern (underfit). High Variance = Very jumpy (overfit).",
        },
        { type: "heading", level: 3, content: "The lecture's worked example" },
        {
          type: "prose",
          html: "<b>X = [3, 5], Y = 12, four datasets.</b> Predictions 11.3, 11.3, 14.7, 11.3 → mean 12.15. Bias = 12 − 12.15 = −0.15 (tiny). Squared deviations 0.7225, 0.7225, 6.5025, 0.7225 → variance 2.17. Low bias, modest variance.",
        },
        {
          type: "prose",
          html: "If the truth were Y = 18 with the same predictions, the models agree as much as before (variance still 2.17) but they're all far off: <b>high bias</b>. The model family is wrong for the data.",
        },
        {
          type: "prose",
          html: "That second half is the cleanest demonstration of the independence of the two quantities. Nothing about the models changed — the same four predictions, the same disagreement among them. Only the truth moved. Variance is a property of the <i>estimator</i>; bias is a property of the estimator <i>relative to the truth</i>.",
        },
        {
          type: "fix",
          html: "The slide lists the Y = 18 bias as 1.35. Recomputing: errors are 6.7, 6.7, 3.3, 6.7, mean 5.85, and 18 − 12.15 = 5.85. Also, the variance formula on the slide is printed as (1/M)·(Y − g(X))²; the intended one is (1/M)·Σ(fₘ(X) − g(X))², which is what the table computes.",
        },
        { type: "heading", level: 3, content: "Which knob moves which" },
        {
          type: "table",
          headers: ["Change", "Bias", "Variance"],
          rows: [
            ["More model complexity (degree, depth, γ, C)", "↓", "↑"],
            ["Stronger regularisation (α up, C down)", "↑", "↓"],
            ["More training data", "—", "↓"],
            ["Bagging / random forest", "—", "↓↓"],
            ["Boosting", "↓↓", "↑ (mildly)"],
            ["Better features", "↓", "—"],
          ],
          caption:
            "Note the asymmetry: more data reduces variance and does nothing for bias. If your model is underfitting, collecting more rows will not help.",
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "How to diagnose it in practice",
      blocks: [
        {
          type: "prose",
          html: "You cannot usually train on many datasets, so you infer the decomposition from two numbers you do have.",
        },
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
          type: "list",
          items: [
            "<b>Do not diagnose from the test score alone.</b> 72% test could be either row. You need the gap.",
            "<b>Do not add data to fix bias.</b> It will not move. Add features or capacity instead.",
            "<b>Do not add capacity to fix variance.</b> That is the direction that caused it.",
            "<b>Beware the irreducible floor.</b> If two very different model families both plateau at the same score, you may be at the noise limit and further tuning is wasted effort.",
            "<b>Estimate variance directly when you can.</b> Refit on several bootstrap resamples and look at the spread of predictions for a fixed row — that is the dartboard, computed.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 2",
          detail:
            "ISLP chapter 2 derives the expected test MSE decomposition into variance, squared bias and irreducible error, and shows the characteristic U-shaped test-error curve against flexibility that this chapter's trade-off produces.",
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
          type: "result",
          headers: ["Model", "Train", "Test", "Gap", "Reading"],
          rows: [
            ["Linear, degree 1 (breast cancer)", "95.8%", "98.2%", "−2.4", "No overfitting at all"],
            ["Linear, degree 3 (breast cancer)", "100.0%", "75.4%", "<b>24.6</b>", "High variance"],
            ["Ridge α=10⁴, degree 3", "90.5%", "90.4%", "0.1", "High bias — over-regularised"],
            ["Hard-margin RBF SVM (churn F1)", "0.90", "0.50", "<b>0.40</b>", "High variance"],
            ["Soft-margin linear SVM (churn F1)", "0.60", "0.58", "0.02", "Balanced, modest capacity"],
          ],
          caption:
            "Every one of these is a real result from the course notebooks. The Reading column is the diagnosis the gap supports.",
        },
        {
          type: "prose",
          html: "Row 3 is the one students usually misread. A gap of 0.1 looks excellent, and the model is still bad — both numbers are 8 points below what a plain degree-1 fit achieved. A small gap means low variance, not a good model. You need both halves: a small gap <i>and</i> a high level.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "estimating variance by resampling",
            code: `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.utils import resample

rng = np.random.default_rng(42)
row = X_test.iloc[[0]]                      # one fixed point to predict
preds = []
for _ in range(60):
    Xb, yb = resample(X_train, y_train, random_state=rng.integers(1e6))
    preds.append(LinearRegression().fit(Xb, yb).predict(row)[0])

preds = np.array(preds)
print("mean prediction g(X):", preds.mean().round(4))
print("variance            :", preds.var().round(4))
print("spread (min..max)   :", preds.min().round(3), "..", preds.max().round(3))`,
            caption:
              "This is the dartboard, computed on real data: 60 models trained on 60 resamples, all predicting one patient. The spread is the variance you have been reading about.",
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
            "Reproduce the lecture's worked example by hand: predictions 11.3, 11.3, 14.7, 11.3 against Y = 12. <b>Success:</b> mean 12.15, bias −0.15, variance 2.17.",
            "Redo it with Y = 18 and confirm the corrected bias. <b>Success:</b> 5.85, not the slide's 1.35, and you can show why.",
            "Run the resampling code above and report g(X) and the variance for one test patient. <b>Success:</b> you have a real number for variance, not an intuition.",
            "Classify each of the five rows in the results table into a quadrant. <b>Success:</b> you put Ridge α=10⁴ in the high-bias box despite its tiny gap.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Plot a full bias–variance curve: for polynomial degrees 1 to 10, resample 40 times each, and plot estimated squared bias, variance and total test error on one set of axes. The U-shape in the total is the trade-off.",
            "Repeat the resampling experiment with a deep decision tree instead of linear regression. The variance should be dramatically larger — which is exactly the setup bagging exists to fix, in the next module.",
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
            "High Bias = Blind to the pattern. High Variance = Very jumpy.",
            "Bias needs the truth; variance only needs the models to disagree — which is why variance is measurable.",
            "Error = bias² + variance + irreducible noise. The third term is why a perfect score is suspicious.",
            "More data reduces variance and does nothing for bias.",
            "A small train/test gap is not a good model — Ridge at α=10⁴ had a 0.1 gap and was 8 points worse.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Define bias and variance in this setting.",
              a: "Train the same model family on many different training sets and predict one point. Bias is the gap between the truth and the average prediction; variance is how much the individual predictions disagree with that average.",
            },
            {
              q: "A model scores 72% on test. Is it high bias or high variance?",
              a: "Unanswerable from that alone. You need the training score: low train and low test is high bias, high train and much lower test is high variance.",
            },
            {
              q: "Would more data fix underfitting?",
              a: "No. More data reduces variance, not bias. Underfitting needs more capacity or better features.",
            },
            {
              q: "In the lecture example with Y = 18, what is the bias?",
              a: "5.85 — the mean prediction is 12.15 and 18 − 12.15 = 5.85. The slide's 1.35 is an arithmetic error; the variance is unchanged at 2.17 because the predictions did not move.",
            },
          ],
        },
      ],
    },
  ],
};
