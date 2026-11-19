"use client";

import { Fragment } from "react";
import type { ContentBlock } from "@/types/content";
import { BASE_PATH } from "@/lib/basePath";
import Callout from "./Callout";
import CodeBlock from "./CodeBlock";
import LabMount from "./LabMount";
import DatasetPreview from "./DatasetPreview";
import DeepDive from "./DeepDive";

/**
 * The ONLY place that knows how to draw a content block. Adding a module never
 * touches this file; adding a new *kind* of block does. See ADDING_NEW_MODULES.md.
 *
 * `html` fields carry inline markup authored in src/content, not user input, so
 * dangerouslySetInnerHTML is safe here — nothing from the network reaches it.
 *
 * Those fields may contain plain <a href="/learn/..."> links. Those bypass
 * next/link, so `withBase` adds the GitHub Pages prefix by hand — without it an
 * in-prose cross-reference 404s on the deployed site.
 */
function withBase(html: string): string {
  if (!BASE_PATH) return html;
  return html.replace(/href="\/(?!\/)/g, `href="${BASE_PATH}/`);
}
export default function ContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="content">
      {blocks.map((block, i) => (
        <Fragment key={i}>{renderBlock(block, i)}</Fragment>
      ))}
    </div>
  );
}

export function renderBlock(block: ContentBlock, key: number) {
  switch (block.type) {
    case "prose":
      return (
        <div
          className="[&>p:last-child]:mb-0"
          dangerouslySetInnerHTML={{ __html: `<p>${withBase(block.html)}</p>` }}
        />
      );

    case "heading": {
      const Tag = block.level === 3 ? "h3" : "h4";
      return (
        <Tag
          className={
            block.level === 3
              ? "mt-9 mb-3 text-[20px] font-semibold tracking-[-0.01em]"
              : "mt-7 mb-2 text-[17px] font-semibold"
          }
          style={{ color: "var(--text)" }}
        >
          {block.content}
        </Tag>
      );
    }

    case "bigIdea":
      return (
        <p
          className="my-6 border-l-[3px] pl-4 text-[19px] leading-[1.6] font-medium tracking-[-0.01em]"
          style={{ borderColor: "var(--accent)", color: "var(--text)" }}
        >
          {block.content}
        </p>
      );

    case "formula":
      return (
        <div
          className="my-6 overflow-x-auto rounded-[var(--radius)] border px-4 py-3.5"
          style={{ borderColor: "var(--line)", background: "var(--panel-2)" }}
        >
          {block.title ? (
            <div
              className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--accent-2)" }}
            >
              {block.title}
            </div>
          ) : null}
          <pre className="font-mono text-[14px] leading-[1.8] whitespace-pre">
            {block.lines}
          </pre>
        </div>
      );

    case "memoryHook":
      return (
        <Callout tone="hook">
          <span dangerouslySetInnerHTML={{ __html: withBase(block.content) }} />
          {block.detail ? (
            <small dangerouslySetInnerHTML={{ __html: withBase(block.detail) }} />
          ) : null}
        </Callout>
      );

    case "trap":
      return (
        <Callout tone="trap">
          <span dangerouslySetInnerHTML={{ __html: withBase(block.html) }} />
        </Callout>
      );

    case "world":
      return (
        <Callout tone="world">
          <span dangerouslySetInnerHTML={{ __html: withBase(block.html) }} />
        </Callout>
      );

    case "genai":
      return (
        <Callout tone="genai">
          <span dangerouslySetInnerHTML={{ __html: withBase(block.html) }} />
        </Callout>
      );

    case "fix":
      return (
        <Callout tone="fix">
          <span dangerouslySetInnerHTML={{ __html: withBase(block.html) }} />
        </Callout>
      );

    case "gradedDetail":
      return (
        <Callout tone="graded">
          <span dangerouslySetInnerHTML={{ __html: withBase(block.html) }} />
        </Callout>
      );

    case "citation":
      return (
        <Callout tone="cite" label={block.source}>
          <span dangerouslySetInnerHTML={{ __html: withBase(block.detail) }} />
        </Callout>
      );

    case "table":
    case "result":
      return (
        <figure className="my-6 w-full min-w-0">
          <div
            className="overflow-x-auto rounded-[var(--radius)] border"
            style={{ borderColor: "var(--line)" }}
          >
            <table className="w-full border-collapse text-[14.5px]">
              <thead>
                <tr style={{ background: "var(--panel)" }}>
                  {block.headers.map((h, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="border-b px-3.5 py-2.5 text-left font-semibold whitespace-nowrap"
                      style={{ borderColor: "var(--line)", color: "var(--muted)" }}
                      dangerouslySetInnerHTML={{ __html: withBase(h) }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 ? "var(--panel)" : "transparent" }}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={
                          block.type === "result" && ci > 0
                            ? "border-t px-3.5 py-2.5 align-top font-mono text-[13.5px]"
                            : "border-t px-3.5 py-2.5 align-top"
                        }
                        style={{ borderColor: "var(--line)" }}
                        dangerouslySetInnerHTML={{ __html: withBase(cell) }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption ? (
            <figcaption className="mt-2 text-[13.5px]" style={{ color: "var(--muted)" }}>
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={
            block.ordered
              ? "my-5 list-decimal space-y-2 pl-6 marker:font-mono marker:text-[var(--accent)]"
              : "my-5 list-disc space-y-2 pl-6 marker:text-[var(--accent)]"
          }
        >
          {block.items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: withBase(item) }} />
          ))}
        </Tag>
      );
    }

    case "code":
      return <CodeBlock spec={block.code} />;

    case "widget":
      return <LabMount lab={block.lab} caption={block.caption} />;

    case "datasetPreview":
      return <DatasetPreview dataset={block.dataset} />;

    case "vivaQuestions":
      return (
        <div className="my-6 space-y-2.5">
          {block.items.map((item, i) => (
            <details
              key={i}
              className="group rounded-[var(--radius)] border px-4 py-3"
              style={{ borderColor: "var(--line)", background: "var(--panel)" }}
            >
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span style={{ color: "var(--accent-2)" }} className="mr-2 font-mono text-[13px]">
                  Q{i + 1}
                </span>
                <span dangerouslySetInnerHTML={{ __html: withBase(item.q) }} />
              </summary>
              <p
                className="mt-2.5 text-[15px]"
                style={{ color: "var(--muted)" }}
                dangerouslySetInnerHTML={{ __html: withBase(item.a) }}
              />
            </details>
          ))}
        </div>
      );

    case "deepDive":
      return <DeepDive summary={block.summary} blocks={block.blocks} keyBase={key} />;

    default: {
      // Exhaustiveness guard: a new block type must be handled above.
      const never: never = block;
      return never;
    }
  }
}
