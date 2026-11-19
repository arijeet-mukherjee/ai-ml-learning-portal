# Source notes

Every fact, number and dataset in this portal traces back to one of the files below.
Nothing here was invented. Read this before editing content.

## 1. `../Module 1 ML Notebook.html` (443 KB, the professor's own single-file app)

Parsed programmatically rather than by hand. Internal structure recovered:

| Structure | Contents |
|---|---|
| `MODULES` | 8 objects `{id, n, date, title, who, tagline, html}`, ids `m0`–`m7` |
| `CODE` | 18 `String.raw` snippets keyed `m0_create`, `m0_index`, `m0_select`, `m0_missing`, `m0_group`, `m0_plot`, `m0_solution`, `m1_desc`, `m1_dist`, `m1_joint`, `m1_corr`, `m1_solution`, `m2_code`, `m3_pipeline`, `m4_code`, `m5_code`, `m6_code`, `camera_practice` |
| `LABS` | 15 interactive labs (see `src/components/labs/`) |
| `QUIZ` | 42 questions with the professor's own explanations |
| `CARDS` | ~60 flashcards (`q` / `a` / `h` = hook) |
| `DATASETS_RAW` | 5 CSVs inlined as strings → extracted to `public/data/` |
| `DS_META` | per-dataset blurb + practice task list |

Prose conventions in the module HTML, mapped to block types in `src/types/content.ts`:

| Notebook markup | Block type |
|---|---|
| `<p class="bigidea">` | `bigIdea` |
| `<div class="note"><span class="lbl">Memory hook</span>…<small>…</small>` | `memoryHook` |
| `<div class="trap">` | `trap` |
| `<div class="world">` | `world` |
| `<div class="genai">` | `genai` |
| `<div class="fix">` | `fix` (the professor correcting his own slides) |
| `<div data-code="…">` | `code` |
| `<div data-lab="…">` | `widget` |
| `<details class="deep">` | `deepDive` |

### Module dates and lecturers (from the `MODULES` metadata)

| id | Date | Lecturer / session |
|---|---|---|
| m0 | Week 0 | Hands-on lab |
| m1 | 6 Sept | Session 2 |
| m2 | 12 Sept | Linear Algebra Foundations |
| m3 | 20 Sept | Prof. Mahesh Mohan M R, IIT Kharagpur |
| m4 | 27 Sept | Prof. Mahesh Mohan M R, IIT Kharagpur |
| m5 | 4 Oct | Prof. Adway Mitra, IIT Kharagpur |
| m6 | 11 Oct | Prof. Adway Mitra, IIT Kharagpur |
| m7 | Revision | Everything on one page |

### Numbers quoted from the notebook

- NumPy vs Python loop on 2 million doublings: **0.42 s vs 0.015 s**, ~28×.
- Lecture central-tendency data `[4, 8, 15, 16, 23, 42, 8, 8, 15]`: mean 15.4, median 15, mode 8.
- Bayes coin example: posterior **0.583** (0.35 / 0.60). Screening quiz: 2% at-risk, 90% detection, 15% false alarms → **10.9%** of flagged are truly at-risk.
- Covariance worked example: var S 10, var F 10, cov 8 → eigenvalues **18 and 2** (90% along the 45° line). With a third feature: 18, 2, 1 → PC1 **86%**, PC2 9%, PC3 5%.
- Breast-cancer linear classifier: no outlier imputation → 20 features, **95.6%** accuracy, recall 0.88, F1 0.94. With imputation → 25 features, **98.2%**, recall 0.95, F1 0.98, precision 1.00 in both.
- Polynomial / regularisation table (breast cancer): degree 1 → 95.8 / **98.2**; degree 3 → 100.0 / 75.4; Ridge α=10⁴ → 90.5 / 90.4; Lasso (40 active weights) → 96.9 / 96.5; logistic → 97.1 / **98.2**.
- Bias–variance worked example (X = [3,5], Y = 12): predictions 11.3, 11.3, 14.7, 11.3 → mean **12.15**, bias **−0.15**, variance **2.17**.
- Camera lecture data (100 cameras, 63 LOW / 37 HIGH): C1 43/11 (P(HIGH) 0.20), C2 20/26 (0.55); price<300 45/25 and 18/12; price<500 55/35 and 8/2. Information gain **≈0.07 / ≈0 / ≈0.01**. Decision stump training accuracy **69%**.
- Variance reduction (regression tree): Company 0.06, Video ≥ 30 fps **0.14**.
- Weighted voting example: simple vote → label 1; weighted (7,5,9,5,7,9) → **label 2** (18 vs 17).
- Telco churn SVM F1 table: hard/linear 0.50 → 0.49; hard/RBF 0.90 → 0.50 (gap 0.40); soft C=1 linear 0.60 → 0.58; soft C=1 RBF 0.65 → 0.60.
- `class_weight="balanced"` on an 8/2 node: weights 0.625 and 2.5, Gini rises **0.32 → 0.50**.

### Corrections the professor himself flagged (`fix` blocks — kept verbatim)

1. Bias–variance slide lists the Y=18 bias as 1.35; recomputed it is **5.85**. The slide's variance formula is printed as `(1/M)(Y − g(X))²`; the intended one is `(1/M)Σ(fₘ(X) − g(X))²`.
2. Entropy slide numbers (0.66 for the 63/37 root) use the **natural log**; sklearn's `criterion="entropy"` uses **log₂**, giving 0.95 for the same root. The base only rescales, so the tree is identical.
3. Weighted-regression voting slide multiplies f6 by 6 instead of its weight 9; with 9 the answer is **85.9 / 42 ≈ 2.05**.

## 2. `../ml-projects/Assesments/Module_1/Module_1_Study_Guide.md`

The densest source: Q1–Q28 with results from the executed solution notebook.

| Topic | Real result |
|---|---|
| Linear regression (California housing, `MedHouseVal` → `MedInc`) | slope **1.1328**, intercept **1.5274**, X (20640, 1), y (20640,) |
| Logistic regression (iris, setosa vs virginica, 80/20) | `coef_` **[0.46, −0.31, 1.73, 0.81]**, `intercept_` **−8.35**, accuracy **1.0** |
| LinearSVC margin width | **0.639** at C=1, **0.243** at C=1000, accuracy 1.0 both |
| Bagging over linear regression, test MSE | **0.5566 → 0.5569 → 0.5535 → 0.5538**, flat **0.553–0.558** for 1→30 models |
| Bootstrap unique rows | **10,449 / 16,512 = 63.3%** (= 1 − 1/e) |
| K-means SSE | k=1 **492.6**, k=2 **86.3**, k=3 **41.0**, k=4 **27.5** → elbow **k=2** |

Rubric-critical details lifted into `gradedDetail` blocks:
- `LinearSVC` defaults to squared hinge — `loss='hinge'` must be passed explicitly.
- `max_iter=100000` avoids convergence warnings at C=1000.
- Q2 deliberately inverts the usual direction: input `MedHouseVal`, target `MedInc`.
- Bagging: average the **predictions** then compute MSE once; new random indices per model and per loop iteration; the test set is never resampled.
- K-means must be written **from scratch**; `sklearn.cluster.KMeans` is explicitly disallowed.
- Q27 awards marks for *printing* every SSE.
- `np.allclose(new, old, atol=1e-6)` for convergence, never `==` on floats.

Also carried over verbatim: the quick-revision cheat sheet and the six likely viva questions.

## 3. Course datasets → `public/data/`

Extracted from the notebook's `DATASETS_RAW` (row counts verified against the CSVs on disk).

| File | Rows | Source on disk | Used by |
|---|---|---|---|
| `employee_dataset.csv` | 240 | `../ml-projects/DAY_1/employee_dataset.csv` | m0 practice, IQR lab |
| `students_survey.csv` | 300 | `../ml-projects/DAY_2/students_survey.csv` | m1 practice, bell-curve lab |
| `breast_cancer.csv` | 569 | `../ml-projects/DAY3/dataset.csv` (identical copy at `KGP_Code/dataset/cancer_dataset.csv`) | m3–m4 real examples |
| `camera_ratings_lecture.csv` | 100 | Rebuilt by the professor to match the lecture slide counts exactly | m6 entropy / trees |
| `churn_practice_synthetic.csv` | 1000 | Synthetic stand-in for the 7,043-row IBM Telco data used in class (≈26% churn) | m5–m6 |

## 4. Other course material read

- `../ml-projects/DAY_1/Python_Tool_Proficiency_Notebook.ipynb` + `.pptx` — m0.
- `../ml-projects/DAY_2/Probability_Statistics_Foundations_Notebook.ipynb` + `.pptx` — m1.
- `../ml-projects/day4/lecture_Slides.pptx.pdf` — m4–m6.
- `../ml-projects/Assesments/Module_1/LinearLogisticRegSVM.ipynb`, `RidgeLassoElastic.ipynb` — worked solutions.
- `../ml-projects/Assesments/Module_1/97b5fe8c-…-Assignment-1-Problem-Statement.pdf` and `4916bb2d-…-Assignment-1-Evaluation-Rubric.xlsx` — practice projects and graded details.
- `../ml-projects/TradingApp/` — unrelated personal project, deliberately ignored.

## 5. `../ISLP_website.pdf` — *An Introduction to Statistical Learning (Python)*

Cited per chapter, not transcribed. Mapping used by the `citation` blocks:
Ch 2 statistical learning & bias–variance · Ch 3 linear regression · Ch 4 classification
and logistic regression · Ch 5 resampling, CV, bootstrap · Ch 6 Ridge/Lasso & model
selection · Ch 8 trees, bagging, random forests · Ch 9 SVM & kernels · Ch 12 PCA & K-means.

## 6. An earlier learning-portal project of mine

The architecture this project mirrors: typed content modules, `AppShell` / `Sidebar` /
`ChapterView` / `ContentRenderer`, `src/app/learn/[slug]/page.tsx` with
`generateStaticParams`, `output: "export"` with a `GITHUB_ACTIONS`-gated `basePath`, and
the `gh-pages` deploy script.

## Module 2 · `../ml-projects/MODULE_2/feedforward_nn_and_backprop_demo.ipynb`

PyTorch lab: tensors, autograd, MNIST DataLoaders, `nn.Module`, manual SGD loop,
metrics, and a depth × width grid. Feeds chapters `m8-01` … `m8-06`.

| Item | Real value from the executed notebook |
|---|---|
| Autograd example `z = x·y + y²` at x=2, y=3 | z **15.0**, ∂z/∂x **3.0**, ∂z/∂y **8.0** |
| Data split | 60,000 train → **48,000 / 12,000** (80/20 `random_split`); test 10,000; batch 128 (test batch 1) |
| Batch shapes | input **[128, 1, 28, 28]**, output **[128, 10]** |
| Classifier | 784→128 (ReLU) →10 no bias (ReLU) → Sequential[10→10 no bias, ReLU, 10→10] |
| Parameters | d1 **100,480**, d2 1,280, seq0 100, seq2 110 → total **101,970** |
| Training | plain SGD, lr **0.01**, **25** epochs, CrossEntropyLoss |
| Loss curve | epoch 1 train **2.3009** / val 2.2831 / val acc 16.48%; epoch 3 2.0212 / 1.7631 / 41.18%; epoch 4 1.4069 / 1.1042 / 66.04%; epoch 10 0.4745 / 0.4633 / 86.37%; epoch 25 **0.2170 / 0.2241 / 93.43%** |
| Test metrics | accuracy **0.9386**, weighted precision 0.9386, weighted recall 0.9386 |
| Confusion matrix highlights | 4→9 **38**, 5→3 29, 3→2 28, 9→4 28, 7→9 22, 7→2 22; class 1 correct 1,117 / 1,135 |
| Grid (10 epochs, test acc) | 2L: 4→0.8023, 8→0.8948, 12→0.8962; 3L: 0.6937, 0.8392, 0.8924; 4L: **0.5448**, 0.8020, 0.8714 |

Derived for this portal (hand calculations, labelled "Deeper dive" in `sourceRefs`, re-checked in Python):
−ln(0.1) = 2.303; 48,000 / 128 = 375 steps per epoch; the 2-2-1 backprop example
(x=(2,1), y=1, loss 0.5501 → 0.1874 after one η=0.5 step); XOR with two ReLU units;
softmax of (2, 1, 0.1) = (0.659, 0.242, 0.099); RBF values for ‖a−b‖² = 5; camera-split
Gini 0.466 → 0.401 (decrease 0.065) and entropy gain 0.103 bits; 25 independent 65%-accurate
voters → majority correct 94%.

## Algorithm atlas (`src/components/labs/AlgoAtlas.tsx`, chapter m3-02)

Written for this portal, not from the course material. It replaces the plain "same four
columns" table in *The four-step recipe*. Every worked example is a hand calculation,
re-checked in Python:

- Linear regression: points (1,2), (2,4), (3,5). ŷ = x + 1 gives errors 0, 1, 1 → MSE 0.667.
  Least squares gives w = 1.5, b = 0.667 → MSE 0.0556.
- Log-loss: −ln 0.9 = 0.105, −ln 0.5 = 0.693, −ln 0.2 = 1.609. σ(2) = 0.881.
- Ridge penalty: 0.5 × (3² + 2²) = 6.5. Lasso penalty: 0.5 × (3 + 2) = 2.5.
- Ridge/lasso animation: orthonormal toy features with least-squares weights (3, −2, 0.5, 1.2) and
  loss ‖y − Xw‖² + α·penalty. Ridge → w/(1+α); lasso → sign(w)·max(|w| − α/2, 0).
  At α = 1: ridge (1.5, −1, 0.25, 0.6), lasso (2.5, −1.5, 0, 0.7). Lasso zeros appear at α = 1, 2.4, 4, 6.
- Hinge with w = (1,1), b = −3, y = +1: (3,1) → 0, (2,1.5) → 0.5, (1,1) → 2.
- Gini: 6/4 → 0.48. Children 5/1 → 0.278 and 1/3 → 0.375. Weighted 0.317, gain 0.163.
  Entropy 0.971 bits.
- K-means: points 1, 2, 9, 10. Centroids 1.5 and 9.5 → SSE 1. Centroids 2 and 9 → SSE 2.

The SVM, tree and k-means animations use seeded synthetic points (mulberry32). The SVM
animation uses subgradient descent for display; real solvers use QP (libsvm).
