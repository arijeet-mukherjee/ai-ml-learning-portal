import type { Chapter } from "@/types/content";

export const fourStepRecipe: Chapter = {
  slug: "the-four-step-recipe",
  title: "The four-step recipe, losses and learning types",
  description:
    "Collect, design, define the loss, optimise — the skeleton under every algorithm in this course; cross-entropy versus MSE; closed form versus gradient descent; supervised, unsupervised, reinforcement.",
  icon: "◳",
  order: 2,
  moduleId: "m3",
  estimatedMinutes: 20,
  prerequisites: ["what-ml-is"],
  sourceRefs: ["Module 1 ML Notebook.html § m3-recipe, m3-loss, m3-opt, m3-types"],
  islpChapters: ["Ch 2"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why one recipe covers everything",
      blocks: [
        {
          type: "prose",
          html: "There are nine or ten algorithms left in this course and they look like nine or ten separate things to learn. They are not. They are one procedure with different choices plugged into four slots.<br><br>Once you can name the four slots, a new algorithm stops being a new idea and becomes a set of answers: what shape is f, what counts as wrong, and how do we search. That reframing is the single highest-leverage thing in Module 3.",
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
            "<b>Collect a labelled dataset</b>: inputs X with correct answers Y (someone had to label them, usually by hand).",
            "<b>Design the model</b>: the shape of f in Y = f(X): a line, a curve, a tree, a neural network.",
            "<b>Define a loss function</b>: one number saying how wrong the predictions are.",
            "<b>Optimise the weights</b>: change the model's parameters to make the loss smaller.",
          ],
        },
        {
          type: "memoryHook",
          content: 'D-M-L-O: "Don\'t Make Losses, Optimise."',
          detail:
            "Every algorithm in this course is these four steps with different choices plugged in.",
        },
        { type: "widget", lab: "algoatlas" },
        { type: "heading", level: 3, content: "Classification vs regression, and their losses" },
        {
          type: "table",
          headers: ["", "Classification", "Regression"],
          rows: [
            [
              "Predicts",
              "A category (digit, spam/not, benign/malignant)",
              "A number (price, temperature, a deblurred pixel)",
            ],
            ["Typical loss", "Cross-entropy", "Mean squared error (MSE)"],
            [
              "Formula",
              "−log(probability given to the correct class)",
              "average of (y − ŷ)²",
            ],
          ],
        },
        {
          type: "memoryHook",
          content: "Categories → Cross-entropy (both C). Measurements → MSE (both M).",
        },
        {
          type: "prose",
          html: "Cross-entropy feels like this: give the true class probability 0.9 → loss 0.105; give it 0.5 → 0.69; give it 0.1 → 2.30. Confident and wrong is punished hardest, and the punishment grows without bound as the probability approaches zero. That asymmetry is deliberate — it is what stops a classifier from being casually overconfident.",
        },
        {
          type: "prose",
          html: "MSE squares the error, so an error of 10 costs 100 while an error of 2 costs 4. Big misses dominate. The practical consequence: MSE will trade several small errors for one avoided large one, which is right when a large error is genuinely much worse and wrong when your data has outliers you could not clean.",
        },
        {
          type: "genai",
          html: "An LLM is a classifier over its vocabulary. Training a GPT-style model minimises cross-entropy on \"which token comes next\". Same loss as the digit reader, 100,000 classes instead of 10.",
        },
        { type: "heading", level: 3, content: "Optimising: closed form versus gradient descent" },
        {
          type: "prose",
          html: "For linear regression with MSE there's a closed-form answer: w = (XᵀX)⁻¹Xᵀy, solved in one shot. For almost everything else (logistic regression, neural networks) there isn't, so we use <b>gradient descent</b>: compute the slope of the loss, take a small step downhill, repeat. Full details and a live lab are in Module 4.",
        },
        {
          type: "prose",
          html: "Why does only linear regression get the shortcut? Because setting the derivative of a <i>quadratic</i> to zero gives a linear equation, and linear equations have an exact solution. The moment the loss stops being quadratic in the weights — a sigmoid, a hinge, a tree — there is no formula to set to zero, and iteration is the only route.",
        },
        { type: "heading", level: 3, content: "Parametric vs non-parametric" },
        {
          type: "prose",
          html: "<b>Parametric</b> models have a fixed number of weights no matter how much data you have (linear and logistic regression, a fixed-size neural network). <b>Non-parametric</b> models grow with the data (k-nearest neighbours keeps every example, decision trees grow deeper, an SVM keeps its support vectors).<br><br>The practical reading: a parametric model's cost at prediction time is fixed and small; a non-parametric one's can grow with your training set, which matters when you deploy it.",
        },
        { type: "heading", level: 3, content: "Three kinds of learning" },
        {
          type: "table",
          headers: ["Type", "Gets", "Example"],
          rows: [
            ["Supervised", "Inputs + correct answers", "Diagnosis, price prediction, churn"],
            [
              "Unsupervised",
              "Inputs only, find structure",
              "<b>Clustering</b>: customer segments. <b>Association</b>: \"bought bread → buys butter\"",
            ],
            [
              "Reinforcement",
              "Actions + rewards over time",
              "A robot learning to walk forward while minimising falls and energy",
            ],
          ],
        },
        {
          type: "memoryHook",
          content:
            "Supervised = a teacher with an answer key. Unsupervised = a librarian sorting books with no labels. Reinforcement = a gamer chasing a high score.",
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "When the choices bite",
      blocks: [
        {
          type: "list",
          items: [
            "<b>Wrong loss for the question.</b> Using MSE on a 0/1 label (the lecture's own linear classifier does this deliberately) works but is not calibrated — the output is not a probability, and comparing it to 0.5 is a convention, not a derivation.",
            "<b>Optimising the wrong thing.</b> Your loss is what the model minimises; your metric is what you report. They are usually different, and when they diverge badly — log-loss falling while recall worsens — believe the metric.",
            "<b>Reaching for gradient descent on linear regression.</b> There is a closed form. Use it, unless the data is too big to invert XᵀX.",
            "<b>Calling an unsupervised result \"accuracy\".</b> There are no labels to be accurate against. K-means is scored by SSE, not accuracy.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 2",
          detail:
            "ISLP chapter 2 is this chapter in textbook form, with the added formality of the expected test MSE decomposition that Module 5 will need.",
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
          html: "Fill in the four slots for the model you are about to build in this module: <b>Collect</b> — 569 labelled tumours, already done for you. <b>Design</b> — a linear model, <code>ŷ = w·x + b</code>, with 30 weights. <b>Loss</b> — squared error on a −1/+1 label. <b>Optimise</b> — the closed form, because the loss is quadratic.<br><br>That is a complete specification of the Week 1 lab, written before any code.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the same four steps in four lines",
            code: `from sklearn.linear_model import LinearRegression
import numpy as np

# 1 collect (X, y already loaded)   2 design   3 loss is MSE by construction
model = LinearRegression()
# 4 optimise: .fit solves (X'X)^-1 X'y in closed form
model.fit(X_train, y_train)

# predict: the sign of the output is the class, because y is -1/+1
y_pred = np.where(model.predict(X_test) > 0, 1, -1)
print("accuracy", (y_pred == y_test).mean().round(4))
print("weights", model.coef_.shape, "bias", round(model.intercept_, 4))`,
            caption:
              "`.fit()` is step 4 and nothing else. Everything interesting about a model is decided in steps 2 and 3, before you call it.",
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
            "Fill in the four-column table above from memory for linear regression, logistic regression and K-means. <b>Success:</b> you can name the loss and the optimiser for each without looking.",
            "Compute cross-entropy by hand for predicted probabilities 0.9, 0.5 and 0.1 on a true class. <b>Success:</b> 0.105, 0.69, 2.30, and you can say why the last is so much larger.",
            "Fit <code>LinearRegression</code> on the breast-cancer features with the −1/+1 label and report accuracy. <b>Success:</b> you can state why <code>&gt; 0</code> is the right threshold here rather than <code>&gt; 0.5</code>.",
            "Classify five problems you can think of as supervised, unsupervised or reinforcement. <b>Success:</b> at least one of yours is genuinely ambiguous and you can say why.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Implement the closed form yourself with <code>np.linalg.solve(X.T @ X, X.T @ y)</code> and confirm the coefficients match sklearn's to several decimals. Note why <code>solve</code> is better practice than <code>inv</code>.",
            "Take the same features and fit both <code>LinearRegression</code> (MSE) and <code>LogisticRegression</code> (log-loss). Compare their accuracies and, more importantly, whether their outputs can be read as probabilities.",
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
            "D-M-L-O: Don't Make Losses, Optimise.",
            "Categories → Cross-entropy. Measurements → MSE.",
            "Cross-entropy punishes confident-and-wrong hardest, without bound.",
            "Only a quadratic loss gets a closed form; everything else iterates.",
            "Parametric = fixed weights. Non-parametric = grows with the data.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Name the four steps of the recipe.",
              a: "Collect a labelled dataset; design the model shape; define a loss; optimise the weights.",
            },
            {
              q: "Which loss for classification, which for regression?",
              a: "Cross-entropy for classification, mean squared error for regression. Cross-entropy is −log of the probability given to the correct class.",
            },
            {
              q: "Why does linear regression have a closed form when logistic regression does not?",
              a: "Squared error is quadratic in the weights, so setting its derivative to zero gives a linear system with an exact solution. The sigmoid makes log-loss non-quadratic, leaving no equation to solve directly.",
            },
            {
              q: "Grouping customers into segments with no labels is which kind of learning?",
              a: "Unsupervised — specifically clustering. There are no correct answers to compare against, so it is scored by something like SSE rather than accuracy.",
            },
          ],
        },
      ],
    },
  ],
};
