import type { Chapter } from "@/types/content";

export const pytorchMnistWalkthrough: Chapter = {
  slug: "pytorch-mnist-walkthrough",
  title: "The PyTorch MNIST notebook, cell by cell — and how to master it",
  description:
    "Tensors, autograd, DataLoaders, nn.Module, the training loop, the confusion matrix and the depth-vs-width grid, with the quirks worth spotting and a roadmap from novice to expert.",
  icon: "▣",
  order: 6,
  moduleId: "m8",
  estimatedMinutes: 35,
  prerequisites: ["training-and-optimizers"],
  sourceRefs: ["MODULE_2/feedforward_nn_and_backprop_demo.ipynb (all cells)"],
  islpChapters: ["Ch 10.9"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why read the notebook line by line",
      blocks: [
        {
          type: "bigIdea",
          content:
            "Every deep-learning project — from MNIST to a large language model — is the same five pieces: tensors, data loading, a model, a loss, and the train/eval loop. This notebook contains all five in their simplest form.",
        },
        {
          type: "prose",
          html: "The previous five chapters explained the ideas. This one maps each idea to the exact cell that implements it, so that when you open any PyTorch code you recognise the skeleton instantly. It ends with a practice plan for turning the understanding into lasting skill.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "The notebook, section by section",
      blocks: [
        { type: "heading", level: 3, content: "1 · Tensors" },
        {
          type: "prose",
          html: "A <b>tensor</b> is a NumPy array that can live on a GPU and remember how it was computed (for gradients). A scalar is a 0-D tensor, a vector 1-D, a matrix 2-D; a batch of images is 4-D: [batch, channels, height, width]. <code>torch.zeros(2, 3, 4)</code> is 2 blocks × 3 rows × 4 columns. <code>torch.from_numpy</code> and <code>.numpy()</code> convert both ways and <b>share memory</b> — change one and the other changes. <code>.to('cuda')</code> moves a tensor to the GPU.",
        },
        {
          type: "table",
          headers: ["Operation", "Notebook example", "Result"],
          rows: [
            ["indexing", "tensor[0, 1] on [[1,2,3],[4,5,6],[7,8,9]]", "2"],
            ["slicing", "tensor[:2, 1:]", "[[2,3],[5,6]]"],
            ["reshape", "tensor.view(1, 9)", "[[1,…,9]] — same data, new shape"],
            ["transpose", "tensor.t() or permute(1, 0)", "rows ↔ columns"],
            ["element-wise", "[1,2,3] * [4,5,6]", "[4, 10, 18]"],
          ],
        },
        { type: "heading", level: 3, content: "2 · Autograd" },
        {
          type: "prose",
          html: "<code>requires_grad=True</code> tells PyTorch to record every operation on that tensor. <code>z.backward()</code> runs the chain rule backwards and stores ∂z/∂x in <code>x.grad</code>: the notebook's 15.0, 3.0 and 8.0 (worked by hand in the calculus chapter). <code>.zero_()</code> clears gradients; <code>.detach()</code> gives a copy that is no longer tracked.",
        },
        { type: "heading", level: 3, content: "3 · Data: Dataset, transform, DataLoader" },
        {
          type: "list",
          items: [
            "<code>transforms.ToTensor()</code> turns each 28 × 28 image of 0–255 integers into a [1, 28, 28] float tensor in [0, 1] — the feature scaling step.",
            "<code>random_split</code> divides the 60,000 training images into 48,000 train and 12,000 validation. The separate 10,000-image test set comes from <code>train=False</code>.",
            "<code>DataLoader</code> with <code>batch_size=128</code> and <code>shuffle=True</code> serves shuffled mini-batches of 128. The test loader uses <code>batch_size=1</code> — correct but slow.",
          ],
        },
        { type: "heading", level: 3, content: "4 · The model: nn.Module" },
        {
          type: "prose",
          html: "A model is a class that inherits from <code>nn.Module</code>. <code>__init__</code> <b>declares</b> the layers (and therefore the parameters). <code>forward</code> <b>defines the flow</b> of data through them. Calling <code>model(images)</code> runs <code>forward</code>. <code>nn.Sequential</code> chains layers without writing a forward; <code>nn.ModuleList</code> holds a variable number of layers, which the <code>AdjustableClassifier</code> uses to build 2, 3 or 4 layers from one class.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the minimal pattern",
            code: `class Classifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.d1 = nn.Linear(28 * 28, 128)   # declares weight [128, 784] + bias [128]
        self.d2 = nn.Linear(128, 10)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = x.flatten(start_dim=1)           # [B, 1, 28, 28] → [B, 784]
        x = self.relu(self.d1(x))
        return self.d2(x)                    # raw logits, no softmax`,
            caption: "The notebook's version adds a 10→10→10 Sequential tail to demonstrate nn.Sequential.",
          },
        },
        { type: "heading", level: 3, content: "5 · Loss, loop and evaluation" },
        {
          type: "prose",
          html: "<code>nn.CrossEntropyLoss()</code> = log-softmax + negative log-likelihood (chapter 3). The loop is forward → loss → <code>backward()</code> → manual update in <code>torch.no_grad()</code> → zero the gradients (chapters 4 and 5). Evaluation uses <code>model.eval()</code> and <code>torch.no_grad()</code>, takes the <code>argmax</code> of the logits as the predicted digit, and scores it with sklearn.",
        },
        { type: "heading", level: 3, content: "6 · Reading the confusion matrix" },
        {
          type: "prose",
          html: "Rows are the true digit, columns the predicted digit, the diagonal is correct. The off-diagonal cells show <i>which</i> mistakes the model makes, and they are the ones a human would make too:",
        },
        {
          type: "table",
          headers: ["True → predicted", "Count", "Why it is plausible"],
          rows: [
            ["4 → 9", "<b>38</b>", "an open-top 4 is a 9 with a gap"],
            ["5 → 3", "29", "same lower curve"],
            ["3 → 2", "28", "shared top arc"],
            ["9 → 4", "28", "the reverse of the biggest error"],
            ["7 → 9", "22", "a crossed 7 or a closed top"],
            ["1 → 1", "<b>1,117 of 1,135</b>", "the easiest class: one stroke"],
          ],
          caption: "From the test-set confusion matrix in the notebook (10,000 images).",
        },
        {
          type: "prose",
          html: "One more subtle fact: the notebook's accuracy, weighted precision and weighted recall are all 0.9386. That isn't a coincidence — <b>weighted recall always equals accuracy</b>, because weighting each class's recall by its size just counts correct predictions over all predictions.",
        },
        { type: "heading", level: 3, content: "7 · The depth × width experiment" },
        {
          type: "prose",
          html: "The final cells train nine networks (2/3/4 Linear layers × 4/8/12 neurons, 10 epochs each) and draw heatmaps of the metrics. The pattern: <b>width helps at every depth, depth hurts when layers are narrow</b>. 4 layers × 4 neurons is the worst at 54.5%: the data is forced through a 4-number bottleneck three times, and plain SGD with lr 0.01 struggles to train deep narrow stacks in 10 epochs.",
        },
        {
          type: "widget",
          lab: "nnplay",
          caption:
            "Recreate the experiment in miniature on the spiral: 1 hidden layer × 4 neurons stalls near 70%, while 2 hidden layers × 8 neurons reaches 100%. Then try 2 layers × 2 neurons — a narrow pipe again.",
        },
        { type: "heading", level: 3, content: "Quirks worth spotting (good practice for your eye)" },
        {
          type: "list",
          items: [
            "ReLU after the 10-wide d2 layer can zero out whole features before the final layers — fine for a demo of nn.Sequential, not a design to copy.",
            "<code>get_accuracy</code> divides by 128 even for the final 96-image validation batch, so validation accuracy is slightly understated.",
            "The test loop inside <code>train_model</code> runs without <code>torch.no_grad()</code> or <code>model.eval()</code> — results are correct, memory use is higher.",
            "Training uses the manual update <code>p -= lr * p.grad</code>; production code uses <code>torch.optim</code>.",
          ],
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "Debugging habits experts use",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            "<b>Check the starting loss.</b> It should be ≈ ln(#classes) = 2.30 for 10 classes.",
            "<b>Overfit one batch.</b> Train on a single batch of 128 for 200 steps. If it can't reach ~100%, there is a bug in the model or the loop.",
            "<b>Print shapes</b> after every line of forward the first time you write it.",
            "<b>Watch train and val curves together</b> (the notebook logs both to TensorBoard).",
            "<b>Fix the seed</b> (<code>torch.manual_seed(0)</code>) so a change in results comes from your change, not from luck.",
            "<b>Change one thing at a time</b> and write down your prediction first.",
          ],
        },
        {
          type: "trap",
          html: "Calling <code>model(images)</code> on CPU tensors when the model is on <code>cuda</code> (or the other way round) is the most common runtime error in this notebook's style of code. Move both with <code>.to(device)</code>.",
        },
        {
          type: "citation",
          source: "ISLP Ch 10.9 (lab)",
          detail: "ISLP's deep-learning lab builds and trains an MNIST network in PyTorch with the same Dataset → DataLoader → nn.Module → loop structure.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "Final numbers",
      blocks: [
        {
          type: "result",
          headers: ["Metric (test set, 10,000 images)", "Value"],
          rows: [
            ["Accuracy", "<b>0.9386</b>"],
            ["Precision (weighted)", "0.9386"],
            ["Recall (weighted)", "0.9386"],
            ["Correct 1s", "1,117 / 1,135"],
            ["Most-confused pair", "4 → 9 (38 images)"],
          ],
          caption: "feedforward_nn_and_backprop_demo.ipynb, Classifier after 25 epochs.",
        },
      ],
    },
    {
      id: "practice",
      kind: "practice",
      title: "A roadmap from novice to expert",
      blocks: [
        { type: "heading", level: 3, content: "Stage 1 · Understand (this module)" },
        {
          type: "list",
          ordered: true,
          items: [
            "Derive the 2-2-1 backprop example on paper without looking. <b>Success:</b> all nine gradients match the backprop chapter.",
            "Write forward, backward and update for a 784 → 64 → 10 network in NumPy only. <b>Success:</b> above 90% on MNIST test.",
            "Build a tiny autograd engine (a Value class with +, ×, ReLU and backward). <b>Success:</b> its gradients match PyTorch on the 2-2-1 example.",
          ],
        },
        { type: "heading", level: 3, content: "Stage 2 · Experiment (predict first, then run)" },
        {
          type: "list",
          ordered: true,
          items: [
            "lr 0.01 → 0.1 → 0.5. <b>Success:</b> you can name the value where training becomes unstable.",
            "Remove every ReLU. <b>Success:</b> accuracy falls to linear-model level and you can explain why with the collapse argument.",
            "Manual SGD → Momentum → Adam. <b>Success:</b> ≥ 97% test accuracy with Adam in 10 epochs.",
            "Add <code>nn.Dropout(0.2)</code> and train 50 epochs. <b>Success:</b> a plot showing the train–val gap with and without it.",
          ],
        },
        { type: "heading", level: 3, content: "Stage 3 · Extend" },
        {
          type: "list",
          items: [
            "Replace the first Linear layer with two <code>nn.Conv2d</code> layers (the next module). <b>Success:</b> ≥ 98.5% test accuracy.",
            "Train the same code on Fashion-MNIST by changing one line. <b>Success:</b> you explain why its accuracy is lower.",
            "Explain the training loop out loud to someone using only the factory analogy and the 2-2-1 numbers. Where you stumble is what to revisit.",
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
            "Five pieces: tensors, data, model, loss, loop.",
            "Heartbeat: zero_grad → forward → loss → backward → step.",
            "Shapes: [128, 1, 28, 28] → [128, 784] → [128, 10].",
            "Test accuracy 93.86%; biggest confusion 4 → 9 (38).",
            "Weighted recall = accuracy, always.",
            "Width beat depth in the grid; 4 × 4 fell to 54.5%.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "What do __init__ and forward each do in an nn.Module?",
              a: "__init__ declares the layers and therefore the learnable parameters; forward describes how an input flows through them. Calling model(x) runs forward.",
            },
            {
              q: "Why are accuracy and weighted recall identical in the notebook?",
              a: "Weighted recall sums each class's correct predictions weighted by class size, which reduces to total correct over total samples: the definition of accuracy.",
            },
            {
              q: "Which mistake does the model make most often, and why is it reasonable?",
              a: "Predicting 9 for a true 4 (38 test images): an open-topped 4 looks like a 9.",
            },
            {
              q: "Name two sanity checks before a long training run.",
              a: "Starting loss ≈ ln(number of classes), and the ability to overfit a single batch to ~100% accuracy.",
            },
          ],
        },
      ],
    },
  ],
};
