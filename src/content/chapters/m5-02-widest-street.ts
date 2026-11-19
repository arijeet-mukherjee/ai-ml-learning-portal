import type { Chapter } from "@/types/content";

export const widestStreet: Chapter = {
  slug: "the-widest-street",
  title: "Margins, soft margins and support vectors",
  description:
    "Why the widest street survives noise, the optimisation behind it, slack and the C knob, and why only a handful of points define the boundary.",
  icon: "▭",
  order: 2,
  moduleId: "m5",
  estimatedMinutes: 24,
  prerequisites: ["linear-classifiers-and-the-perceptron"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m5-margin, m5-soft, m5-sv",
    "Module_1_Study_Guide.md § Part 3",
  ],
  islpChapters: ["Ch 9"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why width is the right criterion",
      blocks: [
        {
          type: "prose",
          html: "The perceptron stops at the <i>first</i> line that works, often one that scrapes past a point. A tiny bit of noise then flips that point.<br><br>Here is the argument for width, in one step. Your training points are samples. A new point from the same source will land near — but not exactly on — an existing one. If the boundary runs a hair from a training point, a small perturbation crosses it. If the boundary sits in the middle of a wide empty corridor, a small perturbation changes nothing. Width <i>is</i> robustness to the noise you have not seen yet.",
        },
        {
          type: "memoryHook",
          content:
            "Pave the widest possible road between two villages. The centre line is the decision boundary, the kerbs are the margins, and the houses touching the kerbs are the support vectors.",
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
          html: "The <b>margin</b> of a class is the smallest perpendicular distance from any of its points to the line. We want both margins large and equal.",
        },
        {
          type: "deepDive",
          summary: "From zero: how far is a point from a line? (the geometry the SVM is built on)",
          blocks: [
            {
              type: "prose",
              html: "A line (in 2-D) or hyperplane (in more dimensions) is the set of points where <code>w · x + b = 0</code>. The vector w is perpendicular to it — it points straight across the street. For any point x, the number <code>f(x) = w · x + b</code> is positive on one side, negative on the other and zero on the line; that sign is the SVM's prediction.<br><br>Its size is a scaled distance. The true perpendicular distance is <code>|w · x + b| / ‖w‖</code>.",
            },
            {
              type: "formula",
              title: "Worked example",
              lines: `line: 3x₁ + 4x₂ − 5 = 0      → w = (3, 4), b = −5, ‖w‖ = √(9 + 16) = 5
point (3, 4):   w·x + b = 9 + 16 − 5 = 20     distance = 20 / 5 = 4
point (1, 0.5): w·x + b = 3 + 2 − 5 = 0       distance = 0  (on the line)

kerbs at w·x + b = ±1 → each kerb is 1/‖w‖ = 0.2 from the centre, street width 2/‖w‖ = 0.4
halve w to (1.5, 2), b = −2.5 → same centre line, street width 2/2.5 = 0.8`,
            },
            {
              type: "prose",
              html: "The last two lines are the whole idea behind “minimise ‖w‖”: the centre line stays put when you scale w and b together, but the kerbs (where f = ±1) move outwards as ‖w‖ shrinks. The SVM looks for the <b>smallest w that still keeps every training point on the correct side of its kerb</b> (y·f(x) ≥ 1).",
            },
            {
              type: "formula",
              title: "Hinge loss in numbers, for a point whose label is y = +1",
              lines: `f(x) = 2.0   → max(0, 1 − 2.0)  = 0     correct and outside the street: no cost
f(x) = 0.5   → max(0, 1 − 0.5)  = 0.5   correct side, but inside the street
f(x) = −1.0  → max(0, 1 + 1.0)  = 2.0   wrong side: cost grows linearly`,
            },
          ],
        },
        {
          type: "formula",
          title: "Max-margin as optimisation",
          lines: `boundaries:   W·X = +k (red side)   and   W·X = −k (blue side)
total margin = 2k / ‖W‖
maximise margin ⇔ minimise ½‖W‖²   subject to  yᵢ(W·Xᵢ) ≥ k for every i`,
        },
        {
          type: "prose",
          html: "The flip from \"maximise\" to \"minimise\" deserves unpacking, because it is where students lose the thread. The margin is 2k/‖W‖. You can fix k = 1 without loss of generality — scaling W and k together does not move the boundary — and then the margin is 2/‖W‖. Making that <i>large</i> means making ‖W‖ <i>small</i>. Minimising ½‖W‖² instead of ‖W‖ changes nothing about where the minimum is and makes the derivative clean. So \"widest street\" and \"smallest weights subject to getting everything right\" are the same request.",
        },
        {
          type: "prose",
          html: "Notice what that means: the SVM's objective is a <i>regularised</i> one by construction. ½‖W‖² is the same L2 penalty from Module 4. Maximising the margin and shrinking the weights are the same act.",
        },
        { type: "heading", level: 3, content: "Soft margin: allowing some mistakes" },
        {
          type: "prose",
          html: "Real data overlaps. Give every point a slack δᵢ ≥ 0 (\"grace marks\") and charge for it:",
        },
        {
          type: "formula",
          title: "Soft-margin SVM",
          lines: `minimise  ½‖W‖² + C Σᵢ δᵢ     s.t.  yᵢ(W·Xᵢ) + δᵢ ≥ k
δ = 0         correct and outside the street
0 < δ < k     correct side, but inside the street
δ > k         misclassified
hinge loss:  max(0, 1 − y·f(x))  is exactly that slack`,
        },
        {
          type: "prose",
          html: "The last line is the bridge to everything else in the course. Hinge loss is zero for a point that is correct and comfortably outside the margin, and grows linearly once it strays inside. So the soft-margin SVM is just <i>hinge loss plus an L2 penalty</i> — the same two-part recipe as Ridge regression, with a different loss.",
        },
        {
          type: "table",
          headers: ["C", "Behaviour", "Risk"],
          rows: [
            ["Large (e.g. 1000+)", 'Hates slack → narrow street, near "hard margin"', "Overfits, chases outliers (high variance)"],
            ["Small (e.g. 0.1–1)", "Tolerates slack → wide street", "Can underfit (higher bias)"],
          ],
        },
        {
          type: "memoryHook",
          content: "C = how Cranky the teacher is about mistakes.",
          detail:
            "C multiplies the total slack, so a large C makes each violation expensive and the model will narrow the street rather than pay for one.",
        },
        { type: "widget", lab: "svm" },
        { type: "heading", level: 3, content: "Support vectors" },
        {
          type: "prose",
          html: "The solution has the form <span class=\"mark\">W = Σ αᵢ yᵢ Xᵢ</span>. For most points αᵢ = 0. It's non-zero only for points on the margin, inside it, or misclassified. Those are the <b>support vectors</b>; delete every other training point and the boundary doesn't move.",
        },
        {
          type: "prose",
          html: "Prediction needs only them: y = sign(Σ αᵢ yᵢ (Xᵢ · X_test)), a dot product of the test point with each support vector.",
        },
        {
          type: "prose",
          html: "Two consequences worth holding onto. First, an SVM is <i>non-parametric</i> in the sense of Module 3 — it keeps training examples, and how many depends on the data. Second, that prediction formula contains the test point only inside a dot product with training points. Replace that dot product with something else and you get the kernel trick, which is the next chapter.",
        },
        {
          type: "trap",
          html: "<code>LinearSVC</code> defaults to <b>squared</b> hinge loss. To get the lecture's formulation you must pass <code>loss='hinge'</code> explicitly. At large C also pass <code>max_iter=100000</code> or you will get convergence warnings.",
        },
        {
          type: "gradedDetail",
          html: "Assignment-1 Part 3 checks both of those. <code>LinearSVC(C=1, loss='hinge')</code> — the <code>loss</code> argument is rubric-checked. The 7-mark questions want the boundary <i>and</i> both margins drawn: with two features, solve <code>w₀x₀ + w₁x₁ + b = c</code> for x₁, giving <code>x₁ = −(w₀x₀ + b − c) / w₁</code> for c = 0 (boundary), +1 and −1 (margins). Get <code>w = svc.coef_[0]</code> and <code>b = svc.intercept_[0]</code>.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "fit, measure the margin, draw all three lines",
            code: `import numpy as np, matplotlib.pyplot as plt
from sklearn.svm import LinearSVC

def run_linear_svc(X, y, C):
    svc = LinearSVC(C=C, loss="hinge", max_iter=100000).fit(X, y)
    w, b = svc.coef_[0], svc.intercept_[0]
    margin = 2 / np.linalg.norm(w)

    xs = np.linspace(X[:, 0].min(), X[:, 0].max(), 2)
    for c, style in [(0, "-"), (1, "--"), (-1, "--")]:
        plt.plot(xs, -(w[0] * xs + b - c) / w[1], style, color="k")
    plt.scatter(X[y == 0, 0], X[y == 0, 1], color="blue")
    plt.scatter(X[y == 1, 0], X[y == 1, 1], color="red")
    plt.title(f"C={C}  margin width {margin:.3f}")
    plt.show()
    return svc, margin

svc1,   m1   = run_linear_svc(X2, y2, C=1)      # margin 0.639
svc1000, m2  = run_linear_svc(X2, y2, C=1000)   # margin 0.243`,
            caption:
              "Three lines from one formula, with c stepping through 0, +1 and −1. That is the whole of the 7-mark plotting question.",
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
            "<b>Not scaling.</b> The margin is measured in feature units, so an unscaled large column dominates ‖W‖ and the street is drawn almost entirely in that one direction. For SVMs, scaling is not a nicety.",
            "<b>Expecting probabilities.</b> An SVM returns a signed distance, not a probability. <code>probability=True</code> on <code>SVC</code> fits a separate calibration and is slow; logistic regression is usually the better choice if you need probabilities.",
            "<b>Forgetting <code>loss='hinge'</code>.</b> The silent default is squared hinge, which penalises violations quadratically and gives different margins.",
            "<b>Large C on noisy data.</b> The model will contort the boundary to accommodate one mislabelled point. That is the overfitting mode the dartboard chapter formalises.",
            "<b>Too many rows.</b> Kernel SVMs scale badly past tens of thousands of rows. <code>LinearSVC</code> handles large n; <code>SVC</code> does not.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 9",
          detail:
            "ISLP chapter 9 derives the maximal margin classifier, the support vector classifier (the soft-margin version) and support vector machines in sequence, with the same C-as-budget intuition and the same observation that only the support vectors matter.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data",
      blocks: [
        {
          type: "result",
          headers: ["Setting", "Margin width", "Test accuracy"],
          rows: [
            ["<code>LinearSVC(C=1, loss='hinge')</code>", "<b>0.639</b>", "1.0"],
            ["<code>LinearSVC(C=1000, loss='hinge')</code>", "<b>0.243</b>", "1.0"],
          ],
          caption:
            "Assignment Q14–Q15 on iris, classes 0 and 1, two features, 80/20 split with random_state=42.",
        },
        {
          type: "prose",
          html: "Read this result carefully, because it is a good lesson in what an experiment does and does not show. The margin narrowed by a factor of 2.6 when C went up by a factor of 1,000 — exactly as the theory says. But accuracy stayed at 1.0 in both cases, because setosa and versicolor are easy and comfortably separable.<br><br>So this experiment demonstrates the <i>mechanism</i> of C and tells you nothing about which C to choose. On easy data every reasonable setting wins. You find out whether C matters on hard data — which is the churn lab at the end of this module.",
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
          type: "list",
          ordered: true,
          items: [
            "Reproduce Assignment Q11–Q15: keep iris classes 0 and 1, scatter them in two colours, split 80/20 with <code>random_state=42</code>, fit <code>LinearSVC(C=1, loss='hinge')</code>, plot the boundary and both margins over the whole dataset, and report test accuracy. <b>Success:</b> margin 0.639, accuracy 1.0, three lines drawn.",
            "Repeat at C=1000. <b>Success:</b> margin 0.243, accuracy still 1.0, and you can explain why accuracy did not move.",
            "Identify the support vectors and confirm that deleting every other training point leaves the boundary unchanged. <b>Success:</b> refitting on only the support vectors gives the same <code>coef_</code> to several decimals.",
            "Show the <code>loss</code> default matters: fit once with <code>loss='hinge'</code> and once without, and compare the margins. <b>Success:</b> they differ, and you can say which the rubric wants.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Sweep C over six orders of magnitude and plot margin width against C on a log axis. The curve is the C knob made visible.",
            "Add one deliberately mislabelled point near the boundary and refit at C=1 and C=1000. Watch the large-C boundary distort to accommodate it while the small-C one ignores it.",
            "Implement hinge loss yourself and confirm that a point correct and outside the margin contributes exactly zero.",
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
            "Pave the widest road: centre line is the boundary, kerbs are the margins, houses on the kerbs are the support vectors.",
            "Margin = 2/‖W‖, so maximising it means minimising ½‖W‖² — the same L2 penalty as Ridge.",
            "Soft-margin SVM = hinge loss + L2 penalty, with C weighting the slack.",
            "C = how Cranky about mistakes. Large C, narrow street, more variance.",
            "LinearSVC defaults to squared hinge — pass loss='hinge' explicitly.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "What happens to the margin as C increases?",
              a: "It narrows. A larger C makes each slack violation more expensive, so the model prefers a tighter street to paying for violations — approaching a hard margin, with more overfitting risk.",
            },
            {
              q: "Why does maximising the margin mean minimising ‖W‖?",
              a: "The total margin is 2k/‖W‖. Fixing k = 1 (a free choice, since scaling W and k together leaves the boundary unmoved) makes the margin 2/‖W‖, so a wider margin is a smaller ‖W‖. ½‖W‖² is used because its derivative is clean.",
            },
            {
              q: "Which points are the support vectors?",
              a: "Those with non-zero αᵢ — the points on the margin, inside it, or misclassified. Every other training point can be deleted without moving the boundary.",
            },
            {
              q: "Margin 0.639 at C=1 and 0.243 at C=1000, both with accuracy 1.0. What does that tell you?",
              a: "That C does what the theory says to the margin, and that this data is easy enough for accuracy not to distinguish the two. The mechanism is demonstrated; the choice of C is not.",
            },
          ],
        },
      ],
    },
  ],
};
