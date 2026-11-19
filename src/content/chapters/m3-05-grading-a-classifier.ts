import type { Chapter } from "@/types/content";

export const gradingAClassifier: Chapter = {
  slug: "grading-a-classifier",
  title: "Grading a classifier",
  description:
    "The confusion matrix, precision versus recall, F1, which metric each case study demands, and why accuracy lies on imbalanced data.",
  icon: "◎",
  order: 5,
  moduleId: "m3",
  estimatedMinutes: 20,
  prerequisites: ["model-complexity"],
  sourceRefs: ["Module 1 ML Notebook.html § m3-eval"],
  islpChapters: ["Ch 4"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why accuracy is the wrong default",
      blocks: [
        {
          type: "trap",
          html: "With imbalance, accuracy lies. If 95% of transactions are honest, a model that always says \"honest\" scores 95% and catches zero fraud.",
        },
        {
          type: "prose",
          html: "That model has no weights, no features and no intelligence, and it beats most first attempts on the only number people instinctively quote. Which tells you the number is wrong, not that the model is good.<br><br>The deeper point: there is no metric that is correct in general. The right metric comes from the <i>cost of the mistake</i>, which is a fact about your problem and not about your data. Decide it before you train anything, because it determines what \"better\" means.",
        },
      ],
    },
    {
      id: "live",
      kind: "live",
      title: "Live: the trade you cannot escape",
      blocks: [
        {
          type: "prose",
          html: "Each dot is a patient with a model score. Slide the threshold and watch missed tumours fall as false alarms rise. There is no setting that fixes both — that is the shape of the problem, not a weakness of the model.",
        },
        { type: "widget", lab: "threshold" },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "prose",
          html: "Every binary prediction lands in one of four boxes. Name them once and the rest of this chapter is arithmetic on those four numbers.",
        },
        {
          type: "table",
          headers: ["", "Model says positive", "Model says negative"],
          rows: [
            ["<b>Actually positive</b>", "True positive (TP)", "False negative (FN) — a miss"],
            ["<b>Actually negative</b>", "False positive (FP) — a false alarm", "True negative (TN)"],
          ],
        },
        {
          type: "formula",
          title: "From the confusion matrix",
          lines: `accuracy  = (TP + TN) / all
precision = TP / (TP + FP)     "of my alarms, how many were real?"
recall    = TP / (TP + FN)     "of the real cases, how many did I catch?"
F1        = 2 · P · R / (P + R) (harmonic mean: low if either is low)`,
        },
        {
          type: "memoryHook",
          content: "Precision → Predicted positives. Recall → Real positives.",
          detail:
            "Type I error (FP) is the boy who cried wolf. Type II error (FN) is the wolf that walked in unnoticed.",
        },
        {
          type: "prose",
          html: "Read the denominators and you never confuse them again. Precision divides by <i>everything the model flagged</i> — it is a statement about the model's output. Recall divides by <i>everything that was actually positive</i> — it is a statement about the world. One asks \"can I trust an alarm\", the other asks \"how much did I miss\".",
        },
        {
          type: "prose",
          html: "F1 is the <b>harmonic</b> mean rather than the ordinary one, and that choice is deliberate: the harmonic mean is dragged down hard by the smaller of the two. Precision 1.0 with recall 0.1 gives an arithmetic mean of 0.55 and an F1 of 0.18. The harmonic mean refuses to let one good number hide one bad one.",
        },
        {
          type: "table",
          headers: ["Case study", "Worse mistake", "Watch"],
          rows: [
            ["Cancer diagnosis", "FN: a missed tumour", "Recall"],
            ["Anti-missile system", "FN: a missed missile", "Recall"],
            ["Spam filter", "FP: an important mail in spam", "Precision"],
            ["Weather \"rain tomorrow\"", "Depends who's asking (a farmer vs a picnic)", "Pick per use"],
          ],
        },
        {
          type: "prose",
          html: "That last row is the honest one. There is no metric for \"rain tomorrow\" in the abstract — only a metric for a farmer deciding whether to harvest and a different one for a family deciding whether to pack sandwiches. When somebody asks which metric to use and refuses to say what the decision is, the question has no answer.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "all four numbers, and the matrix behind them",
            code: `from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix, classification_report)

print(confusion_matrix(y_test, y_pred, labels=[1, -1]))
#  [[TP FN]
#   [FP TN]]      with labels=[1, -1] the positive class comes first

print("acc ", accuracy_score(y_test, y_pred).round(4))
print("prec", precision_score(y_test, y_pred).round(4))
print("rec ", recall_score(y_test, y_pred).round(4))
print("F1  ", f1_score(y_test, y_pred).round(4))

# The one call that gives you all of it, per class
print(classification_report(y_test, y_pred, target_names=["benign", "malignant"]))`,
            caption:
              "Pass `labels=[1, -1]` explicitly. Without it sklearn orders the matrix by sorted label value, which for a −1/+1 encoding puts the negative class first and quietly inverts how you read the quadrants.",
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
            "<b>Reporting accuracy on imbalanced data.</b> Always report the majority-class baseline next to it. If your model cannot beat \"always say no\", say so.",
            "<b>Optimising F1 when the costs are genuinely asymmetric.</b> F1 treats a miss and a false alarm as equally bad. In cancer screening they are not, and chasing F1 will cost you recall you wanted.",
            "<b>Quoting precision without recall.</b> A model that flags one case and gets it right has precision 1.0. Precision alone is trivially gameable; so is recall alone (flag everything).",
            "<b>Reading the confusion matrix transposed.</b> Row versus column conventions differ between libraries and textbooks. Label the axes every time.",
            "<b>Tuning the threshold on test.</b> Pick it on validation. The threshold is a parameter like any other.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 4",
          detail:
            "ISLP chapter 4 covers the confusion matrix, the sensitivity/specificity vocabulary that medicine uses instead of recall/precision, and the ROC curve as the summary of every threshold at once.",
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
          type: "result",
          headers: ["Impute outliers", "Features kept", "Accuracy", "Precision", "Recall", "F1"],
          rows: [
            ["No", "20", "95.6%", "1.00", "0.88", "0.94"],
            ["Yes", "25", "<b>98.2%</b>", "1.00", "<b>0.95</b>", "0.98"],
          ],
          caption: "From the Week 1 breast-cancer notebook on this dataset.",
        },
        {
          type: "prose",
          html: "Read those two rows carefully, because they are a worked example of metric choice. Precision is <b>1.00</b> in both: no benign patient was ever flagged as malignant. Every single error this model makes is a <i>missed cancer</i>. So accuracy's improvement from 95.6% to 98.2% is really recall's improvement from 0.88 to 0.95, and recall is the number that should be in the title of the report.",
        },
        {
          type: "memoryHook",
          content: "Precision 1.00 means every error is a miss — so recall is the whole story.",
          detail:
            "Whenever one of the two is pinned at its maximum, the other one is carrying all the information about the model's failures.",
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
            "Compute accuracy, precision, recall and F1 by hand from a confusion matrix of TP=18, FN=2, FP=0, TN=52. <b>Success:</b> your four numbers match sklearn's on the same counts.",
            "Build the majority-class baseline for the breast-cancer data and report its accuracy. <b>Success:</b> 62.7%, and you can say what its recall on malignant is (zero).",
            "Sweep the logistic threshold from 0.5 down to 0.1 and tabulate missed tumours against false alarms. <b>Success:</b> you can pick a threshold and defend it in one sentence that mentions cost.",
            "For each of the four case studies in the table, write the metric you would report and the one sentence that justifies it. <b>Success:</b> your weather answer names a specific decision-maker.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Plot the precision–recall curve for the breast-cancer logistic model and mark the point the default 0.5 threshold lands on. Then mark where you would rather be.",
            "Construct a dataset where a model with 99% accuracy is worse than useless, and one where 60% accuracy is excellent. Being able to do both is the point of this chapter.",
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
            "Precision → Predicted positives. Recall → Real positives. Read the denominator.",
            "F1 is harmonic so one good number cannot hide one bad one.",
            "Type I (FP) is crying wolf. Type II (FN) is the wolf walking in.",
            "With imbalance, always print the majority-class baseline next to your accuracy.",
            "The metric comes from the cost of the mistake, which is a fact about the problem.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "A fraud model is 95% accurate on data that is 95% honest. Is it any good?",
              a: "Unknown, and probably not — 'always say honest' scores the same and catches nothing. Report recall on the fraud class and the majority-class baseline.",
            },
            {
              q: "Precision or recall for cancer screening, and why?",
              a: "Recall. A false negative is a missed tumour, which is far costlier than a false alarm that leads to one more test.",
            },
            {
              q: "Why is F1 a harmonic mean?",
              a: "Because the harmonic mean is pulled down hard by the smaller value, so a model cannot score well by maximising one of precision or recall and abandoning the other.",
            },
            {
              q: "Precision is 1.00. What does that tell you about the errors?",
              a: "Every error is a false negative — the model never flags a true negative, so all its mistakes are misses, and recall carries all the information about its failures.",
            },
          ],
        },
      ],
    },
  ],
};
