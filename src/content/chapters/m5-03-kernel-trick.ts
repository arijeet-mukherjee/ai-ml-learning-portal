import type { Chapter } from "@/types/content";

export const kernelTrick: Chapter = {
  slug: "the-kernel-trick",
  title: "Non-linear SVM: the kernel trick",
  description:
    "Lifting rings into three dimensions, why you never have to build the lift, the three kernels you need, and what gamma controls.",
  icon: "◠",
  order: 3,
  moduleId: "m5",
  estimatedMinutes: 20,
  prerequisites: ["the-widest-street"],
  sourceRefs: ["Module 1 ML Notebook.html § m5-kernel"],
  islpChapters: ["Ch 9"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why lifting beats bending",
      blocks: [
        {
          type: "prose",
          html: "Points on concentric rings can't be split by a line. Module 4's answer was polynomial features — add x², x₁x₂ and so on, and the linear model bends. That works, and on the breast-cancer data it was a disaster: degree 3 on 25 features produced thousands of columns and 75% test accuracy.<br><br>The kernel trick gets the same expressive power without paying for those columns. That is the entire point, and it is one of the genuinely elegant ideas in machine learning.",
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
          html: "Points on concentric rings can't be split by a line. Map them with φ(x) = (x₁, x₂, x₁² + x₂²) and the inner ring sits low, the outer ring high: now a flat plane separates them.",
        },
        { type: "widget", lab: "kernel" },
        {
          type: "prose",
          html: "Look at what the lab shows. The left panel never changes — lifting does not move the data. It adds a third <i>reading</i> of the same points, and in that reading a flat cut is enough. Back in the original two dimensions, that flat cut is a circle.",
        },
        {
          type: "prose",
          html: "Now recall the SVM's prediction from last chapter: <code>y = sign(Σ αᵢ yᵢ (Xᵢ · X_test))</code>. The test point appears <i>only</i> inside a dot product with training points. So if you want to work in the lifted space, you do not need φ(x) itself — you only need φ(Xᵢ) · φ(X_test). And for many useful φ, that dot product has a closed form you can compute directly from the original coordinates.",
        },
        {
          type: "formula",
          title: "Kernelised SVM",
          lines: `y = sign( Σ αᵢ yᵢ φ(Xᵢ)·φ(X_test) ) = sign( Σ αᵢ yᵢ K(Xᵢ, X_test) )
the kernel K computes the high-dimensional dot product without ever building φ`,
        },
        {
          type: "prose",
          html: "That is the trick, stated plainly: <b>you never build the new features.</b> The RBF kernel corresponds to an <i>infinite</i>-dimensional φ, which you obviously could not construct — and computing <code>exp(−γ‖a − b‖²)</code> takes a subtraction, a norm and an exponential.",
        },
        {
          type: "table",
          headers: ["Kernel", "K(a, b)", "Good for"],
          rows: [
            ["Linear", "a·b", "Many features, text, already separable"],
            ["Polynomial", "(a·b + c)^d", "Interactions between features"],
            ["RBF / Gaussian", "exp(−γ‖a − b‖²)", "Default for curved boundaries"],
          ],
        },
        { type: "heading", level: 3, content: "The trick, verified with real numbers (polynomial kernel)" },
        {
          type: "prose",
          html: "Take a = (1, 2) and b = (3, 1) and the degree-2 kernel K(a, b) = (a · b)².<br>• <b>The shortcut:</b> a · b = 1·3 + 2·1 = 5, so K = 5² = <b>25</b>. One dot product and one square.<br>• <b>The long way:</b> the lift for this kernel is φ(x) = (x₁², √2·x₁x₂, x₂²). So φ(a) = (1, 2√2, 4) and φ(b) = (9, 3√2, 1). Their dot product: 1·9 + (2√2)(3√2) + 4·1 = 9 + 12 + 4 = <b>25</b>.<br>Same answer, without ever building the 3-D vectors. For degree 3 on 25 features the lift has thousands of dimensions; the shortcut is still one dot product and one power.",
        },
        { type: "heading", level: 3, content: "The RBF kernel, from zero" },
        {
          type: "prose",
          html: "RBF stands for <b>radial basis function</b>: “radial” because it depends only on the distance between the two points, not on direction. Read its formula from the inside out:<br>1. <code>‖a − b‖²</code> — the squared distance between the points (Module 2).<br>2. <code>−γ · distance²</code> — make it negative and scale it by γ.<br>3. <code>exp(…)</code> — e to that power. e⁰ = 1, and e to a large negative number is almost 0.<br>So K = 1 when the points are identical and slides smoothly towards 0 as they move apart. It is a <b>similarity score</b> shaped like a bell curve centred on each training point — that is why it is also called the Gaussian kernel.",
        },
        {
          type: "formula",
          title: "Worked example: a = (1, 2), b = (2, 0)",
          lines: `‖a − b‖² = (1 − 2)² + (2 − 0)² = 1 + 4 = 5

γ = 0.1   K = exp(−0.5) = 0.607     still quite similar: wide bubbles
γ = 0.5   K = exp(−2.5) = 0.082     barely similar
γ = 1     K = exp(−5)   = 0.0067    strangers
γ = 2     K = exp(−10)  ≈ 0.00005   might as well be on different planets

“influence radius” where K drops to 0.5:  d = √(ln 2 / γ)   (γ = 1 → d = 0.83)`,
        },
        {
          type: "prose",
          html: "Now the prediction <code>f(x) = Σ αᵢ yᵢ K(xᵢ, x) + b</code> reads in plain English: <b>every support vector casts a vote for its own class, and the vote's strength is how similar it is to the new point</b>. Near a cluster of red support vectors their votes dominate and f says red. Far from every training point all similarities are ~0 and f falls back to the bias. The boundary is where the red and blue votes balance.",
        },
        {
          type: "widget",
          lab: "rbf",
          caption:
            "Slide γ up from the default of 2 on the rings. Each similarity bubble shrinks and the boundary breaks into islands wrapped around single points: at γ = 2 the lab scores 100% train / 93% test, at γ = 20 it is 100% / 78%, at γ = 200 only 100% / 57%. Then go to small γ and drop C to 0.1: the boundary flattens and the model underfits (78% / 60%).",
        },
        {
          type: "deepDive",
          summary: "Why does RBF correspond to infinitely many features?",
          blocks: [
            {
              type: "prose",
              html: "Expand the square: ‖a − b‖² = ‖a‖² + ‖b‖² − 2a·b, so K(a, b) = e^(−γ‖a‖²) · e^(−γ‖b‖²) · e^(2γ a·b). The last factor's Taylor series is 1 + 2γ(a·b) + (2γ a·b)²/2! + (2γ a·b)³/3! + … — a polynomial kernel of degree 1, plus degree 2, plus degree 3, forever. Each degree is a lifted feature space, so the RBF kernel is a dot product in the combination of all of them: infinitely many features, evaluated with one exponential.",
            },
          ],
        },
        {
          type: "prose",
          html: "<b>γ (gamma)</b> controls how fast similarity fades with distance. Small γ: each point influences far away, smooth boundary (higher bias). Large γ: influence is local, wiggly boundary that can wrap single points (higher variance). You can also design your own kernels, or combine several (multiple kernel learning).",
        },
        {
          type: "memoryHook",
          content:
            'Kernel = similarity score. "How alike are these two points?" The SVM votes using the similarity to each support vector.',
          detail:
            "Read the RBF formula that way and it stops being opaque: ‖a − b‖² is the squared distance, the minus and the exponential turn distance into closeness, and γ sets how quickly closeness decays.",
        },
        {
          type: "prose",
          html: "The two knobs interact, which is why they are always tuned together. C controls how much the model cares about violations; γ controls how local the boundary can be. Large C with large γ is a model that will wrap itself around every individual training point — the highest-variance configuration available, and the one that produced a 0.40 train/test gap in the churn lab.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the same problem, three kernels",
            code: `from sklearn.datasets import make_circles
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split

X, y = make_circles(n_samples=400, noise=0.08, factor=0.4, random_state=42)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=42)

for name, svc in [("linear", SVC(kernel="linear")),
                  ("poly d=2", SVC(kernel="poly", degree=2)),
                  ("rbf", SVC(kernel="rbf", gamma="scale"))]:
    svc.fit(Xtr, ytr)
    print(f"{name:<9} train {svc.score(Xtr, ytr):.3f}  test {svc.score(Xte, yte):.3f}  "
          f"support vectors {svc.n_support_.sum()}")

# What gamma does, holding C fixed
for g in [0.01, 0.1, 1, 10, 100]:
    s = SVC(kernel="rbf", C=1, gamma=g).fit(Xtr, ytr)
    print(f"gamma={g:<6} train {s.score(Xtr, ytr):.3f}  test {s.score(Xte, yte):.3f}  "
          f"SVs {s.n_support_.sum()}")`,
            caption:
              "Watch the support-vector count in the second loop. As gamma rises the model needs more and more of the training set to describe its boundary — which is what 'memorising' looks like from the inside.",
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
            "<b>Not scaling.</b> RBF is a function of ‖a − b‖², so an unscaled large-magnitude column decides every distance and γ becomes meaningless. This is the single most common reason an RBF SVM underperforms.",
            "<b>Large γ with large C.</b> Maximum variance. The model wraps individual points, training accuracy approaches 1.0 and test accuracy collapses.",
            "<b>Reaching for RBF by default on wide data.</b> With many features and few rows the data is usually already linearly separable, and a linear kernel is both faster and better. Text classification is the standard example.",
            "<b>Too many rows.</b> Kernel SVMs are roughly quadratic in n. Past tens of thousands of rows, use <code>LinearSVC</code> or an approximation like <code>Nystroem</code>.",
            "<b>Tuning C and γ separately.</b> They interact; grid-search them together.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 9",
          detail:
            "ISLP chapter 9 presents the kernel as an inner product in an enlarged space and makes the computational argument explicitly — that a kernel evaluates the enlarged inner product for every pair without ever working in the enlarged space.",
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
          headers: ["Setting", "Train F1", "Test F1", "Gap"],
          rows: [
            ["Hard margin, linear", "0.50", "0.49", "0.01"],
            ["Hard margin, RBF", "0.90", "0.50", "<b>0.40 ← memorising</b>"],
            ["Soft margin (C=1), linear", "0.60", "0.58", "0.02"],
            ["Soft margin (C=1), RBF", "0.65", "0.60", "0.05"],
          ],
          caption: "From the Telco churn notebook, F1 on the churn class.",
        },
        {
          type: "prose",
          html: "Row 2 is the whole cautionary tale. A hard-margin RBF — effectively C = ∞ with a flexible kernel — reaches 0.90 on training data and 0.50 on test. It has learnt the training set and nothing about churn. Row 4 is the same kernel with C = 1, and the gap drops from 0.40 to 0.05 while test F1 rises from 0.50 to 0.60.<br><br>The flexibility was never the problem. The absence of a budget was.",
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
            "Generate <code>make_circles</code> data and fit linear, polynomial and RBF kernels. <b>Success:</b> linear sits near 50%, the other two near 100%, and you can say why.",
            "Implement the lecture's lift by hand — add a third column <code>x₁² + x₂²</code> and fit a <i>linear</i> SVM in 3D. <b>Success:</b> it matches the RBF result, demonstrating that the kernel is a shortcut rather than a different idea.",
            "Sweep γ over five orders of magnitude at fixed C and record train accuracy, test accuracy and support-vector count. <b>Success:</b> you can identify the overfitting regime from the SV count alone.",
            "On the churn data, reproduce the four rows of the table above. <b>Success:</b> your hard-margin RBF shows a gap above 0.3.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Verify the kernel identity numerically: compute <code>(a·b + 1)²</code> and compare it with the explicit dot product of the degree-2 polynomial feature maps of a and b. They should agree exactly — that equality <i>is</i> the trick.",
            "Grid-search C and γ together on churn with <code>scoring=\"f1\"</code> and plot the result as a heatmap. The diagonal ridge you see is the C–γ interaction.",
            "Compare an RBF SVM against <code>Nystroem</code> + <code>LinearSVC</code> on the full 7,043-row churn data and compare both accuracy and fit time.",
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
            "Kernel = similarity score. How alike are these two points?",
            "The test point appears only inside a dot product, so you never need φ itself.",
            "RBF corresponds to an infinite-dimensional lift and costs one exponential.",
            "Small γ = smooth and biased. Large γ = local and jumpy.",
            "Hard-margin RBF on real data is the clearest overfitting you will see: 0.90 train, 0.50 test.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "What exactly is the kernel trick?",
              a: "The SVM's prediction depends on the data only through dot products between points. A kernel computes the dot product in a higher-dimensional feature space directly from the original coordinates, so the lifted features are never constructed.",
            },
            {
              q: "Which points have non-zero α?",
              a: "Only the support vectors — the points on the margin, inside it, or misclassified. Everything else can be deleted without moving the boundary.",
            },
            {
              q: "What does gamma control in an RBF kernel?",
              a: "How quickly similarity decays with distance. Small gamma means wide influence and a smooth, higher-bias boundary; large gamma means local influence and a wiggly, higher-variance one.",
            },
            {
              q: "Train F1 0.90, test F1 0.50 on an RBF SVM. Diagnose it.",
              a: "A hard margin with a flexible kernel: the model has memorised the training set. Lower C to buy a slack budget — on churn that closed the gap from 0.40 to 0.05 and raised test F1.",
            },
          ],
        },
      ],
    },
  ],
};
