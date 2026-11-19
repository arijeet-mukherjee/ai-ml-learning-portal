"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { X } from "lucide-react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import SearchPalette from "./SearchPalette";
import ShortcutOverlay from "./ShortcutOverlay";
import { getNeighbours } from "@/content/modules";

/**
 * Layout plus the global keyboard surface.
 *
 * Shortcuts are deliberately single keys (the professor's notebook is read on a
 * phone and a laptop in equal measure), but they are ignored whenever focus is
 * inside a field, so typing in the search box never navigates.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  // The drawer is remembered as "open for this route", so navigating closes it
  // without an effect that calls setState.
  const [drawerFor, setDrawerFor] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

    const drawer = drawerFor !== null && drawerFor === pathname;
  const setDrawer = useCallback(
    (open: boolean) => setDrawerFor(open ? pathname : null),
    [pathname],
  );

  const moveSection = useCallback((dir: 1 | -1) => {
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section-anchor]"),
    );
    if (!headings.length) return;
    const y = window.scrollY + 90;
    const idx = headings.findIndex((h) => h.offsetTop > y + 2);
    const currentIdx = idx === -1 ? headings.length - 1 : Math.max(0, idx - 1);
    const target = headings[Math.min(headings.length - 1, Math.max(0, currentIdx + dir))];
    if (target) window.scrollTo({ top: target.offsetTop - 80, behavior: "smooth" });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        !!el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearch(true);
        return;
      }
      if (e.key === "Escape") {
        setSearch(false);
        setShortcuts(false);
        setDrawer(false);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "/":
          e.preventDefault();
          setSearch(true);
          break;
        case "?":
          e.preventDefault();
          setShortcuts((v) => !v);
          break;
        case "j":
          e.preventDefault();
          moveSection(1);
          break;
        case "k":
          e.preventDefault();
          moveSection(-1);
          break;
        case "m":
          router.push("/");
          break;
        case "d":
          setTheme(resolvedTheme === "light" ? "dark" : "light");
          break;
        case "ArrowRight":
        case "ArrowLeft": {
          const slug = pathname?.match(/^\/learn\/([^/]+)/)?.[1];
          if (!slug) return;
          const { prev, next } = getNeighbours(slug);
          const target = e.key === "ArrowRight" ? next : prev;
          if (target) {
            e.preventDefault();
            router.push(`/learn/${target.slug}`);
          }
          break;
        }
        default:
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moveSection, pathname, resolvedTheme, router, setDrawer, setTheme]);

  return (
    <>
      <Header onMenu={() => setDrawer(true)} onSearch={() => setSearch(true)} />

      <div className="mx-auto flex w-full max-w-[1400px] gap-0 px-0 lg:px-4">
        {/* Desktop sidebar */}
        <aside
          className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[270px] shrink-0 overflow-y-auto border-r py-5 lg:block"
          style={{ borderColor: "var(--line)" }}
        >
          <Sidebar />
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Mobile drawer */}
      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Course contents">
          <div
            className="absolute inset-0"
            style={{ background: "color-mix(in srgb, var(--ink) 70%, transparent)" }}
            onClick={() => setDrawer(false)}
          />
          <div
            className="absolute inset-y-0 left-0 w-[min(84vw,300px)] overflow-y-auto border-r py-4"
            style={{ borderColor: "var(--line)", background: "var(--panel)" }}
          >
            <div className="mb-3 flex justify-end px-3">
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close course contents"
                className="inline-flex shrink-0 h-9 w-9 items-center justify-center rounded-md"
                style={{ width: 36, height: 36, minWidth: 36, maxWidth: 36, color: "var(--muted)" }}
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      ) : null}

      <SearchPalette open={search} onClose={() => setSearch(false)} />
      <ShortcutOverlay open={shortcuts} onClose={() => setShortcuts(false)} />
    </>
  );
}
