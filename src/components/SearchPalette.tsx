"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MiniSearch, { type SearchResult } from "minisearch";
import { Beaker, FileText, Hash, Sigma, Terminal } from "lucide-react";
import { asset } from "@/lib/basePath";

/**
 * Cmd+K search over the build-generated index.
 *
 * MiniSearch rather than Fuse: it keeps an inverted index with prefix and fuzzy
 * matching and per-field boosting, so a few hundred long sections stay instant.
 * Fuse scans every document on every keystroke, which is the wrong shape here.
 *
 * The index is fetched lazily the first time the palette opens, so it costs
 * nothing on a page the reader never searches from.
 */
interface Doc {
  id: string;
  chapterSlug: string;
  chapterTitle: string;
  sectionId: string;
  sectionTitle: string;
  sectionKind: string;
  moduleId: string;
  moduleTitle: string;
  moduleNumber: string;
  kinds: string[];
  text: string;
}

const KIND_ICON: Record<string, typeof Beaker> = {
  lab: Beaker,
  formula: Sigma,
  code: Terminal,
};

export default function SearchPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Lazy-load the index the first time the palette is opened.
  useEffect(() => {
    if (!open || docs || error) return;
    let live = true;
    fetch(asset("/search-index.json"))
      .then((r) => {
        if (!r.ok) throw new Error(`search index unavailable (${r.status})`);
        return r.json();
      })
      .then((j: { docs: Doc[] }) => live && setDocs(j.docs))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [open, docs, error]);

  // Focus only: `active` is reset by the query's onChange, so no setState here.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  const engine = useMemo(() => {
    if (!docs) return null;
    const ms = new MiniSearch<Doc>({
      fields: ["sectionTitle", "chapterTitle", "moduleTitle", "text"],
      storeFields: [
        "chapterSlug",
        "chapterTitle",
        "sectionId",
        "sectionTitle",
        "sectionKind",
        "moduleId",
        "moduleTitle",
        "moduleNumber",
        "kinds",
        "text",
      ],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { sectionTitle: 4, chapterTitle: 3, moduleTitle: 1.5 },
      },
    });
    ms.addAll(docs);
    return ms;
  }, [docs]);

  const results = useMemo(() => {
    if (!engine || query.trim().length < 2) return [];
    return engine.search(query).slice(0, 24) as (SearchResult & Doc)[];
  }, [engine, query]);

  // Group by module so results read as "where in the course is this".
  const grouped = useMemo(() => {
    const map = new Map<string, (SearchResult & Doc)[]>();
    for (const r of results) {
      const key = `M${r.moduleNumber} · ${r.moduleTitle}`;
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [results]);

  const flat = grouped.flatMap(([, rs]) => rs);

  const go = (r: Doc) => {
    onClose();
    setQuery("");
    router.push(`/learn/${r.chapterSlug}#${r.sectionId}`);
  };

  if (!open) return null;

  const snippet = (r: SearchResult & Doc) => {
    const terms = (r.terms ?? []).filter(Boolean);
    const lower = r.text.toLowerCase();
    let at = -1;
    for (const t of terms) {
      at = lower.indexOf(t.toLowerCase());
      if (at >= 0) break;
    }
    const start = Math.max(0, at - 50);
    const raw = r.text.slice(start, start + 190);
    return (start ? "..." : "") + raw + (r.text.length > start + 190 ? "..." : "");
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search the course"
    >
      <div
        className="absolute inset-0"
        style={{ background: "color-mix(in srgb, var(--ink) 72%, transparent)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[640px] overflow-hidden rounded-[var(--radius)] border shadow-[var(--shadow-2)]"
        style={{ borderColor: "var(--line-strong)", background: "var(--panel)" }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, flat.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && flat[active]) {
              e.preventDefault();
              go(flat[active]);
            } else if (e.key === "Escape") {
              onClose();
            }
          }}
          placeholder="Search formulas, labs, traps, memory hooks..."
          aria-label="Search query"
          className="w-full border-b bg-transparent px-4 py-3.5 text-[15.5px] outline-none"
          style={{ borderColor: "var(--line)", color: "var(--text)" }}
        />

        <div className="max-h-[56vh] overflow-y-auto">
          {error ? (
            <p className="px-4 py-6 text-[14px]" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          ) : !docs ? (
            <p className="px-4 py-6 text-[14px]" style={{ color: "var(--muted-2)" }}>
              Loading the index...
            </p>
          ) : query.trim().length < 2 ? (
            <p className="px-4 py-6 text-[14px]" style={{ color: "var(--muted-2)" }}>
              Type at least two characters. Try <code>bayes</code>, <code>hinge</code>,{" "}
              <code>36.8</code> or <code>loc vs iloc</code>.
            </p>
          ) : !flat.length ? (
            <p className="px-4 py-6 text-[14px]" style={{ color: "var(--muted-2)" }}>
              Nothing matched &ldquo;{query}&rdquo;.
            </p>
          ) : (
            grouped.map(([group, rs]) => (
              <div key={group}>
                <div
                  className="px-4 pt-3 pb-1 font-mono text-[10.5px] uppercase tracking-[0.14em]"
                  style={{ color: "var(--muted-2)" }}
                >
                  {group}
                </div>
                {rs.map((r) => {
                  const idx = flat.indexOf(r);
                  const Icon =
                    KIND_ICON[r.kinds[0]] ?? (r.sectionKind === "recap" ? Hash : FileText);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => go(r)}
                      onMouseEnter={() => setActive(idx)}
                      className="flex w-full items-start gap-3 px-4 py-2.5 text-left"
                      style={{
                        background: idx === active ? "var(--accent-soft)" : "transparent",
                      }}
                    >
                      <Icon
                        size={15}
                        aria-hidden
                        className="mt-1 shrink-0"
                        style={{ color: "var(--accent-2)" }}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[14.5px] font-medium">
                          {r.sectionTitle}
                          <span className="ml-2 font-normal" style={{ color: "var(--muted-2)" }}>
                            {r.chapterTitle}
                          </span>
                        </span>
                        <span
                          className="mt-0.5 block overflow-hidden text-[12.5px] leading-snug"
                          style={{
                            color: "var(--muted)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {snippet(r)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div
          className="flex items-center gap-3 border-t px-4 py-2 font-mono text-[11px]"
          style={{ borderColor: "var(--line)", color: "var(--muted-2)" }}
        >
          <span>up/down move</span>
          <span>enter open</span>
          <span>esc close</span>
          {docs ? <span className="ml-auto">{docs.length} sections indexed</span> : null}
        </div>
      </div>
    </div>
  );
}
