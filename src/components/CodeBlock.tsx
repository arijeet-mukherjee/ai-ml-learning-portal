"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CodeSpec } from "@/types/content";

const KEYWORDS = new Set([
  "import", "from", "as", "def", "return", "if", "elif", "else", "for", "while",
  "in", "not", "and", "or", "None", "True", "False", "print", "class", "with",
  "lambda", "break", "continue", "try", "except", "raise", "pass", "yield",
  "global", "assert", "del", "is",
]);

type Tok = { text: string; kind: "cmt" | "str" | "kw" | "num" | "fn" | "txt" };

/**
 * Tiny Python tokeniser. A full highlighter library would cost more bundle than
 * the entire content layer; this covers comments, strings, keywords, numbers and
 * call names, which is everything the course snippets contain.
 */
function tokenise(src: string): Tok[][] {
  return src.split("\n").map((line) => {
    const out: Tok[] = [];
    let i = 0;
    while (i < line.length) {
      const rest = line.slice(i);

      const cmt = /^#.*/.exec(rest);
      if (cmt) {
        out.push({ text: cmt[0], kind: "cmt" });
        break;
      }

      const str = /^(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/.exec(rest);
      if (str) {
        out.push({ text: str[0], kind: "str" });
        i += str[0].length;
        continue;
      }

      const word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
      if (word) {
        const after = line.slice(i + word[0].length);
        const kind = KEYWORDS.has(word[0])
          ? "kw"
          : after.startsWith("(")
            ? "fn"
            : "txt";
        out.push({ text: word[0], kind });
        i += word[0].length;
        continue;
      }

      const num = /^\d[\d_.eE+-]*/.exec(rest);
      if (num) {
        out.push({ text: num[0], kind: "num" });
        i += num[0].length;
        continue;
      }

      out.push({ text: line[i], kind: "txt" });
      i += 1;
    }
    return out;
  });
}

const COLOR: Record<Tok["kind"], string> = {
  cmt: "var(--muted-2)",
  str: "var(--good)",
  kw: "var(--violet)",
  num: "var(--warn)",
  fn: "var(--accent-2)",
  txt: "inherit",
};

export default function CodeBlock({ spec }: { spec: CodeSpec }) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(
    () => (spec.language === "python" ? tokenise(spec.code) : null),
    [spec.code, spec.language],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(spec.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — the code is selectable either way */
    }
  }

  return (
    <figure className="my-6 w-full min-w-0">
      <div
        className="overflow-hidden rounded-[var(--radius)] border"
        style={{ borderColor: "var(--line)", background: "var(--ink-2)" }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-2"
          style={{ borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <span
            className="truncate font-mono text-[11.5px] uppercase tracking-[0.14em]"
            style={{ color: "var(--muted)" }}
          >
            {spec.title ?? "python"}
          </span>
          <button
            type="button"
            onClick={copy}
            className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[12px] transition-colors"
            style={{ color: copied ? "var(--good)" : "var(--muted)" }}
          >
            {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto px-4 py-3.5 text-[13.5px] leading-[1.75]">
          <code className="font-mono">
            {lines
              ? lines.map((toks, li) => (
                  <span key={li} className="block whitespace-pre">
                    {toks.length === 0
                      ? " "
                      : toks.map((t, ti) => (
                          <span key={ti} style={{ color: COLOR[t.kind] }}>
                            {t.text}
                          </span>
                        ))}
                  </span>
                ))
              : spec.code}
          </code>
        </pre>
      </div>
      {spec.caption ? (
        <figcaption className="mt-2 text-[13.5px]" style={{ color: "var(--muted)" }}>
          {spec.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
