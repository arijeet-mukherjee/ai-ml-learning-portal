"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { LabId } from "@/types/content";
import { LABS } from "@/lib/labs";

/**
 * Every lab is code-split AND client-only.
 *
 * `ssr: false` is load-bearing, not an optimisation. The labs compute SVG
 * coordinates through Math.log / Math.exp / Math.sqrt, and those are not
 * required to be bit-identical across engines — Node and Chrome disagree in the
 * last ULP. Server-rendering the geometry therefore produced attribute
 * mismatches ("cx=126.31186390453591" vs 126.3118639045359) on every lab, and
 * React reported them as hydration errors it would not patch up.
 *
 * There is nothing to gain from prerendering an interactive instrument, so the
 * labs render on the client only and the placeholder holds the space meanwhile.
 */
function Placeholder({ title }: { title: string }) {
  return (
    <div
      className="my-7 grid min-h-[340px] place-items-center rounded-[var(--radius)] border"
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
    >
      <span className="text-[13.5px]" style={{ color: "var(--muted-2)" }}>
        Loading {title}…
      </span>
    </div>
  );
}

function loading(title: string) {
  const Loading = () => <Placeholder title={title} />;
  Loading.displayName = `LabLoading(${title})`;
  return Loading;
}

const REGISTRY: Record<LabId, ComponentType> = {
  axis: dynamic(() => import("./labs/AxisExplorer"), { loading: loading(LABS.axis.title), ssr: false }),
  iqr: dynamic(() => import("./labs/OutlierHunter"), { loading: loading(LABS.iqr.title), ssr: false }),
  normal: dynamic(() => import("./labs/BellCurve"), { loading: loading(LABS.normal.title), ssr: false }),
  bayes: dynamic(() => import("./labs/BayesPeople"), { loading: loading(LABS.bayes.title), ssr: false }),
  vectors: dynamic(() => import("./labs/VectorPlayground"), { loading: loading(LABS.vectors.title), ssr: false }),
  pca: dynamic(() => import("./labs/FirstComponent"), { loading: loading(LABS.pca.title), ssr: false }),
  threshold: dynamic(() => import("./labs/ThresholdLab"), { loading: loading(LABS.threshold.title), ssr: false }),
  gd: dynamic(() => import("./labs/GradientDescent"), { loading: loading(LABS.gd.title), ssr: false }),
  poly: dynamic(() => import("./labs/OverfitRidge"), { loading: loading(LABS.poly.title), ssr: false }),
  sigmoid: dynamic(() => import("./labs/LogisticOneD"), { loading: loading(LABS.sigmoid.title), ssr: false }),
  svm: dynamic(() => import("./labs/PerceptronVsSvm"), { loading: loading(LABS.svm.title), ssr: false }),
  kernel: dynamic(() => import("./labs/KernelTrick"), { loading: loading(LABS.kernel.title), ssr: false }),
  darts: dynamic(() => import("./labs/BiasVarianceDarts"), { loading: loading(LABS.darts.title), ssr: false }),
  entropy: dynamic(() => import("./labs/EntropyGain"), { loading: loading(LABS.entropy.title), ssr: false }),
  boot: dynamic(() => import("./labs/BootstrapLab"), { loading: loading(LABS.boot.title), ssr: false }),
  derivative: dynamic(() => import("./labs/SlopeDetective"), { loading: loading(LABS.derivative.title), ssr: false }),
  partial: dynamic(() => import("./labs/PartialDerivatives"), { loading: loading(LABS.partial.title), ssr: false }),
  nnplay: dynamic(() => import("./labs/NeuralPlayground"), { loading: loading(LABS.nnplay.title), ssr: false }),
  backprop: dynamic(() => import("./labs/BackpropStepper"), { loading: loading(LABS.backprop.title), ssr: false }),
  optimizers: dynamic(() => import("./labs/OptimizerRace"), { loading: loading(LABS.optimizers.title), ssr: false }),
  rbf: dynamic(() => import("./labs/RbfSimilarity"), { loading: loading(LABS.rbf.title), ssr: false }),
  treesplit: dynamic(() => import("./labs/TreeSplitter"), { loading: loading(LABS.treesplit.title), ssr: false }),
  forest: dynamic(() => import("./labs/ForestVote"), { loading: loading(LABS.forest.title), ssr: false }),
  algoatlas: dynamic(() => import("./labs/AlgoAtlas"), { loading: loading(LABS.algoatlas.title), ssr: false }),
};

export default function LabMount({ lab, caption }: { lab: LabId; caption?: string }) {
  const Lab = REGISTRY[lab];
  return (
    <div className="not-prose">
      {caption ? (
        <p className="mt-6 mb-0 text-[14.5px]" style={{ color: "var(--muted)" }}>
          {caption}
        </p>
      ) : null}
      <Lab />
    </div>
  );
}
