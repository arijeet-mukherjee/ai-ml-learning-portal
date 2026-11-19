import type { Chapter } from "@/types/content";

export const distributions: Chapter = {
  slug: "distributions",
  title: "Probability distributions",
  description:
    "PMF versus PDF, the normal curve and the 68-95-99.7 rule, Bernoulli and Binomial, and the difference between scipy.stats and np.random.",
  icon: "∿",
  order: 2,
  moduleId: "m1",
  estimatedMinutes: 18,
  prerequisites: ["describing-data"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m1-dist",
    "DAY_2/Probability_Statistics_Foundations_Notebook.ipynb",
  ],
  islpChapters: ["Ch 2", "Ch 4"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why a curve instead of a number",
      blocks: [
        {
          type: "prose",
          html: "A summary statistic tells you about the data you have. A distribution tells you what to expect from data you have not seen — which is the only thing that matters when you deploy a model.<br><br>Concretely: \"the exam mean is 70\" does not tell you whether a 92 is remarkable. \"Scores are roughly normal with μ = 70 and σ = 10\" tells you 92 is 2.2σ out, which happens about 1.4% of the time. That second statement is actionable; the first is not.",
        },
        {
          type: "world",
          html: "A call centre where each call converts with p = 0.3: \"how many sales out of the next 10 calls?\" is Binomial(10, 0.3). The most likely answer is 3, but 1 or 5 happen often enough that a manager shouldn't panic about a single shift. Knowing the distribution is the difference between managing and reacting.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        {
          type: "prose",
          html: "A distribution maps every possible outcome to its probability. <b>Discrete</b> ones (Bernoulli, Binomial) give a probability per outcome via a PMF. <b>Continuous</b> ones (Normal) give a density via a PDF; the <i>area</i> under the curve is the probability.",
        },
        {
          type: "memoryHook",
          content: "pMf → Marbles you can count. pDf → Density you measure as area.",
          detail:
            "This is why P(X = 70.000…) is zero for a continuous variable: a single point has no width, so no area. You can only ask for the probability of a range.",
        },
        { type: "heading", level: 3, content: "Normal (Gaussian)" },
        {
          type: "prose",
          html: "Bell-shaped, symmetric around μ, width set by σ. Heights, measurement errors, exam scores, and — crucially — sums of many small random effects. That last one is the central limit theorem, and it is why the normal keeps appearing in places with no obvious reason to be bell-shaped: anything that is the sum of many small independent contributions tends towards it.",
        },
        { type: "widget", lab: "normal" },
        {
          type: "memoryHook",
          content: '"68, 95, 99.7 — one, two, three steps to heaven."',
          detail:
            "Within 1σ: 68%. Within 2σ: 95%. Within 3σ: 99.7%. A value beyond 3σ is a 3-in-1000 event; that is the logic behind z-score outlier checks.",
        },
        {
          type: "prose",
          html: "The rule holds <i>whatever</i> μ and σ you pick, which is what makes it worth memorising. Shift the centre, stretch the width — the fractions do not move. That invariance is the whole content of the z-score: <code>z = (x − μ)/σ</code> converts any normal variable into the standard one, so a single table of areas serves every normal distribution there has ever been.",
        },
        { type: "heading", level: 3, content: "Bernoulli and Binomial" },
        {
          type: "prose",
          html: "<b>Bernoulli(p)</b>: one yes/no trial (one coin flip, one email spam or not). <b>Binomial(n, p)</b>: count the yeses in n independent trials. A Bernoulli is just a Binomial with n = 1.",
        },
        {
          type: "formula",
          title: "Binomial PMF",
          lines: `P(k successes in n trials) = C(n, k) · p^k · (1 − p)^(n − k)
mean = n·p        variance = n·p·(1 − p)
Binomial(10, 0.3): mean 3, variance 2.1, std ≈ 1.45`,
        },
        {
          type: "prose",
          html: "The three pieces read left to right: <code>C(n, k)</code> counts how many orderings give k successes, <code>p^k</code> is the probability of the successes, <code>(1−p)^(n−k)</code> the probability of the failures. The independence assumption is doing all the work in that multiplication — if calls in a shift are correlated (a bad script, a broken line), Binomial is the wrong model.",
        },
        {
          type: "prose",
          html: "<b>scipy.stats</b> answers \"what <i>should</i> this distribution look like?\" (<code>.pdf()</code>, <code>.pmf()</code>, <code>.cdf()</code>). <b>np.random</b> answers \"give me fake data that looks like this\" (<code>np.random.normal(70, 10, 1000)</code>). Theory versus simulation — you will use both, and confusing them is how people end up plotting a histogram where they meant a curve.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "theory and simulation side by side",
            code: `from scipy import stats
import numpy as np, matplotlib.pyplot as plt

x = np.linspace(-4, 4, 400)
plt.plot(x, stats.norm.pdf(x, loc=0, scale=1)); plt.title("Standard normal"); plt.show()

stats.norm.cdf(1) - stats.norm.cdf(-1)     # 0.6827 -> the 68% rule

np.random.binomial(n=1, p=0.3)             # Bernoulli: one trial
k = np.arange(0, 11)
plt.bar(k, stats.binom.pmf(k, n=10, p=0.3)); plt.title("Binomial(10, 0.3)"); plt.show()

sample = np.random.normal(loc=70, scale=10, size=1000)   # fake exam scores
plt.hist(sample, bins=30); plt.show()`,
            caption:
              "Line 7 is the 68% rule computed rather than recited: the CDF at +1 minus the CDF at −1 is 0.6827.",
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
            "<b>Assuming normality because it is convenient.</b> Income, wait times, counts and anything bounded below at zero are usually not normal. Plot it; a histogram with a long right tail is a refusal.",
            "<b>Using a z-score fence on skewed data.</b> If the distribution is not symmetric, ±3σ is not the 0.3% boundary you think it is. Use the IQR fence instead.",
            "<b>Forgetting independence.</b> Binomial requires independent trials with constant p. Ten calls handled by the same tired agent are neither.",
            "<b>Reading a PDF value as a probability.</b> A density can exceed 1. Only areas are probabilities.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 4",
          detail:
            "ISLP chapter 4 builds classification on top of these distributions — the Bayes classifier it opens with, and LDA later, both assume a distributional form for each class. Reading it after this chapter makes the assumption visible.",
        },
      ],
    },
    {
      id: "real",
      kind: "real",
      title: "On the real data",
      blocks: [
        { type: "datasetPreview", dataset: "students" },
        {
          type: "prose",
          html: "Treat <code>exam_score</code> as the candidate normal variable and <code>passed</code> as the Bernoulli one. Those two columns let you exercise both halves of this chapter against 300 real rows: fit μ and σ to the scores and check the 68-95-99.7 fractions empirically, then count the pass rate and ask whether Binomial would describe a random sample of 10 students.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "checking the rule against the survey",
            code: `df = pd.read_csv("students_survey.csv")
scores = df["exam_score"]
mu, sigma = scores.mean(), scores.std(ddof=1)

for k in (1, 2, 3):
    inside = scores.between(mu - k * sigma, mu + k * sigma).mean()
    print(k, round(inside * 100, 1), "% vs theory", round(
        (stats.norm.cdf(k) - stats.norm.cdf(-k)) * 100, 1))

# the Bernoulli half
p = (df["passed"] == "Yes").mean()
print("pass rate", round(p, 3), "| Binomial(10, p) mean", round(10 * p, 2))`,
            caption:
              "The empirical fractions will not land exactly on 68.3 / 95.4 / 99.7 — 300 rows is a small sample, and that gap is itself worth reasoning about.",
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
            "Plot <code>exam_score</code> and <code>study_hours_per_week</code> and guess each one's distribution shape before computing anything. <b>Success:</b> you can justify \"roughly normal\" or \"not normal\" from the picture.",
            "Run the 68-95-99.7 check above. <b>Success:</b> you can say how far the empirical fractions are from theory and whether 300 rows explains the gap.",
            "Draw the Binomial(10, 0.3) PMF as a bar chart and mark its mean. <b>Success:</b> the mean lands at 3 and you can read off P(exactly 5).",
            "Simulate 1,000 exam scores with <code>np.random.normal(70, 10, 1000)</code> and overlay the theoretical PDF on the histogram. <b>Success:</b> both are on the same axes with the histogram density-normalised.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Demonstrate the central limit theorem: draw 10,000 samples of 30 values each from a deliberately non-normal distribution (uniform, or exponential), histogram the 10,000 sample means, and watch a bell appear.",
            "Compare the IQR fence and the ±3σ fence on <code>study_hours_per_week</code>. Where they disagree, decide which you trust and say why.",
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
            "pMf → Marbles you can count. pDf → Density you measure as area.",
            "68, 95, 99.7 — one, two, three steps to heaven, whatever μ and σ are.",
            "A Bernoulli is a Binomial with n = 1.",
            "scipy.stats is theory; np.random is simulation.",
            "Only areas are probabilities — a density can exceed 1.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "What fraction of a normal distribution lies within 2σ of the mean?",
              a: "About 95% — 95.45% exactly. Within 1σ it is 68.3% and within 3σ 99.7%, and those fractions do not depend on μ or σ.",
            },
            {
              q: "Difference between a PMF and a PDF?",
              a: "A PMF gives the probability of each discrete outcome and the values are probabilities. A PDF gives a density for a continuous variable; probability is the area under it, so a single point has probability zero.",
            },
            {
              q: "When does Binomial stop being the right model?",
              a: "When the trials are not independent or p is not constant across them — correlated calls, a changing script, a learning agent.",
            },
            {
              q: "Why does the normal keep showing up?",
              a: "The central limit theorem: anything that is the sum of many small independent contributions tends towards a normal distribution, whatever the individual contributions look like.",
            },
          ],
        },
      ],
    },
  ],
};
