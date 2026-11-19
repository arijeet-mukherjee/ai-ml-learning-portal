import type { Chapter } from "@/types/content";

export const perceptron: Chapter = {
  slug: "linear-classifiers-and-the-perceptron",
  title: "Linear classifiers and the perceptron",
  description:
    "Supervised learning framed properly, the hyperplane written as W·X = 0, and the 1958 algorithm that learns from its mistakes.",
  icon: "⫽",
  order: 1,
  moduleId: "m5",
  estimatedMinutes: 20,
  prerequisites: ["the-artificial-neuron"],
  sourceRefs: ["Module 1 ML Notebook.html § m5-frame, m5-linear, m5-perceptron"],
  islpChapters: ["Ch 9"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why 'any line that works' is not good enough",
      blocks: [
        {
          type: "bigIdea",
          content:
            "Many lines can split two classes. An SVM picks the one with the widest empty street on both sides, because that line survives noise best.",
        },
        {
          type: "prose",
          html: "This chapter builds the first half of that sentence. The perceptron finds <i>a</i> line — the first one that happens to work, often one scraping past a point by a hair. Next chapter explains why that is a problem and what to do instead.<br><br>Starting here rather than with the SVM is worth the detour, because the perceptron's update rule is three lines long, it is the direct ancestor of backpropagation, and watching it stop at an obviously bad line is the most convincing possible motivation for margins.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        { type: "heading", level: 3, content: "Supervised learning, framed" },
        {
          type: "prose",
          html: "<b>Features</b>: any measurable attribute (numeric, categorical, ordinal). <b>Model</b>: an <i>imagined</i> relation between features and label, with parameters. There is no \"true model\" hiding in the data, only better and worse descriptions. <b>Learning algorithm</b>: anything that estimates those parameters by minimising a loss.",
        },
        {
          type: "prose",
          html: "That middle sentence is the one to sit with. Students often look for the right model as though it were a fact about the data waiting to be discovered. It is not. A model is a description you propose, and the question is only whether it describes well enough to be useful on data you have not seen.",
        },
        {
          type: "table",
          headers: ["Model family", "Form"],
          rows: [
            ["Linear regression", "Y = w₀ + w₁X₁ + w₂X₂ + w₃X₃"],
            ["Polynomial / interaction", "Y = w₀ + w₁X₁ + w₂X₂² + w₃X₂X₃"],
            ["Linear classifier", "Y = sign(w₀ + w₁X₁ + w₂X₂ + w₃X₃)"],
            ["Logistic regression", "P(Y=1|X) = 1 / (1 + exp(−w·X))"],
          ],
        },
        { type: "heading", level: 3, content: "A line in 2D, a hyperplane in D dimensions" },
        {
          type: "formula",
          title: "The compact form",
          lines: `w₁x₁ + w₂x₂ + w₃ = 0     (w₃ is the bias, weight of a constant feature 1)
compact: W·X = 0, with W and X both (D + 1)-dimensional
prediction: y = sign(W·X)  → +1 on one side, −1 on the other`,
        },
        {
          type: "prose",
          html: "This is the constant-feature trick from Module 4, now doing real work: folding the bias into W means the boundary is the clean statement <code>W·X = 0</code> rather than <code>w·x + b = 0</code>, and the perceptron update below becomes a single line instead of two.",
        },
        {
          type: "prose",
          html: "<b>Linearly separable</b>: at least one line splits the classes perfectly. Many real datasets are not. Geometrically, W is the <i>normal</i> to the boundary — it points perpendicular to the line, towards the +1 side — and <code>W·X</code> is proportional to the signed distance from a point to that line. The sign is which side; the magnitude is how far.",
        },
        {
          type: "trap",
          html: "A linear classifier needs numeric features. Categories must be encoded first (one-hot) before the dot product means anything.",
        },
        { type: "heading", level: 3, content: "The perceptron algorithm" },
        {
          type: "formula",
          title: "Perceptron",
          lines: `start with any W
repeat over the data:
    if yᵢ · (W·Xᵢ) ≤ 0:      # wrong side (or on the line)
        W = W + yᵢ Xᵢ          # nudge the line toward the right answer
stop when every point is correct (or after max_iter)`,
        },
        {
          type: "prose",
          html: "The test <code>yᵢ·(W·Xᵢ) ≤ 0</code> is the whole cleverness. <code>W·Xᵢ</code> is positive on one side and negative on the other; <code>yᵢ</code> is +1 or −1. Multiply them and the product is positive exactly when the prediction and the label agree. So one expression covers both classes with no case analysis.",
        },
        {
          type: "prose",
          html: "Why the update works: if a +1 point scored negative, adding Xᵢ to W raises W·Xᵢ by |Xᵢ|². If the data is linearly separable, the perceptron is guaranteed to find a perfect line in finitely many steps. If not, it never settles.",
        },
        {
          type: "memoryHook",
          content: "The perceptron is a student who only studies the questions they got wrong.",
          detail:
            "Correct points contribute nothing to the update. All the learning comes from mistakes — which is also why it stops the instant there are none.",
        },
        { type: "widget", lab: "svm" },
        {
          type: "prose",
          html: "Run the perceptron twice in that lab, from different starting states, and you will usually get two different lines. Both are correct on the training data. Neither has any claim to being better — which is precisely the gap the next chapter closes.",
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
            "<b>Non-separable data.</b> The perceptron never converges — it cycles forever, swapping which points it gets wrong. You must cap <code>max_iter</code>, and the line you end on is whichever one the clock stopped at.",
            "<b>No margin guarantee.</b> It stops at the first working line, which may pass within a hair of a training point. One noisy new observation then flips that point.",
            "<b>Order dependence.</b> Shuffle the rows and you get a different line. Reproducibility requires fixing both the order and the initialisation.",
            "<b>Unscaled features.</b> The update adds <code>yᵢXᵢ</code> directly to W, so a feature measured in thousands dominates every step.",
            "<b>No probabilities.</b> The output is a sign. If you need confidence, use logistic regression.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 9",
          detail:
            "ISLP chapter 9 opens with the maximal margin classifier for exactly the reason this chapter ends on: among the infinitely many separating hyperplanes, some principled choice has to be made, and 'widest margin' is that principle.",
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
            title: "the perceptron, written out, on the real features",
            code: `import numpy as np

def perceptron(X, y, max_iter=100):
    """y must be -1/+1. Returns W including the bias as W[0]."""
    X = np.c_[np.ones(len(X)), X]              # constant feature -> bias folded in
    W = np.zeros(X.shape[1])
    for epoch in range(max_iter):
        mistakes = 0
        for xi, yi in zip(X, y):
            if yi * (W @ xi) <= 0:             # wrong side, or exactly on the line
                W += yi * xi                   # the entire learning rule
                mistakes += 1
        if mistakes == 0:
            return W, epoch + 1
    return W, max_iter

W, epochs = perceptron(X_train.to_numpy(), y_train)   # y_train is -1/+1
print("converged in", epochs, "passes")

Xb_test = np.c_[np.ones(len(X_test)), X_test]
pred = np.where(Xb_test @ W > 0, 1, -1)
print("test accuracy", (pred == y_test).mean().round(4))

# Run it again on shuffled rows: a different line, also correct on train
idx = np.random.default_rng(0).permutation(len(X_train))
W2, _ = perceptron(X_train.to_numpy()[idx], y_train[idx])
print("same line?", np.allclose(W, W2))        # -> False`,
            caption:
              "The last two lines are the lesson. Two runs, two different boundaries, both perfect on the training data. The perceptron has no way to prefer one.",
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
            "Implement the perceptron from the pseudocode and run it on the cleaned breast-cancer features. <b>Success:</b> it converges in a handful of passes and you report test accuracy.",
            "Run it on shuffled data three times and compare the resulting W vectors. <b>Success:</b> they differ, and you can say why that matters.",
            "Construct deliberately non-separable data (overlap two blobs) and run with <code>max_iter=1000</code>. <b>Success:</b> it never reaches zero mistakes, and you can describe what the mistake count does instead.",
            "Verify the update's effect by hand: take a misclassified +1 point, apply W += X, and show that W·X increased by |X|². <b>Success:</b> your arithmetic matches.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Track and plot the number of mistakes per pass for both separable and non-separable data. One curve hits zero; the other plateaus and jitters forever.",
            "Add a learning rate to the update (<code>W += lr * yi * xi</code>) and show it changes only the scale of W, not the boundary — a useful demonstration that the perceptron's boundary is scale-invariant in W.",
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
            "There is no true model hiding in the data — only better and worse descriptions.",
            "W·X = 0 is the boundary; W is its normal, and W·X is the signed distance.",
            "yᵢ·(W·Xᵢ) ≤ 0 covers both classes in one expression.",
            "The perceptron only studies the questions it got wrong.",
            "It stops at the first line that works — which is the problem the SVM solves.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "State the perceptron update rule and when it fires.",
              a: "If yᵢ(W·Xᵢ) ≤ 0 — the point is on the wrong side or exactly on the line — then W ← W + yᵢXᵢ. Correctly classified points produce no update.",
            },
            {
              q: "Is the perceptron guaranteed to converge?",
              a: "Only if the data is linearly separable; then it finds a perfect line in finitely many steps. On non-separable data it never settles and must be capped by max_iter.",
            },
            {
              q: "What does W·X represent geometrically?",
              a: "W is the normal to the boundary, and W·X is proportional to the signed perpendicular distance from the point to that boundary — sign gives the side, magnitude the distance.",
            },
            {
              q: "Two perceptron runs give different lines. Which is better?",
              a: "The algorithm cannot say — both are perfect on the training data. That absence of a preference is what motivates the maximum-margin criterion.",
            },
          ],
        },
      ],
    },
  ],
};
