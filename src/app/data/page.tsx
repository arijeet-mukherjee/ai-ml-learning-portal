import type { Metadata } from "next";
import DatasetExplorer from "@/components/DatasetExplorer";

export const metadata: Metadata = {
  title: "Datasets",
  description:
    "The real course datasets with column statistics, missing-value counts and a correlation heatmap.",
};

export default function DataPage() {
  return (
    <div className="px-4 pt-8 pb-24 sm:px-6 lg:px-10">
      <header className="max-w-[var(--measure)]">
        <p
          className="font-mono text-[11.5px] uppercase tracking-[0.18em]"
          style={{ color: "var(--accent)" }}
        >
          The actual course data
        </p>
        <h1 className="mt-2 text-[clamp(27px,5vw,42px)] leading-[1.1] font-semibold tracking-[-0.03em]">
          Datasets
        </h1>
        <p className="mt-3 text-[17px]" style={{ color: "var(--muted)" }}>
          Five CSVs, loaded and summarised in the browser. Pick a column to see its
          distribution, its quartiles and how many values are missing.
        </p>
      </header>

      <DatasetExplorer />
    </div>
  );
}
