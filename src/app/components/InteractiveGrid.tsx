"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useReducedMotion,
} from "framer-motion";

/**
 * Cursor-reactive hero grid.
 *
 * Isolated client leaf so pointer tracking never re-renders the page: the cursor
 * position lives in motion values (not React state), a spring gives it the smooth
 * trailing "advance", and the mask strings are composed with useMotionTemplate so
 * they update outside the React render cycle. Listens on the parent element so
 * moves over the hero content still register. Collapses to the static base grid
 * for touch/coarse pointers and reduced-motion.
 */
export default function InteractiveGrid() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [interactive, setInteractive] = useState(false);

  const rawX = useMotionValue(-9999);
  const rawY = useMotionValue(-9999);
  const spring = { stiffness: 150, damping: 20 };
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);
  const glow = useSpring(0, { stiffness: 120, damping: 22 });

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !fine) return;

    const parent = wrapRef.current?.parentElement;
    if (!parent) return;

    setInteractive(true);
    let rect = parent.getBoundingClientRect();
    const measure = () => {
      rect = parent.getBoundingClientRect();
    };

    const onMove = (e: PointerEvent) => {
      rawX.set(e.clientX - rect.left);
      rawY.set(e.clientY - rect.top);
    };
    const onEnter = (e: PointerEvent) => {
      measure();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      rawX.set(px);
      rawY.set(py);
      x.jump(px); // snap the spring so the glow appears under the cursor, no sweep-in
      y.jump(py);
      glow.set(1);
    };
    const onLeave = () => glow.set(0);

    parent.addEventListener("pointermove", onMove, { passive: true });
    parent.addEventListener("pointerenter", onEnter);
    parent.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerenter", onEnter);
      parent.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [reduce, rawX, rawY, x, y, glow]);

  const sharpMask = useMotionTemplate`radial-gradient(150px circle at ${x}px ${y}px, black 20%, transparent 100%)`;
  const haloMask = useMotionTemplate`radial-gradient(220px circle at ${x}px ${y}px, black 10%, transparent 100%)`;

  return (
    <div ref={wrapRef} className="absolute inset-0 z-0 pointer-events-none">
      {/* Static base grid (32px) */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#d4d0c5_1px,transparent_1px),linear-gradient(to_bottom,#d4d0c5_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#38332b_1px,transparent_1px),linear-gradient(to_bottom,#38332b_1px,transparent_1px)] opacity-[0.25] dark:opacity-[0.4]"
        style={{
          backgroundSize: "2rem 2rem",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 50%, black 80%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 50% at 50% 50%, black 80%, transparent 100%)",
        }}
      />

      {interactive && (
        <motion.div className="absolute inset-0" style={{ opacity: glow }}>
          {/* Cursor-lit sharp grid lines */}
          <motion.div
            className="absolute inset-0 opacity-85 dark:opacity-70 bg-[linear-gradient(to_right,#c03a2b_1.5px,transparent_1.5px),linear-gradient(to_bottom,#c03a2b_1.5px,transparent_1.5px)] dark:bg-[linear-gradient(to_right,#ffb000_1.5px,transparent_1.5px),linear-gradient(to_bottom,#ffb000_1.5px,transparent_1.5px)]"
            style={{
              backgroundSize: "2rem 2rem",
              maskImage: sharpMask,
              WebkitMaskImage: sharpMask,
            }}
          />
          {/* Blurred glow halo */}
          <motion.div
            className="absolute inset-0 blur-[2.5px] opacity-70 dark:opacity-50 bg-[linear-gradient(to_right,#c03a2b_2px,transparent_2px),linear-gradient(to_bottom,#c03a2b_2px,transparent_2px)] dark:bg-[linear-gradient(to_right,#ffb000_2px,transparent_2px),linear-gradient(to_bottom,#ffb000_2px,transparent_2px)]"
            style={{
              backgroundSize: "2rem 2rem",
              maskImage: haloMask,
              WebkitMaskImage: haloMask,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
