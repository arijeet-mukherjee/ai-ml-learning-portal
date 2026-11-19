import type { Chapter, ModuleDefinition } from "@/types/content";

import { numpyArrays } from "./chapters/m0-01-numpy-arrays";
import { pandasTables } from "./chapters/m0-02-pandas-tables";
import { plottingAndEda } from "./chapters/m0-03-plotting-and-eda";
import { describingData } from "./chapters/m1-01-describing-data";
import { distributions } from "./chapters/m1-02-distributions";
import { probabilityAndBayes } from "./chapters/m1-03-probability-and-bayes";
import { correlation } from "./chapters/m1-04-correlation";
import { vectors } from "./chapters/m2-01-vectors";
import { dotProduct } from "./chapters/m2-02-dot-product";
import { normsAndDistance } from "./chapters/m2-03-norms-and-distance";
import { eigenvectorsAndPca } from "./chapters/m2-04-eigenvectors-and-pca";
import { whatMlIs } from "./chapters/m3-01-what-ml-is";
import { fourStepRecipe } from "./chapters/m3-02-the-four-step-recipe";
import { dataChallenges } from "./chapters/m3-03-data-challenges";
import { modelComplexity } from "./chapters/m3-04-model-complexity";
import { gradingAClassifier } from "./chapters/m3-05-grading-a-classifier";
import { cancerPipeline } from "./chapters/m3-06-cancer-pipeline";
import { artificialNeuron } from "./chapters/m4-01-artificial-neuron";
import { regularisation } from "./chapters/m4-02-regularisation";
import { logisticRegression } from "./chapters/m4-03-logistic-regression";
import { gradientDescent } from "./chapters/m4-04-gradient-descent";
import { perceptron } from "./chapters/m5-01-perceptron";
import { widestStreet } from "./chapters/m5-02-widest-street";
import { kernelTrick } from "./chapters/m5-03-kernel-trick";
import { biasAndVariance } from "./chapters/m5-04-bias-and-variance";
import { classImbalance } from "./chapters/m5-05-class-imbalance";
import { entropy } from "./chapters/m6-01-entropy";
import { growingTrees } from "./chapters/m6-02-growing-trees";
import { baggingAndForest } from "./chapters/m6-03-bagging-and-forest";
import { kmeans } from "./chapters/m6-04-kmeans";
import { projectPipeline } from "./chapters/m7-01-pipeline";
import { modelSelection } from "./chapters/m7-02-model-selection";
import { genaiBridge } from "./chapters/m7-03-genai-bridge";
import { rubricChecklist } from "./chapters/m7-04-rubric-checklist";
import { calculusForMl } from "./chapters/m8-01-calculus-for-ml";
import { whyNeuralNetworks } from "./chapters/m8-02-why-neural-networks";
import { feedforwardNetwork } from "./chapters/m8-03-feedforward-network";
import { backpropagation } from "./chapters/m8-04-backpropagation";
import { trainingAndOptimizers } from "./chapters/m8-05-training-and-optimizers";
import { pytorchMnistWalkthrough } from "./chapters/m8-06-pytorch-mnist-walkthrough";

/**
 * The module registry.
 *
 * Module titles, taglines, dates and lecturers are verbatim from the professor's
 * notebook (SOURCE_NOTES.md § 1). To add a module or a chapter, add the import and
 * drop it into the right `chapters` array — nothing else in the codebase changes.
 * See ADDING_NEW_MODULES.md.
 */
export const modules: ModuleDefinition[] = [
  {
    id: "m0",
    number: "0",
    title: "Python toolkit: NumPy, Pandas, plots",
    tagline: "Read, slice, group and plot any table without thinking about syntax.",
    date: "Week 0",
    who: "Hands-on lab",
    icon: "▦",
    motif: "grid",
    chapters: [numpyArrays, pandasTables, plottingAndEda],
  },
  {
    id: "m1",
    number: "1",
    title: "Probability and statistics foundations",
    tagline:
      "Describe data, reason about chance, flip conditionals with Bayes, and read correlation honestly.",
    date: "6 Sept",
    who: "Session 2",
    icon: "◉",
    motif: "scatter",
    chapters: [describingData, distributions, probabilityAndBayes, correlation],
  },
  {
    id: "m2",
    number: "2",
    title: "Linear algebra: vectors to PCA",
    tagline:
      "Multiply and add. That is all a dot product, a matrix, an embedding search and PCA really are.",
    date: "12 Sept",
    who: "Linear Algebra Foundations",
    icon: "⟋",
    motif: "axes",
    chapters: [vectors, dotProduct, normsAndDistance, eigenvectorsAndPca],
  },
  {
    id: "m3",
    number: "3",
    title: "Introduction to machine learning",
    tagline:
      "Data shapes, the four-step recipe, losses, overfitting, cross-validation and how to grade a model.",
    date: "20 Sept",
    who: "Prof. Mahesh Mohan M R, IIT Kharagpur",
    icon: "◧",
    motif: "pixels",
    chapters: [
      whatMlIs,
      fourStepRecipe,
      dataChallenges,
      modelComplexity,
      gradingAClassifier,
      cancerPipeline,
    ],
  },
  {
    id: "m4",
    number: "4",
    title: "Linear and logistic regression",
    tagline:
      "From a biological neuron to w·x + b, overfitting, Ridge and Lasso, the sigmoid, and gradient descent.",
    date: "27 Sept",
    who: "Prof. Mahesh Mohan M R, IIT Kharagpur",
    icon: "↘",
    motif: "descent",
    chapters: [artificialNeuron, regularisation, logisticRegression, gradientDescent],
  },
  {
    id: "m5",
    number: "5",
    title: "Linear classifiers, SVM, bias vs variance",
    tagline:
      "Perceptron, the widest street, soft margins, kernels, the bias–variance trade-off, and imbalanced classes.",
    date: "4 Oct",
    who: "Prof. Adway Mitra, IIT Kharagpur",
    icon: "⫽",
    motif: "margin",
    chapters: [perceptron, widestStreet, kernelTrick, biasAndVariance, classImbalance],
  },
  {
    id: "m6",
    number: "6",
    title: "Decision trees, bagging, random forest",
    tagline:
      "Pick the most informative question, split, repeat. Then grow a whole forest and let it vote.",
    date: "11 Oct",
    who: "Prof. Adway Mitra, IIT Kharagpur",
    icon: "⑂",
    motif: "branch",
    chapters: [entropy, growingTrees, baggingAndForest, kmeans],
  },
  {
    id: "m7",
    number: "★",
    title: "The master map",
    tagline:
      "The pipeline, which model when, which metric when, every knob's direction, and the formula sheet.",
    date: "Revision",
    who: "Everything on one page",
    icon: "✦",
    motif: "map",
    chapters: [projectPipeline, modelSelection, genaiBridge, rubricChecklist],
  },
  {
    id: "m8",
    number: "8",
    title: "Neural networks and backpropagation",
    tagline:
      "Derivatives from zero, why hidden layers beat a straight line, backprop by hand, optimisers, and the PyTorch MNIST notebook cell by cell.",
    date: "Module 2",
    who: "Course Module 2 · PyTorch lab",
    icon: "⧉",
    motif: "network",
    chapters: [
      calculusForMl,
      whyNeuralNetworks,
      feedforwardNetwork,
      backpropagation,
      trainingAndOptimizers,
      pytorchMnistWalkthrough,
    ],
  },
];

/* ===========================================================================
   Derived lookups. Everything below is computed from `modules` above, so the
   nav, the routes, the search index and the master map stay in step for free.
   =========================================================================== */

export const allChapters: Chapter[] = modules.flatMap((m) => m.chapters);

export function getAllChapterSlugs(): string[] {
  return allChapters.map((c) => c.slug);
}

export function getChapter(slug: string): Chapter | undefined {
  return allChapters.find((c) => c.slug === slug);
}

export function getModule(id: string): ModuleDefinition | undefined {
  return modules.find((m) => m.id === id);
}

export function getModuleOf(slug: string): ModuleDefinition | undefined {
  return modules.find((m) => m.chapters.some((c) => c.slug === slug));
}

/** Reading order across the whole portal, used for prev/next and keyboard nav. */
export function getNeighbours(slug: string): {
  prev?: Chapter;
  next?: Chapter;
} {
  const i = allChapters.findIndex((c) => c.slug === slug);
  if (i < 0) return {};
  return {
    prev: i > 0 ? allChapters[i - 1] : undefined,
    next: i < allChapters.length - 1 ? allChapters[i + 1] : undefined,
  };
}

export const totalChapters = allChapters.length;

export const totalMinutes = allChapters.reduce(
  (acc, c) => acc + c.estimatedMinutes,
  0,
);
