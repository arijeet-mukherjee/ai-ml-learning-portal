import type { Chapter } from "@/types/content";

export const trainingAndOptimizers: Chapter = {
  slug: "training-and-optimizers",
  title: "Training a network: mini-batches, epochs, learning rate, Momentum and Adam",
  description:
    "Batch vs stochastic vs mini-batch gradient descent, what an epoch is (375 steps here), why the notebook's loss sat at 2.30 for three epochs, and how Momentum and Adam fix plain SGD.",
  icon: "⤓",
  order: 5,
  moduleId: "m8",
  estimatedMinutes: 30,
  prerequisites: ["backpropagation", "gradient-descent"],
  sourceRefs: [
    "MODULE_2/feedforward_nn_and_backprop_demo.ipynb § Data Loader, Training and Validating the Model",
  ],
  islpChapters: ["Ch 10.7"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why the training loop deserves its own chapter",
      blocks: [
        {
          type: "bigIdea",
          content:
            "The model decides what can be learnt; the optimiser decides whether it actually gets learnt. The same network can reach 54% or 98% depending only on how you walk downhill.",
        },
        {
          type: "prose",
          html: "Module 4's gradient-descent lab had one weight and a smooth bowl. A real network has 100,000+ weights, a loss surface full of long narrow valleys and flat plateaus, and a training set too big to look at all at once. Three practical questions follow: <b>how much data per step</b> (batch size), <b>how big a step</b> (learning rate), and <b>which direction</b> (plain gradient, or something smarter like Momentum or Adam).",
        },
        {
          type: "world",
          html: "You are hiking down a mountain in fog. Plain gradient descent feels the slope under your feet and steps. Momentum is a ball rolling downhill — it gathers speed along a consistent slope and isn't knocked sideways by every bump. Adam is a hiker with adjustable boots: short careful steps on steep rock, long strides on gentle grass.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        { type: "heading", level: 3, content: "Three ways to compute the gradient" },
        {
          type: "table",
          headers: ["Variant", "Examples per update", "Notebook equivalent", "Trade-off"],
          rows: [
            ["Batch GD", "all 48,000", "1 update per epoch", "exact direction, very slow, needs all data in memory"],
            ["Stochastic GD (SGD)", "1", "48,000 updates per epoch", "fast and cheap but very noisy, zig-zags"],
            ["<b>Mini-batch GD</b>", "<b>128</b>", "<b>375 updates per epoch</b>", "the standard: GPU-friendly, mild useful noise"],
          ],
          caption:
            "The notebook splits MNIST's 60,000 training images 80/20 into 48,000 train and 12,000 validation; 48,000 / 128 = 375.",
        },
        {
          type: "prose",
          html: "The mini-batch gradient is an <b>estimate</b> of the full gradient — the average over 128 random images instead of all 48,000. It points roughly the right way and costs 375× less. The small noise is even helpful: it can shake the weights out of flat spots and sharp, poorly-generalising minima. That is why <code>shuffle=True</code> matters in the training DataLoader — each epoch sees the batches in a new random order.",
        },
        {
          type: "formula",
          title: "Vocabulary",
          lines: `batch (mini-batch)   the 128 examples used for one gradient step
iteration / step     one forward + backward + update on one batch
epoch                one full pass over the training set  (375 steps here)
25 epochs            25 × 375 = 9,375 weight updates in the notebook's first run`,
        },
        { type: "heading", level: 3, content: "The learning rate: the most important knob" },
        {
          type: "table",
          headers: ["Learning rate", "What you see"],
          rows: [
            ["too small", "loss falls painfully slowly or seems stuck"],
            ["about right", "loss falls quickly, then flattens"],
            ["too big", "loss bounces, then explodes to NaN"],
          ],
        },
        {
          type: "prose",
          html: "The notebook shows the too-small case clearly. With lr = 0.01 and plain SGD the loss was <b>2.3009, 2.2447, 2.0212</b> over the first three epochs — still near the random-guess value of 2.30 — before dropping to 1.4069 and then steadily to <b>0.2170</b> by epoch 25. A larger learning rate, or Adam, typically gets past that plateau inside the first epoch.",
        },
        { type: "heading", level: 3, content: "Momentum: remember where you were going" },
        {
          type: "prose",
          html: "On a long narrow valley, the gradient points mostly across the valley (the steep walls), not along it (the gentle floor). Plain GD zig-zags from wall to wall and crawls along the floor. Momentum keeps a running <b>velocity</b> v: an exponentially-weighted sum of past gradients. The cross-valley components alternate in sign and cancel; the along-valley components agree and add up.",
        },
        {
          type: "formula",
          title: "SGD with momentum (β ≈ 0.9)",
          lines: `v ← β·v + ∇L(w)
w ← w − η·v

with β = 0.9, a constant gradient g builds up to a velocity of g / (1 − β) = 10·g`,
        },
        { type: "heading", level: 3, content: "Adam: a separate step size for every weight" },
        {
          type: "prose",
          html: "Adam keeps two running averages per weight: <b>m</b>, the average gradient (like momentum), and <b>s</b>, the average <i>squared</i> gradient (how big this weight's gradients usually are). It then divides by √s. A weight whose gradients are always huge gets its steps shrunk; one with tiny gradients gets its steps enlarged. Every coordinate moves at a sensible speed, so Adam works well with its default learning rate (0.001) on most problems.",
        },
        {
          type: "formula",
          title: "Adam (β₁ = 0.9, β₂ = 0.999, ε = 1e-8)",
          lines: `m ← β₁·m + (1 − β₁)·g              running mean of the gradient
s ← β₂·s + (1 − β₂)·g²             running mean of the squared gradient
m̂ = m / (1 − β₁ᵗ)   ŝ = s / (1 − β₂ᵗ)   bias correction for the first steps
w ← w − η · m̂ / (√ŝ + ε)`,
        },
        {
          type: "widget",
          lab: "optimizers",
          caption:
            "Race all four from the same start. Then switch the batch size to 1 and watch the SGD paths jitter. The plain-GD path's zig-zag is the shape of the problem Momentum and Adam were invented to solve. With the full batch, after 120 steps GD is at a loss of 0.003 while Momentum and Adam are around 0.000001 — about a thousand times lower. Push η to 1.1 and GD diverges while both still converge. With batch 1, noise holds every stochastic optimiser above exact GD: cheaper steps, noisier finish.",
        },
        {
          type: "memoryHook",
          content: "GD steps. Momentum rolls. Adam adapts.",
          detail:
            "Plain SGD: w −= η·g. Momentum: average the direction. Adam: average the direction and divide by each weight's typical gradient size.",
        },
        { type: "heading", level: 3, content: "Train, validation, test: three different jobs" },
        {
          type: "table",
          headers: ["Split", "Notebook size", "Used for", "Mode"],
          rows: [
            ["train", "48,000", "computing gradients and updating weights", "<code>model.train()</code>"],
            ["validation", "12,000", "watching for overfitting, choosing hyperparameters", "<code>model.eval()</code> + <code>torch.no_grad()</code>"],
            ["test", "10,000", "the final exam, touched once at the end", "eval, no grad"],
          ],
        },
        {
          type: "prose",
          html: "Plot train loss and validation loss per epoch. If both fall together, keep training. If train keeps falling while validation turns upward, the network is memorising: stop (<b>early stopping</b>), add regularisation (weight decay, dropout) or get more data. In the notebook they fall together all the way — train 0.2170, validation 0.2241 at epoch 25 — so it is <b>under</b>-trained, not overfitting.",
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
            "<b>Loss is NaN.</b> Learning rate too large (or log of 0). Divide it by 10.",
            "<b>Loss stuck at ln(#classes).</b> Learning rate too small, dead ReLUs, or a bug — e.g. labels shuffled independently of images.",
            "<b>Validation better than training</b> early on is normal when dropout is used; persistent gaps the other way mean overfitting.",
            "<b>Not calling model.eval()</b> for validation. Harmless for this notebook (no dropout or batch-norm) but wrong in general.",
            "<b>Tuning on the test set.</b> Pick epochs and learning rate with validation; report test once.",
          ],
        },
        {
          type: "trap",
          html: "<b>Accuracy averaged per batch with a fixed divisor.</b> The notebook's <code>get_accuracy</code> divides by <code>BATCH_SIZE</code> (128), but 12,000 isn't a multiple of 128: the last validation batch has 96 images, so its accuracy is under-counted. Divide by <code>labels.size(0)</code> instead.",
        },
        {
          type: "citation",
          source: "ISLP Ch 10.7.2",
          detail:
            "ISLP's “Regularization and Stochastic Gradient Descent” subsection covers mini-batches, epochs and the validation curve on MNIST, plus dropout and weight decay as the fixes for overfitting.",
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
          headers: ["Epoch", "Train loss", "Val loss", "Val accuracy"],
          rows: [
            ["1", "2.3009", "2.2831", "16.5%"],
            ["3", "2.0212", "1.7631", "41.2%"],
            ["4", "1.4069", "1.1042", "66.0%"],
            ["5", "0.9214", "0.8055", "73.3%"],
            ["10", "0.4745", "0.4633", "86.4%"],
            ["15", "0.3492", "0.3491", "89.9%"],
            ["20", "0.2744", "0.2796", "91.8%"],
            ["25", "<b>0.2170</b>", "<b>0.2241</b>", "<b>93.4%</b>"],
          ],
          caption: "784 → 128 → 10 → 10 → 10, plain SGD, lr = 0.01, batch 128. Test accuracy afterwards: 93.86%.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the same loop with a real optimiser",
            code: `import torch.optim as optim

model = Classifier().to(device)
optimizer = optim.Adam(model.parameters(), lr=1e-3)     # or optim.SGD(..., lr=0.1, momentum=0.9)

for epoch in range(10):
    model.train()
    for images, labels in trainloader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()                    # 1. clear old gradients
        loss = criterion(model(images), labels)  # 2. forward + loss
        loss.backward()                          # 3. backprop
        optimizer.step()                         # 4. update (replaces the manual p -= lr * p.grad)

    model.eval(); correct = total = 0
    with torch.no_grad():
        for images, labels in valloader:
            preds = model(images.to(device)).argmax(1)
            correct += (preds == labels.to(device)).sum().item()
            total += labels.size(0)              # correct divisor for the last batch
    print(epoch + 1, round(100 * correct / total, 2))`,
            caption:
              "Four lines inside the batch loop — zero_grad, forward, backward, step — are the heartbeat of every network ever trained.",
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
            "Rerun the notebook's model with lr = 0.1 instead of 0.01, everything else equal. <b>Success:</b> you predict beforehand that the 2.30 plateau shortens, then confirm it in the epoch log.",
            "Swap the manual update for <code>optim.SGD(momentum=0.9)</code> and then <code>optim.Adam(lr=1e-3)</code>, 10 epochs each. <b>Success:</b> a three-row table of validation accuracy after epochs 1 and 10.",
            "Fix <code>get_accuracy</code> to divide by the true batch size. <b>Success:</b> validation accuracy rises slightly and matches sklearn's accuracy on the same predictions.",
            "Train for 100 epochs and plot train vs validation loss. <b>Success:</b> you can point to the epoch (if any) where validation stops improving.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Implement Momentum and Adam yourself in NumPy on f(x, y) = 0.5x² + 4y² and reproduce the lab's paths.",
            "Add a learning-rate schedule (<code>optim.lr_scheduler.StepLR</code>) and compare.",
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
            "Mini-batch GD: average the gradient over 128 examples; 375 steps per epoch here.",
            "Learning rate: too small crawls (the notebook's 2.30 plateau), too big explodes.",
            "Momentum: v ← βv + g, w ← w − ηv — cancels zig-zag, builds speed.",
            "Adam: per-weight step = mean gradient / √(mean squared gradient).",
            "Train to learn, validation to decide, test once to report.",
            "Train and val losses falling together = keep going; diverging = overfitting.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "How many weight updates happen per epoch in the notebook?",
              a: "48,000 training images / batch size 128 = 375 mini-batch updates.",
            },
            {
              q: "Why did the loss stay near 2.30 for the first few epochs?",
              a: "2.30 = −ln(0.1) is random guessing over 10 classes. With plain SGD and a small learning rate of 0.01, the first epochs move the weights too little to escape the starting plateau.",
            },
            {
              q: "What problem does momentum solve?",
              a: "Zig-zagging in long narrow valleys: gradient components across the valley alternate and cancel in the running average, while those along it accumulate, so progress along the floor speeds up.",
            },
            {
              q: "Is the notebook's model overfitting after 25 epochs?",
              a: "No. Train loss 0.2170 and validation loss 0.2241 are still falling together; it is under-trained.",
            },
          ],
        },
      ],
    },
  ],
};
