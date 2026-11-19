import type { Chapter } from "@/types/content";

/**
 * Added as the ADDING_NEW_MODULES.md verification: written using only the runbook's
 * instructions — this file plus one import and one array entry in modules.ts.
 */
export const rubricChecklist: Chapter = {
  slug: "assignment-rubric-checklist",
  title: "Every graded detail in Assignment 1",
  description:
    "The rubric-checked specifics from all five parts, collected in one place, with the exact code line each one wants.",
  icon: "☑",
  order: 4,
  moduleId: "m7",
  estimatedMinutes: 14,
  prerequisites: ["model-and-metric-selection"],
  sourceRefs: [
    "Assesments/Module_1/4916bb2d-…-Assignment-1-Evaluation-Rubric.xlsx",
    "Assesments/Module_1/97b5fe8c-…-Assignment-1-Problem-Statement.pdf",
    "Module_1_Study_Guide.md",
  ],
  islpChapters: ["Ch 3", "Ch 4", "Ch 9", "Ch 12"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why marks go missing on correct answers",
      blocks: [
        {
          type: "bigIdea",
          content:
            "Most lost marks are not wrong answers. They are right answers that skipped a specific thing the rubric asked for.",
        },
        {
          type: "prose",
          html: "The rubric checks for particular arguments, particular printed output and particular implementations — not just the final number. A K-means solution that uses <code>sklearn.cluster.KMeans</code> is correct and scores nothing. An SVM fitted without <code>loss='hinge'</code> gives a plausible margin and the wrong one.<br><br>This page is every such detail from the five parts, in one list, so you can run it as a pre-submission check.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "Part by part",
      blocks: [
        { type: "heading", level: 3, content: "Part 1 — Linear regression (Q1–Q5, 10 marks)" },
        {
          type: "gradedDetail",
          html: "Q2 <b>inverts the usual direction on purpose</b>: input is <code>MedHouseVal</code>, target is <code>MedInc</code>. Follow it exactly — the rubric checks this. Print both shapes: <code>X = df[['MedHouseVal']]</code> → (20640, 1) and <code>y = df['MedInc']</code> → (20640,).",
        },
        {
          type: "prose",
          html: "The shape convention is the trap underneath it: sklearn wants <b>X as 2D</b> <code>(n_samples, n_features)</code> and <b>y as 1D</b> <code>(n_samples,)</code>. <code>df['col']</code> is 1D; <code>df[['col']]</code> is 2D. Q3 wants a scatter with small transparent dots (<code>s=5, alpha=0.3</code>) because there are 20,640 points, and Q5 wants the fitted line drawn over that scatter in a distinguishable colour.",
        },
        {
          type: "result",
          headers: ["Q", "Expected", "Value"],
          rows: [
            ["Q4", "<code>reg.coef_[0]</code>", "<b>1.1328</b>"],
            ["Q4", "<code>reg.intercept_</code>", "<b>1.5274</b>"],
          ],
        },
        { type: "heading", level: 3, content: "Part 2 — Logistic regression (Q6–Q10, 10 marks)" },
        {
          type: "gradedDetail",
          html: "Q8: <code>LabelEncoder</code> maps classes <b>alphabetically</b> — setosa 0, versicolor 1, virginica 2. So drop versicolor with <code>data[data.Species != 1]</code> and relabel virginica with <code>.replace(2, 1)</code>, leaving 50 of class 0 and 50 of class 1. Q9: <code>train_test_split(x, y, test_size=0.2, random_state=42)</code> → train (80, 4), test (20, 4). Q10 wants the <b>weights and the bias printed</b>, not only the accuracy.",
        },
        {
          type: "result",
          headers: ["Q", "Expected", "Value"],
          rows: [
            ["Q10", "<code>coef_</code>", "<b>[0.46, −0.31, 1.73, 0.81]</b>"],
            ["Q10", "<code>intercept_</code>", "<b>−8.35</b>"],
            ["Q10", "<code>accuracy_score</code>", "<b>1.0</b>"],
          ],
        },
        { type: "heading", level: 3, content: "Part 3 — Support vector classifier (Q11–Q15, 20 marks)" },
        {
          type: "gradedDetail",
          html: "<code>LinearSVC</code> defaults to <b>squared</b> hinge, so <code>loss='hinge'</code> must be passed explicitly — this is rubric-checked. Add <code>max_iter=100000</code> to avoid convergence warnings at C=1000. The 7-mark questions want the boundary <b>and both margins</b> drawn over the whole dataset: solve <code>w₀x₀ + w₁x₁ + b = c</code> for x₁, giving <code>x₁ = −(w₀x₀ + b − c) / w₁</code> with c = 0, +1, −1. Take <code>w = svc.coef_[0]</code> and <code>b = svc.intercept_[0]</code>.",
        },
        {
          type: "result",
          headers: ["Q", "Setting", "Margin width"],
          rows: [
            ["Q14", "C = 1", "<b>0.639</b>"],
            ["Q15", "C = 1000", "<b>0.243</b>"],
          ],
          caption: "Test accuracy is 1.0 in both cases — this data is easy, so only the margin moves.",
        },
        { type: "heading", level: 3, content: "Part 4 — Bagging (Q16–Q21, 30 marks)" },
        {
          type: "gradedDetail",
          html: "Three separate traps. (a) Average the <b>predictions</b> and then compute MSE once — that is <i>not</i> the same as averaging the individual MSEs, and the solution notebook prints both for Q21 to cover either reading of \"average mean squared error\". (b) Each model <i>and</i> each loop iteration needs <b>new random indices</b> — the rubric says \"new models trained\" per iteration. (c) The <b>test set is never resampled</b>: bootstrap only the training rows.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the three lines the rubric is looking for",
            code: `def get_random_indices(n, rng):
    return rng.choice(n, size=n, replace=True)     # with replacement

idx = get_random_indices(len(x_train), rng)
x_var, y_var = x_train[idx], y_train[idx]          # training variation only

preds = np.mean([m.predict(x_test) for m in models], axis=0)   # average PREDICTIONS
mse = mean_squared_error(y_test, preds)                        # then MSE once`,
          },
        },
        {
          type: "result",
          headers: ["Q", "Models averaged", "Test MSE"],
          rows: [
            ["Q17", "1", "<b>0.5566</b>"],
            ["Q18", "2", "<b>0.5569</b>"],
            ["Q19", "3", "<b>0.5535</b>"],
            ["Q20", "4", "<b>0.5538</b>"],
            ["Q21", "2 → 30", "flat, <b>0.553–0.558</b>"],
          ],
          caption:
            "The flat curve is the correct answer: linear regression is low-variance, and bagging only reduces variance. Also report the bootstrap's unique-row count — 10,449 / 16,512 = 63.3%, matching 1 − 1/e.",
        },
        { type: "heading", level: 3, content: "Part 5 — K-means (Q22–Q28, 30 marks)" },
        {
          type: "gradedDetail",
          html: "<b><code>sklearn.cluster.KMeans</code> is disallowed</b> — the question says \"from scratch\" and the rubric explicitly checks for it. Q24 needs <code>replace=False</code> so two centroids cannot start on the same point. Q23 needs an empty-cluster guard (keep the old centroid) or you get a NaN that poisons the run. Q26 must stop on a <b>tolerance</b>: <code>np.allclose(new, old, atol=1e-6)</code>, never <code>==</code> on floats. Q27 awards marks for <b>printing</b> every SSE, not just plotting it, and must use your own <code>kmeans</code> from Q26. Q28 uses k = 2 from the elbow, with centroids drawn as red X markers.",
        },
        {
          type: "result",
          headers: ["k", "SSE"],
          rows: [
            ["1", "<b>492.6</b>"],
            ["2", "<b>86.3</b>"],
            ["3", "<b>41.0</b>"],
            ["4", "<b>27.5</b>"],
          ],
          caption: "Elbow at k = 2, which also matches the question's \"two classes\".",
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "The silent failures",
      blocks: [
        {
          type: "prose",
          html: "Each of these produces output that looks right. None of them raises an error.",
        },
        {
          type: "table",
          headers: ["Write this", "And you get", "Instead of"],
          rows: [
            ["<code>df['col']</code> as X", "a shape error, or a silently wrong fit", "<code>df[['col']]</code> — 2D"],
            ["<code>LinearSVC(C=1)</code>", "squared-hinge margins", "<code>loss='hinge'</code> margins"],
            ["mean of the MSEs", "a different number", "MSE of the mean prediction"],
            ["the same indices each iteration", "identical models, no bagging", "fresh <code>rng.choice</code> per model"],
            ["<code>replace=True</code> in Q24", "duplicate starting centroids", "<code>replace=False</code>"],
            ["<code>new == old</code> in Q26", "a loop that may never stop", "<code>np.allclose(..., atol=1e-6)</code>"],
            ["<code>KMeans(n_clusters=2)</code>", "the right clusters, zero marks", "your own Q22–Q26 functions"],
          ],
        },
        {
          type: "trap",
          html: "Your decimals match the study guide's only if you keep the same seeds. Any seed gives figures of the same size — roughly 0.55 for the bagging MSE, roughly 1.13 for the slope. If yours are a different order of magnitude, something is wrong; if they differ in the third decimal, it is the seed.",
        },
        {
          type: "citation",
          source: "ISLP Ch 9 and Ch 12",
          detail:
            "Chapter 9 for the support vector classifier's margin and the role of C; chapter 12 for K-means, including the proof that the objective decreases at every step and the advice to restart from several random initialisations.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "The numbers to check against",
      blocks: [
        {
          type: "result",
          headers: ["Part", "What", "Value"],
          rows: [
            ["1", "slope / intercept", "1.1328 / 1.5274"],
            ["2", "coef_ / intercept_ / accuracy", "[0.46, −0.31, 1.73, 0.81] / −8.35 / 1.0"],
            ["3", "margin at C=1 / C=1000", "0.639 / 0.243"],
            ["4", "test MSE, 1→4 models", "0.5566 / 0.5569 / 0.5535 / 0.5538"],
            ["4", "bootstrap unique rows", "10,449 / 16,512 = 63.3%"],
            ["5", "SSE, k=1→4", "492.6 / 86.3 / 41.0 / 27.5"],
          ],
          caption: "All from the executed solution notebook, via Module_1_Study_Guide.md.",
        },
        { type: "datasetPreview", dataset: "cancer" },
      ],
    },
    {
      id: "practice",
      kind: "practice",
      title: "Pre-submission check",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            "Walk every <b>Graded detail</b> box on this page against your notebook. <b>Success:</b> you can point at the line that satisfies each one.",
            "Confirm every figure in the table above matches yours, or that you can explain the difference by the seed. <b>Success:</b> no unexplained gaps.",
            "Check that every plot has a title and both axis labels. <b>Success:</b> no unlabelled figure anywhere.",
            "Search your notebook for <code>sklearn.cluster</code>. <b>Success:</b> no match.",
            "Confirm Q27 <i>prints</i> all four SSE values as well as plotting them. <b>Success:</b> four printed lines in the output.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Re-run every part with a different seed and record how far each headline number moves. That spread is your error bar, and it is what lets you say \"0.55\" with confidence rather than \"0.5566\".",
            "Write the pre-submission check as a short script that greps your notebook for the disallowed imports and the required arguments.",
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
            "<code>df[['col']]</code> for X, <code>df['col']</code> for y. Two brackets, 2D.",
            "<code>LinearSVC</code> needs <code>loss='hinge'</code> — the default is squared hinge.",
            "Average the predictions, then compute MSE once. New indices every iteration. Never resample test.",
            "K-means from scratch: <code>replace=False</code>, empty-cluster guard, <code>np.allclose</code> stop, print every SSE.",
            "Seeds change the third decimal, not the order of magnitude.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Why must <code>loss='hinge'</code> be passed to LinearSVC?",
              a: "Because its default is squared hinge, which penalises margin violations quadratically and produces different margins. The lecture's formulation and the rubric both want plain hinge.",
            },
            {
              q: "Why is averaging the MSEs different from the MSE of the averaged predictions?",
              a: "Squaring is not linear, so the mean of squared errors is not the squared error of the mean. Bagging averages the predictions first and then scores once — that is where the variance reduction appears.",
            },
            {
              q: "Why <code>replace=False</code> when initialising centroids?",
              a: "With replacement, two centroids can start on the same point; one cluster then immediately empties and the run degenerates.",
            },
            {
              q: "Why stop K-means on a tolerance rather than exact equality?",
              a: "The centroids are floats computed by averaging, so exact equality between iterations may never occur. <code>np.allclose(new, old, atol=1e-6)</code> is the rubric's \"above a small tolerance\".",
            },
          ],
        },
      ],
    },
  ],
};
