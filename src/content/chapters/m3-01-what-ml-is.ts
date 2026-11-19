import type { Chapter } from "@/types/content";

export const whatMlIs: Chapter = {
  slug: "what-ml-is",
  title: "What machine learning is, and why now",
  description:
    "Data shapes from 1D to 4D, why the techniques waited thirty years for data and GPUs, and the postcode reader that set the pattern.",
  icon: "◧",
  order: 1,
  moduleId: "m3",
  estimatedMinutes: 16,
  prerequisites: ["plotting-and-eda"],
  sourceRefs: ["Module 1 ML Notebook.html § m3-data, m3-why, m3-postcode"],
  islpChapters: ["Ch 2"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why this took until now",
      blocks: [
        {
          type: "bigIdea",
          content:
            "Machine learning = collect labelled examples, pick a model shape, define how wrong it is, and nudge its weights until it's less wrong.",
        },
        {
          type: "prose",
          html: "Most of the core techniques in this entire course existed before 1990. Backpropagation, the perceptron, decision trees, logistic regression — all older than the people using them. So why did nothing happen for thirty years?<br><br>Two things were missing: <b>data</b> (now ~350 million images uploaded per day, 100 hours of video per minute) and <b>compute</b> to crunch it (GPUs, parallel processing). The algorithms were waiting.",
        },
        {
          type: "memoryHook",
          content:
            "Algorithms are the car. Data is the fuel. GPUs are the engine. The car existed in 1990; fuel and engine arrived later.",
        },
        {
          type: "prose",
          html: "This matters practically, not just historically. It tells you where to spend effort. When a model underperforms, the instinct is to reach for a cleverer algorithm. Usually the answer is more data, better labels, or better features — because the algorithm was rarely the bottleneck in the first place.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        { type: "heading", level: 3, content: "Data comes in dimensions" },
        {
          type: "table",
          headers: ["Data", "Shape", "Example from the lecture"],
          rows: [
            ["Time series", "1D: value over time", "ESG risk forecasting"],
            ["Grayscale image", "2D: height × width, each pixel 0–255", "Electron-microscope detail enhancement"],
            ["Colour image", "3D: H × W × 3 (R, G, B)", "Dual-lens camera deblurring"],
            ["Grayscale video", "3D: H × W × time", "Infrared motion deblurring"],
            ["Colour video", "4D: H × W × 3 × time", "Pig distress monitoring on farms"],
          ],
        },
        {
          type: "prose",
          html: "Pixels run 0 (black) to 255 (white) because 8 bits give 2⁸ = 256 levels. A hex colour like #FF0000 is three 8-bit channels: full red, zero green, zero blue.",
        },
        {
          type: "memoryHook",
          content: "Line → sheet → stack of 3 sheets → flip-book of sheets.",
          detail: "Each new kind of data adds one dimension.",
        },
        {
          type: "prose",
          html: "Why dimension-counting earns a section of its own: every library in this course wants your data as a specific shape, and the first error you hit on a new problem is almost always a shape error. A tabular model wants <code>(n_samples, n_features)</code>. Flattening a 28×28 image into 784 features is how you feed a picture to a linear model — and throwing away the 2D structure in that flatten is precisely what convolutional networks were invented to avoid.",
        },
        { type: "heading", level: 3, content: "Case study: reading postcodes" },
        {
          type: "prose",
          html: "LeCun's digit reader (the MNIST setup): 28×28 grayscale images, 60,000 training and 10,000 test examples, output an integer 0–9. The network has to be invariant to translation, rotation, scale, squeeze, stroke width and noise, because nobody writes a \"2\" the same way twice.",
        },
        {
          type: "prose",
          html: "The output is a list of 10 numbers, one per digit. For a \"7\" the ideal output is [0,0,0,0,0,0,0,1,0,0]: a <b>one-hot</b> vector. That representation is worth noticing, because it recurs everywhere — a categorical variable encoded for a model, a class label in a loss function, a token in a language model's vocabulary. One-hot is how you turn \"which one of K\" into numbers a dot product can touch.",
        },
        {
          type: "world",
          html: "The same pipeline (pixels → neural network → class) powers OCR for invoices and forms, number-plate readers at toll booths, and cheque processing at banks.",
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "When the framing is wrong",
      blocks: [
        {
          type: "list",
          items: [
            "<b>No labels.</b> If nobody has told you the right answer for any example, this is not supervised learning and no amount of model choice will fix it. You are in clustering territory — Module 6's K-means.",
            "<b>Labels that encode the answer.</b> If a feature is downstream of the label (a \"case closed by\" field when predicting closure), the model will score beautifully and be useless. This is leakage at the problem-definition level, before any code.",
            "<b>A rule would do.</b> If the relationship is \"flag anything over ₹50,000\", write the <code>if</code> statement. ML earns its complexity when the rule is unknown or has hundreds of exceptions.",
            "<b>Too little data for the shape.</b> Thousands of features and a few hundred rows is the setup for memorising noise, which you will watch happen in Module 4 at polynomial degree 3.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 2",
          detail:
            "ISLP chapter 2 formalises what this chapter frames informally: the distinction between prediction and inference, the irreducible error you can never remove, and why more flexible models are not automatically better.",
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
          html: "The dataset you will use for the rest of Modules 3 and 4 is deliberately ordinary: 569 patients, 30 numeric features of cell nuclei, one binary label. Benign 62.7%, malignant 37.3%. No images, no deep learning — just a table, which is what most real machine learning actually looks like.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the shapes, before anything else",
            code: `import pandas as pd, numpy as np

df = pd.read_csv("breast_cancer.csv", index_col=0).drop(columns="id")
print(df.shape)                                   # (569, 31) -> 30 features + label
print(df["diagnosis"].value_counts(normalize=True))   # B 0.627, M 0.373

X = df.drop(columns="diagnosis")
y = np.where(df["diagnosis"] == "M", 1, -1)       # the lecture's -1/+1 encoding
print(X.shape, y.shape)                           # (569, 30) (569,)

# One-hot, for comparison: the same label as a 2-slot vector per row
pd.get_dummies(df["diagnosis"]).head(3)`,
            caption:
              "`index_col=0` handles the unnamed row-index column the CSV carries. Note the −1/+1 encoding rather than 0/1 — the lecture's linear classifier uses it so that the sign of the prediction *is* the class.",
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
            "Load the breast-cancer data correctly, dropping both the index column and <code>id</code>. <b>Success:</b> shape (569, 31) and no stray <code>Unnamed: 0</code>.",
            "Print the class balance. <b>Success:</b> 62.7% / 37.3%, and you can say whether accuracy will be a fair metric on it.",
            "For each of the five data shapes in the table, write down the NumPy shape tuple a single example would have. <b>Success:</b> a colour video frame sequence is 4D and you can say which axis is which.",
            "Encode the label three ways — as −1/+1, as 0/1, and one-hot — and state which model in this course wants each. <b>Success:</b> you can name the lecture's reason for −1/+1.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Load one MNIST digit with <code>sklearn.datasets.load_digits</code>, print its shape, flatten it, and state exactly what information the flatten destroyed.",
            "Find a feature in the breast-cancer data that is a deterministic function of two others (hint: radius, perimeter and area describe one circle). That redundancy is what the |r| > 0.9 drop in the next chapters removes.",
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
            "Collect labelled examples, pick a shape, define how wrong, nudge the weights.",
            "Algorithms are the car. Data is the fuel. GPUs are the engine.",
            "Line → sheet → stack of 3 sheets → flip-book. Each data type adds a dimension.",
            "One-hot is how \"which of K\" becomes numbers.",
            "Most real ML is a table, not an image.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Why did machine learning take off after 2010 rather than 1990?",
              a: "The algorithms mostly already existed; data and compute did not. Billions of labelled examples and GPU parallelism arrived later.",
            },
            {
              q: "What shape is a colour video?",
              a: "4D — height × width × 3 colour channels × time.",
            },
            {
              q: "Why do pixels run 0 to 255?",
              a: "8 bits per channel gives 2⁸ = 256 distinct levels, numbered 0 through 255.",
            },
            {
              q: "What is a one-hot vector and where does it show up?",
              a: "A vector of zeros with a single 1 marking which class. It is the ideal output of a classifier, the encoding for a categorical feature, and the target for next-token prediction in a language model.",
            },
          ],
        },
      ],
    },
  ],
};
