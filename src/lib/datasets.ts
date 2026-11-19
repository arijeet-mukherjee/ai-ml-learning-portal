import type { DatasetId } from "@/types/content";

export interface DatasetMeta {
  id: DatasetId;
  file: string;
  title: string;
  /** Where in the course it came from. */
  from: string;
  moduleId: string;
  rows: number;
  /** True when the professor rebuilt or synthesised the data for offline practice. */
  synthetic?: boolean;
  about: string;
  tasks: string[];
}

/**
 * Verbatim from the notebook's DS_META, with row counts checked against the CSVs
 * in public/data. See SOURCE_NOTES.md.
 */
export const DATASETS: Record<DatasetId, DatasetMeta> = {
  employee: {
    id: "employee",
    file: "employee_dataset.csv",
    title: "Employees",
    from: "Week 0 · Python toolkit",
    moduleId: "m0",
    rows: 240,
    about:
      "240 employees across departments with age, experience, salary, performance and satisfaction scores, and remote flag. Salary and performance have deliberate gaps.",
    tasks: [
      "Count missing values per column, then fill salary with the median per department",
      "Mean salary and headcount by department, sorted",
      "Box plot of salary by department; which department has outliers?",
      "Does remote work relate to satisfaction? (groupby + box plot)",
    ],
  },
  students: {
    id: "students",
    file: "students_survey.csv",
    title: "Student survey",
    from: "6 Sept · Probability & statistics",
    moduleId: "m1",
    rows: 300,
    about:
      "300 students: study group (A–D), study mode, weekly study hours, sleep, attendance %, confidence rating, exam score and pass/fail.",
    tasks: [
      "Mean, median, std and IQR for every numeric column",
      "Joint table study_group × passed, then P(passed | group)",
      "Bayes: P(group C | passed) two ways",
      "Pearson vs Spearman between confidence_rating and exam_score",
    ],
  },
  cancer: {
    id: "cancer",
    file: "breast_cancer.csv",
    title: "Wisconsin breast cancer",
    from: "20 Sept – 4 Oct · linear & logistic models",
    moduleId: "m3",
    rows: 569,
    about:
      "569 tumours, 30 numeric features of cell nuclei (mean, standard error, worst), diagnosis M (malignant) or B (benign). First column is a row index; drop id too.",
    tasks: [
      "Rebuild the Week 1 pipeline and match 98.2% test accuracy",
      "Lower the logistic threshold and count missed tumours",
      "Lasso on degree-2 features: how many weights survive?",
      "PCA to 2 components and scatter-plot coloured by diagnosis",
    ],
  },
  camera: {
    id: "camera",
    file: "camera_ratings_lecture.csv",
    title: "Camera ratings (rebuilt from the lecture)",
    from: "11 Oct · Decision trees",
    moduleId: "m6",
    rows: 100,
    synthetic: true,
    about:
      "100 cameras one shopper rated, rebuilt so its counts match the lecture slides exactly: C1 43 LOW / 11 HIGH, C2 20 / 26, price < 300 → 45 / 25, price < 500 → 55 / 35, colour Black 70 / White 30.",
    tasks: [
      "Reproduce the three information-gain numbers (0.07, ~0, ~0.01)",
      "Fit a depth-2 tree with criterion='entropy' and print its rules",
      "Predict the test camera: C2, Black, 15 MP, 30 fps, $350",
      "Regression tree on the 1–5 rating: which feature reduces variance most?",
    ],
  },
  churn: {
    id: "churn",
    file: "churn_practice_synthetic.csv",
    title: "Churn practice (offline)",
    from: "4 & 11 Oct · SVM, trees, forests",
    moduleId: "m5",
    rows: 1000,
    synthetic: true,
    about:
      "1,000 synthetic telecom customers with the same patterns as the IBM Telco data used in class (≈26% churn; month-to-month, fibre, electronic cheque and new customers churn more). Use it when you're offline; the real file has 7,043 rows.",
    tasks: [
      "Show why accuracy misleads: compare with always predicting 'No'",
      "Scale numeric columns, then compare linear vs RBF SVM on churn F1",
      "Unconstrained tree vs random forest: train/test F1 gap",
      "GridSearchCV over C and gamma inside a Pipeline",
    ],
  },
};

export const DATASET_LIST = Object.values(DATASETS);
