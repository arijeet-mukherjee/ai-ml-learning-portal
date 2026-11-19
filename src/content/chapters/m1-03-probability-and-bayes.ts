import type { Chapter } from "@/types/content";

export const probabilityAndBayes: Chapter = {
  slug: "probability-and-bayes",
  title: "Joint, conditional, and Bayes",
  description:
    "Two-way tables, conditional probability, independence, and why a positive test for a rare condition is mostly a false alarm.",
  icon: "⇄",
  order: 3,
  moduleId: "m1",
  estimatedMinutes: 24,
  prerequisites: ["distributions"],
  sourceRefs: [
    "Module 1 ML Notebook.html § m1-rules, m1-bayes",
    "DAY_2/Probability_Statistics_Foundations_Notebook.ipynb",
  ],
  islpChapters: ["Ch 4"],
  sections: [
    {
      id: "why",
      kind: "why",
      title: "Why conditionals do not reverse",
      blocks: [
        {
          type: "prose",
          html: "P(flagged | at risk) and P(at risk | flagged) are different numbers, and confusing them is one of the most expensive mistakes in applied statistics. A screening test can be 90% accurate at detecting a condition and still be wrong nine times out of ten when it fires — if the condition is rare enough.<br><br>That is not a paradox and it is not a flaw in the test. It is arithmetic, and Bayes' theorem is the arithmetic.",
        },
        {
          type: "world",
          html: "Bank fraud alerts, cancer screening, spam filters (Naive Bayes is literally this formula applied word by word), and incident triage that flags \"probable outage\": all of them fight the low-base-rate problem. Every one of them has a team arguing about where to put the threshold.",
        },
      ],
    },
    {
      id: "how",
      kind: "how",
      title: "How it works",
      blocks: [
        { type: "heading", level: 3, content: "Joint, marginal, conditional" },
        {
          type: "prose",
          html: "Build a two-way count table with <code>pd.crosstab</code>, divide by the grand total, and you have joint probabilities. Sum across a row or column and you get the marginals — they live in the table's margins, which is where the name comes from.",
        },
        {
          type: "formula",
          title: "Conditional probability",
          lines: `P(A | B) = P(A and B) / P(B)
"Zoom into B's world. What fraction of it is A?"`,
        },
        {
          type: "prose",
          html: "That one-line gloss is worth more than the formula. Conditioning is <i>restriction</i>: you throw away every row where B did not happen, and then ask what fraction of what remains has A. The denominator P(B) is just renormalising so the surviving rows add to 1.",
        },
        {
          type: "formula",
          title: "Independence",
          lines: `A and B are independent  ⇔  P(A | B) = P(A)
Knowing B happened changes nothing about A.`,
        },
        { type: "heading", level: 3, content: "Bayes' theorem" },
        {
          type: "prose",
          html: "Both conditionals share the same joint: P(A|B)·P(B) = P(A and B) = P(B|A)·P(A). Divide by P(B) and you have the theorem. That is the entire derivation — there is nothing else in it.",
        },
        {
          type: "formula",
          title: "Bayes",
          lines: `P(A | B) = P(B | A) × P(A) / P(B)
posterior = likelihood × prior / evidence
evidence P(B) = P(B|A)P(A) + P(B|not A)P(not A)`,
        },
        {
          type: "table",
          headers: ["Word", "Symbol", "Plain meaning"],
          rows: [
            ["Prior", "P(A)", "What you believed before the evidence"],
            ["Likelihood", "P(B | A)", "How likely the evidence is if A were true"],
            ["Evidence", "P(B)", "How likely the evidence is overall"],
            ["Posterior", "P(A | B)", "Updated belief after seeing the evidence"],
          ],
        },
        {
          type: "memoryHook",
          content: '"Post = Like × Prior ÷ Evidence"',
          detail:
            "Read it as: new belief = (how well the evidence fits) × (old belief), rescaled so everything adds to 1.",
        },
        { type: "heading", level: 3, content: "The three lecture examples" },
        {
          type: "list",
          ordered: true,
          items: [
            "<b>Coin:</b> prior 0.5 this person flips; P(heads | them) = 0.7, P(heads | other) = 0.5. Seeing heads, P(them) = 0.35 / 0.60 = <b>0.583</b>.",
            "<b>Study group:</b> P(group C | passed) via Bayes matches the direct table lookup exactly. Bayes is not magic, it is the table read backwards.",
            "<b>Screening quiz:</b> 2% at-risk, 90% detection, 15% false alarms. Flagged → only <b>10.9%</b> are truly at-risk.",
          ],
        },
        { type: "widget", lab: "bayes" },
        {
          type: "memoryHook",
          content: "When the thing is rare, a positive test is mostly false alarms.",
          detail:
            "Always imagine 1,000 people. 20 are at-risk, 18 get flagged. 980 are fine, 147 still get flagged. 18 out of 165 ≈ 11%.",
        },
        {
          type: "prose",
          html: "That counting version is the one to reach for under pressure. Nobody computes 0.9 × 0.02 / (0.9 × 0.02 + 0.15 × 0.98) in their head reliably, but almost anyone can count 18 out of 165. The formula and the headcount are the same calculation; the headcount is the one you can check.",
        },
        {
          type: "code",
          code: {
            language: "python",
            title: "the table, both ways",
            code: `counts = pd.crosstab(df["study_group"], df["passed"])
joint  = counts / counts.values.sum()          # P(group and passed)
p_group  = joint.sum(axis=1)                   # marginal P(group)
p_passed = joint.sum(axis=0)                   # marginal P(passed)

p_yes_given_c = joint.loc["C", "Yes"] / p_group["C"]
independent = np.isclose(p_passed["Yes"], p_yes_given_c)

# Bayes: P(C | Yes) two ways
bayes  = p_yes_given_c * p_group["C"] / p_passed["Yes"]
direct = joint.loc["C", "Yes"] / p_passed["Yes"]
print(round(bayes, 4), round(direct, 4))       # identical`,
            caption:
              "The last line is the point of the exercise: Bayes and the direct lookup print the same number, because they are the same division written two ways.",
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
          type: "trap",
          html: "<b>The prosecutor's fallacy.</b> \"The test is 90% accurate, so there is a 90% chance you have it\" swaps the conditional. The 90% is P(flagged | at risk). What the patient wants is P(at risk | flagged), and without the prior you cannot get there.",
        },
        {
          type: "list",
          items: [
            "<b>Forgetting the evidence term.</b> P(B) is not 1 and it is not the false-alarm rate — it is the <i>total</i> probability of being flagged, from both groups. Half the arithmetic errors live here.",
            "<b>Assuming independence to make the maths work.</b> Naive Bayes does exactly this on purpose and says so in its name. Doing it silently is different.",
            "<b>A prior pulled from nowhere.</b> The posterior is only as good as the prior. In the screening example, the entire conclusion rests on \"2% at risk\" being right.",
            "<b>Rounding mid-calculation.</b> With small probabilities, rounding the numerator and denominator separately can move the answer by several percentage points.",
          ],
        },
        {
          type: "citation",
          source: "ISLP Ch 4",
          detail:
            "ISLP chapter 4 opens with the Bayes classifier — the theoretically optimal one — and everything after it is an attempt to approximate it from data. Logistic regression in Module 4 is one such attempt.",
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
          html: "<code>study_group</code> (A–D) crossed with <code>passed</code> (Yes/No) is a genuine 4 × 2 table, which is enough to exercise every term in the formula. Compute P(passed | group C) by restriction, then recover P(group C | passed) by Bayes, and check it against the direct lookup. When the two agree to the last decimal you have understood the theorem rather than memorised it.",
        },
        {
          type: "prose",
          html: "Then test independence: is P(passed | group C) equal to P(passed)? If the groups genuinely differ, it is not — and the size of the gap is the size of the group effect.",
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
            "Build the joint table of <code>study_group</code> × <code>passed</code> and both sets of marginals. <b>Success:</b> the joint table sums to 1.0 and each marginal sums to 1.0.",
            "Compute P(passed | group C) by restriction. <b>Success:</b> you got it from the table without a formula.",
            "Get P(group C | passed) by Bayes and by direct lookup. <b>Success:</b> identical to four decimal places.",
            "Reproduce the screening quiz: 2% at-risk, 90% detection, 15% false alarms. <b>Success:</b> you get 10.9% and you can show the 1,000-person headcount that proves it.",
          ],
        },
        { type: "heading", level: 3, content: "Stretch goals" },
        {
          type: "list",
          items: [
            "Find the prevalence at which the screening test's posterior crosses 50% — the point where a positive result becomes more likely true than false. Then argue about whether that is the right threshold for a screening programme.",
            "Test independence for every pair of categorical columns in the survey, and rank the pairs by how far P(A|B) sits from P(A).",
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
            "Conditioning is restriction: zoom into B's world, then ask what fraction is A.",
            "Post = Like × Prior ÷ Evidence.",
            "When the thing is rare, a positive test is mostly false alarms.",
            "Bayes is not magic — it is the joint table read backwards.",
            "Always sanity-check with 1,000 imaginary people.",
          ],
        },
        {
          type: "vivaQuestions",
          items: [
            {
              q: "A test detects 90% of cases and false-alarms on 15% of healthy people. The condition affects 2%. Someone is flagged — what is the chance they have it?",
              a: "About 10.9%. Of 1,000 people, 20 are at risk and 18 are flagged; 980 are healthy and 147 are flagged. 18 / 165 ≈ 10.9%.",
            },
            {
              q: "What is the evidence term P(B) made of?",
              a: "The total probability of the evidence from every source: P(B|A)P(A) + P(B|¬A)P(¬A). It is not the false-alarm rate alone.",
            },
            {
              q: "What does independence mean in one line?",
              a: "P(A | B) = P(A) — knowing B happened changes nothing about A.",
            },
            {
              q: "Why is the prior so important here?",
              a: "The posterior is the likelihood reweighted by the prior. With a rare condition the prior is tiny, so even a good likelihood cannot lift the posterior far — which is exactly the rare-disease result.",
            },
          ],
        },
      ],
    },
  ],
};
