import type { Chapter } from "@/types/content";

export const artificialNeuron: Chapter = {
  slug: "the-artificial-neuron",
  title: "From a biological neuron to w·x + b",
  description:
    "The 1943–1969 history, why the bias exists, the constant-feature trick, and the XOR problem that ended the first AI wave.",
  icon: "⊹",
  order: 1,
  moduleId: "m4",
  estimatedMinutes: 16,
  prerequisites: ["dot-product-and-cosine", "the-four-step-recipe"],
  sourceRefs: ["Module 1 ML Notebook.html § m4-neuron, m4-linear"],
  islpChapters: ["Ch 3"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why start with biology",
      blocks: [
        {
          type: "bigIdea",
          content:
            "A linear model is one artificial neuron: weigh the inputs, add a bias, output the sum. Logistic regression squashes that sum into a probability.",
        },
        {
          type: "prose",
          html: "The biological story is not decoration. It explains why the equation has the shape it has — a weighted sum followed by a decision about whether to fire — and it explains the one historical fact that shaped everything after: in 1969 a single one of these units was shown to be unable to learn XOR, and the field's funding collapsed for a decade.<br><br>Stacking them fixed it. Every neural network you will ever use is this unit, repeated.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "table",
          headers: ["Biology", "Artificial neuron"],
          rows: [
            ["Dendrites receive signals", "Inputs x₁, x₂, …"],
            ["Synapse strength", "Weights w₁, w₂, …"],
            ["Cell body adds things up", "Weighted sum z = w·x + b"],
            ["Fires if above threshold", "Activation (step, sigmoid, …)"],
            ["Axon carries output", "Output ŷ"],
          ],
        },
        { type: "heading", level: 3, content: "A short history" },
        {
          type: "table",
          headers: ["Year", "Milestone"],
          rows: [
            [
              "1943",
              "McCulloch–Pitts neuron: binary inputs, weights +1 (excitatory) / −1 (inhibitory), fires if sum ≥ threshold",
            ],
            ['1949', 'Hebb: learning = strengthening connections ("cells that fire together wire together")'],
            ["1958", "Rosenblatt's Perceptron: first machine that <i>learns</i> its weights. First AI wave."],
            [
              "1969",
              "Minsky &amp; Papert show one perceptron can't learn XOR → funding dries up (AI winter). Fixed later by stacking layers.",
            ],
          ],
        },
        {
          type: "memoryHook",
          content: '"43 fires, 49 wires, 58 learns, 69 burns."',
        },
        { type: "heading", level: 3, content: "The linear model and its bias" },
        {
          type: "formula",
          title: "Linear model",
          lines: `ŷ = w₁x₁ + w₂x₂ + … + wₙxₙ + b  =  w·x + b`,
        },
        {
          type: "prose",
          html: "That is a dot product plus a number, which means you already know how to compute it. The only new thing in this chapter is <code>b</code>.",
        },
        {
          type: "prose",
          html: "Without b the line is forced through the origin. The bias is the starting height (the y-intercept) that lets the line sit where the data is. Trick used everywhere: add a constant feature x₀ = 1 so b becomes just another weight w₀.",
        },
        {
          type: "memoryHook",
          content: "Weights set the tilt. Bias sets the height.",
        },
        {
          type: "prose",
          html: "The constant-feature trick is worth doing once by hand, because it explains a lot of notation you will meet later. Append a column of ones to X and the model becomes a pure dot product <code>ŷ = w·x</code> with no separate bias term. Module 5 writes the linear classifier as <code>W·X = 0</code> with W and X both (D+1)-dimensional for exactly this reason, and the gradient-descent code at the end of this module does <code>X = np.c_[np.ones(len(X)), X]</code> on its first line.",
        },
        {
          type: "trap",
          html: "XOR: (0,0)→0, (1,1)→0, (0,1)→1, (1,0)→1. No single straight line splits these. A linear model alone cannot solve it.",
        },
        {
          type: "prose",
          html: "Draw the four points and try. The two zeros sit on one diagonal and the two ones on the other, so any line that separates (0,1) from (0,0) has (1,0) on the wrong side. The failure is not about training harder or longer — it is that the model's hypothesis space does not contain a solution. That distinction, between \"not trained enough\" and \"cannot be expressed\", is one of the most useful diagnostics you can carry.",
        },
        {
          type: "prose",
          html: "Two ways out, and you will meet both: add features so the problem becomes linearly separable in a bigger space (polynomial features here, the kernel trick in Module 5), or stack units into layers so later units can combine earlier ones. The second is what the field eventually did.",
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "When a linear model is the right call",
      blocks: [
        {
          type: "table",
          headers: ["Reach for it when", "Avoid it when"],
          rows: [
            [
              "You need coefficients a human can read and defend",
              "The true boundary is clearly curved and you cannot engineer features",
            ],
            ["The relation is roughly linear, or can be made so", "There are strong interactions you cannot name in advance"],
            ["You want a fast, honest baseline before anything complex", "Many outliers, with squared error amplifying them"],
            ["Features are many and rows are few (with regularisation)", "You need the model to discover structure you have not thought of"],
          ],
        },
        {
          type: "prose",
          html: "The baseline argument is the one people skip and regret. A linear model takes two minutes to fit and tells you the floor: if a gradient-boosted forest beats it by two points, the extra complexity is not buying much, and you now know that before spending a week on tuning.",
        },
        {
          type: "list",
          items: [
            "<b>Unscaled features.</b> The weights are in the units of their features, so a weight of 0.0001 on a column measured in rupees is not 'unimportant'. Scale before interpreting coefficients.",
            "<b>Correlated features.</b> Two columns saying the same thing split the credit between them arbitrarily. The prediction is fine; the individual coefficients are not interpretable.",
            "<b>Reading a coefficient as a cause.</b> It is the association conditional on the other features in the model. Change the feature set and it changes.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 3",
          detail:
            "ISLP chapter 3 is linear regression in full — coefficient interpretation, standard errors, what the intercept means when features are not centred, and the difference between simple and multiple regression coefficients for the same predictor.",
        },
      ],
    },
    {
      id: "live",
      kind: "live",
      title: "Live: the neuron, with a squash on the end",
      blocks: [
        {
          type: "prose",
          html: "The lab below is the next chapter's subject, but it is worth a minute here: move <code>w</code> and watch the tilt change, move <code>b</code> and watch the whole thing slide sideways without changing shape. Weights set the tilt, bias sets the height — visible in two sliders.",
        },
        { type: "widget", lab: "sigmoid" },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data",
      blocks: [
        { type: "datasetPreview", dataset: "cancer" },
        {
          type: "code",
          code: {
            language: "python",
            title: "one neuron, 30 inputs, and the bias trick",
            code: `import numpy as np
from sklearn.linear_model import LinearRegression

model = LinearRegression().fit(X_train, y_train)
print(model.coef_.shape, model.intercept_.round(4))   # (25,) and one bias

# The same model with the bias folded in as a constant feature
Xb = np.c_[np.ones(len(X_train)), X_train]            # prepend a column of 1s
w  = np.linalg.solve(Xb.T @ Xb, Xb.T @ y_train)       # closed form, bias included

print("w0 (the bias) :", w[0].round(4))
print("sklearn bias  :", model.intercept_.round(4))   # identical
print("weights agree :", np.allclose(w[1:], model.coef_))

# Which features pull hardest toward malignant? (valid because X is scaled)
import pandas as pd
pd.Series(model.coef_, index=X_train.columns).sort_values(key=abs, ascending=False).head(5)`,
            caption:
              "The two biases print the same number, which is the constant-feature trick demonstrated rather than asserted. The last line is only meaningful because step 4 of the pipeline scaled the columns.",
          },
        },
        {
          type: "prose",
          html: "Run the final line and keep the answer. The features with the largest positive weights are the ones pushing a prediction towards malignant, and in Module 6 the decision tree will choose its first split from roughly the same group. When two very different model families agree about which features matter, that is the strongest evidence you get from a dataset this size.",
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
            "Draw the four XOR points on paper and try to separate them with one straight line. <b>Success:</b> you can state in one sentence why no line works, without mentioning training.",
            "Fit a linear model to the XOR table and report its accuracy. <b>Success:</b> you get 50% and you expected it.",
            "Add the feature x₁·x₂ to XOR and refit. <b>Success:</b> 100%, and you can say what that third feature did geometrically.",
            "Verify the constant-feature trick on the breast-cancer data with the code above. <b>Success:</b> <code>w[0]</code> equals <code>model.intercept_</code> and the remaining weights match.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Implement the 1943 McCulloch–Pitts neuron — binary inputs, weights of +1 and −1, fire if the sum meets a threshold — and build AND, OR and NOT with it. Then try to build XOR and watch exactly where it fails.",
            "Fit a linear model to the breast-cancer data with and without the intercept (<code>fit_intercept=False</code>) and compare. The gap is what the bias was doing.",
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
            "43 fires, 49 wires, 58 learns, 69 burns.",
            "Weights set the tilt. Bias sets the height.",
            "Append a column of ones and the bias becomes just another weight.",
            "XOR fails because no line exists, not because training was too short.",
            "Fix it by adding features or by stacking layers.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "What does the bias term do, and how can you get rid of it?",
              a: "It is the intercept — without it the line is forced through the origin. Add a constant feature x₀ = 1 and the bias becomes the weight w₀, making the model a pure dot product.",
            },
            {
              q: "Why can one perceptron not learn XOR?",
              a: "XOR's two positive points lie on one diagonal and its two negatives on the other, so no single straight line separates them. The solution is outside the model's hypothesis space, so no amount of training reaches it.",
            },
            {
              q: "What happened in 1969 and why did it matter?",
              a: "Minsky and Papert published the XOR limitation of a single perceptron, funding dried up and the first AI winter began. Stacking layers resolved the limitation later.",
            },
            {
              q: "You see a weight of 0.0001 on a feature. Is it unimportant?",
              a: "Not necessarily — weights carry the units of their feature. On unscaled data a tiny weight on a large-magnitude column can dominate. Only compare coefficients after scaling.",
            },
          ],
        },
      ],
    },
  ],
};
