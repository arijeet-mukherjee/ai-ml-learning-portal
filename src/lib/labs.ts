import type { LabId } from "@/types/content";

export interface LabMeta {
  id: LabId;
  title: string;
  moduleId: string;
  /** The professor's own "how to use it" line, kept verbatim. */
  how: string;
}

/**
 * Verbatim from the notebook's LABS registry — titles and framing are the
 * professor's language, which Arijeet already thinks in. The implementations in
 * src/components/labs are written from scratch. See SOURCE_NOTES.md.
 */
export const LABS: Record<LabId, LabMeta> = {
  axis: {
    id: "axis",
    title: "Axis explorer",
    moduleId: "m0",
    how: "Pick an operation and an axis, then watch which cells get squashed into each answer.",
  },
  iqr: {
    id: "iqr",
    title: "Outlier hunter (IQR)",
    moduleId: "m1",
    how: "Choose a real column from your course datasets. Drag the multiplier to see how the fences move.",
  },
  normal: {
    id: "normal",
    title: "The bell curve, 68-95-99.7",
    moduleId: "m1",
    how: "Exam scores with mean μ and spread σ. Slide k to shade μ ± kσ and read off the area.",
  },
  bayes: {
    id: "bayes",
    title: "Bayes with 1,000 people",
    moduleId: "m1",
    how: "Each dot is a person. Change how rare the condition is and how good the test is, then read the posterior.",
  },
  vectors: {
    id: "vectors",
    title: "Vector playground",
    moduleId: "m2",
    how: "Drag the two arrow tips. The dot product, cosine, angle and both distances update live.",
  },
  pca: {
    id: "pca",
    title: "Find the first principal component",
    moduleId: "m2",
    how: "Rotate the line. The spread of the projected points (the variance along it) peaks at PC1.",
  },
  threshold: {
    id: "threshold",
    title: "Threshold, precision and recall",
    moduleId: "m3",
    how: "Each dot is a patient with a model score. Slide the threshold: right of the line = flagged positive.",
  },
  gd: {
    id: "gd",
    title: "Gradient descent, step by step",
    moduleId: "m4",
    how: "Pick a learning rate and a start, then step downhill. Push the rate past 1 on the bowl and watch it blow up.",
  },
  poly: {
    id: "poly",
    title: "Overfitting and Ridge, live",
    moduleId: "m4",
    how: "Blue dots train the curve, hollow dots test it. Raise the degree until it memorises, then add a Ridge penalty to calm it.",
  },
  sigmoid: {
    id: "sigmoid",
    title: "Logistic regression in 1D",
    moduleId: "m4",
    how: "Move w and b, or let gradient descent fit them. Dots at the top are class 1, at the bottom class 0.",
  },
  svm: {
    id: "svm",
    title: "Perceptron vs SVM",
    moduleId: "m5",
    how: "Run the perceptron and see it stop at any line that works. Then fit the SVM and watch it centre the widest street. Tap the plot to add points.",
  },
  kernel: {
    id: "kernel",
    title: "The kernel trick, lifted",
    moduleId: "m5",
    how: "Rings can't be split by a line. Lift each point by z = x₁² + x₂² and a flat cut separates them. Slide the cut.",
  },
  darts: {
    id: "darts",
    title: "Bias and variance on a dartboard",
    moduleId: "m5",
    how: "Each dart is one model trained on a different sample, predicting the same point. The bullseye is the truth.",
  },
  entropy: {
    id: "entropy",
    title: "Entropy, Gini and information gain",
    moduleId: "m6",
    how: "Fill a bag with stay (blue) and churn (red) marbles. Then score a split with the lecture's camera numbers or your own.",
  },
  boot: {
    id: "boot",
    title: "Bootstrap sampling and the 36.8% rule",
    moduleId: "m6",
    how: "Draw N rows with replacement from N. Yellow = picked more than once, dashed = left out (out-of-bag).",
  },
  derivative: {
    id: "derivative",
    title: "Slope detective: what a derivative really is",
    moduleId: "m8",
    how: "Pick a curve and a point. Shrink the gap h between the two dots and watch the secant line turn into the tangent: its slope is the derivative.",
  },
  partial: {
    id: "partial",
    title: "Partial derivatives on a hill",
    moduleId: "m8",
    how: "Click anywhere on the contour map. The two side panels slice the hill along x and along y: each slice's slope is one partial derivative. Then walk downhill.",
  },
  nnplay: {
    id: "nnplay",
    title: "Neural network playground",
    moduleId: "m8",
    how: "Pick a dataset and a network shape, then press Train. Zero hidden layers is logistic regression; add neurons and watch the boundary bend.",
  },
  backprop: {
    id: "backprop",
    title: "Backpropagation, one number at a time",
    moduleId: "m8",
    how: "A 2-2-1 network with real numbers. Step forward to compute the prediction, step backward to apply the chain rule node by node, then update and repeat.",
  },
  optimizers: {
    id: "optimizers",
    title: "Optimizer race: GD, SGD, Momentum, Adam",
    moduleId: "m8",
    how: "Four optimizers start from the same point on a long narrow valley. Change the learning rate and batch noise, then race them to the bottom.",
  },
  rbf: {
    id: "rbf",
    title: "RBF kernel: similarity bubbles and gamma",
    moduleId: "m5",
    how: "Every training point radiates a similarity bubble exp(−γ·d²). Slide γ and C and watch the boundary go from smooth to wrapping single points.",
  },
  treesplit: {
    id: "treesplit",
    title: "Grow a decision tree by hand",
    moduleId: "m6",
    how: "Choose a feature and drag the threshold to score a split with Gini or entropy. Then let the greedy algorithm grow the tree one depth at a time.",
  },
  forest: {
    id: "forest",
    title: "One tree vs a forest vote",
    moduleId: "m6",
    how: "Train 1 to 60 trees on bootstrap samples. Compare one jumpy tree with the forest's averaged vote on held-out points.",
  },  algoatlas: {
    id: "algoatlas",
    title: "Algorithm atlas",
    moduleId: "m3",
    how: "Every algorithm in the course as model, loss and optimiser. Press Animate on a row to watch that optimiser push its loss down.",
  },

};

export const LAB_LIST = Object.values(LABS);
