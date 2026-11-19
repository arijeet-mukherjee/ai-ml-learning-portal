"use client";

import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";

/* ===========================================================================
   Shared chrome and controls for every lab.
   Every lab gets: a titled frame, the professor's "how to use it" line, a stage,
   labelled keyboard-operable controls, a live readout, a "what to notice" line
   and a reset. Keeping it in one place is what makes fifteen labs feel like one
   instrument panel rather than fifteen experiments.
   =========================================================================== */

export function LabFrame({
  title,
  how,
  notice,
  onReset,
  stage,
  controls,
  readout,
}: {
  title: string;
  how: string;
  notice: string;
  onReset: () => void;
  stage: ReactNode;
  controls: ReactNode;
  readout?: ReactNode;
}) {
  return (
    <section
      className="my-7 w-full min-w-0 overflow-hidden rounded-[var(--radius)] border"
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
      aria-label={`Interactive lab: ${title}`}
    >
      <header
        className="flex items-start justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: "var(--line)", background: "var(--panel-2)" }}
      >
        <div className="min-w-0">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--accent-2)" }}
          >
            Live lab
          </div>
          <h4 className="mt-0.5 text-[16.5px] font-semibold tracking-[-0.01em]">{title}</h4>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12.5px] transition-colors"
          style={{ borderColor: "var(--line-strong)", color: "var(--muted)" }}
        >
          <RotateCcw size={13} aria-hidden /> Reset
        </button>
      </header>

      <p className="px-4 pt-3 text-[14.5px]" style={{ color: "var(--muted)" }}>
        {how}
      </p>

      <div className="px-4 pt-3">{stage}</div>

      <div className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="space-y-3.5">{controls}</div>
        {readout ? <div className="space-y-2">{readout}</div> : null}
      </div>

      <p
        className="border-t px-4 py-2.5 text-[13.5px]"
        style={{ borderColor: "var(--line)", color: "var(--muted-2)" }}
      >
        <span style={{ color: "var(--accent)" }}>What to notice — </span>
        {notice}
      </p>
    </section>
  );
}

/** A labelled range input. Arrow keys work by construction; step sets the grain. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  display?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13.5px]" style={{ color: "var(--muted)" }}>
          {label}
        </label>
        <span className="font-mono text-[13px]" style={{ color: "var(--text)" }}>
          {display ?? value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full outline-offset-4
                   [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-[var(--accent)]
                   [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
                   [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:bg-[var(--accent)]"
        style={{ background: "var(--line-strong)" }}
      />
      {hint ? (
        <p className="mt-1 text-[12.5px]" style={{ color: "var(--muted-2)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** A small segmented control. Rendered as real radio buttons for keyboard use. */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13.5px]" style={{ color: "var(--muted)" }}>
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <label
              key={opt.value}
              className="cursor-pointer rounded-full border px-3 py-1 text-[13px] transition-colors"
              style={{
                borderColor: active ? "var(--accent)" : "var(--line-strong)",
                background: active ? "var(--accent-soft)" : "transparent",
                color: active ? "var(--text)" : "var(--muted)",
              }}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={active}
                onChange={() => onChange(opt.value)}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function LabButton({
  children,
  onClick,
  tone = "accent",
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "accent" | "plain";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40"
      style={{
        borderColor: tone === "accent" ? "var(--accent)" : "var(--line-strong)",
        background: tone === "accent" ? "var(--accent-soft)" : "transparent",
        color: tone === "accent" ? "var(--text)" : "var(--muted)",
      }}
    >
      {children}
    </button>
  );
}

/** The live number panel. The whole point of a lab is control → picture → number. */
export function Readout({
  items,
}: {
  items: { label: string; value: string; tone?: "accent" | "good" | "warn" | "danger" }[];
}) {
  const color = (t?: string) =>
    t === "good"
      ? "var(--good)"
      : t === "warn"
        ? "var(--warn)"
        : t === "danger"
          ? "var(--danger)"
          : "var(--accent-2)";
  return (
    <dl
      aria-live="polite"
      className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-[var(--radius-sm)] border p-3"
      style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
    >
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="truncate text-[12px]" style={{ color: "var(--muted-2)" }}>
            {it.label}
          </dt>
          <dd
            className="font-mono text-[15px] font-medium tabular-nums"
            style={{ color: color(it.tone) }}
          >
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Responsive SVG stage with a fixed aspect so layout never shifts on load. */
export function Stage({
  viewBox,
  children,
  label,
  className,
}: {
  viewBox: string;
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-sm)] border ${className ?? ""}`}
      style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
    >
      <svg
        viewBox={viewBox}
        role="img"
        aria-label={label}
        className="block h-auto w-full"
        style={{ touchAction: "manipulation" }}
      >
        {children}
      </svg>
    </div>
  );
}
