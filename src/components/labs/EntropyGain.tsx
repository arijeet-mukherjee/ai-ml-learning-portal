"use client";

import { useMemo, useState } from "react";
import { Choice, LabButton, LabFrame, Readout, Slider } from "./LabKit";
import { LABS } from "@/lib/labs";
import { entropyBits, entropyNats, fmt, gini } from "@/lib/stats";

/**
 * m6 · A bag of marbles, then a split scored with information gain.
 *
 * The "camera lecture" preset reproduces the slide: a 63 LOW / 37 HIGH root split
 * into C1 (43/11) and C2 (20/26) gives IG ≈ 0.07 in nats — the number the lecture
 * quotes. The log base toggle shows why sklearn's `criterion="entropy"` prints
 * 0.95 for the same root: it uses log₂, which only rescales.
 */
type Base = "nats" | "bits";

const PRESETS = {
  camera: { parent: [63, 37], left: [43, 11], right: [20, 26], label: "Company (C1 vs C2)" },
  price300: { parent: [63, 37], left: [45, 25], right: [18, 12], label: "Price < 300" },
  price500: { parent: [63, 37], left: [55, 35], right: [8, 2], label: "Price < 500" },
} as const;

type PresetKey = keyof typeof PRESETS;

export default function EntropyGain() {
  const [stay, setStay] = useState(8);
  const [churn, setChurn] = useState(2);
  const [base, setBase] = useState<Base>("bits");
  const [preset, setPreset] = useState<PresetKey>("camera");

  const H = base === "bits" ? entropyBits : entropyNats;
  const unit = base === "bits" ? " bits" : " nats";

  const bag = useMemo(() => {
    const counts = [stay, churn];
    return { h: H([stay, churn]), g: gini(counts), total: stay + churn };
  }, [stay, churn, H]);

  const split = useMemo(() => {
    const p = PRESETS[preset];
    const nParent = p.parent[0] + p.parent[1];
    const nL = p.left[0] + p.left[1];
    const nR = p.right[0] + p.right[1];
    const hParent = H([...p.parent]);
    const hL = H([...p.left]);
    const hR = H([...p.right]);
    const ig = hParent - ((nL / nParent) * hL + (nR / nParent) * hR);
    return { ...p, nParent, nL, nR, hParent, hL, hR, ig };
  }, [preset, H]);

  const marbleRows = 4;
  const marbleCols = Math.ceil(bag.total / marbleRows) || 1;

  return (
    <LabFrame
      title={LABS.entropy.title}
      how={LABS.entropy.how}
      notice="A 50/50 bag is maximum uncertainty; a pure bag is zero. Then compare the three lecture splits: Company scores ≈0.07, price < 300 scores ≈0, and price < 500 scores ≈0.01 — the tree picks Company because its children differ most, not because its numbers are biggest."
      onReset={() => {
        setStay(8);
        setChurn(2);
        setBase("bits");
        setPreset("camera");
      }}
      stage={
        <div className="grid gap-3 md:grid-cols-2">
          {/* The bag */}
          <div
            className="rounded-[var(--radius-sm)] border p-3"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
          >
            <div className="mb-2 font-mono text-[11px]" style={{ color: "var(--muted-2)" }}>
              one bag — {stay} stay / {churn} churn
            </div>
            <svg
              viewBox={`0 0 ${Math.max(marbleCols, 10) * 20 + 8} ${marbleRows * 20 + 8}`}
              className="block h-auto w-full"
              role="img"
              aria-label={`A bag of ${stay} blue stay marbles and ${churn} red churn marbles`}
            >
              {Array.from({ length: bag.total }, (_, i) => (
                <circle
                  key={i}
                  cx={(i % marbleCols) * 20 + 14}
                  cy={Math.floor(i / marbleCols) * 20 + 14}
                  r="7.5"
                  fill={i < stay ? "var(--accent-2)" : "var(--danger)"}
                />
              ))}
            </svg>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[12.5px]">
              <div>
                <div style={{ color: "var(--muted-2)" }}>Entropy</div>
                <div className="font-mono text-[15px]" style={{ color: "var(--accent-2)" }}>
                  {fmt(bag.h, 3)}
                  <span className="text-[11px]">{unit}</span>
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted-2)" }}>Gini</div>
                <div className="font-mono text-[15px]" style={{ color: "var(--warn)" }}>
                  {fmt(bag.g, 3)}
                </div>
              </div>
            </div>
          </div>

          {/* The split */}
          <div
            className="rounded-[var(--radius-sm)] border p-3"
            style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
          >
            <div className="mb-2 font-mono text-[11px]" style={{ color: "var(--muted-2)" }}>
              scoring a split — {split.label}
            </div>
            <svg viewBox="0 0 300 150" className="block h-auto w-full" role="img" aria-label={`Split tree with information gain ${fmt(split.ig, 3)}`}>
              <rect x="105" y="8" width="90" height="34" rx="7" fill="var(--panel-2)" stroke="var(--accent)" />
              <text x="150" y="23" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="var(--text)">
                {split.parent[0]} / {split.parent[1]}
              </text>
              <text x="150" y="36" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="var(--muted-2)">
                H = {fmt(split.hParent, 2)}
              </text>

              <line x1="150" y1="42" x2="62" y2="92" stroke="var(--line-strong)" />
              <line x1="150" y1="42" x2="238" y2="92" stroke="var(--line-strong)" />

              {(
                [
                  [62, split.left, split.nL, split.hL],
                  [238, split.right, split.nR, split.hR],
                ] as [number, readonly number[], number, number][]
              ).map(([x, counts, n, h], i) => (
                <g key={i}>
                  <rect x={x - 45} y="92" width="90" height="34" rx="7" fill="var(--panel-2)" stroke="var(--accent-2)" />
                  <text x={x} y="107" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="var(--text)">
                    {counts[0]} / {counts[1]}
                  </text>
                  <text x={x} y="120" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="var(--muted-2)">
                    H = {fmt(h, 2)} · {fmt((100 * n) / split.nParent, 0)}%
                  </text>
                </g>
              ))}

              <text x="150" y="146" textAnchor="middle" fontSize="11.5" fontFamily="monospace" fill="var(--good)">
                IG = {fmt(split.ig, 3)}
                {unit}
              </text>
            </svg>
          </div>
        </div>
      }
      controls={
        <>
          <Slider label="Stay marbles (blue)" value={stay} min={0} max={20} step={1} onChange={setStay} display={`${stay}`} />
          <Slider label="Churn marbles (red)" value={churn} min={0} max={20} step={1} onChange={setChurn} display={`${churn}`} />
          <div className="flex flex-wrap gap-2">
            <LabButton tone="plain" onClick={() => { setStay(5); setChurn(5); }}>
              50/50
            </LabButton>
            <LabButton tone="plain" onClick={() => { setStay(10); setChurn(0); }}>
              Pure
            </LabButton>
            <LabButton tone="plain" onClick={() => { setStay(9); setChurn(1); }}>
              90/10
            </LabButton>
          </div>
          <Choice<Base>
            label="Log base"
            value={base}
            onChange={setBase}
            options={[
              { value: "bits", label: "log₂ (sklearn)" },
              { value: "nats", label: "ln (the slides)" },
            ]}
          />
          <Choice<PresetKey>
            label="Candidate split (lecture camera data)"
            value={preset}
            onChange={setPreset}
            options={(Object.keys(PRESETS) as PresetKey[]).map((k) => ({
              value: k,
              label: PRESETS[k].label,
            }))}
          />
        </>
      }
      readout={
        <Readout
          items={[
            { label: `Bag entropy${unit}`, value: fmt(bag.h, 3), tone: "accent" },
            { label: "Bag Gini", value: fmt(bag.g, 3), tone: "warn" },
            { label: "Parent H", value: fmt(split.hParent, 3) },
            { label: "Weighted children H", value: fmt(split.hParent - split.ig, 3) },
            { label: "Information gain", value: fmt(split.ig, 3), tone: "good" },
            {
              label: "Verdict",
              value:
                split.ig > 0.05
                  ? "worth splitting on"
                  : split.ig > 0.008
                    ? "doubtful"
                    : "tells you nothing",
              tone: split.ig > 0.05 ? "good" : "warn",
            },
          ]}
        />
      }
    />
  );
}
