import type { Chapter } from "@/types/content";

export const kmeans: Chapter = {
  slug: "kmeans-from-scratch",
  title: "K-means clustering, from scratch",
  description:
    "Unsupervised learning, the assign–update loop, SSE and the elbow, and the six functions the assignment rubric requires you to write yourself.",
  icon: "⊙",
  order: 4,
  moduleId: "m6",
  estimatedMinutes: 26,
  prerequisites: ["norms-and-distance", "the-four-step-recipe"],
  sourceRefs: [
    "Module_1_Study_Guide.md § Part 5 (Q22–Q28)",
    "Assesments/Module_1/97b5fe8c-…-Assignment-1-Problem-Statement.pdf",
  ],
  islpChapters: ["Ch 12"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why learn without labels",
      blocks: [
        {
          type: "prose",
          html: "Every model so far has been handed the right answers. K-means is the first one that is not — and most data in the world arrives without labels, because labelling is expensive and somebody has to do it by hand.<br><br><b>Unsupervised learning</b> = no labels; find structure. K-means partitions data into k clusters and is the simplest useful instance of it: no training signal, no accuracy to report, and an answer that depends on where you started.",
        },
        {
          type: "world",
          html: "Customer segmentation is the canonical use: nobody labelled your customers as \"price-sensitive\" or \"loyal\", but the groups are latent in the behaviour. Also image colour quantisation, document grouping, and compressing a 1,536-dimensional embedding space into a few hundred representative centroids for faster retrieval.",
        },
        {
          type: "gradedDetail",
          html: "Assignment-1 Part 5 (Q22–Q28, 30 marks) requires this <b>from scratch</b>. The question says \"from scratch\" and the rubric explicitly checks for it — <code>sklearn.cluster.KMeans</code> is disallowed. This chapter is structured around the six functions it asks for.",
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
            "<b>Initialise:</b> pick <code>k</code> points as starting centroids.",
            "<b>Assign:</b> each point → its nearest centroid (Euclidean distance √Σ(aᵢ−bᵢ)²).",
            "<b>Update:</b> each centroid → the mean of its assigned points.",
            "Repeat 2–3 until centroids stop moving (<b>convergence</b>).",
          ],
        },
        {
          type: "prose",
          html: "Those two alternating steps are the whole algorithm, and each one is provably optimal <i>given</i> the other. Holding the centroids fixed, assigning each point to its nearest centroid is the best possible assignment. Holding the assignment fixed, the mean is the point that minimises the sum of squared distances to a group. Alternating two locally optimal steps is why K-means always converges — and why it converges to a local minimum rather than the global one.",
        },
        {
          type: "formula",
          title: "What it minimises",
          lines: `SSE (inertia) = Σ over clusters  Σ over points  ‖x − centroid‖²

the assign step minimises SSE over assignments, centroids fixed
the update step minimises SSE over centroids, assignments fixed
→ SSE falls every iteration, so the loop must terminate`,
        },
        {
          type: "prose",
          html: "Weaknesses to know: you must choose <code>k</code>; the result depends on the initialisation (hence the fixed seed); it assumes roughly round, similar-sized clusters; and it is sensitive to feature scale.",
        },
        {
          type: "prose",
          html: "The \"round clusters\" assumption follows directly from the use of Euclidean distance and a mean. A cluster is defined as \"everything closer to this centroid than to any other\", and that region is always a convex polygon. Two interleaved crescents cannot be separated by it, however many times you run the loop.",
        },
        { type: "heading", level: 3, content: "The elbow method" },
        {
          type: "prose",
          html: "Run k = 1, 2, 3, …, plot SSE vs k. SSE always falls as k rises (k = n points gives SSE 0), so look for the <b>\"elbow\"</b>, where adding clusters stops paying off.",
        },
        {
          type: "result",
          headers: ["k", "SSE", "Drop from previous"],
          rows: [
            ["1", "<b>492.6</b>", "—"],
            ["2", "<b>86.3</b>", "406.3"],
            ["3", "<b>41.0</b>", "45.3"],
            ["4", "<b>27.5</b>", "13.5"],
          ],
          caption:
            "Study guide Q27. The huge drop at k=2, then diminishing returns → elbow at k=2, which also matches the question's \"two classes\".",
        },
        {
          type: "prose",
          html: "Read the third column rather than the second. Going from 1 to 2 clusters removes 406 of the 493 available SSE — 82% of it. Going from 2 to 3 removes another 45, and from 3 to 4 only 13. The curve has a corner at 2 because the data genuinely has two groups; after that you are subdividing groups that were already coherent.",
        },
        {
          type: "memoryHook",
          content: "SSE always falls, so the number itself tells you nothing — only its bend does.",
          detail:
            "At k = n every point is its own cluster and SSE is exactly zero. Any method that picks k by minimising SSE will therefore pick k = n.",
        },
        { type: "heading", level: 3, content: "The six functions, as the rubric wants them" },
        {
          type: "table",
          headers: ["Q", "Function", "Logic"],
          rows: [
            [
              "Q22",
              "<code>closest_centroid(point, centroids)</code>",
              "<code>np.argmin(np.linalg.norm(centroids - point, axis=1))</code>",
            ],
            [
              "Q23",
              "<code>compute_centroids(clusters)</code>",
              "<code>np.mean(points_in_cluster, axis=0)</code> for each cluster id → NumPy array. An empty cluster keeps its old centroid (avoids NaN)",
            ],
            [
              "Q24",
              "<code>initialize_centroids(seed, p)</code>",
              "<code>np.random.seed(seed)</code>; <code>points[np.random.choice(len(points), p, replace=False)]</code>. <code>replace=False</code> prevents duplicate starting centroids",
            ],
            [
              "Q25",
              "<code>compute_sse(centroids, clusters, k)</code>",
              "sum of squared distances from each point to its own centroid",
            ],
            [
              "Q26",
              "<code>kmeans(p, data_points, centroids)</code>",
              "loop: assign → update → stop when <code>np.allclose(new, old, atol=1e-6)</code>. Returns <code>(centroids, clusters_dict)</code>",
            ],
            [
              "Q27–28",
              "the elbow, then k = 2",
              "loop k = 1..4 with seed 42, print every SSE, plot SSE vs k; then scatter the k=2 clusters in two colours with centroids as red X",
            ],
          ],
        },
        {
          type: "gradedDetail",
          html: "Specific marks: Q24's <code>replace=False</code> stops two centroids starting on the same point. Q26 must stop on a <b>tolerance</b> — the rubric says \"above a small tolerance\", so <code>np.allclose(new, old, atol=1e-6)</code>, never <code>==</code> on floats. Q27 awards marks for <b>printing</b> every SSE, not just plotting it, and it must use <i>your</i> <code>kmeans</code> from Q26. Q23's empty-cluster guard matters: without it a cluster that loses all its points produces a NaN centroid and poisons the rest of the run.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the six functions",
            code: `import numpy as np, matplotlib.pyplot as plt

def closest_centroid(point, centroids):
    return int(np.argmin(np.linalg.norm(centroids - point, axis=1)))

def assign(points, centroids):
    clusters = {i: [] for i in range(len(centroids))}
    for pt in points:
        clusters[closest_centroid(pt, centroids)].append(pt)
    return clusters

def compute_centroids(clusters, old):
    out = []
    for i in sorted(clusters):
        pts = clusters[i]
        out.append(np.mean(pts, axis=0) if len(pts) else old[i])   # empty -> keep old
    return np.array(out)

def initialize_centroids(seed, p, points):
    np.random.seed(seed)
    return points[np.random.choice(len(points), p, replace=False)]

def compute_sse(centroids, clusters, k):
    return sum(float(np.sum((np.array(clusters[i]) - centroids[i]) ** 2))
               for i in range(k) if len(clusters[i]))

def kmeans(p, data_points, centroids, atol=1e-6, max_iter=300):
    for _ in range(max_iter):
        clusters = assign(data_points, centroids)
        new = compute_centroids(clusters, centroids)
        if np.allclose(new, centroids, atol=atol):      # tolerance, not ==
            centroids = new
            break
        centroids = new
    return centroids, clusters

# Q27: the elbow, printing every SSE as the rubric requires
sse = []
for k in range(1, 5):
    c0 = initialize_centroids(42, k, data_points)
    c, cl = kmeans(k, data_points, c0)
    s = compute_sse(c, cl, k)
    print(f"k={k}  SSE={s:.1f}")                        # PRINT, not just plot
    sse.append(s)

plt.plot(range(1, 5), sse, marker="o")
plt.xlabel("k"); plt.ylabel("SSE"); plt.title("Elbow method"); plt.show()`,
            caption:
              "`compute_centroids` takes the old centroids so an emptied cluster can keep its position instead of becoming NaN — the guard the rubric looks for.",
          },
        },
      ],
    },
    {
      id: "live",
      kind: "live",
      title: "Live: distance is the whole algorithm",
      blocks: [
        {
          type: "prose",
          html: "K-means is \"nearest centroid\" repeated, so everything it does is downstream of how you measure distance. Unscaled features mean the biggest-unit column decides every assignment — the same trap as k-NN, SVM and PCA.",
        },
        { type: "widget", lab: "vectors" },
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
            "<b>Not scaling.</b> A column in rupees and a column in counts means the rupees decide every cluster. Standardise first — this is the number-one K-means mistake.",
            "<b>Picking k by minimising SSE.</b> SSE is monotonically decreasing in k and reaches zero at k = n. Use the elbow, or a silhouette score.",
            "<b>Expecting reproducibility without a seed.</b> Different initialisation, different local minimum. Fix the seed and say so. Production code runs <code>n_init</code> restarts and keeps the best.",
            "<b>Non-convex clusters.</b> Two crescents or concentric rings cannot be separated by nearest-centroid regions, which are always convex. Use DBSCAN or spectral clustering instead.",
            "<b>Very unequal cluster sizes.</b> K-means tends to split a large cluster and merge small ones, because that lowers SSE.",
            "<b>Reporting \"accuracy\".</b> There are no labels. If you happen to have them, the cluster ids are arbitrary and must be matched to labels before any comparison means anything.",
            "<b>Empty clusters.</b> A centroid can lose every point. Without the guard in Q23 its mean is NaN and the run is ruined.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 12",
          detail:
            "ISLP chapter 12 presents K-means alongside hierarchical clustering, proves that the algorithm decreases the objective at every step, and makes the point that because it finds a local optimum you should run it several times from different random starts.",
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
          html: "The breast-cancer data is a good honest test, because you have labels but the algorithm does not. Run K-means with k = 2 on the scaled features and then — only afterwards — check how well the two clusters line up with benign and malignant. If they line up well, the classes were separable in the feature geometry all along, which is consistent with what PCA showed in Module 2 and what the linear classifier achieved in Module 3.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "clustering without labels, then checking against them",
            code: `from sklearn.preprocessing import StandardScaler
import numpy as np, pandas as pd

df = pd.read_csv("breast_cancer.csv", index_col=0).drop(columns="id")
y = (df["diagnosis"] == "M").to_numpy()
X = StandardScaler().fit_transform(df.drop(columns="diagnosis"))   # scale FIRST

c0 = initialize_centroids(42, 2, X)
centroids, clusters = kmeans(2, X, c0)
print("SSE:", round(compute_sse(centroids, clusters, 2), 1))

labels = np.array([closest_centroid(x, centroids) for x in X])
# Cluster ids are arbitrary, so align them with the labels before comparing
agree = max((labels == y).mean(), (labels != y).mean())
print("agreement with diagnosis:", round(agree, 3))
print(pd.crosstab(labels, y, rownames=["cluster"], colnames=["malignant"]))`,
            caption:
              "The `max` of the two agreements is the alignment step: cluster 0 might correspond to malignant or to benign, and nothing in the algorithm decides which.",
          },
        },
      ],
    },
    {
      id: "practice",
      kind: "practice",
      title: "Practice project",
      blocks: [
        {
          type: "prose",
          html: "This is Assignment-1 Part 5, worth 30 marks. Write all six functions yourself; do not import <code>KMeans</code>.",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Write <code>closest_centroid</code>, <code>compute_centroids</code>, <code>initialize_centroids</code>, <code>compute_sse</code> and <code>kmeans</code>. <b>Success:</b> all five match the signatures in the table, with the empty-cluster guard and the <code>np.allclose</code> stop.",
            "Loop k = 1 to 4 with seed 42 using <i>your</i> <code>kmeans</code>, and <b>print</b> every SSE. <b>Success:</b> 492.6, 86.3, 41.0, 27.5.",
            "Plot SSE against k and identify the elbow. <b>Success:</b> k = 2, and you can justify it from the drop column rather than the SSE column.",
            "Run k = 2 and scatter the clusters in two colours with the centroids as red X markers. <b>Success:</b> two visibly separated groups and two marked centroids.",
            "Confirm <code>replace=False</code> matters by running with <code>replace=True</code> a few times. <b>Success:</b> you can produce a run where two centroids start on the same point.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Run your K-means from ten different seeds and record the final SSE for each. The spread is the local-minimum problem, measured — and it is why sklearn defaults to <code>n_init=10</code>.",
            "Cluster the breast-cancer data with k = 2 and compare against the real diagnoses, remembering to align the arbitrary cluster ids first.",
            "Implement k-means++ initialisation — choose each new centroid with probability proportional to its squared distance from the nearest existing one — and show it reaches a lower SSE more often than uniform random starts.",
            "Build <code>make_moons</code> data and watch K-means fail on it. Then say in one sentence why, using the word <i>convex</i>.",
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
            "Initialise, assign to nearest, update to the mean, repeat until nothing moves.",
            "Each step is optimal given the other, which is why it converges — to a local minimum.",
            "SSE always falls, so only the bend in the curve tells you k. Ours bends hard at 2: 492.6 → 86.3 → 41.0 → 27.5.",
            "Nearest-centroid regions are convex, so crescents and rings defeat it.",
            "Scale first, seed it, guard against empty clusters, and stop on a tolerance not on equality.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Why can K-means give different answers on different runs?",
              a: "Random initialisation. The algorithm converges to a local minimum of SSE, and which one depends on where the centroids started — hence the fixed seed, and hence n_init restarts in production.",
            },
            {
              q: "Why is SSE alone a bad way to choose k?",
              a: "It decreases monotonically with k and reaches zero when every point is its own cluster, so minimising it always picks k = n. You look for the elbow instead.",
            },
            {
              q: "What are the four steps of the algorithm?",
              a: "Initialise k centroids; assign every point to its nearest centroid; move each centroid to the mean of its assigned points; repeat until the centroids stop moving within a tolerance.",
            },
            {
              q: "Why does an empty cluster need special handling?",
              a: "Its mean is the mean of nothing, which is NaN, and that NaN then propagates through every subsequent distance. The fix is to keep the old centroid for that cluster.",
            },
            {
              q: "Why does K-means fail on two interleaved crescents?",
              a: "A cluster is defined as the set of points nearest one centroid, and that region is always convex. A crescent is not convex, so no set of centroids can carve it out.",
            },
          ],
        },
      ],
    },
  ],
};
