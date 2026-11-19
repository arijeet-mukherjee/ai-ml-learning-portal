"use client";

import { useEffect, useState } from "react";

/** A hairline progress bar pinned under the header, driven by scroll position. */
export default function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="fixed top-14 right-0 left-0 z-30 h-[2px]"
      style={{ background: "transparent" }}
      aria-hidden
    >
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
        }}
      />
    </div>
  );
}
