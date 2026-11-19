
/**
 * The professor's own 42 quiz questions and explanations, verbatim from the
 * notebook's QUIZ array (SOURCE_NOTES.md § 1). `m` is the owning module, `a` the
 * index of the correct option, `w` the explanation shown after answering.
 */
export interface QuizQuestion {
  m: string;
  q: string;
  o: string[];
  a: number;
  w: string;
}

export const QUIZ: QuizQuestion[] = [
  { m: "m0", q: "Matrix m = [[1,2,3],[4,5,6]]. What is np.sum(m, axis=1)?", o: ["[5, 7, 9]", "[6, 15]", "21", "[1, 4]"], a: 1, w: "axis=1 removes the column axis, leaving one sum per row: 1+2+3 = 6 and 4+5+6 = 15." },
  { m: "m0", q: "df.loc[0:4] and df.iloc[0:4] on a default index return how many rows?", o: ["4 and 4", "5 and 4", "4 and 5", "5 and 5"], a: 1, w: "loc includes the end label (0..4 = 5 rows); iloc excludes the end position (0..3 = 4 rows)." },
  { m: "m0", q: "Which fill value is safest for a right-skewed salary column?", o: ["Mean", "Median", "0", "Max"], a: 1, w: "The median isn't dragged by the long tail of high salaries." },
  { m: "m0", q: "With fig, axes = plt.subplots(1,2), how do you title the left plot?", o: ["plt.title('x')", "axes[0].title('x')", "axes[0].set_title('x')", "fig.title('x')"], a: 2, w: "Axes objects use set_ methods: set_title, set_xlabel, set_ylabel." },
  { m: "m1", q: "Data: 2, 3, 3, 4, 100. Which is most affected by the 100?", o: ["Median", "Mode", "Mean", "IQR"], a: 2, w: "The mean is 22.4; median 3, mode 3 and IQR barely notice." },
  { m: "m1", q: "Q1 = 20, Q3 = 40. Which value is an IQR outlier?", o: ["−5", "65", "75", "None of these"], a: 2, w: "IQR = 20, so fences are 20 − 30 = −10 and 40 + 30 = 70. Only 75 lies outside." },
  { m: "m1", q: "For a normal distribution, roughly what share lies beyond 2σ from the mean (both sides)?", o: ["32%", "5%", "0.3%", "16%"], a: 1, w: "95% lies within 2σ, so about 5% lies outside." },
  { m: "m1", q: "A disease affects 1% of people. A test catches 99% of cases and false-alarms 5% of the time. You test positive. P(disease)?", o: ["99%", "95%", "About 17%", "About 1%"], a: 2, w: "Per 10,000: 99 true positives vs 495 false positives → 99/594 ≈ 16.7%. The low base rate dominates." },
  { m: "m1", q: "Exam score rises with confidence but in a curved, always-increasing way. Which correlation captures it fully?", o: ["Pearson", "Spearman", "Neither", "Covariance"], a: 1, w: "Spearman works on ranks, so any monotonic relationship gives ρ near ±1." },
  { m: "m1", q: "P(A|B) = P(A). What does that tell you?", o: ["A causes B", "A and B are independent", "A and B are mutually exclusive", "B is impossible"], a: 1, w: "Knowing B happened doesn't change A's probability: independence." },
  { m: "m2", q: "Cosine similarity of [2,1] and [6,3]?", o: ["0", "0.5", "1", "3"], a: 2, w: "[6,3] = 3 × [2,1], same direction, so cos θ = 1 regardless of length." },
  { m: "m2", q: "a = [6,2], b = [2,5]. L1 distance?", o: ["5", "7", "25", "4"], a: 1, w: "a − b = [4, −3]; L1 = |4| + |−3| = 7 (L2 would be 5)." },
  { m: "m2", q: "A = [[3,1],[1,3]]. Which is an eigenvector?", o: ["[2,1]", "[1,2]", "[1,−1]", "[3,1]"], a: 2, w: "A[1,−1] = [2,−2] = 2 × [1,−1]. The others get turned." },
  { m: "m2", q: "Eigenvalues of a covariance matrix: 9, 6, 3, 2. Minimum components for ≥ 75% variance?", o: ["1", "2", "3", "4"], a: 1, w: "Total 20. PC1 = 45%, PC1+PC2 = 75%. Two components." },
  { m: "m2", q: "Before PCA on [income in ₹, number of logins], you should…", o: ["Do nothing", "Standardise both columns", "Remove income", "Square both columns"], a: 1, w: "Otherwise income's huge variance hijacks PC1 purely because of its units." },
  { m: "m2", q: "In a RAG system, which operation picks the most relevant documents?", o: ["L1 norm of the query", "Cosine similarity between query and document embeddings", "Eigen-decomposition", "Vector addition"], a: 1, w: "Retrieval ranks documents by how closely their embedding direction matches the query's." },
  { m: "m3", q: "A model predicts house prices. Natural loss?", o: ["Cross-entropy", "MSE", "Accuracy", "Gini"], a: 1, w: "Regression → MSE (or MAE)." },
  { m: "m3", q: "Fraud is 1% of transactions. A model says 'not fraud' for everything. Accuracy?", o: ["1%", "50%", "99%", "0%"], a: 2, w: "99% accuracy with zero recall: the accuracy paradox under imbalance." },
  { m: "m3", q: "TP = 40, FP = 10, FN = 20. Precision and recall?", o: ["0.8 and 0.67", "0.67 and 0.8", "0.8 and 0.8", "0.5 and 0.67"], a: 0, w: "Precision = 40/50 = 0.8. Recall = 40/60 ≈ 0.67." },
  { m: "m3", q: "You fit a StandardScaler on the full dataset, then split. What went wrong?", o: ["Nothing", "Data leakage: test statistics influenced training", "Underfitting", "The scaler can't handle test data"], a: 1, w: "Fit every transformer on training data only." },
  { m: "m3", q: "Which is non-parametric?", o: ["Linear regression", "Logistic regression", "k-nearest neighbours", "A fixed 3-layer network"], a: 2, w: "k-NN stores all training data; its 'size' grows with the dataset." },
  { m: "m3", q: "Grouping customers into segments with no labels is…", o: ["Regression", "Classification", "Clustering", "Reinforcement learning"], a: 2, w: "Unsupervised learning finds structure without labels." },
  { m: "m4", q: "Train accuracy 100%, test 75%. Diagnosis?", o: ["Underfitting", "Overfitting", "Perfect model", "Data has no signal"], a: 1, w: "A big train–test gap means the model memorised the training set (high variance)." },
  { m: "m4", q: "You want a model that uses only the few genes that matter out of 20,000.", o: ["Ridge", "Lasso", "Plain linear regression", "Polynomial degree 5"], a: 1, w: "L1 sets most weights exactly to zero: built-in feature selection." },
  { m: "m4", q: "Logistic regression output for z = 0?", o: ["0", "0.5", "1", "Undefined"], a: 1, w: "σ(0) = 1/(1 + 1) = 0.5." },
  { m: "m4", q: "Probability 0.8. Odds?", o: ["0.8", "4", "0.25", "1.25"], a: 1, w: "Odds = 0.8 / 0.2 = 4." },
  { m: "m4", q: "Gradient at the current weight is +3, learning rate 0.1. Weight moves by…", o: ["+0.3", "−0.3", "+3", "−3"], a: 1, w: "w ← w − η·g = w − 0.3." },
  { m: "m4", q: "Loss jumps around and grows each iteration. Most likely fix?", o: ["Increase learning rate", "Decrease learning rate", "Add features", "Remove bias"], a: 1, w: "Divergence is the signature of a step size that's too large." },
  { m: "m4", q: "In sklearn LogisticRegression, C = 0.01 compared with C = 1 means…", o: ["Weaker regularisation", "Stronger regularisation", "No regularisation", "More iterations"], a: 1, w: "C is the inverse of regularisation strength." },
  { m: "m5", q: "The perceptron runs forever on your data. Why?", o: ["Learning rate too small", "Data isn't linearly separable", "Too many features", "Bias missing"], a: 1, w: "It only converges when a perfect separating line exists." },
  { m: "m5", q: "‖W‖ = 4 with k = 1. Total SVM margin?", o: ["4", "2", "0.5", "0.25"], a: 2, w: "Margin = 2k/‖W‖ = 2/4 = 0.5." },
  { m: "m5", q: "Which training points determine an SVM's boundary?", o: ["All points", "Only the support vectors", "The class centroids", "Outliers only"], a: 1, w: "Only points with non-zero α, those on or inside the margin." },
  { m: "m5", q: "RBF SVM: train F1 0.90, test F1 0.50. Try…", o: ["Increase C and gamma", "Decrease C and/or gamma", "Remove scaling", "Use hard margin"], a: 1, w: "Large C and γ make a wiggly, memorising boundary; lowering them reduces variance." },
  { m: "m5", q: "Models trained on different samples give very different predictions, but their average is near the truth.", o: ["High bias, low variance", "Low bias, high variance", "Low bias, low variance", "High bias, high variance"], a: 1, w: "Average close to truth = low bias. Scattered predictions = high variance." },
  { m: "m5", q: "Dataset: 900 'stay', 100 'churn'. class_weight='balanced' weight for churn?", o: ["0.1", "1", "5", "9"], a: 2, w: "1000 / (2 × 100) = 5 (and stay gets 1000/(2×900) ≈ 0.56)." },
  { m: "m6", q: "Which split gives the most information gain?", o: ["A split whose children have the same class mix as the parent", "A split producing two nearly pure children", "A split with one tiny child", "Any split, they're equal"], a: 1, w: "Pure children have low entropy, so the drop from the parent is largest." },
  { m: "m6", q: "Entropy (log₂) of a group with 8 stay and 2 churn?", o: ["0", "0.32", "0.72", "1"], a: 2, w: "−(0.8 log₂ 0.8 + 0.2 log₂ 0.2) ≈ 0.72. (Gini would be 0.32.)" },
  { m: "m6", q: "A regression tree chooses splits by…", o: ["Information gain", "Gini", "Variance reduction", "Accuracy"], a: 2, w: "For numeric targets, impurity is measured as variance; the leaf predicts the mean." },
  { m: "m6", q: "5 classes, one-vs-one. How many binary classifiers?", o: ["5", "10", "20", "25"], a: 1, w: "K(K−1)/2 = 5×4/2 = 10." },
  { m: "m6", q: "About what fraction of rows does a bootstrap sample leave out?", o: ["0%", "10%", "37%", "50%"], a: 2, w: "(1 − 1/N)^N ≈ 1/e ≈ 0.368." },
  { m: "m6", q: "Random forest differs from plain bagged trees by…", o: ["Using boosting", "Random feature subsets at each split", "No bootstrap", "Deeper trees only"], a: 1, w: "Feature randomness decorrelates the trees, so averaging cancels more error." },
  { m: "m6", q: "Your model underfits (high bias). Which ensemble family targets that?", o: ["Bagging", "Random forest", "Boosting", "Voting with identical models"], a: 2, w: "Boosting builds models sequentially to fix remaining errors, reducing bias." },
  /* Module 2 (m8) questions — written for this portal from the PyTorch MNIST notebook. */
  { m: "m8", q: "f(x, y) = x²y + 3y. What is ∂f/∂x at (2, 1)?", o: ["7", "4", "2", "3"], a: 1, w: "Freeze y: ∂f/∂x = 2xy = 2·2·1 = 4. (∂f/∂y = x² + 3 = 7 is the other partial.)" },
  { m: "m8", q: "In the notebook, z = x·y + y² with x = 2, y = 3. What is y.grad after z.backward()?", o: ["3", "6", "8", "15"], a: 2, w: "∂z/∂y = x + 2y = 2 + 6 = 8. x.grad is y = 3." },
  { m: "m8", q: "A 10-class network's starting loss is 6.8. What does that suggest?", o: ["Normal", "A bug or bad initialisation: it should be ≈ 2.30", "Too few epochs", "The learning rate is too small"], a: 1, w: "Random guessing gives −ln(0.1) ≈ 2.30. A much larger starting loss means confidently wrong outputs — check the model, labels and loss." },
  { m: "m8", q: "How many parameters does nn.Linear(784, 128) have?", o: ["100,352", "100,480", "912", "128"], a: 1, w: "784 × 128 weights + 128 biases = 100,480." },
  { m: "m8", q: "Remove every ReLU from a 4-layer network. Its decision boundary becomes…", o: ["More curved", "Unchanged", "A single straight line", "Random"], a: 2, w: "A composition of linear maps is linear, so the network collapses to one linear layer." },
  { m: "m8", q: "In backprop, a hidden ReLU neuron had z = −0.4 for this sample. Its incoming weights get gradient…", o: ["The same as its output weight", "0", "−0.4", "1"], a: 1, w: "ReLU′(z) = 0 for z < 0, so no gradient flows back through that neuron for this sample." },
  { m: "m8", q: "Plain GD zig-zags across a long narrow valley. Which change helps most directly?", o: ["Bigger learning rate", "Momentum", "Fewer epochs", "Removing the bias"], a: 1, w: "Momentum averages gradients, so the alternating cross-valley components cancel while the along-valley ones add up." },
  { m: "m8", q: "Train loss 0.217 and val loss 0.224, both still falling at epoch 25. Diagnosis?", o: ["Overfitting", "Under-trained — keep going or raise the learning rate", "Data leakage", "Exploding gradients"], a: 1, w: "Overfitting shows as validation loss rising while training loss falls. Both falling together means more training would still help." },
];

export const quizByModule = (id: string): QuizQuestion[] => QUIZ.filter((q) => q.m === id);

