import type { Chapter } from "@/types/content";

export const dotProduct: Chapter = {
  slug: "dot-product-and-cosine",
  title: "The dot product and cosine similarity",
  description:
    "Zip, multiply, sum — one number that carries both a weighted score and an angle, and the retrieval step of RAG.",
  icon: "·",
  order: 2,
  moduleId: "m2",
  estimatedMinutes: 20,
  prerequisites: ["vectors"],
  sourceRefs: ["Module 1 ML Notebook.html § m2-dot, m2-cos"],
  islpChapters: ["Ch 2"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why one number matters this much",
      blocks: [
        {
          type: "prose",
          html: "The dot product is the single most load-bearing operation in machine learning. A linear model's prediction is a dot product. A logistic regression's score is a dot product. An SVM's decision is a dot product with each support vector. Attention in a transformer is a dot product between a query and a key. If you understand this one operation properly, a surprising amount of the rest is bookkeeping.",
        },
        {
          type: "prose",
          html: "It has two readings, and the trick is that they are the same number. Read one way it is a <b>weighted score</b>: each feature times how much it matters, added up. Read the other way it is <b>length times length times the cosine of the angle</b>. The first reading is why models use it; the second is why search engines use it.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "formula",
          title: "Recipe: pair up, multiply, add",
          lines: `t = [4, 3],  p = [2, 4]
t · p = 4×2 + 3×4 = 8 + 12 = 20      ← a single number`,
        },
        {
          type: "memoryHook",
          content: '"Zip, multiply, sum."',
          detail:
            "It's a weighted score: each feature × how much it matters, added up. Days waiting 4×2 + tier 3×5 + \"urgent\" words 2×1 = priority 25.",
        },
        {
          type: "prose",
          html: "<b>Sign:</b> positive = leaning the same way, zero = perpendicular (nothing shared), negative = pulling against each other. Picture two kids pushing a wagon — same direction and the effort adds, opposite and it cancels, at right angles and neither helps the other.",
        },
        {
          type: "prose",
          html: "<b>Length</b> comes free: v · v = 4² + 3² = 25, so |v| = √25 = 5. That's Pythagoras, unchanged from school. A vector dotted with itself is its squared length, which is also why the L2 norm and the dot product are never far apart in a formula.",
        },
        {
          type: "formula",
          title: "Two readings, one number",
          lines: `t · p = |t| × |p| × cos θ
20 = 5 × 4.47 × 0.89`,
        },
        { type: "heading", level: 3, content: "Cosine similarity" },
        {
          type: "prose",
          html: "A three-line ticket [2,1] and a three-paragraph ticket [6,3] about the same issue point the same way, but distance says they're far apart. Throw away length, keep the angle:",
        },
        {
          type: "formula",
          title: "Cosine similarity",
          lines: `cos θ = (a · b) / (|a| × |b|)      range −1 … +1
[4,3] vs [2,4]: 20 / (5 × 4.47) = 0.89  (≈ 27°)`,
        },
        {
          type: "prose",
          html: "The division is doing exactly one thing: cancelling both lengths out of the dot product, so what is left is purely about direction. That is the whole difference between \"dot product\" and \"cosine similarity\" — one is a score that grows with size, the other is a score that ignores it.",
        },
        { type: "widget", lab: "vectors" },
        {
          type: "genai",
          html: "This is semantic search and the retrieval step of RAG. The ticket \"I can't log in, my password expired\" becomes 1,536 numbers; so does every help article. Cosine 0.91 → \"Resetting an expired password\" is sent; 0.64 → offered second; 0.12 and 0.03 → discarded. Where you put the cut-off is a product decision, not maths.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "dot product, length, cosine",
            code: `import numpy as np
t, p = np.array([4, 3]), np.array([2, 4])

t @ p                      # dot product -> 20   (same as np.dot(t, p))
np.linalg.norm(t)          # L2 length -> 5.0
cos = t @ p / (np.linalg.norm(t) * np.linalg.norm(p))   # 0.894

from sklearn.metrics.pairwise import cosine_similarity
cosine_similarity([t], [p])          # same, for whole matrices of vectors`,
            caption:
              "`cosine_similarity` takes matrices, so it gives you every pairwise score in one call — which is how a vector database answers a query against a million documents.",
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
            "<b>Comparing dot products across differently-sized vectors.</b> A long document scores higher against everything simply because it is long. If size is not part of what you mean by similar, use cosine.",
            "<b>Using cosine when magnitude is the signal.</b> Two users with identical taste but wildly different activity levels have cosine 1.0. If you are predicting spend, that is the wrong answer.",
            "<b>Unscaled features.</b> A dot product on [salary in rupees, years of service] is a measure of salary. This is the same trap as distance, and the fix is the same: standardise first.",
            "<b>Reading cos θ = 0 as \"opposite\".</b> Zero is perpendicular — nothing shared. Opposite is −1.",
          ],
        },
        {
          type: "trap",
          html: "<code>a * b</code> in NumPy is element-wise and returns a <i>vector</i>; <code>a @ b</code> is the dot product and returns a <i>number</i>. Both run without error on two vectors of the same length, so the only sign you used the wrong one is a shape you did not expect.",
        },
        {
          type: "citation",
          source: "ISLP Ch 2",
          detail:
            "ISLP introduces the matrix-vector notation this chapter's arithmetic underlies; from chapter 3 onwards every fitted value ŷᵢ in the book is a dot product of a row of X with the coefficient vector.",
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
          html: "Here is the retrieval idea run against real rows: pick one tumour, score it against all 568 others by cosine, and look at whether its nearest neighbours share its diagnosis. If they do, the data is separable and the linear classifier in Module 3 will work. If they do not, no amount of model tuning will save it.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "nearest neighbours by cosine, on scaled features",
            code: `import pandas as pd, numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity

df = pd.read_csv("breast_cancer.csv").drop(columns=["Unnamed: 0", "id"], errors="ignore")
y = (df["diagnosis"] == "M").to_numpy()
X = StandardScaler().fit_transform(df.drop(columns="diagnosis"))   # scale FIRST

sims = cosine_similarity(X[:1], X)[0]      # one tumour vs all 569
order = np.argsort(-sims)[1:11]            # top 10, skipping itself

print("query is malignant:", y[0])
print("neighbours malignant:", y[order].sum(), "of 10")
print("similarity range:", sims[order].min().round(3), "-", sims[order].max().round(3))`,
            caption:
              "Scaling before the cosine is not optional here. Run it on the raw columns and `area_mean` alone decides every neighbour, because it is three orders of magnitude bigger than `smoothness_mean`.",
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
            "Compute t · p, |t|, |p| and cos θ for the lecture's [4,3] and [2,4] by hand, then check with NumPy. <b>Success:</b> 20, 5, 4.47, 0.89 and you can show the two readings agree.",
            "Build a priority score: days waiting × 2 + tier × 5 + urgent words × 1, as a dot product with a weight vector. <b>Success:</b> you get 25 for [4, 3, 2] and can say which weight dominates.",
            "Run the nearest-neighbour code above, with and without <code>StandardScaler</code>. <b>Success:</b> you can state how many of the top 10 share the query's diagnosis in each case.",
            "Take two vectors with cosine 1.0 but very different lengths. <b>Success:</b> you can name a task where that is the right answer and one where it is wrong.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Build a tiny RAG retriever: write five short help-article titles, hand-count two keyword features for each, and rank them against a query ticket by cosine. Then pick a cut-off and defend it.",
            "Show that cosine similarity on mean-centred columns is exactly the Pearson correlation from Module 1. Doing this once makes both concepts permanent.",
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
            "Zip, multiply, sum — and the answer is one number, not a vector.",
            "Positive = same way, zero = perpendicular, negative = opposing.",
            "v · v is the squared length, so Pythagoras comes free.",
            "Cosine is the dot product with both lengths divided out.",
            "Scale features before any dot product or distance, or the biggest-unit column decides everything.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Give both readings of the dot product.",
              a: "A weighted score — each feature times its weight, summed. And |a||b|cos θ — length times length times the cosine of the angle between them. They are the same number.",
            },
            {
              q: "Why does retrieval use cosine rather than distance?",
              a: "Because document length should not count as dissimilarity. Cosine divides both magnitudes out, so a short and a long document about the same thing score alike.",
            },
            {
              q: "Two vectors have cos θ = 0. What does that mean?",
              a: "They are perpendicular — they share nothing. Opposite would be −1.",
            },
            {
              q: "What does <code>a * b</code> give you in NumPy, versus <code>a @ b</code>?",
              a: "<code>*</code> is element-wise and returns a vector; <code>@</code> is the dot product and returns a scalar. Both run without error, so the wrong one fails silently.",
            },
          ],
        },
      ],
    },
  ],
};
