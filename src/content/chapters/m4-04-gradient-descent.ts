import type { Chapter } from "@/types/content";

export const gradientDescent: Chapter = {
  slug: "gradient-descent",
  title: "Gradient descent",
  description:
    "The update rule and why it works, the two gradients you should know, learning rates that diverge, local minima, and batch versus stochastic versus mini-batch.",
  icon: "↘",
  order: 4,
  moduleId: "m4",
  estimatedMinutes: 22,
  prerequisites: ["logistic-regression"],
  sourceRefs: ["Module 1 ML Notebook.html § m4-gd"],
  islpChapters: ["Ch 4"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why iterate at all",
      blocks: [
        {
          type: "prose",
          html: "Linear regression has a closed form. Logistic regression does not, and neither does an SVM, a neural network, or anything you will meet after this course. For all of those, \"find the weights that minimise the loss\" is not a formula you evaluate — it is a search you run.<br><br>Gradient descent is that search, and it is almost embarrassingly simple: work out which way is downhill, take a small step that way, repeat. Everything sophisticated in modern training — Adam, momentum, learning-rate schedules — is a refinement of those two lines.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "prose",
          html: "The derivative tells you the slope. Positive slope → moving right goes uphill, so move left. Negative slope → move right. At a minimum the slope is 0.",
        },
        {
          type: "formula",
          title: "Update rule",
          lines: `w  ←  w − η · dL/dw          (η = learning rate, η > 0)
Why it works: L(w + h) − L(w) ≈ L'(w)·h. With h = −η L'(w),
the change is −η L'(w)² ≤ 0. The loss can only go down (for small η).`,
        },
        {
          type: "prose",
          html: "That justification is worth reading twice, because it is the whole guarantee and it is three lines. Take a first-order Taylor expansion of the loss. Substitute the step we intend to take. The resulting change is <i>minus</i> a positive number times a square — and a square is never negative. So the loss decreases. The only caveat is \"for small η\", because the Taylor approximation is only good nearby, and that caveat is exactly where divergence comes from.",
        },
        { type: "widget", lab: "gd" },
        {
          type: "memoryHook",
          content: "The slope says which way. The learning rate says how big a stride.",
          detail:
            "Too small: you're still walking at sunrise. Too big: you leap over the valley and bounce up the other side.",
        },
        { type: "heading", level: 3, content: "More than one weight: partial derivatives and the gradient" },
        {
          type: "prose",
          html: "The lab has one weight. A real model has many — logistic regression on the cancer data has 25 weights and a bias. The loss is then a surface over many dimensions, and you need the slope in each direction separately. That slope is a <b>partial derivative</b>: change one weight, freeze all the others, measure how fast the loss changes. Collect one partial derivative per weight into a vector and you have the <b>gradient</b> ∇L, which points steepest uphill. The update becomes wᵢ ← wᵢ − η·∂L/∂wᵢ for every weight at once.<br><br>If derivatives are new to you, the <a href=\"/learn/calculus-for-ml/\">calculus chapter</a> builds them from scratch, with worked examples and labs for slopes, partial derivatives and the chain rule.",
        },
        {
          type: "widget",
          lab: "partial",
          caption:
            "The same descent on a two-weight loss. Each side panel is a slice of the surface; its slope is one partial derivative. Try the long valley with a large step to see the zig-zag.",
        },
        { type: "heading", level: 3, content: "The two gradients to know" },
        {
          type: "formula",
          title: "Gradients you should know",
          lines: `Linear regression (MSE):     ∂L/∂w = (2/n) Σ (ŷᵢ − yᵢ) xᵢ
Logistic regression (log-loss): ∂L/∂w = (1/n) Σ (pᵢ − yᵢ) xᵢ
Same shape: (prediction − truth) × input.`,
        },
        {
          type: "prose",
          html: "The fact that these two are the same shape is not a coincidence, and it is the most useful thing in this chapter. Two completely different losses, applied to two different models, produce the same update form: <i>error times input</i>. A feature that was large on an example the model got badly wrong gets a large correction. A feature that was zero gets none.<br><br>This generalises. Backpropagation through a deep network is this same quantity, chained. If you understand \"error times input\" you have the shape of nearly all gradient-based learning.",
        },
        { type: "heading", level: 3, content: "When to stop, and where you land" },
        {
          type: "prose",
          html: "<b>When to stop:</b> after a fixed number of iterations, or when the weights (or loss) barely change between two iterations.",
        },
        {
          type: "prose",
          html: "<b>Local vs global minima:</b> MSE for linear regression and log-loss for logistic regression are convex (one bowl), so gradient descent finds the global minimum. Neural networks have many dips.<br><br>Convexity is why every model in <i>this</i> course has a reproducible answer. Run logistic regression twice from different starting points and you get the same weights. Run a neural network twice and you do not — and that is the single biggest practical difference between the two worlds.",
        },
        { type: "heading", level: 3, content: "Batch, stochastic, mini-batch" },
        {
          type: "table",
          headers: ["Variant", "Uses per step", "Trade-off"],
          rows: [
            ["Batch GD", "All rows", "Smooth but slow on big data"],
            ["Stochastic GD", "One row", "Fast, noisy path"],
            ["Mini-batch GD", "32 / 64 / 128 rows", "The default in deep learning"],
          ],
        },
        {
          type: "prose",
          html: "The noise in stochastic descent is not purely a cost. On a non-convex surface it can shake the search out of a shallow dip that batch descent would settle into — which is part of why mini-batch became the default rather than a compromise.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "gradient descent for linear regression, from scratch",
            code: `import numpy as np

def gd(X, y, lr=0.1, steps=500):
    X = np.c_[np.ones(len(X)), X]          # bias as weight w0
    w = np.zeros(X.shape[1])
    for _ in range(steps):
        grad = 2 / len(X) * X.T @ (X @ w - y)
        w -= lr * grad
    return w

# Check it against the closed form
w_gd = gd(X_train.to_numpy(), y_train, lr=0.1, steps=2000)
Xb = np.c_[np.ones(len(X_train)), X_train]
w_exact = np.linalg.solve(Xb.T @ Xb, Xb.T @ y_train)
print(np.abs(w_gd - w_exact).max().round(6))   # -> tiny, if lr and steps are sane`,
            caption:
              "`X @ w - y` is the error vector and `X.T @ error` is error-times-input summed over rows — the formula above, written in one line of linear algebra.",
          },
        },
        {
          type: "prose",
          html: "Run that comparison and the agreement is the proof. Iterating towards the answer and solving for it directly land in the same place, because the surface is convex and there is only one place to land.",
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
            "<b>Learning rate too high.</b> The loss increases, oscillates, or becomes <code>nan</code>. On the simple bowl L(w) = w² the threshold is exactly η = 1 — the lab lets you cross it on purpose.",
            "<b>Learning rate too low.</b> The loss falls but never arrives. Looks like a modelling problem; is a patience problem. Always plot loss against iteration.",
            "<b>Unscaled features.</b> If one feature's scale is a thousand times another's, the loss surface is a long narrow valley and a single learning rate cannot suit both directions. Gradient descent zigzags. Scaling is not optional here.",
            "<b>Forgetting to average.</b> Dividing by n keeps the gradient's size independent of the dataset size, so your learning rate still works when the data grows.",
            "<b>Expecting reproducibility from a non-convex model.</b> Different initialisation, different minimum. Fix the seed and report it.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 4",
          detail:
            "ISLP chapter 4 covers the maximum-likelihood fitting of logistic regression that this iteration is solving, and its deep-learning chapter returns to gradient descent with momentum and the stochastic variants.",
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
          type: "code",
          code: {
            language: "python",
            title: "a learning-rate sweep on the real features",
            code: `import numpy as np

def gd_trace(X, y, lr, steps=300):
    X = np.c_[np.ones(len(X)), X]
    w = np.zeros(X.shape[1])
    losses = []
    for _ in range(steps):
        err = X @ w - y
        losses.append((err ** 2).mean())
        w -= lr * (2 / len(X)) * (X.T @ err)
    return np.array(losses), w

Xtr = X_train.to_numpy()
for lr in [0.001, 0.01, 0.1, 0.5, 1.0]:
    losses, _ = gd_trace(Xtr, y_train, lr)
    end = losses[-1]
    print(f"lr={lr:<6} final loss {end:.4f}  "
          f"{'DIVERGED' if not np.isfinite(end) or end > losses[0] else 'ok'}")`,
            caption:
              "Plot each `losses` curve on one set of axes. The small rates give long slow slopes, the good one drops fast and flattens, and the largest blows up — three shapes you will recognise for the rest of your career.",
          },
        },
        {
          type: "prose",
          html: "This works on the cleaned, <i>scaled</i> features from the Module 3 pipeline. Try it on the raw columns, where <code>area_worst</code> runs into the thousands, and every learning rate that is stable for one feature is useless for another. That experiment is the most convincing argument for scaling you will run.",
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
            "Implement <code>gd</code> from scratch and check it against <code>np.linalg.solve</code> on the breast-cancer features. <b>Success:</b> the maximum absolute difference is below 1e-4 and you can say why it is not exactly zero.",
            "Sweep the learning rate over five orders of magnitude and plot loss against iteration for each. <b>Success:</b> you can point at the too-small, the good and the diverging curve.",
            "Find the exact divergence threshold for L(w) = w² by hand. <b>Success:</b> you derive η = 1 from the update w ← w(1 − 2η) and confirm it in the lab.",
            "Derive the logistic gradient from log-loss and the sigmoid. <b>Success:</b> you arrive at (1/n) Σ (pᵢ − yᵢ) xᵢ and can say why the sigmoid's derivative cancels so neatly.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Implement stochastic and mini-batch variants and plot all three loss curves together. The noise in the stochastic path should be clearly visible.",
            "Run the sweep on unscaled features and find a single learning rate that works for all 30 columns. You will not find one — that is the result.",
            "Add momentum: keep a running average of the gradient and step along that instead. Compare how many iterations each needs to reach the same loss.",
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
            "The slope says which way; the learning rate says how big a stride.",
            "Both gradients have the same shape: (prediction − truth) × input.",
            "The guarantee is three lines of Taylor expansion, and it only holds for small η.",
            "Convex loss → one minimum → reproducible answer. Neural networks have many dips.",
            "Unscaled features make a narrow valley that no single learning rate suits.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Write the gradient-descent update rule and say why it decreases the loss.",
              a: "w ← w − η·dL/dw. From a first-order expansion, the change in loss is approximately −η·L'(w)², which is never positive — so for a small enough η the loss can only go down.",
            },
            {
              q: "What happens if the learning rate is too large?",
              a: "The step overshoots the minimum and lands further up the other side, so the loss grows each iteration and eventually becomes infinite. On L(w) = w² this happens for η above 1.",
            },
            {
              q: "Why do the MSE and log-loss gradients have the same shape?",
              a: "Both reduce to (prediction − truth) × input. For log-loss the sigmoid's derivative cancels against the log in the loss, leaving the same error-times-input form — which is also the shape backpropagation generalises.",
            },
            {
              q: "Does gradient descent find the global minimum?",
              a: "For a convex loss — MSE in linear regression, log-loss in logistic regression — yes, there is only one. For a neural network, no: there are many dips and where you land depends on initialisation.",
            },
          ],
        },
      ],
    },
  ],
};
