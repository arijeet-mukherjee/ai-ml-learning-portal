"use client";

import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { ContentBlock } from "@/types/content";
import { renderBlock } from "./ContentRenderer";

/** The notebook's <details class="deep"> — optional depth, collapsed by default. */
export default function DeepDive({
  summary,
  blocks,
  keyBase,
}: {
  summary: string;
  blocks: ContentBlock[];
  keyBase: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="my-6 overflow-hidden rounded-[var(--radius)] border"
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <ChevronRight
          size={16}
          aria-hidden
          style={{
            color: "var(--accent-2)",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform var(--dur) var(--ease)",
          }}
        />
        <span className="text-[15px] font-medium">{summary}</span>
      </button>
      {open ? (
        <div className="content border-t px-4 pt-1 pb-3" style={{ borderColor: "var(--line)" }}>
          {blocks.map((b, i) => (
            <Fragment key={`${keyBase}-${i}`}>{renderBlock(b, i)}</Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}
