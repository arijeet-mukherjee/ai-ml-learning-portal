import type { Chapter } from "@/types/content";

export const classImbalance: Chapter = {
  slug: "class-imbalance-and-churn",
  title: "Class imbalance, and the churn notebook",
  description:
    "Why equal total error can hide a fairness problem, the three fixes, and the full SVM-on-Telco-churn workflow with its leakage trap.",
  icon: "⚖",
  order: 5,
  moduleId: "m5",
  estimatedMinutes: 22,
  prerequisites: ["the-kernel-trick", "grading-a-classifier"],
  sourceRefs: ["Module 1 ML Notebook.html § m5-imb, m5-nb"],
  islpChapters: ["Ch 9"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why the same error count can be two different models",
      blocks: [
        {
          type: "prose",
          html: "Lecture example: 12 blue, 5 red. Two classifiers each make 3 mistakes. Classifier 1 gets 0/12 blue wrong but 3/5 red wrong — <b>60% of the minority class</b>. Classifier 2 gets 3/12 blue wrong and 0/5 red wrong.<br><br>Both have the same total error. A training algorithm minimising total error may pick either, with no preference. The second is obviously fairer and more useful, and nothing in the loss function knows that.",
        },
        {
          type: "world",
          html: "Telco churn: ~27% leave. A model that says \"nobody leaves\" is 73% accurate and useless. Judge on recall and F1 for the churn class, and train with balanced weights.",
        },
        {
          type: "prose",
          html: "The minority class is almost always the one you care about. Fraud, churn, disease, equipment failure, security incidents — in every case the rare event is the reason the project exists. Imbalance is not an edge case; it is the normal condition of useful classification problems.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "table",
          headers: ["Fix", "How", "Note"],
          rows: [
            [
              "Oversample minority",
              "Add more minority examples: inexact copies close in feature space",
              "SMOTE does exactly this, interpolating between neighbours",
            ],
            [
              "Undersample majority",
              "Drop majority examples, preferably near the boundary",
              "Throws away data; fine when data is plentiful",
            ],
            [
              "Class weights",
              "Make each minority mistake cost more",
              '<code>class_weight="balanced"</code>: w_c = n / (k × n_c)',
            ],
          ],
        },
        {
          type: "prose",
          html: "Take the weight formula apart, because it is used unchanged in the next module. With n rows, k classes and n_c rows in class c, the weight is n / (k · n_c). For a 73/27 split with 1,000 rows: the majority weight is 1000/(2·730) = 0.68 and the minority weight is 1000/(2·270) = 1.85. Multiply each class's count by its weight and both come to 500 — the weights are exactly what makes the <i>effective</i> class counts equal.",
        },
        {
          type: "memoryHook",
          content: "Balanced weights do not change the data — they change the price of each mistake.",
          detail:
            "Which is why they are usually the first thing to try: no rows invented, no rows discarded, one argument.",
        },
        {
          type: "prose",
          html: "Which to pick, in practice. <b>Class weights</b> first: one argument, no data distortion, works for SVMs, logistic regression and trees. <b>Oversampling / SMOTE</b> when the minority is very small and the model needs more examples to shape a boundary — but it must happen <i>inside</i> the cross-validation fold, or synthetic points derived from a validation row end up in training. <b>Undersampling</b> only when you have data to spare.",
        },
        {
          type: "prose",
          html: "And independently of all three: <b>move the threshold</b>. A probabilistic model trained on imbalanced data can often be fixed at prediction time rather than training time, which is cheaper and more controllable. The threshold lab from Module 3 is the tool.",
        },
        { type: "heading", level: 3, content: "The churn workflow" },
        {
          type: "list",
          ordered: true,
          items: [
            "Load 7,043 customers; <code>TotalCharges</code> is text → <code>pd.to_numeric(errors=\"coerce\")</code>; the 11 NaNs are tenure-0 customers, so drop them.",
            "EDA: churners are new, pay more per month, sit on month-to-month contracts, fibre internet, electronic cheque.",
            "Drop <code>customerID</code>, target Yes→1, <code>pd.get_dummies(drop_first=True)</code>, stratified split.",
            "<b>Scale numeric columns</b>: w·x adds features, so TotalCharges (thousands) would drown tenure (tens).",
            "Compare hard/soft margin × linear/RBF, then tune C and γ with GridSearchCV inside a Pipeline.",
          ],
        },
        {
          type: "prose",
          html: "Step 1 is a good reminder that data cleaning is domain reasoning, not mechanics. <code>TotalCharges</code> is blank for exactly the customers whose tenure is 0 — they have been billed nothing because they have been there no months. The 11 NaNs are not errors; they are a category. Dropping them is defensible because they cannot have churned yet.",
        },
        {
          type: "trap",
          html: "Put the scaler <i>inside</i> the Pipeline when cross-validating. Otherwise it's fit on all training folds, including the one being used for validation: leakage.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the whole churn pipeline, leak-free",
            code: `import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC
from sklearn.metrics import classification_report

url = "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv"
df = pd.read_csv(url)            # or the offline practice file: churn_practice_synthetic.csv
df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
df = df.dropna(subset=["TotalCharges"]).drop(columns="customerID")
y = (df.pop("Churn") == "Yes").astype(int)
X = pd.get_dummies(df, drop_first=True, dtype=int)
num = ["tenure", "MonthlyCharges", "TotalCharges"]
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

pipe = Pipeline([
    ("scale", ColumnTransformer([("s", StandardScaler(), num)], remainder="passthrough")),
    ("svm", SVC(kernel="rbf", class_weight="balanced", random_state=42)),
])
grid = GridSearchCV(pipe,
    {"svm__C": [0.1, 1, 10, 100], "svm__gamma": [0.001, 0.01, 0.1, 1]},
    cv=StratifiedKFold(5, shuffle=True, random_state=42),
    scoring="f1", return_train_score=True, n_jobs=-1)
grid.fit(X_tr, y_tr)
print(grid.best_params_, round(grid.best_score_, 3))
print(classification_report(y_te, grid.best_estimator_.predict(X_te)))

res = pd.DataFrame(grid.cv_results_)[["param_svm__C", "param_svm__gamma", "mean_train_score", "mean_test_score"]]
res["gap"] = res.mean_train_score - res.mean_test_score     # big gap = high variance
print(res.sort_values("gap", ascending=False).round(3))`,
            caption:
              "Four things to copy: ColumnTransformer scales only the numeric columns and passes the one-hot ones through; class_weight='balanced' prices the minority correctly; scoring='f1' optimises the thing you actually care about; and return_train_score gives you the gap column that diagnoses every cell of the grid.",
          },
        },
        {
          type: "prose",
          html: "That last block — sorting the grid by train-minus-test gap — is the most reusable idea in the notebook. It turns a hyperparameter search into a bias–variance map: the cells with the biggest gaps are the high-variance corner (large C, large γ), and the cells with low scores on both are the underfitting corner.",
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
            "<b>Reporting accuracy.</b> On 27% churn, \"nobody leaves\" scores 73%. Always print the majority baseline beside your number.",
            "<b>Resampling outside the fold.</b> SMOTE or oversampling applied before cross-validation leaks: synthetic points built from a validation row train the model that is then validated on it. Use <code>imblearn</code>'s Pipeline, which resamples per fold.",
            "<b>Scaling outside the Pipeline.</b> Same class of error, and the one the lecture flags explicitly.",
            "<b>One-hot encoding before splitting.</b> Usually harmless, but if a category appears only in test you get a column mismatch. Encode inside the Pipeline or align the columns explicitly.",
            "<b>Balancing when you do not need to.</b> If the costs really are symmetric and the classes are only mildly unequal, weighting shifts the threshold for no benefit.",
            "<b><code>drop_first=True</code> with a model that has no intercept.</b> It avoids the dummy-variable trap for linear models; for trees it just removes information.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 9",
          detail:
            "ISLP chapter 9 covers the SVM with unequal class costs and the ROC curve as the summary of a classifier across all thresholds — the right way to compare two models when the operating point is still undecided.",
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
            ["Soft margin (C=1), RBF", "0.65", "<b>0.60</b>", "0.05"],
          ],
        },
        {
          type: "prose",
          html: "Read the F1 values rather than the gaps for a moment. The best test F1 here is 0.60 — which is not a great model, and that is the honest result for churn from these features. Churn is genuinely hard: people leave for reasons that are not in a billing table. A 0.60 F1 that you understand is worth more than a 0.90 accuracy that you have misread.",
        },
        {
          type: "prose",
          html: "The offline practice file in this portal is a 1,000-row synthetic stand-in with the same patterns — around 26% churn, with month-to-month contracts, fibre internet, electronic cheque and short tenure all over-represented among churners. Use it when you cannot reach the IBM URL; the real file has 7,043 rows.",
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
            "Load the churn data, fix <code>TotalCharges</code>, drop the tenure-0 rows, and confirm the churn rate. <b>Success:</b> ~26–27%, and you can explain what the 11 NaNs were.",
            "Build the majority-class baseline and report its accuracy and its churn-class recall. <b>Success:</b> ~73% accuracy and 0.0 recall — the number that proves accuracy is the wrong metric.",
            "Fit the four settings in the table and reproduce the gaps. <b>Success:</b> your hard-margin RBF shows a gap above 0.3.",
            "Run the GridSearchCV over C and γ with <code>scoring=\"f1\"</code> inside a Pipeline, then print the grid sorted by train-minus-test gap. <b>Success:</b> the largest gaps sit at large C and large γ, as the theory predicts.",
            "Compare <code>class_weight=\"balanced\"</code> against the default on the same settings. <b>Success:</b> you can state what it did to recall and to precision.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Compute the balanced weights by hand from the class counts and confirm they match sklearn's <code>compute_class_weight</code>.",
            "Deliberately leak: fit the scaler outside the Pipeline, cross-validate, and compare the cross-validated F1 with the leak-free version. The difference is the size of the mistake.",
            "Add SMOTE via <code>imblearn.pipeline.Pipeline</code> and compare it with class weights on the same grid. Then explain why the <code>imblearn</code> Pipeline exists rather than the sklearn one.",
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
            "Equal total error can hide a 60% failure rate on the minority class.",
            "Balanced weights change the price of a mistake, not the data: w_c = n / (k · n_c).",
            "Resampling and scaling both belong inside the cross-validation fold.",
            "Sort a hyperparameter grid by train-minus-test gap and it becomes a bias–variance map.",
            "The honest churn result is F1 ≈ 0.60, and understanding that beats misreading 73% accuracy.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Two classifiers make three mistakes each on 12 blue and 5 red. Are they equally good?",
              a: "No. One gets 3 of the 5 red wrong — 60% of the minority — while the other gets all the red right. Total error treats them identically, which is why you report per-class recall.",
            },
            {
              q: "What does class_weight='balanced' actually compute?",
              a: "w_c = n / (k · n_c), so each class's weighted count becomes n/k. For a 73/27 split the weights are about 0.68 and 1.85, making the effective class sizes equal.",
            },
            {
              q: "Why must the scaler sit inside the Pipeline during cross-validation?",
              a: "Fitted outside, it has seen every training fold including the one being held out for validation, so the validation score is contaminated. A Pipeline refits it per fold.",
            },
            {
              q: "A churn model is 73% accurate. What do you ask next?",
              a: "What the majority baseline scores — also 73% — and what the recall on the churn class is. If recall is near zero the model has learnt nothing useful.",
            },
          ],
        },
      ],
    },
  ],
};
