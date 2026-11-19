import type { Chapter } from "@/types/content";

export const entropy: Chapter = {
  slug: "entropy-and-information-gain",
  title: "Discriminative features, entropy and information gain",
  description:
    "What makes a feature worth splitting on, entropy as surprise, information gain, Gini, and the lecture's camera numbers reproduced exactly.",
  icon: "⑂",
  order: 1,
  moduleId: "m6",
  estimatedMinutes: 22,
  prerequisites: ["probability-and-bayes"],
  sourceRefs: ["Module 1 ML Notebook.html § m6-feat, m6-entropy"],
  islpChapters: ["Ch 8"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why some questions are worth asking",
      blocks: [
        {
          type: "bigIdea",
          content:
            "A decision tree asks the one question that best separates the classes, then asks again inside each answer. An ensemble asks many trees and takes the vote.",
        },
        {
          type: "prose",
          html: "Number of legs can't separate cats from dogs: every example has the same value. Colour overlaps too much. A <b>discriminative</b> feature has different label distributions for its different values. House colour barely predicts price; location does.<br><br>\"Different label distributions for different values\" is the whole criterion, and the rest of this chapter is about how to put a number on it — because a tree has to compare candidate questions automatically, and \"looks more separated\" is not something an algorithm can act on.",
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
          html: "Lecture example: one shopper rated 100 cameras. Group ratings into LOW (1–3) and HIGH (4–5). 63 LOW, 37 HIGH overall.",
        },
        {
          type: "table",
          headers: ["Split", "Group", "LOW", "HIGH", "P(HIGH | group)", "Verdict"],
          rows: [
            ["Company", "C1", "43", "11", "0.20", "Good: groups differ a lot"],
            ["Company", "C2", "20", "26", "0.55", "Good: groups differ a lot"],
            ["Price &lt; 300", "yes", "45", "25", "0.36", "Bad: groups look alike"],
            ["Price &lt; 300", "no", "18", "12", "0.40", "Bad: groups look alike"],
            ["Price &lt; 500", "yes", "55", "35", "0.40", "Doubtful: one group has only 10 cameras"],
            ["Price &lt; 500", "no", "8", "2", "0.20", "Doubtful: one group has only 10 cameras"],
          ],
        },
        {
          type: "prose",
          html: "Read the P(HIGH) column. Company splits 100 cameras into groups where the chance of a HIGH rating is 0.20 and 0.55 — a real difference. Price &lt; 300 gives 0.36 and 0.40, which is almost no difference at all. Price &lt; 500 looks like a difference (0.40 versus 0.20) but one side has only 10 cameras, so that 0.20 is two cameras out of ten and could easily be noise.<br><br>Those three verdicts are exactly what information gain will compute, and the third one shows why the formula weights children <i>by size</i>.",
        },
        { type: "heading", level: 3, content: "Entropy" },
        {
          type: "formula",
          title: "Entropy of a group",
          lines: `H = − Σ pᵢ log pᵢ
50/50 → maximum uncertainty (1 bit with log₂, 0.69 with ln)
90/10 → low uncertainty (0.47 bits, 0.33 with ln)
pure  → 0`,
        },
        {
          type: "memoryHook",
          content:
            "Entropy = how surprised you'd be pulling a marble from the bag. Information gain = how much less surprised you are after the split.",
          detail:
            "A 50/50 bag is maximum surprise — you genuinely cannot guess. A pure bag is zero surprise — you always know.",
        },
        {
          type: "formula",
          title: "Information gain of a split",
          lines: `IG = H(parent) − Σ (size of child / size of parent) × H(child)
Company:     0.66 − (0.54 × 0.51 + 0.46 × 0.68) ≈ 0.07   ← winner
Price<300:   0.66 − (0.70 × 0.65 + 0.30 × 0.67) ≈ 0
Price<500:   0.66 − (0.90 × 0.67 + 0.10 × 0.50) ≈ 0.01`,
        },
        {
          type: "prose",
          html: "The size weighting is what demotes Price &lt; 500. Its small child is genuinely purer (H = 0.50), but it holds only 10% of the cameras, so it contributes 0.10 × 0.50 to the weighted average and barely moves the total. A split that purifies a tiny corner of the data has not told you much about the data.",
        },
        {
          type: "fix",
          html: "The slide numbers (0.66 for the 63/37 root) use the natural log. sklearn's <code>criterion=\"entropy\"</code> uses log₂, which gives 0.95 for the same root. The base only rescales every number by the same factor, so the ranking of splits, and the tree, stays identical.",
        },
        { type: "widget", lab: "entropy" },
        { type: "heading", level: 3, content: "Gini impurity (sklearn's default)" },
        {
          type: "formula",
          title: "Gini",
          lines: `G = 1 − Σ pᵢ²     "chance a random guess from the bag's own mix is wrong"
10/0 → 0     8/2 → 0.32     5/5 → 0.50   (entropy: 0, 0.72, 1.00 bits)`,
        },
        {
          type: "prose",
          html: "Gini and entropy almost always pick the same split. Gini is slightly cheaper (no logarithm).<br><br>The quoted interpretation is worth unpacking because it makes Gini memorable: draw a marble at random, then guess its colour by drawing a second marble at random from the same bag. The chance you guess wrong is 1 − Σpᵢ². For a pure bag it is zero; for 50/50 it is a half.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "reproducing the lecture's three numbers",
            code: `import pandas as pd, numpy as np

df = pd.read_csv("camera_ratings_lecture.csv")
print(pd.crosstab(df.company, df.rating_band, margins=True))
print(pd.crosstab(df.price_usd < 300, df.rating_band, margins=True))
print(pd.crosstab(df.price_usd < 500, df.rating_band, margins=True))

def entropy(labels):
    p = labels.value_counts(normalize=True)
    return -(p * np.log(p)).sum()          # natural log, like the slides

def info_gain(df, mask, target="rating_band"):
    n = len(df); left, right = df[mask], df[~mask]
    return entropy(df[target]) - (len(left)/n*entropy(left[target]) + len(right)/n*entropy(right[target]))

print("Company   IG", round(info_gain(df, df.company == "C1"), 3))
print("Price<300 IG", round(info_gain(df, df.price_usd < 300), 3))
print("Price<500 IG", round(info_gain(df, df.price_usd < 500), 3))`,
            caption:
              "Swap np.log for np.log2 and every number scales by 1/ln(2) ≈ 1.443 — the root goes 0.66 → 0.95 and the gains 0.07 → 0.10 — while the ranking is untouched.",
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
            "<b>Information gain favours many-valued features.</b> A feature with a unique value per row (an ID, a timestamp) splits the data into pure singletons and scores maximum gain while predicting nothing. Gain ratio, or simply dropping ID-like columns, is the fix.",
            "<b>Comparing gains across log bases.</b> 0.07 nats and 0.10 bits are the same split. Never compare a number from the slides with one from sklearn without converting.",
            "<b>Reading a small gain as a useless feature.</b> The camera winner scores only 0.07, and it is still the best question available. Gains are relative to the candidates, not absolute.",
            "<b>Forgetting the size weighting.</b> Purifying 10% of the data is not the same as purifying half of it.",
            "<b>Expecting entropy to notice interactions.</b> Each split is scored on its own. A pair of features that are useless alone and perfect together will not be found by greedy single-feature gain.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 8",
          detail:
            "ISLP chapter 8 covers the classification error rate, Gini and entropy as the three node-impurity measures, and explains why Gini and entropy are preferred for growing the tree while classification error is preferred for pruning it.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data",
      blocks: [
        { type: "datasetPreview", dataset: "camera" },
        {
          type: "result",
          headers: ["Candidate split", "IG (nats)", "IG (bits)", "Verdict"],
          rows: [
            ["Company (C1 vs C2)", "<b>0.07</b>", "<b>0.10</b>", "Winner — the tree's first question"],
            ["Price &lt; 300", "≈ 0.00", "≈ 0.00", "Tells you nothing"],
            ["Price &lt; 500", "≈ 0.01", "≈ 0.01", "Doubtful — one child has 10 rows"],
          ],
          caption:
            "The professor rebuilt this 100-row file so its counts match the lecture slides exactly, which means these three numbers are reproducible to the decimal.",
        },
        {
          type: "prose",
          html: "The camera dataset is worth appreciating for what it is: a teaching artefact, built so the arithmetic on the slide can be checked. That is unusual and useful — most of the time you cannot verify a worked example against data. Here you can, and the lab above does it live.",
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
            "Reproduce the three crosstabs and confirm they match the lecture counts: C1 43/11, C2 20/26, price&lt;300 45/25 and 18/12, price&lt;500 55/35 and 8/2. <b>Success:</b> exact match.",
            "Compute the three information gains in nats. <b>Success:</b> 0.07, ≈0, ≈0.01 — the slide's numbers.",
            "Recompute in bits and confirm the ranking is unchanged. <b>Success:</b> root entropy 0.95, and you can state the conversion factor.",
            "Compute entropy and Gini for 10/0, 8/2 and 5/5 by hand. <b>Success:</b> Gini 0, 0.32, 0.50 and entropy 0, 0.72, 1.00 bits.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Add a fake ID column with a unique value per camera and compute its information gain. It will be maximal and the feature is worthless — the clearest possible demonstration of why gain alone is not enough.",
            "Plot entropy against p for a two-class bag, from 0 to 1, and mark where it peaks. Then overlay Gini and see how closely the two curves track each other.",
            "Score every candidate split on the camera data — every feature, every threshold — and rank them. That ranking is exactly what a tree computes at its root.",
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
            "A discriminative feature has different label distributions for different values.",
            "Entropy = how surprised you'd be. Information gain = how much less surprised after the split.",
            "IG weights each child by its size — purifying a tiny corner does not count for much.",
            "The slides use ln, sklearn uses log₂. Same ranking, different numbers.",
            "Gini is the chance a random guess from the bag's own mix is wrong.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Entropy (log₂) of a group with 8 stay and 2 churn?",
              a: "About 0.72 bits. −(0.8·log₂0.8 + 0.2·log₂0.2) = 0.72. Its Gini is 1 − (0.64 + 0.04) = 0.32.",
            },
            {
              q: "What is information gain, in words?",
              a: "The parent's entropy minus the size-weighted average entropy of the children — how much uncertainty the split removed.",
            },
            {
              q: "The slides say the 63/37 root has entropy 0.66 but sklearn says 0.95. Who is wrong?",
              a: "Neither. The slides use the natural log and sklearn uses log₂; the ratio is 1/ln 2 ≈ 1.443. The base rescales every value equally, so the chosen split is identical.",
            },
            {
              q: "Why does a unique-ID feature score maximum information gain?",
              a: "It splits the data into pure single-row children, so the weighted child entropy is zero. The gain is maximal and the feature predicts nothing about new data — which is why gain ratio exists, and why ID columns get dropped.",
            },
          ],
        },
      ],
    },
  ],
};
