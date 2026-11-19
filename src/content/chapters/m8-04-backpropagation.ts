import type { Chapter } from "@/types/content";

export const backpropagation: Chapter = {
  slug: "backpropagation",
  title: "Backpropagation, worked by hand",
  description:
    "The computational graph, the forward pass, the chain rule run backwards node by node with real numbers, the update, and why the loss falls from 0.550 to 0.187 in one step.",
  icon: "⇇",
  order: 4,
  moduleId: "m8",
  estimatedMinutes: 35,
  prerequisites: ["calculus-for-ml", "inside-a-feedforward-network"],
  sourceRefs: [
    "MODULE_2/feedforward_nn_and_backprop_demo.ipynb § autograd, training loop",
    "Deeper dive: 2-2-1 worked example written for this portal",
  ],
  islpChapters: ["Ch 10.7"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "The blame-assignment problem",
      blocks: [
        {
          type: "bigIdea",
          content:
            "Backpropagation answers: for this mistake, how much is each weight to blame? It does it by walking backwards from the loss and multiplying local slopes — the chain rule, applied in a smart order.",
        },
        {
          type: "prose",
          html: "After the forward pass the network has made a prediction and the loss says how bad it was. Gradient descent now needs ∂L/∂w for <i>every</i> weight. Doing it the slow way — nudge each of 101,970 weights one at a time and re-run the network — costs 101,970 forward passes per training step.<br><br>Backpropagation computes <b>all</b> of them in roughly the cost of <b>one</b> extra pass, by reusing intermediate results. That single trick is what made training deep networks practical.",
        },
        {
          type: "world",
          html: "A factory ships a defective product. The quality inspector at the end measures how bad it is (the loss). They go back to the last station: “how much did your step change the defect?” That station passes the question to the stations that fed it, scaled by its own effect, and so on back to the start. Every station learns its share of the blame in a single backwards walk.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works, with every number",
      blocks: [
        { type: "heading", level: 3, content: "The network" },
        {
          type: "prose",
          html: "Two inputs, two hidden ReLU neurons, one sigmoid output, binary cross-entropy loss. Small enough to do by hand, and structurally identical to the MNIST model.",
        },
        {
          type: "formula",
          title: "Set-up",
          lines: `inputs        x₁ = 2     x₂ = 1        target y = 1
hidden 1      z₁ = w₁₁x₁ + w₁₂x₂ + b₁    w₁₁ = 0.5   w₁₂ = −0.3   b₁ = 0.1     h₁ = ReLU(z₁)
hidden 2      z₂ = w₂₁x₁ + w₂₂x₂ + b₂    w₂₁ = −0.4  w₂₂ = 0.9    b₂ = 0.2     h₂ = ReLU(z₂)
output        z  = v₁h₁ + v₂h₂ + c       v₁ = 0.7    v₂ = −0.5    c = −0.1     ŷ = σ(z)
loss          L  = −[ y·ln ŷ + (1 − y)·ln(1 − ŷ) ]          learning rate η = 0.5`,
        },
        { type: "heading", level: 3, content: "Step 1 · Forward pass (left → right)" },
        {
          type: "formula",
          title: "Compute and remember every intermediate value",
          lines: `z₁ = 0.5·2 + (−0.3)·1 + 0.1 = 0.8        h₁ = ReLU(0.8) = 0.8
z₂ = −0.4·2 + 0.9·1 + 0.2 = 0.3        h₂ = ReLU(0.3) = 0.3
z  = 0.7·0.8 + (−0.5)·0.3 − 0.1 = 0.31
ŷ  = σ(0.31) = 1 / (1 + e^−0.31) = 0.5769
L  = −ln(0.5769) = 0.5501`,
        },
        {
          type: "prose",
          html: "The network says 57.7% for a sample whose true label is 1. Not terrible, not good. We now want ∂L/∂(every parameter) — nine numbers.",
        },
        { type: "heading", level: 3, content: "Step 2 · Backward pass (right → left)" },
        {
          type: "prose",
          html: "Rule for every node: <b>gradient arriving from the right × the node's own local slope</b>. Start at the loss, where ∂L/∂L = 1.",
        },
        {
          type: "formula",
          title: "Output layer",
          lines: `∂L/∂z  = ŷ − y = 0.5769 − 1 = −0.4231        (sigmoid + cross-entropy simplify to this)

z = v₁h₁ + v₂h₂ + c, so the local slopes are ∂z/∂v₁ = h₁, ∂z/∂v₂ = h₂, ∂z/∂c = 1
∂L/∂v₁ = ∂L/∂z · h₁ = −0.4231 × 0.8 = −0.3385
∂L/∂v₂ = ∂L/∂z · h₂ = −0.4231 × 0.3 = −0.1269
∂L/∂c  = ∂L/∂z · 1  = −0.4231`,
        },
        {
          type: "prose",
          html: "Why ∂L/∂z = ŷ − y: L = −ln ŷ (because y = 1), so ∂L/∂ŷ = −1/ŷ; the sigmoid's slope is ŷ(1 − ŷ); multiply them: −(1 − ŷ) = ŷ − 1 = ŷ − y. The same tidy result as logistic regression in the calculus chapter.",
        },
        {
          type: "formula",
          title: "Pass the blame into the hidden layer",
          lines: `∂z/∂h₁ = v₁, ∂z/∂h₂ = v₂
∂L/∂h₁ = ∂L/∂z · v₁ = −0.4231 × 0.7    = −0.2962
∂L/∂h₂ = ∂L/∂z · v₂ = −0.4231 × (−0.5) = +0.2116

through ReLU: slope is 1 where z > 0, else 0   (both z₁ = 0.8 and z₂ = 0.3 are > 0)
∂L/∂z₁ = −0.2962 × 1 = −0.2962
∂L/∂z₂ = +0.2116 × 1 = +0.2116`,
        },
        {
          type: "formula",
          title: "First-layer weights",
          lines: `z₁ = w₁₁x₁ + w₁₂x₂ + b₁ → local slopes x₁, x₂, 1
∂L/∂w₁₁ = −0.2962 × 2 = −0.5924     ∂L/∂w₁₂ = −0.2962 × 1 = −0.2962     ∂L/∂b₁ = −0.2962
∂L/∂w₂₁ = +0.2116 × 2 = +0.4231     ∂L/∂w₂₂ = +0.2116 × 1 = +0.2116     ∂L/∂b₂ = +0.2116`,
        },
        {
          type: "prose",
          html: "Read the signs as blame. ∂L/∂v₁ is negative: increasing v₁ would <i>lower</i> the loss, so the update will raise v₁. Neuron 2's path goes through v₂ = −0.5, which is pushing the prediction down, so its incoming weights get positive gradients and will be <i>lowered</i> — the network learns to quieten a neuron that is hurting this prediction.",
        },
        { type: "heading", level: 3, content: "Step 3 · Update every parameter" },
        {
          type: "formula",
          title: "p ← p − η · ∂L/∂p with η = 0.5",
          lines: `w₁₁  0.5   → 0.7962     w₁₂ −0.3 → −0.1519     b₁  0.1 → 0.2481
w₂₁ −0.4   → −0.6116    w₂₂  0.9 →  0.7942     b₂  0.2 → 0.0942
v₁   0.7   → 0.8692     v₂  −0.5 → −0.4365     c  −0.1 → 0.1116

re-run the forward pass:  ŷ = 0.8291,  L = 0.1874     (was 0.5769 and 0.5501)`,
        },
        {
          type: "widget",
          lab: "backprop",
          caption:
            "Every number above, animated. Step forward, then backward, and read each chain-rule product in the formula panel. The numerical check shows a partial derivative is literally ‘nudge one weight, measure the loss change’.",
        },
        {
          type: "prose",
          html: "Keep pressing through a second cycle and watch something important happen. After the first update, neuron 2's new weights give z₂ = −0.3347 &lt; 0, so its ReLU outputs 0 and its slope is 0. In cycle 2, ∂L/∂w₂₁, ∂L/∂w₂₂ and ∂L/∂b₂ are all exactly <b>0</b> — and the numerical check agrees. ReLU decides who gets blamed: a neuron that stayed silent for this example is not responsible for its error. (Setting x₁ = 3 shows the same thing in cycle 1.) Across cycles the loss goes 0.550 → 0.187 → 0.090 → 0.054 → 0.037.",
        },
        {
          type: "memoryHook",
          content: "Forward: compute and remember. Backward: arriving gradient × local slope. Update: subtract η × gradient.",
          detail:
            "Each node only needs its own small derivative (x for a weight, v for a hidden value, 1-or-0 for ReLU). The chain rule glues them together.",
        },
        { type: "heading", level: 3, content: "The same thing, for whole layers" },
        {
          type: "prose",
          html: "With layers of hundreds of neurons, the same three steps become matrix operations. If δ is the vector of ∂L/∂z for a layer, then the weight gradient is an outer product and the gradient passed back is a multiply by the transposed weights:",
        },
        {
          type: "formula",
          title: "Backprop for one Linear + ReLU layer",
          lines: `forward:    z = W·x + b        h = ReLU(z)
backward:   δ   = ∂L/∂h ⊙ ReLU′(z)        (⊙ = element-wise; ReLU′ is 1 or 0)
            ∂L/∂W = δ · xᵀ                (outer product: same shape as W)
            ∂L/∂b = δ
            ∂L/∂x = Wᵀ · δ                (passed back to the previous layer)`,
        },
        {
          type: "prose",
          html: "That is all <code>loss.backward()</code> does in the notebook: PyTorch recorded every operation during the forward pass (the <b>computational graph</b>), and backward walks it in reverse applying exactly these rules, filling each parameter's <code>.grad</code>.",
        },
        {
          type: "deepDive",
          summary: "Vanishing and exploding gradients — why depth is hard",
          blocks: [
            {
              type: "prose",
              html: "The gradient reaching an early layer is a <b>product</b> of many local slopes. Sigmoid's slope is at most 0.25, so ten sigmoid layers multiply the gradient by at most 0.25¹⁰ ≈ 0.000001 — the early layers barely learn (<b>vanishing gradients</b>). ReLU's slope is exactly 1 where active, which is why it replaced sigmoid in hidden layers. The opposite — slopes or weights larger than 1 multiplied many times — causes <b>exploding gradients</b> and a NaN loss. Careful initialisation, normalisation layers and residual connections are the standard fixes.",
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
          type: "trap",
          html: "<b>Not zeroing gradients.</b> PyTorch <i>accumulates</i> into <code>.grad</code>. The notebook calls <code>p.grad.zero_()</code> after every update; with an optimiser it is <code>optimizer.zero_grad()</code>. Forget it and step 100 uses the sum of 100 batches' gradients.",
        },
        {
          type: "list",
          items: [
            "<b>Updating with gradient tracking on.</b> The update itself must not be recorded in the graph, hence the notebook's <code>with torch.no_grad():</code> around <code>p -= learning_rate * p.grad</code>.",
            "<b>Dead ReLUs.</b> If a neuron's z is negative for every input, its slope is always 0, it gets no gradient and never recovers. Large learning rates cause this.",
            "<b>Calling backward twice</b> on the same graph raises an error, because PyTorch frees the stored intermediates after the first backward.",
            "<b>Gradient check.</b> When writing backprop yourself, always compare with (L(w + ε) − L(w − ε)) / 2ε on a few weights.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 10.7.1",
          detail:
            "ISLP's “Backpropagation” subsection derives the hidden-layer gradient with the chain rule exactly as above and notes that it ‘assigns a fraction of the residual to each parameter’.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "Check it in PyTorch",
      blocks: [
        {
          type: "code",
          code: {
            language: "python",
            title: "the 2-2-1 example, verified by autograd",
            code: `import torch
x = torch.tensor([2.0, 1.0]); y = torch.tensor(1.0)
W1 = torch.tensor([[0.5, -0.3], [-0.4, 0.9]], requires_grad=True)
b1 = torch.tensor([0.1, 0.2], requires_grad=True)
v  = torch.tensor([0.7, -0.5], requires_grad=True)
c  = torch.tensor(-0.1, requires_grad=True)

h = torch.relu(W1 @ x + b1)            # [0.8, 0.3]
y_hat = torch.sigmoid(v @ h + c)       # 0.5769
L = torch.nn.functional.binary_cross_entropy(y_hat, y)
L.backward()
print(L.item())       # 0.5501
print(W1.grad)        # [[-0.5924, -0.2962], [ 0.4231,  0.2116]]
print(v.grad, c.grad) # [-0.3385, -0.1269]  -0.4231`,
            caption: "Every gradient matches the hand calculation to four decimals.",
          },
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "what the notebook's training loop does with them",
            code: `predictions = model(images)            # forward: builds the graph
loss = criterion(predictions, labels)  # cross-entropy
loss.backward()                        # backward: fills p.grad for all 101,970 params
with torch.no_grad():
    for p in model.parameters():
        p -= learning_rate * p.grad    # update
        p.grad.zero_()                 # reset for the next batch`,
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
            "Redo the hand calculation with target y = 0. <b>Success:</b> ∂L/∂z = +0.5769 and every gradient flips sign relative to the table above; confirm with the lab's target switch.",
            "Write a NumPy 2-H-1 network with forward, backward and update functions, and train it on XOR. <b>Success:</b> all four outputs on the correct side of 0.5 and a gradient check that agrees to 1e-6.",
            "Extend it to 784 → 64 → 10 with softmax + cross-entropy on MNIST (no PyTorch). <b>Success:</b> over 90% test accuracy after a few epochs.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Build a 30-line autograd engine (a Value class with + , ×, ReLU and backward()) and train the XOR network with it.",
            "Make z₂ negative (e.g. w₂₂ = 0.2) and show that w₂₁, w₂₂ and b₂ get zero gradient — a dead ReLU for this sample.",
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
            "Forward pass: compute and store every z and h.",
            "Backward pass: start at the loss; gradient arriving × local slope at each node.",
            "Sigmoid + cross-entropy gives ∂L/∂z = ŷ − y.",
            "Weight gradient = (∂L/∂z of its neuron) × (its input). ReLU passes gradient only where z > 0.",
            "Update: p ← p − η·∂L/∂p. One step took the example from L = 0.550 to 0.187.",
            "loss.backward() = this, for every parameter; zero the gradients every step.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "Why is backprop efficient?",
              a: "It reuses the forward-pass values and passes one gradient per node backwards, so all parameter gradients cost about one extra pass, instead of one forward pass per parameter.",
            },
            {
              q: "What is ∂L/∂w for a weight feeding a neuron?",
              a: "The neuron's ∂L/∂z times the input travelling along that weight. In the example ∂L/∂w₁₁ = −0.2962 × 2 = −0.5924.",
            },
            {
              q: "What does ReLU do in the backward pass?",
              a: "Its slope is 1 where its input was positive and 0 otherwise, so it passes the gradient through unchanged for active neurons and blocks it for inactive ones.",
            },
            {
              q: "Why does the notebook call p.grad.zero_() every iteration?",
              a: "PyTorch accumulates gradients across backward calls. Without zeroing, each update would use the sum of all previous batches' gradients.",
            },
          ],
        },
      ],
    },
  ],
};
