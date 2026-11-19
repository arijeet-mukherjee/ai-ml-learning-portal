import type { Chapter } from "@/types/content";

export const feedforwardNetwork: Chapter = {
  slug: "inside-a-feedforward-network",
  title: "Inside a feedforward network: layers, shapes, softmax, cross-entropy",
  description:
    "A layer as one matrix multiply, tracing a batch of 128 MNIST images through every shape, counting all 101,970 parameters, and why the starting loss is exactly 2.30.",
  icon: "⇶",
  order: 3,
  moduleId: "m8",
  estimatedMinutes: 30,
  prerequisites: ["why-neural-networks", "dot-product-and-cosine", "logistic-regression"],
  sourceRefs: [
    "MODULE_2/feedforward_nn_and_backprop_demo.ipynb § Tensors, Networks, Loss modules",
  ],
  islpChapters: ["Ch 10.1", "Ch 10.2"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why look inside",
      blocks: [
        {
          type: "bigIdea",
          content:
            "A feedforward network is nothing but: multiply by a matrix, add a vector, bend with ReLU — repeated — then turn the last scores into probabilities and measure surprise.",
        },
        {
          type: "prose",
          html: "Most bugs in deep-learning code are not maths bugs; they are <b>shape</b> bugs — a tensor that is [128, 1, 28, 28] where a layer expected [128, 784]. If you can trace the shape of the data through every line of the model, you can read any network's code and debug it. This chapter does that trace for the notebook's MNIST model, number by number.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How the forward pass works",
      blocks: [
        { type: "heading", level: 3, content: "One neuron, again" },
        {
          type: "prose",
          html: "From Module 4: a neuron takes inputs x₁…xₙ, multiplies each by a weight, adds a bias and applies an activation: <code>h = ReLU(w₁x₁ + … + wₙxₙ + b)</code>, which is the same as <code>ReLU(w · x + b)</code>. The w · x part is the dot product from Module 2 — a single number measuring how well the input matches the neuron's preferred pattern w.<br><br>Worked example: x = (0.0, 0.8, 1.0), w = (0.5, −1.0, 2.0), b = −0.5. Then w·x + b = 0 − 0.8 + 2.0 − 0.5 = 0.7, and ReLU(0.7) = <b>0.7</b>. If the bias were −1.5 the sum would be −0.3 and ReLU would output <b>0</b>: the neuron stays silent.",
        },
        { type: "heading", level: 3, content: "A layer = many neurons = one matrix multiply" },
        {
          type: "prose",
          html: "A layer with 128 neurons has 128 weight vectors. Stack them as the 128 rows of a matrix W (shape 128 × 784) and the whole layer is one line: <code>h = ReLU(W x + b)</code>. Row i of W dotted with x gives neuron i's score. That is exactly what <code>nn.Linear(784, 128)</code> stores: <code>weight</code> of shape [128, 784] and <code>bias</code> of shape [128] — the notebook printed both.",
        },
        {
          type: "formula",
          title: "A fully-connected (Linear) layer",
          lines: `h = ReLU( W · x + b )
     W : [out_features, in_features]     x : [in_features]     b, h : [out_features]

for a batch of B inputs stacked as rows of X : [B, in]
H = ReLU( X · Wᵀ + b )    →   [B, out]`,
        },
        { type: "heading", level: 3, content: "Tracing a batch through the notebook's model" },
        {
          type: "table",
          headers: ["Line in forward()", "Shape after it", "What happened"],
          rows: [
            ["images from DataLoader", "[128, 1, 28, 28]", "128 images, 1 colour channel, 28 × 28 pixels, values 0–1"],
            ["x.flatten(start_dim=1)", "[128, 784]", "each image unrolled into a row of 784 numbers"],
            ["self.d1 = Linear(784, 128)", "[128, 128]", "128 pattern-detector scores per image"],
            ["ReLU", "[128, 128]", "negative scores set to 0"],
            ["self.d2 = Linear(128, 10, bias=False)", "[128, 10]", "squeezed to 10 numbers"],
            ["ReLU", "[128, 10]", ""],
            ["seq_container: Linear(10,10) → ReLU → Linear(10,10)", "[128, 10]", "two more small layers"],
            ["output (logits)", "<b>[128, 10]</b>", "10 raw scores per image, one per digit"],
          ],
          caption: "The notebook printed exactly these: input [128, 1, 28, 28], output [128, 10].",
        },
        { type: "heading", level: 3, content: "Counting the parameters" },
        {
          type: "formula",
          title: "Parameters of a Linear layer = in × out weights + out biases",
          lines: `d1   Linear(784 → 128)            784 × 128 + 128 = 100,480
d2   Linear(128 → 10, no bias)    128 × 10        =   1,280
seq0 Linear(10 → 10, no bias)     10 × 10         =     100
seq2 Linear(10 → 10)              10 × 10 + 10    =     110
                                                    ───────
                                           total  = 101,970   (98.5% in the first layer)`,
        },
        {
          type: "prose",
          html: "ReLU layers have <b>zero</b> parameters — they are fixed functions. The first layer holds almost everything because it connects to all 784 pixels. This is one reason convolutional networks (next module) exist: they reuse the same small set of weights across the image instead of one weight per pixel per neuron.",
        },
        { type: "heading", level: 3, content: "From 10 scores to 10 probabilities: softmax" },
        {
          type: "prose",
          html: "The final layer outputs raw scores called <b>logits</b> — any real numbers, positive or negative. To read them as probabilities, apply <b>softmax</b>: exponentiate each (making them all positive, and exaggerating the gaps) and divide by the total (making them sum to 1).",
        },
        {
          type: "formula",
          title: "Softmax",
          lines: `pₖ = e^(scoreₖ) / Σⱼ e^(scoreⱼ)

worked example, 3 classes, scores (2.0, 1.0, 0.1):
e² = 7.39   e¹ = 2.72   e⁰·¹ = 1.11     total = 11.21
p  = (0.659, 0.242, 0.099)               sums to 1, biggest score → biggest probability`,
        },
        { type: "heading", level: 3, content: "Cross-entropy: measuring surprise" },
        {
          type: "prose",
          html: "Now we need one number that says how wrong the prediction is. Cross-entropy looks only at the probability the model gave to the <b>correct</b> class and takes −ln of it. Confident and right → tiny loss. Confident and wrong → huge loss. It is the multi-class version of the log-loss you met with logistic regression.",
        },
        {
          type: "table",
          headers: ["Probability on the correct digit", "Loss = −ln p", "Meaning"],
          rows: [
            ["0.99", "0.010", "confident and right"],
            ["0.90", "0.105", "right"],
            ["0.50", "0.693", "unsure"],
            ["<b>0.10</b>", "<b>2.303</b>", "<b>a random guess among 10 classes</b>"],
            ["0.01", "4.605", "confident and wrong — heavily punished"],
          ],
        },
        {
          type: "memoryHook",
          content: "Cross-entropy = surprise. −ln(probability you gave the truth).",
          detail:
            "A freshly initialised 10-class network guesses ~uniformly, so its loss starts at −ln(0.1) = 2.30. The notebook's first epoch: Train Loss 2.3009. If your starting loss is far from ln(#classes), something is broken.",
        },
        {
          type: "trap",
          html: "<b>Don't put a softmax at the end of the model when using <code>nn.CrossEntropyLoss</code>.</b> It already applies log-softmax internally (it is more numerically stable that way). A second softmax squashes the scores and slows learning badly. The notebook's model correctly ends with a plain Linear layer.",
        },
        {
          type: "deepDive",
          summary: "Why −ln, and why it combines so neatly with softmax",
          blocks: [
            {
              type: "prose",
              html: "−ln p is the number of nats of “surprise” in information theory (Module 6's entropy used the same idea with log₂). It also equals the negative log-likelihood: maximising the probability of the training labels is the same as minimising the sum of −ln p. And the gradient of softmax + cross-entropy with respect to the logits is simply <code>pₖ − yₖ</code> (prediction minus one-hot truth) — the same ‘error’ form as logistic regression. The next chapter uses that fact.",
            },
          ],
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "What goes wrong",
      blocks: [
        {
          type: "list",
          items: [
            "<b>Forgetting to flatten.</b> <code>nn.Linear(784, …)</code> on a [128, 1, 28, 28] tensor raises a shape error. <code>flatten(start_dim=1)</code> keeps the batch dimension and flattens the rest.",
            "<b>Flattening the batch too.</b> <code>x.flatten()</code> (no start_dim) turns the batch into one vector of 100,352 numbers.",
            "<b>A ReLU right before the logits.</b> Scores can then never be negative, which hampers learning. The notebook applies ReLU after d2, a 10-wide layer, before more layers — legal, but it can silence whole neurons.",
            "<b>Device mismatch.</b> The model is on <code>cuda</code> and the data on <code>cpu</code> → error. The notebook moves both with <code>.to(device)</code>.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 10.2",
          detail:
            "ISLP's MNIST example uses the same flatten → dense → softmax structure and the same cross-entropy loss, with a parameter count worked through just like the table above.",
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
          headers: ["Parameter tensor", "Shape"],
          rows: [
            ["d1.weight", "<b>[128, 784]</b>"],
            ["d1.bias", "[128]"],
            ["d2.weight", "[10, 128]"],
            ["seq_container.0.weight", "[10, 10]"],
            ["seq_container.2.weight", "[10, 10]"],
            ["seq_container.2.bias", "[10]"],
            ["Total (torchsummary)", "<b>101,970</b> trainable"],
          ],
          caption: "Printed by model.named_parameters() and summary(model, (1, 28, 28)).",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "trace the shapes yourself",
            code: `images, labels = next(iter(trainloader))
print(images.shape)                       # torch.Size([128, 1, 28, 28])
x = images.flatten(start_dim=1)
print(x.shape)                            # torch.Size([128, 784])
h = torch.relu(model.d1(x.to(device)))
print(h.shape, (h == 0).float().mean())   # [128, 128], fraction of silent neurons
logits = model(images.to(device))
probs = torch.softmax(logits, dim=1)
print(probs[0].sum())                     # 1.0
print(nn.CrossEntropyLoss()(logits, labels.to(device)))   # ≈ 2.30 before training`,
            caption:
              "Run this before training and confirm the loss is close to 2.30 — the single best sanity check in deep learning.",
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
          type: "list",
          ordered: true,
          items: [
            "Write the forward pass of a 784 → 64 → 10 network in pure NumPy using matrix multiplies. <b>Success:</b> output shape (batch, 10) and probabilities that sum to 1 per row.",
            "Compute softmax and cross-entropy by hand for scores (1, 2, 3) with true class 3. <b>Success:</b> p = (0.090, 0.245, 0.665), loss = 0.408.",
            "Count the parameters of 784 → 256 → 128 → 10 by hand. <b>Success:</b> 235,146, matching <code>p.numel()</code> summed over <code>model.parameters()</code>.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Implement a numerically stable softmax (subtract the max score first) and show the naive version overflows for scores like (1000, 1001).",
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
            "Layer = ReLU(Wx + b); W has shape [out, in].",
            "MNIST batch: [128, 1, 28, 28] → flatten [128, 784] → … → logits [128, 10].",
            "Parameters = in × out + out per Linear layer; 101,970 here, 100,480 in the first layer.",
            "Softmax: exponentiate, then normalise to sum 1.",
            "Cross-entropy = −ln p(correct). Random guessing over 10 classes = 2.30.",
            "CrossEntropyLoss already includes softmax — feed it raw logits.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Why does the notebook's first epoch report a loss of 2.3009?",
              a: "An untrained network spreads probability roughly evenly over 10 digits, about 0.1 on the correct one, and −ln(0.1) = 2.303.",
            },
            {
              q: "Where do the 100,480 parameters of d1 come from?",
              a: "784 inputs × 128 neurons = 100,352 weights, plus 128 biases.",
            },
            {
              q: "What does softmax do to scores (2.0, 1.0, 0.1)?",
              a: "Exponentiates and normalises them into probabilities (0.659, 0.242, 0.099), which sum to 1 and keep the order of the scores.",
            },
            {
              q: "Why not add a softmax layer before nn.CrossEntropyLoss?",
              a: "The loss applies log-softmax itself. A second softmax distorts the scores and harms learning; feed it raw logits.",
            },
          ],
        },
      ],
    },
  ],
};
