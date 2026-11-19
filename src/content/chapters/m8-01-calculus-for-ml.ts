import type { Chapter } from "@/types/content";

export const calculusForMl: Chapter = {
  slug: "calculus-for-ml",
  title: "Calculus for ML: derivatives, partial derivatives, the chain rule",
  description:
    "From zero: what a slope is, why a derivative is a zoomed-in slope, how a partial derivative freezes every other variable, what the gradient points at, and the chain rule that powers backprop.",
  icon: "∂",
  order: 1,
  moduleId: "m8",
  estimatedMinutes: 35,
  prerequisites: ["vectors", "gradient-descent"],
  sourceRefs: [
    "MODULE_2/feedforward_nn_and_backprop_demo.ipynb § Basics of autograd",
    "Deeper dive: worked examples written for this portal",
  ],
  islpChapters: ["Ch 10"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why a learner needs calculus at all",
      blocks: [
        {
          type: "bigIdea",
          content:
            "Training any model is asking one question millions of times: if I nudge this weight a little, does the error go up or down, and how fast? A derivative is the answer to that question.",
        },
        {
          type: "prose",
          html: "Every model you have met so far — linear regression, logistic regression, the SVM, and now neural networks — is a formula with knobs (weights). Training means turning the knobs until the error (the <b>loss</b>) is as small as possible. With two knobs you could try every combination. A neural network for MNIST has <b>101,970</b> knobs. Trying combinations is hopeless.<br><br>Calculus gives a shortcut: at the current setting, it tells you <i>for every knob separately</i> which direction reduces the loss and how sensitive the loss is to that knob. Then you turn all of them a little in the right direction at once. That is gradient descent, and the numbers it needs are derivatives.",
        },
        {
          type: "world",
          html: "Think of driving a car. Your <b>position</b> is a function of time. Your <b>speed</b> is how fast position changes — that is the derivative of position. The speedometer doesn't need to know where you will be in an hour; it tells you the rate of change <i>right now</i>. A derivative is a speedometer for any formula.",
        },
        {
          type: "prose",
          html: "You only need four ideas, and this chapter builds each from scratch with pictures: <b>(1)</b> slope, <b>(2)</b> derivative = slope when zoomed in, <b>(3)</b> partial derivative = slope along one direction while everything else is frozen, <b>(4)</b> the chain rule = how slopes multiply through a chain of functions. Backpropagation is idea 4 applied carefully. Nothing else.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works, from zero",
      blocks: [
        { type: "heading", level: 3, content: "1 · Slope: rise over run" },
        {
          type: "prose",
          html: "For a straight line, slope is how much y goes up when x goes up by 1. Pick two points on the line and divide: <code>slope = Δy / Δx = (y₂ − y₁) / (x₂ − x₁)</code>. The Greek Δ (delta) just means “change in”.<br><br>Example: the line y = 3x + 1 passes through (1, 4) and (3, 10). Slope = (10 − 4) / (3 − 1) = 6 / 2 = <b>3</b>. Every step right by 1, the line climbs by 3. A negative slope means it goes down; zero means flat.",
        },
        { type: "heading", level: 3, content: "2 · Derivative: the slope of a curve, zoomed in" },
        {
          type: "prose",
          html: "A curve like y = x² has no single slope — it is gentle near 0 and steep further out. But zoom in far enough on any smooth curve and the little piece you see looks straight. The slope of that tiny straight piece is the <b>derivative</b> at that point.<br><br>To compute it, take two points very close together — x and x + h — and compute rise over run. Then let h shrink towards zero.",
        },
        {
          type: "formula",
          title: "The definition of a derivative",
          lines: `f′(x) = lim (h → 0)  [ f(x + h) − f(x) ] / h

read it as: "slope between two points that are squeezed together"`,
        },
        {
          type: "prose",
          html: "Worked example for f(x) = x² at x = 3:<br>• h = 1: [f(4) − f(3)] / 1 = (16 − 9) / 1 = <b>7</b><br>• h = 0.1: [f(3.1) − f(3)] / 0.1 = (9.61 − 9) / 0.1 = <b>6.1</b><br>• h = 0.01: (9.0601 − 9) / 0.01 = <b>6.01</b><br>• h = 0.001: <b>6.001</b><br>The answers close in on <b>6</b>. Do the algebra once and you see why: [(x+h)² − x²] / h = (2xh + h²) / h = 2x + h → 2x. At x = 3 that is 6. So the derivative of x² is <b>2x</b>.",
        },
        {
          type: "widget",
          lab: "derivative",
          caption:
            "Do it yourself: the lab opens on x² at x₀ = 1 with h = 1. Press “Animate h → 0”: the orange secant rotates onto the dashed tangent and the slope readout walks 3 → 2.1 → 2.001, closing in on the true derivative 2x = 2. The zoom panel shows the curve straightening out as you zoom; on ReLU at 0 it never does.",
        },
        {
          type: "prose",
          html: "Three facts to take from the picture. <b>Large |f′|</b> = steep, the output is very sensitive to x. <b>f′ = 0</b> = flat — the bottom of a valley or the top of a hill. That is why we look for places where the derivative is zero when we want a minimum. <b>The sign</b> of f′ tells you which way is uphill: positive means increasing x increases f, so to go <i>down</i> you move x the opposite way.",
        },
        { type: "heading", level: 4, content: "The only derivative rules you need for this course" },
        {
          type: "table",
          headers: ["Function f(x)", "Derivative f′(x)", "Where you meet it"],
          rows: [
            ["c (a constant)", "0", "biases don't change with x"],
            ["a·x", "a", "a weight times an input"],
            ["xⁿ", "n·xⁿ⁻¹ (so x² → 2x, x³ → 3x²)", "squared error"],
            ["eˣ", "eˣ", "softmax, sigmoid, RBF kernel"],
            ["ln x", "1 / x", "cross-entropy, log-loss"],
            ["σ(x) = 1 / (1 + e⁻ˣ)", "σ(x)·(1 − σ(x))", "logistic regression, output neurons"],
            ["ReLU(x) = max(0, x)", "1 if x > 0, else 0", "hidden layers in the MNIST notebook"],
            ["tanh x", "1 − tanh² x", "older hidden layers, RNNs"],
            ["f(x) + g(x)", "f′(x) + g′(x)", "a loss summed over samples"],
            ["c·f(x)", "c·f′(x)", "the learning rate scales a gradient"],
          ],
        },
        {
          type: "memoryHook",
          content: "Derivative = sensitivity. “If I wiggle the input by a tiny bit, the output wiggles by f′ times as much.”",
          detail:
            "f(x + h) ≈ f(x) + f′(x)·h for small h. Gradient descent is just this sentence used in reverse: pick h = −η·f′(x) and f is guaranteed to go down (for small enough η).",
        },

        { type: "heading", level: 3, content: "3 · Partial derivatives: one knob at a time" },
        {
          type: "prose",
          html: "Real losses depend on many knobs at once. Start with two: f(x, y). Picture it as a <b>hill</b>: x and y are your position on a map, f is the height of the ground.<br><br>A <b>partial derivative</b> asks: if I walk only east (change x) and keep my north–south position y fixed, how steep is it? That slope is written <b>∂f/∂x</b> (the curly ∂ is read “partial”). Walk only north instead and you get <b>∂f/∂y</b>.<br><br>The recipe is mechanical: <b>treat every other variable as a constant number, then differentiate as usual.</b>",
        },
        {
          type: "formula",
          title: "Worked example: f(x, y) = x²·y + 3y",
          lines: `∂f/∂x : freeze y (treat it like the number 5, say)
        x²·y → 2x·y      3y → 0 (no x in it)
        ∂f/∂x = 2xy

∂f/∂y : freeze x
        x²·y → x²        3y → 3
        ∂f/∂y = x² + 3

at the point (x, y) = (2, 1):
        ∂f/∂x = 2·2·1 = 4        ∂f/∂y = 2² + 3 = 7`,
        },
        {
          type: "prose",
          html: "Read the numbers as sensitivities. At (2, 1), nudging x by 0.01 changes f by about 4 × 0.01 = 0.04; nudging y by 0.01 changes f by about 0.07. So f is almost twice as sensitive to y here. Check it: f(2, 1) = 4 + 3 = 7, and f(2.01, 1) = 4.0401 + 3 = 7.0401 — up by 0.0401 ✓.",
        },
        {
          type: "prose",
          html: "You already saw this in the PyTorch notebook, which computed it for you with <code>z.backward()</code>:",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the notebook's autograd cell, with the hand calculation beside it",
            code: `x = torch.tensor(2.0, requires_grad=True)
y = torch.tensor(3.0, requires_grad=True)
z = x * y + y**2          # 2·3 + 3² = 15
z.backward()

x.grad   # ∂z/∂x : freeze y → derivative of x·y is y      → 3.0
y.grad   # ∂z/∂y : freeze x → x + 2y = 2 + 6              → 8.0`,
            caption:
              "The notebook printed 15.0, 3.0 and 8.0. Every number is a partial derivative you can now do by hand.",
          },
        },
        { type: "heading", level: 3, content: "The gradient: all partial derivatives in one arrow" },
        {
          type: "prose",
          html: "Stack the partial derivatives into a vector and you get the <b>gradient</b>, written ∇f (“nabla f” or “grad f”): <code>∇f = (∂f/∂x, ∂f/∂y)</code>. With 101,970 weights it is a vector with 101,970 entries, one sensitivity per weight.<br><br>The gradient has a beautiful geometric meaning: <b>it points in the direction of steepest uphill</b>, and its length is how steep that is. So <b>−∇f</b> points steepest downhill. It is also always perpendicular to the contour lines of the hill — walking along a contour keeps height constant, so the steepest direction must cut straight across them.",
        },
        {
          type: "widget",
          lab: "partial",
          caption:
            "It opens on the round bowl f = x² + y² at P = (2, 1.5): ∂f/∂x = 2x = 4, ∂f/∂y = 2y = 3, so |∇f| = 5. Click anywhere to move P; the two side plots are slices of the hill and their slopes are exactly ∂f/∂x and ∂f/∂y. Then switch to the long valley and set η above 0.125 to watch the zig-zag, or above 0.25 to watch it blow up.",
        },
        {
          type: "formula",
          title: "Gradient descent, many knobs at once",
          lines: `w ← w − η · ∇L(w)

each weight separately:   wᵢ ← wᵢ − η · ∂L/∂wᵢ
η (eta) = learning rate = how big a step you take`,
        },

        { type: "heading", level: 3, content: "4 · The chain rule: slopes multiply" },
        {
          type: "prose",
          html: "Most formulas in ML are <b>chains</b>: the input goes through one function, its result through another, and so on. A neural network is literally a long chain: input → layer 1 → ReLU → layer 2 → … → loss.<br><br>Say u = g(x) and y = f(u). How sensitive is y to x? Wiggle x a little: u changes by g′(x) times that; then y changes by f′(u) times the change in u. Sensitivities <b>multiply</b>.",
        },
        {
          type: "formula",
          title: "The chain rule",
          lines: `if  y = f(g(x))   then   dy/dx = (dy/du) · (du/dx) = f′(g(x)) · g′(x)

gears: gear A turns 3× faster than gear B, B turns 2× faster than C
       → A turns 3 × 2 = 6× faster than C`,
        },
        {
          type: "prose",
          html: "Worked example: y = (3x + 1)². Inner u = 3x + 1, outer y = u². Then dy/du = 2u and du/dx = 3, so dy/dx = 2u · 3 = 6(3x + 1). At x = 1: u = 4, dy/dx = 6 × 4 = <b>24</b>. Check numerically: y(1.001) = (4.003)² = 16.024009, y(1) = 16, difference / 0.001 = 24.009 ≈ 24 ✓.",
        },
        {
          type: "prose",
          html: "A machine-learning example — the derivative of logistic regression's loss with respect to its weight. One sample, input x, label y = 1, prediction ŷ = σ(wx + b), loss L = −ln ŷ. The chain is w → z = wx + b → ŷ = σ(z) → L = −ln ŷ. Multiply the three local slopes:<br>• dL/dŷ = −1/ŷ<br>• dŷ/dz = ŷ(1 − ŷ)<br>• dz/dw = x<br>Product: (−1/ŷ) · ŷ(1 − ŷ) · x = <b>−(1 − ŷ)·x = (ŷ − y)·x</b>. The messy pieces cancel and leave “error × input”. That tidy result is why sigmoid and cross-entropy are always used together, and it reappears in every neural-network output layer.",
        },
        {
          type: "memoryHook",
          content: "Chain rule = multiply the local slopes along the path.",
          detail:
            "Each box only needs to know its own little derivative. Backpropagation walks the chain from the loss back to each weight and multiplies as it goes.",
        },
        {
          type: "deepDive",
          summary: "When the chain branches: add the paths (multivariable chain rule)",
          blocks: [
            {
              type: "prose",
              html: "If x affects the output through <i>two</i> routes — say u = g(x) and v = h(x), and y = f(u, v) — then you add the contributions of each route: <code>dy/dx = ∂y/∂u · du/dx + ∂y/∂v · dv/dx</code>. In a neural network one input feeds every neuron in the next layer, so its gradient is a <b>sum over all the neurons it feeds</b>. That sum is a matrix multiplication by the transposed weights — which is why backprop is fast on GPUs.",
            },
          ],
        },
      ],
    },
    {
      id: "when",
      kind: "when",
      title: "Where it goes wrong",
      blocks: [
        {
          type: "trap",
          html: "<b>Mixing up the derivative's sign with the update direction.</b> The gradient points <i>uphill</i>. The update subtracts it: w ← w − η·∇L. Writing + instead of − makes the loss grow every step.",
        },
        {
          type: "trap",
          html: "<b>Forgetting to freeze the other variables.</b> For ∂(x²y)/∂x the answer is 2xy, not 2x. The y stays as a multiplier, because it is a constant while you differentiate with respect to x.",
        },
        {
          type: "list",
          items: [
            "<b>Kinks.</b> ReLU has no derivative exactly at 0. Libraries simply define it as 0 there; it never matters in practice.",
            "<b>Flat regions.</b> Where the derivative is ~0 (sigmoid far from the centre, a ReLU whose input is always negative) learning stops. This is the <i>vanishing gradient</i> problem, and it is why modern networks use ReLU in hidden layers instead of sigmoid.",
            "<b>Accumulating gradients.</b> PyTorch <i>adds</i> new gradients to <code>.grad</code>. The notebook calls <code>x.grad.zero_()</code> and <code>p.grad.zero_()</code> for exactly this reason. Skip it and every step uses the sum of all past gradients.",
            "<b>A numerical check catches bugs.</b> (f(w + ε) − f(w − ε)) / 2ε should match your analytic gradient to 4–6 decimal places. If it doesn't, the formula is wrong.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 10.7",
          detail:
            "ISLP section 10.7 (Fitting a neural network) writes gradient descent and backpropagation using exactly this chain-rule argument, and explains why the gradient is cheap to compute.",
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
          headers: ["Quantity", "Hand calculation", "PyTorch output"],
          rows: [
            ["z = x·y + y² at (2, 3)", "6 + 9 = 15", "<b>15.0</b>"],
            ["∂z/∂x", "y = 3", "<b>3.0</b>"],
            ["∂z/∂y", "x + 2y = 8", "<b>8.0</b>"],
            ["requires_grad after .detach()", "no graph is tracked", "<b>False</b>"],
          ],
          caption: "From the autograd cell of feedforward_nn_and_backprop_demo.ipynb.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "check any derivative numerically",
            code: `def numeric_grad(f, x, eps=1e-5):
    return (f(x + eps) - f(x - eps)) / (2 * eps)

import math
print(numeric_grad(lambda x: x**2, 3.0))          # 6.000000
print(numeric_grad(lambda x: (3*x + 1)**2, 1.0))  # 24.000000
sig = lambda z: 1 / (1 + math.exp(-z))
print(numeric_grad(sig, 0.0), sig(0)*(1 - sig(0)))  # 0.25 0.25

# partial derivative of f(x, y) = x²y + 3y at (2, 1)
f = lambda x, y: x**2 * y + 3*y
print(numeric_grad(lambda x: f(x, 1.0), 2.0))   # ∂f/∂x = 4
print(numeric_grad(lambda y: f(2.0, y), 1.0))   # ∂f/∂y = 7`,
            caption:
              "The lambda that freezes y is the partial derivative, written as code: one variable moves, the other is held at its value.",
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
            "Differentiate by hand: 5x³ − 2x + 7, e^(2x), ln(x² + 1), σ(3x). <b>Success:</b> each matches <code>numeric_grad</code> to 5 decimals.",
            "Compute both partial derivatives of f(x, y) = 3x² + 2xy + y² at (1, 2). <b>Success:</b> ∂f/∂x = 10, ∂f/∂y = 6, confirmed with PyTorch autograd.",
            "Write gradient descent from scratch for f(x, y) = (x − 3)² + (y + 1)² starting at (0, 0) with η = 0.1. <b>Success:</b> after 50 steps you are within 0.01 of (3, −1).",
            "Derive dL/dw for logistic regression with the chain rule, then verify (ŷ − y)·x numerically for w = 0.5, b = 0, x = 2, y = 1. <b>Success:</b> both give −0.5379 (because ŷ = σ(1) = 0.7311).",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Prove σ′(x) = σ(x)(1 − σ(x)) yourself using the chain rule on (1 + e⁻ˣ)⁻¹.",
            "Run the partial-derivative lab on the long valley with a large learning rate and explain the zig-zag using the two partial derivatives' sizes.",
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
            "Slope = rise / run. Derivative = slope of a curve, zoomed in until it looks straight.",
            "f′ large = sensitive; f′ = 0 = flat (minimum or maximum); the sign says which way is uphill.",
            "Partial derivative = freeze every other variable, then differentiate normally.",
            "Gradient = vector of all partial derivatives; it points steepest uphill, perpendicular to contours.",
            "Gradient descent: w ← w − η·∇L.",
            "Chain rule: multiply the local slopes along the path; add over branching paths.",
            "σ + cross-entropy gives the tidy gradient (ŷ − y)·x.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "What does a derivative of 6 at x = 3 mean for f(x) = x²?",
              a: "Near x = 3, increasing x by a small amount h increases f by about 6h. It is the slope of the tangent there, the limit of (f(3 + h) − 9)/h, which goes 7, 6.1, 6.01 … as h shrinks.",
            },
            {
              q: "How do you compute ∂f/∂y?",
              a: "Treat every variable except y as a constant and differentiate with respect to y. For f = x²y + 3y that is x² + 3, which is 7 at (2, 1).",
            },
            {
              q: "Why does gradient descent subtract the gradient?",
              a: "The gradient points in the direction of steepest increase. Subtracting it moves you steepest downhill, so for a small enough learning rate the loss goes down.",
            },
            {
              q: "In the notebook's autograd example, why is y.grad 8?",
              a: "z = xy + y². Freezing x, ∂z/∂y = x + 2y = 2 + 6 = 8.",
            },
            {
              q: "State the chain rule and why it matters for neural networks.",
              a: "d f(g(x))/dx = f′(g(x))·g′(x): local slopes multiply along a chain. A network is a chain of layers ending in the loss, so the gradient of the loss for any weight is the product of local slopes from the loss back to that weight. That is backpropagation.",
            },
          ],
        },
      ],
    },
  ],
};
