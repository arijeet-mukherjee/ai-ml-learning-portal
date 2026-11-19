import type { Chapter } from "@/types/content";

export const whyNeuralNetworks: Chapter = {
  slug: "why-neural-networks",
  title: "Why neural networks, when we already have linear models, SVMs and trees?",
  description:
    "The XOR problem, why stacking linear layers is pointless without ReLU, feature learning, and an honest side-by-side of every classifier in the course.",
  icon: "⧉",
  order: 2,
  moduleId: "m8",
  estimatedMinutes: 28,
  prerequisites: ["calculus-for-ml", "the-artificial-neuron", "the-kernel-trick"],
  sourceRefs: [
    "MODULE_2/feedforward_nn_and_backprop_demo.ipynb § Networks",
    "Deeper dive: XOR construction and model comparison written for this portal",
  ],
  islpChapters: ["Ch 10"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "The question every student asks",
      blocks: [
        {
          type: "bigIdea",
          content:
            "Linear models need you to hand them good features. SVMs need you to choose a fixed similarity formula. A neural network builds its own features from raw data, and keeps getting better as you give it more data.",
        },
        {
          type: "prose",
          html: "By Module 6 you can already classify things in three different ways: draw a line (logistic regression, linear SVM), measure similarity to examples (kernel SVM), or ask a sequence of yes/no questions (trees and forests). On a spreadsheet of a few thousand rows, a random forest is still very hard to beat. So why does every image, speech and language system in the world use neural networks?<br><br>The short answer is <b>who designs the features</b>. On a spreadsheet, a human already did that: the columns <i>are</i> meaningful features (tenure, monthly charge, contract type). An image is 784 raw pixel brightnesses. No single pixel means “this is a 7”. The useful features — strokes, loops, corners — have to be <i>discovered</i>, and that is the one thing a neural network does that the others don't.",
        },
        {
          type: "world",
          html: "Before 2012, image recognition used hand-engineered features: researchers spent years designing edge detectors and gradient histograms, then fed those into an SVM. In 2012 a neural network (AlexNet) that learnt its own features from raw pixels cut the ImageNet error rate dramatically, and the whole field switched within two years. The same thing later happened to speech and to language.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How a network gets its power",
      blocks: [
        { type: "heading", level: 3, content: "Step 1 · A straight line can't solve XOR" },
        {
          type: "table",
          headers: ["x₁", "x₂", "XOR (1 if exactly one is on)"],
          rows: [
            ["0", "0", "0"],
            ["1", "0", "1"],
            ["0", "1", "1"],
            ["1", "1", "0"],
          ],
        },
        {
          type: "prose",
          html: "Put the four points on a square: the 1s sit on one diagonal, the 0s on the other. Try to draw <b>one straight line</b> with all the 1s on one side and all the 0s on the other. You can't — any line that separates (1,0) from (0,0) also has to deal with (1,1). Logistic regression, the perceptron and a linear SVM all draw exactly one straight line, so they all fail on four points. This is the problem that stalled neural-network research in 1969.",
        },
        { type: "heading", level: 3, content: "Step 2 · One hidden layer fixes it" },
        {
          type: "prose",
          html: "Add a middle (<b>hidden</b>) layer of two neurons with ReLU, and hand-pick the weights:",
        },
        {
          type: "formula",
          title: "XOR with two ReLU neurons",
          lines: `h₁ = ReLU(x₁ + x₂)          h₂ = ReLU(x₁ + x₂ − 1)
out = h₁ − 2·h₂

(0,0):  h₁ = 0   h₂ = 0   out = 0
(1,0):  h₁ = 1   h₂ = 0   out = 1
(0,1):  h₁ = 1   h₂ = 0   out = 1
(1,1):  h₁ = 2   h₂ = 1   out = 2 − 2 = 0   ✓`,
        },
        {
          type: "prose",
          html: "Look at what the hidden layer did. It didn't classify anything. It <b>re-described</b> each input as a new pair of numbers (h₁, h₂). In that new description, (1,0) and (0,1) both become (1, 0), and (1,1) becomes (2, 1): the problem is now trivially separable by a line. <b>Hidden layers move the data into a space where a straight line works.</b> That is exactly the kernel trick's goal from Module 5 — except here the mapping is <i>learnt</i>, not chosen by you.",
        },
        { type: "heading", level: 3, content: "Step 3 · Why the ReLU is non-negotiable" },
        {
          type: "prose",
          html: "Delete the ReLU and each layer is just “multiply by a matrix, add a vector”. Two such layers in a row: W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂). That is <b>one</b> matrix and <b>one</b> vector — a single linear layer in disguise. Ten linear layers stacked are no more powerful than one. The non-linear activation is what puts a <i>bend</i> between layers, and bends are what let the boundary curve.",
        },
        {
          type: "formula",
          title: "Why linear layers collapse",
          lines: `layer 1:  u = W₁x + b₁
layer 2:  y = W₂u + b₂ = W₂W₁x + W₂b₁ + b₂ = W x + b      (still a straight line)

with ReLU: y = W₂·ReLU(W₁x + b₁) + b₂                      (a bent, piecewise-linear surface)`,
        },
        {
          type: "widget",
          lab: "nnplay",
          caption:
            "Try this order. (1) XOR with 0 hidden layers: stuck at 51.5%, because it can only draw a line. (2) The default, 1 hidden layer of 4 tanh neurons: 100% by about epoch 22. (3) Activation “linear” with 2 hidden layers of 8: back to 51.5% and a straight line. (4) The spiral: 4 neurons stall near 70%; 2 layers × 8 neurons gets there, after a long plateau. (The playground uses the Adam optimiser on the full batch so you don't wait for minutes — chapter 5 explains Adam.)",
        },
        { type: "heading", level: 3, content: "Step 4 · Many bends make any shape" },
        {
          type: "prose",
          html: "Each ReLU neuron contributes one “hinge” — a crease where the output switches from flat to sloped. Add enough hinges and you can approximate <i>any</i> smooth boundary, the way enough short straight segments can trace any curve. This is the <b>universal approximation theorem</b>: one hidden layer with enough neurons can approximate any continuous function. Deeper networks do it with far fewer neurons, because later layers reuse and combine the features of earlier ones (a loop detector built from curve detectors built from edge detectors).",
        },
        {
          type: "memoryHook",
          content: "Neuron = mini logistic regression. Layer = a committee of them. Network = committees reporting to committees.",
          detail:
            "The first layer finds simple patterns in the raw input, the next combines them into bigger patterns, and the output layer votes on the answer. Nobody labels the patterns — training discovers them.",
        },
        { type: "heading", level: 3, content: "Every classifier in the course, side by side" },
        {
          type: "table",
          headers: ["", "Logistic / linear SVM", "Kernel SVM (RBF)", "Decision tree / forest", "Neural network"],
          rows: [
            ["Boundary shape", "one straight line (hyperplane)", "curved, from similarity bubbles", "axis-aligned boxes; forest = smoothed boxes", "any shape, learnt"],
            ["Who makes the features?", "you", "you choose the kernel (fixed formula)", "you (it picks among your columns)", "<b>it learns them</b>"],
            ["Training cost as rows grow", "linear, very cheap", "≈ n² to n³ — impractical past ~10⁵ rows", "n log n, cheap", "linear per epoch, mini-batches on GPU"],
            ["Small tabular data (≤ 10k rows)", "great baseline", "very good", "<b>usually best</b>", "often overkill, overfits"],
            ["Images, audio, text", "poor on raw input", "OK on small sets", "poor on raw input", "<b>best by far</b>"],
            ["Needs feature scaling?", "yes", "yes (distances)", "no", "yes"],
            ["Interpretability", "high (read the weights)", "low", "tree: very high; forest: medium", "low"],
            ["Data needed", "little", "little–medium", "little–medium", "a lot"],
          ],
          caption:
            "On MNIST specifically, an RBF-SVM is very competitive; neural networks win because they scale to millions of images and learn features (convolutions) that transfer to new tasks.",
        },
        {
          type: "prose",
          html: "So the honest rule of thumb: <b>tabular data, a few thousand rows → start with logistic regression and a random forest. Raw perceptual data (pixels, waveforms, words) or millions of rows → neural network.</b> Choosing a network for 500 rows of tabular data is a common mistake in assignments.",
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "When not to reach for a network",
      blocks: [
        {
          type: "list",
          items: [
            "<b>Small data.</b> 100k+ parameters fitted to 1,000 rows will memorise them. Trees and regularised linear models need far less data.",
            "<b>You need to explain each decision</b> (credit, medical, legal). A shallow tree or logistic regression gives reasons; a network gives a number.",
            "<b>Unscaled inputs.</b> Like the SVM, gradient descent behaves badly when one feature is in the thousands and another in fractions. The notebook's <code>ToTensor()</code> already scales pixels to [0, 1].",
            "<b>A strong baseline hasn't been tried.</b> Always fit logistic regression first. On MNIST it reaches roughly the low 90s in percent; a network that can't beat it is under-trained or mis-built.",
          ],
        },
        {
          type: "trap",
          html: "<b>“More layers = better.”</b> The notebook's own grid search disproves it: with 4 neurons per layer, 2 layers scored <b>80.2%</b>, 3 layers <b>69.4%</b> and 4 layers only <b>54.5%</b> after 10 epochs. Narrow, deep stacks squeeze 784 pixels through a 4-number pipe again and again and are harder to train with plain gradient descent.",
        },
        {
          type: "citation",
          source: "ISLP Ch 10.1–10.2",
          detail:
            "ISLP introduces single-layer and multilayer networks with the same ‘hidden units are learnt features’ framing, and section 10.6 discusses when deep learning is worth it compared with simpler models.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real notebook",
      blocks: [
        {
          type: "result",
          headers: ["Model (MNIST, 10 epochs, plain SGD, lr 0.01)", "Test accuracy"],
          rows: [
            ["2 layers × 4 neurons", "80.2%"],
            ["2 layers × 8 neurons", "89.5%"],
            ["2 layers × 12 neurons", "<b>89.6%</b>"],
            ["3 layers × 12 neurons", "89.2%"],
            ["4 layers × 4 neurons", "54.5%"],
            ["4 layers × 12 neurons", "87.1%"],
            ["784 → 128 → 10 → 10 → 10, 25 epochs", "<b>93.9%</b>"],
          ],
          caption: "From the AdjustableClassifier grid search and the first Classifier in feedforward_nn_and_backprop_demo.ipynb. “Layers” counts nn.Linear layers, so 2 layers = input → one hidden layer → output.",
        },
        {
          type: "prose",
          html: "Read the table as a lesson in <b>width</b>: at every depth, 12 neurons per layer beats 4. The 93.9% model is wider still (128 in its first layer) and trained longer. That 93.9% is only a little above a linear classifier on MNIST, because training here is deliberately simple (a small learning rate and no momentum). The next chapters explain exactly which knobs would push it towards 98%.",
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
            "Verify the hand-built XOR network in NumPy on all four inputs. <b>Success:</b> outputs 0, 1, 1, 0.",
            "Fit <code>LogisticRegression</code>, <code>SVC(kernel='rbf')</code>, <code>RandomForestClassifier</code> and <code>MLPClassifier</code> with one hidden layer of 16 on <code>make_moons(noise=0.25)</code>. <b>Success:</b> a table of test accuracies in which logistic regression is clearly last, and you can explain why.",
            "In the playground, find the smallest network that solves the spiral. <b>Success:</b> train accuracy above 95% and a one-line explanation of why fewer neurons fail.",
            "Remove every <code>nn.ReLU()</code> from the notebook's <code>Classifier</code> and retrain. <b>Success:</b> you predict beforehand that accuracy falls to linear-model level, and it does.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Train an RBF SVM on a 10,000-image subset of MNIST and time it at 2k, 5k and 10k rows. Plot fit time against n and compare with one epoch of the PyTorch network.",
            "Prove algebraically that three stacked linear layers equal one, for any weights.",
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
            "XOR can't be split by one line; one hidden ReLU layer solves it.",
            "Hidden layers re-describe the data so a line works — a learnt kernel trick.",
            "No activation → stacked layers collapse into one linear layer.",
            "Each ReLU neuron adds a hinge; enough hinges approximate any boundary.",
            "Tabular and small → trees / linear. Pixels, audio, text, millions of rows → neural network.",
            "Wider beat deeper in the notebook's grid: 4 layers × 4 neurons fell to 54.5%.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Why can't logistic regression solve XOR?",
              a: "It draws a single straight line, and XOR's positive points sit on one diagonal of a square with the negatives on the other. No line separates them.",
            },
            {
              q: "What happens if you remove all activation functions from a deep network?",
              a: "Every layer is linear, and a composition of linear maps is linear, so the whole network collapses to one linear layer. It can only draw a straight boundary.",
            },
            {
              q: "How is a hidden layer related to the kernel trick?",
              a: "Both map the input into a new space where classes become linearly separable. A kernel fixes that map in advance; a hidden layer learns it from the data by gradient descent.",
            },
            {
              q: "When would you prefer a random forest to a neural network?",
              a: "Small or medium tabular data with meaningful columns, when you want robustness without scaling and some interpretability. Networks pay off on raw perceptual data and very large datasets.",
            },
          ],
        },
      ],
    },
  ],
};
