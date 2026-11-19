import type { Chapter } from "@/types/content";

export const genaiBridge: Chapter = {
  slug: "genai-bridge-and-formula-sheet",
  title: "How Module 1 powers Gen AI, and the formula sheet",
  description:
    "Where every idea in this module reappears inside a transformer or an agent, and every formula from the whole module on one page.",
  icon: "✦",
  order: 3,
  moduleId: "m7",
  estimatedMinutes: 16,
  prerequisites: ["model-and-metric-selection"],
  sourceRefs: ["Module 1 ML Notebook.html § m7-genai, m7-formulas"],
  islpChapters: ["Ch 2", "Ch 3", "Ch 4", "Ch 5", "Ch 6", "Ch 8", "Ch 9", "Ch 12"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why none of this is a detour",
      blocks: [
        {
          type: "prose",
          html: "It is easy to read Module 1 as the boring prerequisite before the interesting part — the classical statistics you have to get through before you reach language models and agents.<br><br>It is not. A transformer is dot products, softmax and cross-entropy, trained by gradient descent with weight decay. A RAG retriever is cosine similarity over embeddings. Self-consistency is ensemble voting. Fine-tuning on a small dataset is overfitting, and holding out an eval set is the fix. There is no second body of mathematics waiting after this one — there is this one, at scale.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "Where each idea reappears",
      blocks: [
        {
          type: "table",
          headers: ["Module 1 idea", "Inside a Gen AI / agentic system"],
          rows: [
            ["Vectors, embeddings", "Every token, document and user is a vector"],
            [
              "Cosine similarity",
              "RAG retrieval, semantic search, picking which tool an agent should call",
            ],
            ["Dot product, ÷ scale", "Attention: query·key, divided by √d to keep numbers stable"],
            ["Vector addition", "Residual stream, token + position embeddings"],
            ["Softmax + cross-entropy", "Next-token prediction training"],
            ["Gradient descent, learning rate", "Pre-training and fine-tuning"],
            ["L2 regularisation", "Weight decay"],
            ["Temperature (scaling scores)", "Logits ÷ T before sampling: low T sharper, high T more random"],
            ["PCA / dimensionality reduction", "Compressing embeddings for vector stores"],
            [
              "Ensembles and voting",
              "Self-consistency (sample several answers, majority vote), model routing",
            ],
            [
              "Class imbalance, precision/recall",
              "Evaluating guardrails, rare-incident detection, hallucination flags",
            ],
            ["Bias–variance, overfitting", "Fine-tuning on tiny datasets memorises; hold out an eval set"],
          ],
        },
        { type: "heading", level: 3, content: "Three worth following through properly" },
        {
          type: "prose",
          html: "<b>Attention is a dot product with a scale.</b> A token's query vector is dotted with every other token's key vector, giving one similarity score per pair — exactly the weighted-score reading from Module 2. The division by √d is there because the dot product of two d-dimensional vectors grows with d, and without the division the scores would be large enough to saturate the softmax. That is the \"scale\" operation from the vectors chapter, used to keep numbers in a workable range.",
        },
        {
          type: "prose",
          html: "<b>Next-token prediction is the digit reader.</b> The output is a one-hot target over a vocabulary instead of over ten digits, the loss is cross-entropy, and the training is gradient descent. Same four-step recipe from Module 3, with 100,000 classes instead of 10.",
        },
        {
          type: "prose",
          html: "<b>Temperature is the threshold decision again.</b> Dividing logits by T before sampling makes the distribution sharper (low T) or flatter (high T), which trades confident-but-narrow against varied-but-risky. Structurally it is the same choice as moving a classifier's threshold: the model has not changed, only the operating point.",
        },
        {
          type: "genai",
          html: "Which means the diagnostic habits transfer too. A fine-tune that memorises a 200-example dataset is high variance and shows the same train/eval gap you watched at polynomial degree 3. A retrieval system that returns plausible-but-wrong documents has a precision problem, and lowering the similarity cut-off trades precision for recall exactly as the threshold lab shows.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "The formula sheet",
      blocks: [
        {
          type: "prose",
          html: "Everything from the whole module, in the professor's own grouping.",
        },
        {
          type: "formula",
          title: "Statistics",
          lines: `mean = Σx/n   var = Σ(x−μ)²/n (sample: n−1)   std = √var
IQR = Q3 − Q1   fences = Q1 − 1.5·IQR, Q3 + 1.5·IQR
z = (x − μ)/σ    68 / 95 / 99.7% within 1 / 2 / 3σ`,
        },
        {
          type: "formula",
          title: "Probability",
          lines: `P(A|B) = P(A∩B)/P(B)    independent ⇔ P(A|B) = P(A)
Bayes: P(A|B) = P(B|A)P(A) / [P(B|A)P(A) + P(B|¬A)P(¬A)]`,
        },
        {
          type: "formula",
          title: "Linear algebra",
          lines: `a·b = Σaᵢbᵢ = |a||b|cosθ    |a|₂ = √Σaᵢ²   |a|₁ = Σ|aᵢ|
cos sim = a·b / (|a||b|)    Av = λv ⇔ det(A − λI) = 0   det[[a,b],[c,d]] = ad − bc
explained variance of PC k = λₖ / Σλ`,
        },
        {
          type: "formula",
          title: "Models",
          lines: `linear: ŷ = w·x + b        logistic: p = 1/(1 + e^−(w·x+b)), log(p/(1−p)) = w·x + b
ridge: + α Σw²   lasso: + α Σ|w|      GD: w ← w − η ∂L/∂w
SVM: min ½‖w‖² + CΣξᵢ, margin = 2/‖w‖, hinge = max(0, 1 − y f(x))
RBF: K(a,b) = exp(−γ‖a − b‖²)`,
        },
        {
          type: "formula",
          title: "Losses and metrics",
          lines: `MSE = Σ(y − ŷ)²/n     cross-entropy = −Σ y log p
precision = TP/(TP+FP)   recall = TP/(TP+FN)   F1 = 2PR/(P+R)`,
        },
        {
          type: "formula",
          title: "Trees and ensembles",
          lines: `entropy = −Σ p log p    gini = 1 − Σp²    IG = H(parent) − Σ (nₖ/n) H(childₖ)
OvO models = K(K−1)/2    OvA models = K    P(out of bag) = (1 − 1/N)ᴺ ≈ 0.368
class weight = n / (k · n_c)`,
        },
        {
          type: "citation",
          source: "ISLP, the whole book",
          detail:
            "Chapter map used throughout this portal: Ch 2 statistical learning and bias–variance · Ch 3 linear regression · Ch 4 classification and logistic regression · Ch 5 resampling, cross-validation and the bootstrap · Ch 6 Ridge, Lasso and model selection · Ch 8 trees, bagging and random forests · Ch 9 SVM and kernels · Ch 12 PCA and K-means. The PDF is in the parent folder.",
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "What Module 1 does not cover",
      blocks: [
        {
          type: "prose",
          html: "Knowing the edges of what you have learnt is as useful as knowing the middle. None of the following appeared here, and each is a real gap rather than a detail:",
        },
        {
          type: "list",
          items: [
            "<b>Neural networks beyond one neuron.</b> Stacking layers, activation functions, backpropagation through them. The single neuron and gradient descent are the ingredients; the assembly is a later module.",
            "<b>Boosting in depth.</b> AdaBoost and gradient boosting got a preview in Module 6, not a treatment — and on tabular data they are usually the model to beat.",
            "<b>Time series.</b> Everything here assumes rows are exchangeable. They are not when they are ordered in time, and a random split is actively wrong there.",
            "<b>Causal inference.</b> Every coefficient in this module is an association. Nothing here licenses a causal claim.",
            "<b>Calibration and uncertainty.</b> Logistic regression gives a probability; whether that probability is trustworthy is a separate question with its own tooling.",
            "<b>Deployment.</b> Drift, monitoring, retraining cadence — the part where a model meets the world and slowly stops working.",
          ],
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
            "Cover the right column of the Gen AI table and reconstruct it from the left. <b>Success:</b> at least ten of the twelve, and you can explain the √d division without looking.",
            "Write out the formula sheet from memory, group by group. <b>Success:</b> you can produce Bayes, the SVM objective, IG and the out-of-bag probability unaided.",
            "Implement scaled dot-product attention for three toy token vectors: dot every query with every key, divide by √d, softmax, and use the weights to average the values. <b>Success:</b> the weights sum to 1 per row and the most similar token gets the most weight.",
            "For each of the six gaps above, name which later module or external resource would close it. <b>Success:</b> you have a reading plan rather than a feeling of incompleteness.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Build a minimal RAG retriever end to end: embed five documents with any sentence-transformer, embed a query, rank by cosine, pick a cut-off and justify it. Every step is a Module 1 or Module 2 idea.",
            "Demonstrate temperature: take a vector of logits, divide by T for T = 0.2, 1 and 5, softmax each, and plot the three distributions. Then say which one you would ship and for what.",
            "Fine-tune anything on 50 examples and plot train versus eval loss. You will reproduce polynomial degree 3, in a different costume.",
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
            "Attention is a dot product divided by √d to keep the softmax from saturating.",
            "Next-token prediction is the digit reader with 100,000 classes.",
            "Temperature is the decision threshold, moved at sampling time.",
            "Self-consistency is ensemble voting; weight decay is L2.",
            "A fine-tune on 200 examples is high variance, and a held-out eval set is the fix.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Why is attention divided by √d?",
              a: "The dot product of two d-dimensional vectors grows with d, so without the division the scores become large enough to saturate the softmax into a near-one-hot distribution with vanishing gradients. It is the scale operation from vector arithmetic.",
            },
            {
              q: "Which Module 1 idea is RAG retrieval?",
              a: "Cosine similarity over embeddings — the query and every document become vectors, and the top matches by angle are retrieved. Where you put the cut-off is a precision/recall trade, not a mathematical fact.",
            },
            {
              q: "What loss trains a GPT-style model?",
              a: "Cross-entropy on next-token prediction — the same loss as the handwritten-digit classifier, over a vocabulary instead of ten digits.",
            },
            {
              q: "A fine-tune on 200 examples scores well on training and badly on held-out data. What is that?",
              a: "High variance — overfitting. The same diagnosis as a degree-3 polynomial on 455 rows, and the same fixes: more data, less capacity, stronger regularisation, and an honest eval set.",
            },
          ],
        },
      ],
    },
  ],
};
