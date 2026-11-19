import type { Chapter } from "@/types/content";

export const eigenvectorsAndPca: Chapter = {
  slug: "eigenvectors-and-pca",
  title: "Matrices, eigenvectors and PCA",
  description:
    "A matrix as a machine, the directions it refuses to turn, the covariance matrix, and the five steps of PCA worked on the lecture's own five accounts.",
  icon: "⟋",
  order: 4,
  moduleId: "m2",
  estimatedMinutes: 28,
  prerequisites: ["dot-product-and-cosine", "describing-data"],
  sourceRefs: ["Module 1 ML Notebook.html § m2-eigen, m2-cov, m2-pca"],
  islpChapters: ["Ch 12"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why compress at all",
      blocks: [
        {
          type: "prose",
          html: "You have thirty features describing a tumour and you want to draw a picture. You have 1,536 numbers describing a sentence and you are paying to store a million of them. You have forty columns, half of which say roughly the same thing, and your linear model's coefficients have gone haywire.<br><br>All three are the same problem: the data has fewer genuine directions in it than it has columns. PCA finds those directions, ranks them, and lets you keep the ones that matter.",
        },
        {
          type: "genai",
          html: "A 1,536-slot embedding often keeps most of its signal in a couple of hundred directions. PCA-style compression cuts vector-database storage and search cost. PageRank is the dominant eigenvector of a link matrix; spectral clustering reads eigenvectors of a similarity matrix.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        { type: "heading", level: 3, content: "A matrix is a machine" },
        {
          type: "prose",
          html: "A matrix takes a vector in and pushes a vector out, one dot product per output slot. That is the whole definition — and notice that it is built from the operation you learnt last chapter.",
        },
        {
          type: "formula",
          title: "A = [[3, 1], [1, 3]],  v = [2, 1]",
          lines: `row 1 · v = 3×2 + 1×1 = 7
row 2 · v = 1×2 + 3×1 = 5      → Av = [7, 5]   (it grew AND turned)`,
        },
        { type: "heading", level: 3, content: "Eigenvectors: the directions it refuses to turn" },
        {
          type: "prose",
          html: "Most inputs get turned. A few special directions only get stretched:",
        },
        {
          type: "formula",
          title: "Eigenvectors: A v = λ v",
          lines: `A[1, 1]  = [4, 4]  = 4 × [1, 1]     → λ = 4
A[1, −1] = [2, −2] = 2 × [1, −1]    → λ = 2`,
        },
        {
          type: "prose",
          html: "<b>Finding them by hand:</b> (A − λI)v = 0 has a non-zero solution only if det(A − λI) = 0. For 2×2, det = ad − bc, so (3 − λ)² − 1 = 0 → λ = 4 or 2. This is the one piece of hand-computation in the module worth being able to do under exam conditions, because it is short and it is checkable.",
        },
        {
          type: "memoryHook",
          content:
            '"Eigen" is German for "own". Eigenvectors are the matrix\'s own directions: it stretches them but refuses to turn them.',
        },
        { type: "heading", level: 3, content: "The covariance matrix" },
        {
          type: "prose",
          html: "For features in columns: the diagonal holds each feature's variance, the off-diagonal holds covariances (+ rise together, − one rises as other falls, 0 unrelated). It's always symmetric, so its eigenvectors meet at right angles — which is what makes the principal components a usable set of new axes rather than a tangle.",
        },
        {
          type: "table",
          headers: ["Account", "Sessions S", "Features F", "S−6", "F−8", "(S−6)(F−8)"],
          rows: [
            ["A1", "2", "6", "−4", "−2", "8"],
            ["A2", "4", "4", "−2", "−4", "8"],
            ["A3", "6", "8", "0", "0", "0"],
            ["A4", "8", "12", "2", "4", "8"],
            ["A5", "10", "10", "4", "2", "8"],
          ],
          caption:
            "Totals ÷ (n − 1 = 4): var S = 40/4 = 10, var F = 10, cov = 32/4 = 8.",
        },
        {
          type: "formula",
          title: "C = [[10, 8], [8, 10]]",
          lines: `(10 − λ)² − 64 = 0  →  λ = 18 (direction [1,1]),  λ = 2 (direction [1,−1])
18 / (18 + 2) = 90% of all variation lies along one 45° line`,
        },
        { type: "heading", level: 3, content: "Principal component analysis" },
        {
          type: "prose",
          html: "PCA finds the directions the data spreads along most, ranks them, and keeps the top few. Add a third feature (tickets T, independent of S and F, variance 1) and the eigenvalues become 18, 2, 1:",
        },
        {
          type: "formula",
          title: "Explained variance",
          lines: `total = 18 + 2 + 1 = 21  (= sum of the diagonal 10 + 10 + 1, a handy check)
PC1 = 86%   PC2 = 9%   PC3 = 5%      → keep 2, hold 95%`,
        },
        {
          type: "prose",
          html: "Projecting a row is one dot product per kept axis. A4 centred = [2, 4, −1]; V1 = [0.71, 0.71, 0] → 4.24; V2 = [0.71, −0.71, 0] → −1.41. Three numbers became two.",
        },
        { type: "widget", lab: "pca" },
        {
          type: "memoryHook",
          content: 'PCA in five: "Can Cats Eat Raw Pizza?"',
          detail: "Centre → Covariance → Eigen-decompose → Rank by λ → Project.",
        },
        {
          type: "prose",
          html: "<b>How many components?</b> Pick a variance target (95% or 99%) and keep adding until you cross it; or look for the elbow where eigenvalue bars flatten; or take 2 if a human needs a picture (and report the % kept). The first is the one to automate — <code>PCA(n_components=0.95)</code> does exactly that.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "PCA by hand on the five accounts, then with sklearn",
            code: `import numpy as np

A = np.array([[3, 1], [1, 3]])
vals, vecs = np.linalg.eig(A)        # [4, 2], columns are eigenvectors

X = np.array([[2, 6, 4], [4, 4, 2], [6, 8, 3], [8, 12, 2], [10, 10, 4]], dtype=float)
Xc = X - X.mean(axis=0)              # 1 centre
C = Xc.T @ Xc / (len(X) - 1)         # 2 covariance  -> [[10,8,0],[8,10,0],[0,0,1]]
lam, V = np.linalg.eigh(C)           # 3 eigen (eigh: for symmetric matrices)
order = lam.argsort()[::-1]          # 4 rank
lam, V = lam[order], V[:, order]
print(lam / lam.sum())               # [0.857 0.095 0.048]
Z = Xc @ V[:, :2]                    # 5 project to 2D

from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
pca = PCA(n_components=0.95)         # keep enough components for 95% variance
Z = pca.fit_transform(StandardScaler().fit_transform(X))
print(pca.explained_variance_ratio_)`,
            caption:
              "Use `eigh`, not `eig`, on a covariance matrix: it exploits symmetry, returns real eigenvalues in ascending order, and guarantees orthogonal eigenvectors.",
          },
        },
        {
          type: "trap",
          html: "<b>Scale hijacks PCA.</b> A feature in rupees swamps one in counts just because its numbers are bigger. Standardise every column first. Also: the new axes have no names (PC1 is a blend), and PCA only finds straight-line structure, so a spiral defeats it.",
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
            "<b>Forgetting to standardise.</b> The most common PCA mistake by a wide margin. If one column is in rupees, PC1 is that column.",
            "<b>Fitting PCA on all the data.</b> PCA learns the components from the data, so it must be fitted on the training split only and applied to test. Same leakage rule as imputation and scaling.",
            "<b>Expecting interpretable axes.</b> PC1 is a blend of every original feature. If a stakeholder needs \"which feature drove this\", PCA is the wrong tool.",
            "<b>Non-linear structure.</b> Concentric rings or a spiral have no dominant straight direction; PCA will report that honestly and uselessly.",
            "<b>Reading a sign.</b> Eigenvector signs are arbitrary — PC1 and −PC1 are the same component. Do not interpret the direction of the arrow.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 12",
          detail:
            "ISLP chapter 12 covers PCA as unsupervised learning, including the proportion-of-variance-explained plot and the scaling discussion, and then goes on to K-means — which closes the loop with the Module 6 assessment chapter.",
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
          html: "Thirty features, many of them near-duplicates by construction — <code>radius</code>, <code>perimeter</code> and <code>area</code> are three readings of the same circle, so they correlate enormously. That redundancy is exactly what PCA is for, and it is why two components are enough to draw a picture in which malignant and benign separate visibly.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "PCA to two components, coloured by diagnosis",
            code: `import pandas as pd, matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

df = pd.read_csv("breast_cancer.csv").drop(columns=["Unnamed: 0", "id"], errors="ignore")
y = (df["diagnosis"] == "M")
X = StandardScaler().fit_transform(df.drop(columns="diagnosis"))

p = PCA(n_components=2).fit(X)
Z = p.transform(X)
print(p.explained_variance_ratio_, p.explained_variance_ratio_.sum().round(3))

plt.scatter(Z[~y, 0], Z[~y, 1], s=12, alpha=0.6, label="benign")
plt.scatter(Z[y, 0], Z[y, 1], s=12, alpha=0.6, label="malignant")
plt.xlabel("PC1"); plt.ylabel("PC2"); plt.legend()
plt.title(f"Breast cancer, 30D -> 2D ({p.explained_variance_ratio_.sum():.0%} of variance)")
plt.show()

# How many components for 95%?
full = PCA().fit(X)
import numpy as np
print("components for 95%:", np.searchsorted(np.cumsum(full.explained_variance_ratio_), 0.95) + 1)`,
            caption:
              "Two components hold roughly 63% of the variance here and already separate the classes by eye — which is the clue that the linear classifier in Module 3 is going to do well.",
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
            "Find the eigenvalues of [[3, 1], [1, 3]] by hand via det(A − λI) = 0, then check with <code>np.linalg.eig</code>. <b>Success:</b> 4 and 2, and your hand working fits on three lines.",
            "Rebuild the five-account covariance matrix from the table and confirm C = [[10, 8], [8, 10]] and λ = 18, 2. <b>Success:</b> the trace (20) equals the sum of eigenvalues.",
            "Run PCA to two components on the breast-cancer data and plot it coloured by diagnosis. <b>Success:</b> you can state the explained-variance ratio and say whether the classes look separable.",
            "Find how many components reach 95% variance, with and without <code>StandardScaler</code>. <b>Success:</b> the two answers differ a lot and you can explain which is meaningful.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Plot the full scree curve (eigenvalue against component number) and mark both the elbow and the 95% crossing. Decide which you would defend.",
            "Reconstruct the data from k components and measure the reconstruction error as k rises. That curve is exactly what \"how much did we throw away\" means.",
          ],
        },
        {
          type: "deepDive",
          summary: "Go deeper: four ways to build a user vector (appendix)",
          blocks: [
            {
              type: "list",
              ordered: true,
              items: [
                "<b>Interaction pooling:</b> weighted average of the item vectors a user touched, recent ones weighted more (exponential decay). The user sits at the centre of gravity of what they consume.",
                "<b>Two-tower encoders:</b> categorical fields → embedding lookups, numeric fields normalised, concatenated, squeezed by an MLP to ~128 numbers.",
                "<b>Collaborative filtering:</b> each user starts as random numbers; training nudges them so the dot product with liked items is high and with ignored items is low.",
                "<b>Text serialisation:</b> write the profile as a sentence, embed it with a sentence transformer. Fastest route when there is no recommender yet.",
              ],
            },
            {
              type: "prose",
              html: "The <b>cold-start problem</b>: a brand-new user has no history, so what stands in for their vector on day one is a design decision with revenue attached.",
            },
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
            '"Eigen" means "own" — the directions a matrix stretches but refuses to turn.',
            "Can Cats Eat Raw Pizza: Centre, Covariance, Eigen, Rank, Project.",
            "The trace of the covariance matrix equals the sum of the eigenvalues — a free check.",
            "Scale hijacks PCA. Standardise first, always.",
            "PC1 is a blend, so the new axes have no names and their signs mean nothing.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Eigenvalues 18, 2, 1. What fraction of the variance does PC1 explain?",
              a: "18 / 21 ≈ 86%. PC1 and PC2 together hold 95%, so two components are enough for a 95% target.",
            },
            {
              q: "What is the biggest pitfall in applying PCA?",
              a: "Not standardising. PCA maximises variance, and an unscaled large-unit column has the most variance by default, so PC1 becomes that column.",
            },
            {
              q: "Why are the principal components guaranteed to be perpendicular?",
              a: "The covariance matrix is symmetric, and a real symmetric matrix has orthogonal eigenvectors.",
            },
            {
              q: "Name a dataset shape PCA cannot help with.",
              a: "Anything whose structure is not along straight directions — concentric rings, a spiral. PCA finds linear directions of maximum variance only.",
            },
          ],
        },
      ],
    },
  ],
};
