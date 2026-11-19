import type { Chapter } from "@/types/content";

export const regularisation: Chapter = {
  slug: "overfitting-and-regularisation",
  title: "Polynomial features, Ridge and Lasso",
  description:
    "How a linear model bends, the degree-3 collapse on real data, L2 versus L1 penalties, why L1 zeroes weights, and the C-versus-α direction trap.",
  icon: "⌁",
  order: 2,
  moduleId: "m4",
  estimatedMinutes: 24,
  prerequisites: ["the-artificial-neuron", "norms-and-distance", "model-complexity"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m4-poly, m4-reg",
    "Assesments/Module_1/RidgeLassoElastic.ipynb",
  ],
  islpChapters: ["Ch 6"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why a straight-line model can draw a curve",
      blocks: [
        {
          type: "prose",
          html: "Add powers and products of features (x², x³, x₁x₂) and a <i>linear</i> model can bend. It is still linear in the weights, which is why the same solver works — the model never learns that x² is the square of x, it just sees another column.<br><br>That is a remarkably cheap way to buy flexibility, and it is a remarkably easy way to destroy a model. This chapter is both halves.",
        },
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
            "On the breast-cancer data. 100% train with 75% test is the textbook signature of overfitting: the model memorised.",
        },
        {
          type: "prose",
          html: "Read row 2 as arithmetic rather than as a surprise. Degree 3 on 25 scaled features generates every cube, every square, every pairwise and triple product — thousands of columns — against about 455 training rows. With more parameters than examples a linear model can fit the training set exactly, and exactly is what it does.",
        },
      ],
    },
    {
      id: "live",
      kind: "live",
      title: "Live: degree up, then penalty up",
      blocks: [
        {
          type: "prose",
          html: "Raise the degree to 11 with the penalty off. Watch training error collapse, test error climb, and ‖w‖ run into the thousands. Then raise α and watch all three come back — that is the entire chapter in two sliders.",
        },
        { type: "widget", lab: "poly" },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "formula",
          title: "Ridge (L2) and Lasso (L1)",
          lines: `Ridge:  minimise   Σ(y − ŷ)²  +  α Σ wⱼ²
Lasso:  minimise   (1/2n) Σ(y − ŷ)²  +  α Σ |wⱼ|`,
        },
        {
          type: "prose",
          html: "Both add a price for large weights. The fit still wants to match the data; the penalty still wants every weight near zero; α decides who wins. At α = 0 you have plain least squares. At α → ∞ every weight goes to zero and the model predicts the mean.",
        },
        {
          type: "table",
          headers: ["", "Ridge (L2)", "Lasso (L1)"],
          rows: [
            ["Penalty", "sum of squared weights", "sum of absolute weights"],
            [
              "Effect",
              "shrinks every weight, none to exactly 0",
              "sets many weights to exactly 0 → automatic feature selection",
            ],
            [
              "Pick when",
              "most features help a little, often correlated",
              "you suspect only a few features matter (genes, text words)",
            ],
            ["Strength", "α larger = stronger penalty = simpler model", "α larger = stronger penalty = simpler model"],
          ],
        },
        {
          type: "memoryHook",
          content: "Ridge Reduces. Lasso Lops off.",
          detail:
            "L1's diamond-shaped constraint has corners on the axes; the best solution usually hits a corner, which means some weights are exactly 0. L2's circle has no corners.",
        },
        {
          type: "prose",
          html: "Why does L1 zero things? Near zero, L2's push (gradient 2w) fades to nothing; L1's push stays the same size, so small weights get shoved all the way to 0 and held there. The geometry version — the diamond's corners sitting on the axes — is in the <a href=\"/learn/norms-and-distance\">norms chapter</a>, and the two arguments are the same fact told from different ends.",
        },
        { type: "heading", level: 3, content: "Elastic Net, briefly" },
        {
          type: "formula",
          title: "Both penalties at once",
          lines: `ElasticNet:  minimise  (1/2n) Σ(y − ŷ)²  +  α [ ρ·Σ|wⱼ|  +  (1−ρ)/2·Σwⱼ² ]
ρ = l1_ratio:  1 → pure Lasso,  0 → pure Ridge`,
        },
        {
          type: "prose",
          html: "The reason it exists: given a group of strongly correlated features, Lasso picks one more or less arbitrarily and zeroes the rest, which makes the selection unstable across resamples. Adding a little L2 makes correlated features shrink <i>together</i>, so the group survives or dies as a group. When your features come in natural families — the <code>_mean</code>, <code>_se</code> and <code>_worst</code> versions of each nucleus measurement, say — that is usually what you want.",
        },
        {
          type: "trap",
          html: "In <code>LogisticRegression</code> and SVMs, the knob is <b>C = 1/strength</b>. Smaller C = stronger regularisation. It runs the opposite way to α. Getting this backwards is the single most common tuning error in the course.",
        },
        {
          type: "memoryHook",
          content: "α is the penalty; C is the patience for data.",
          detail:
            "Raise α and the model gets simpler. Raise C and it gets more complex. Same knob, read from opposite ends.",
        },
        {
          type: "world",
          html: "Genetic research: tens of thousands of gene expression levels, a few hundred patients. Lasso picks the handful of genes linked to a disease. House prices: dozens of mildly useful, correlated features (rooms, area, floors), so Ridge keeps them all, gently shrunk.",
        },
        {
          type: "genai",
          html: "L2 regularisation in deep learning is \"weight decay\", a standard setting when fine-tuning LLMs.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the three fits from the table",
            code: `from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LinearRegression, Ridge, Lasso
import numpy as np

# y01: 1 = malignant, 0 = benign  (X_train / X_test already cleaned and scaled)
for name, reg in [("plain", LinearRegression()),
                  ("ridge", Ridge(alpha=1e4)),
                  ("lasso", Lasso(alpha=0.023, max_iter=200))]:
    model = make_pipeline(PolynomialFeatures(3, include_bias=False), StandardScaler(), reg)
    model.fit(X_train, y_train01)
    acc_tr = ((model.predict(X_train) >= 0.5) == y_train01).mean()
    acc_te = ((model.predict(X_test)  >= 0.5) == y_test01).mean()
    print(name, round(acc_tr, 3), round(acc_te, 3))

lasso = model[-1]
print("weights switched off:", np.sum(lasso.coef_ == 0), "of", lasso.coef_.size)`,
            caption:
              "The second StandardScaler, after PolynomialFeatures, is not redundant: cubing a scaled column produces a column with a completely different spread, and a penalty applied to weights on unscaled columns penalises them unequally.",
          },
        },
        {
          type: "prose",
          html: "That last point is worth stating plainly, because it is a real trap. A penalty of α on every weight is only fair if every feature is on the same scale — otherwise the weight on a large-magnitude column is naturally small and barely penalised, while the weight on a small-magnitude column is naturally large and crushed. <b>Always scale before regularising.</b>",
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
            "<b>Regularising without scaling.</b> The penalty is then unequal across features, as above. This is the most consequential mistake in the chapter.",
            "<b>Penalising the intercept.</b> It is not a slope and shrinking it towards zero biases the predictions. scikit-learn excludes it by default; a hand-rolled implementation must too.",
            "<b>Tuning α on test.</b> Use <code>RidgeCV</code>, <code>LassoCV</code> or an explicit cross-validation inside the training half.",
            "<b>Reading Lasso's survivors as 'the important features'.</b> Given correlated columns it keeps one arbitrarily. The survivors are <i>a</i> sufficient set, not <i>the</i> important set.",
            "<b>Lasso not converging.</b> <code>max_iter=200</code> is low. If you see a ConvergenceWarning, raise it rather than ignoring it, or scale better.",
            "<b>Expecting polynomial features to help.</b> They help when the true boundary is curved and the features are few. Neither is true here.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 6",
          detail:
            "ISLP chapter 6 is the authoritative treatment: the constraint-region picture, the bias–variance explanation of why shrinkage helps, and the comparison between subset selection, Ridge and Lasso on the same data.",
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
          html: "The table at the top of this chapter is the result to reproduce. Three things in it are worth reading closely:<br><br><b>Degree 3, no penalty:</b> 100% train, 75.4% test. A 24.6-point gap. <b>Ridge at α = 10⁴:</b> the gap closes to 0.1 points, but both numbers fall to ~90% — the penalty is too strong and has underfit. <b>Lasso with 40 surviving weights:</b> 96.9% and 96.5%, a 0.4-point gap, and it got there by discarding thousands of features. Lasso wins here because most of those polynomial columns genuinely carry nothing.",
        },
        {
          type: "prose",
          html: "And the quiet lesson in rows 1 and 5: plain degree-1 linear regression and logistic regression both hit 98.2%, beating every regularised polynomial. The extra flexibility was never needed. <i>Try the simple thing first</i> is not advice about effort, it is advice about accuracy.",
        },
        {
          type: "deepDive",
          summary: "Take-home answers (from the notebook)",
          blocks: [
            {
              type: "prose",
              html: "<b>1. Why didn't polynomial features help?</b> The breast-cancer classes are already nearly linearly separable in 20–30 scaled features. Degree 3 explodes the feature count into the thousands with only ~455 training rows, so the model fits noise. Polynomials win when the true boundary is curved and features are few, e.g. <code>make_moons</code> or <code>make_circles</code> from sklearn.",
            },
            {
              type: "prose",
              html: "<b>2. Polynomial logistic regression:</b> <code>PolynomialFeatures(degree=2)</code>, <code>fit_transform</code> on train, <code>transform</code> on test, then <code>LogisticRegression(C=...)</code>. As C drops 1 → 0.1 → 0.01 the penalty grows, train accuracy falls, and the train/test gap closes. Adding a StandardScaler after the polynomial step helps the solver converge.",
            },
            {
              type: "prose",
              html: "<b>3. RidgeCV:</b> <code>make_pipeline(PolynomialFeatures(3, include_bias=False), StandardScaler(), RidgeCV(alphas=alphas))</code> fit on train. CV picks a smaller α than 10⁴ and test accuracy beats the hand-picked 90.4%.",
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
          type: "list",
          ordered: true,
          items: [
            "Reproduce all five rows of the table on the cleaned breast-cancer data. <b>Success:</b> your degree-3 plain fit shows a train/test gap above 20 points.",
            "Count how many Lasso weights are exactly zero at α = 0.023. <b>Success:</b> roughly 40 survive out of thousands, and you can state what fraction that is.",
            "Replace the hand-picked α = 10⁴ with <code>RidgeCV</code> over a log-spaced grid. <b>Success:</b> CV picks something smaller and test accuracy improves on 90.4%.",
            "Sweep <code>LogisticRegression</code>'s C from 1 → 0.1 → 0.01 and tabulate train and test accuracy. <b>Success:</b> you can state which direction C moves complexity, having just watched it.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Run the whole comparison once with the second <code>StandardScaler</code> removed. The degradation is the size of the scale-before-you-penalise rule.",
            "Fit <code>ElasticNetCV</code> over a grid of <code>l1_ratio</code> and compare its surviving feature set with Lasso's across three different random splits. Lasso's set should be noticeably less stable.",
            "Build <code>make_circles</code> data and show polynomial features turning an impossible problem into an easy one — the case where this technique is actually the right tool.",
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
            "Polynomial features make a model bend while staying linear in the weights.",
            "Ridge Reduces. Lasso Lops off.",
            "α up = simpler. C up = more complex. They point opposite ways.",
            "Always scale before regularising, or the penalty is unequal across features.",
            "Degree 1 and logistic both beat every polynomial here — try the simple thing first.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "What does a 100% train / 75% test result tell you?",
              a: "The model memorised the training set. Reduce complexity, add regularisation, select features, or get more data. The gap is the diagnosis, not either number.",
            },
            {
              q: "Why does Lasso produce exact zeros and Ridge does not?",
              a: "L1's gradient keeps its magnitude as a weight approaches zero, so small weights get pushed all the way; L2's push fades to nothing. Geometrically, L1's constraint region is a diamond with corners on the axes.",
            },
            {
              q: "Which way does C go, compared with α?",
              a: "Opposite. α is the penalty, so larger α means a simpler model. C is the inverse of the penalty, so larger C means a more complex model.",
            },
            {
              q: "Why scale features before applying a penalty?",
              a: "The penalty charges per unit of weight, and weights carry their feature's units. Without scaling, large-magnitude columns are barely penalised and small-magnitude ones are crushed.",
            },
          ],
        },
      ],
    },
  ],
};
