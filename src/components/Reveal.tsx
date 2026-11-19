"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll reveal. Fires once, never animates layout-shifting properties, and
 * collapses to a plain render when the viewer asks for reduced motion.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: `translate3d(0, ${y}px, 0)` }}
      whileInView={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
      viewport={{ once: true, margin: "-60px 0px -60px 0px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
