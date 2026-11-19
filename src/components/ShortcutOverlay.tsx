"use client";

const KEYS: [string, string][] = [
  ["/  or  ⌘K", "Search the whole course"],
  ["j  /  k", "Next / previous section"],
  ["→  /  ←", "Next / previous chapter"],
  ["m", "Jump to the master map"],
  ["d", "Toggle dark and light"],
  ["?", "Show this list"],
  ["esc", "Close anything open"],
];

export default function ShortcutOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[95] grid place-items-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="absolute inset-0"
        style={{ background: "color-mix(in srgb, var(--ink) 75%, transparent)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[420px] rounded-[var(--radius)] border p-5 shadow-[var(--shadow-2)]"
        style={{ borderColor: "var(--line-strong)", background: "var(--panel)" }}
      >
        <h2 className="mb-3 text-[17px] font-semibold">Keyboard shortcuts</h2>
        <dl className="space-y-2">
          {KEYS.map(([k, label]) => (
            <div key={k} className="flex items-baseline justify-between gap-4">
              <dt>
                <kbd
                  className="rounded px-2 py-1 font-mono text-[12px]"
                  style={{ background: "var(--panel-2)", color: "var(--accent)" }}
                >
                  {k}
                </kbd>
              </dt>
              <dd className="text-[14px]" style={{ color: "var(--muted)" }}>
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
