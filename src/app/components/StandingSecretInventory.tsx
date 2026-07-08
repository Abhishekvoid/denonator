"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * SEC.1 — The standing secret. The emotional inverse of the hero: the hero's
 * capability is born, lives, expires, and leaves a record. Here nothing expires.
 *
 * Observation over explanation. The register is static; only *time* moves:
 *   1. each credential's age ticks up (they are still alive),
 *   2. a system clock ticks,
 *   3. occasionally a new agent boots and inherits all of them, then leaves —
 *      the credentials remain.
 * No scramble gimmick, no entrance animations. Reduced motion freezes all three.
 */

const CREDENTIALS: { name: string; base: number }[] = [
  { name: "GITHUB_PAT", base: 421 },
  { name: "AWS_ACCESS_KEY", base: 286 },
  { name: "DB_PASSWORD", base: 812 },
  { name: "SLACK_BOT_TOKEN", base: 197 },
];

const COLS =
  "sm:grid-cols-[1.7fr_0.9fr_1fr_1.15fr_0.85fr_0.85fr]";

export default function StandingSecretInventory() {
  const reduce = useReducedMotion();
  const [ages, setAges] = useState<number[]>(CREDENTIALS.map((c) => c.base));
  const [clock, setClock] = useState("");
  const [agent, setAgent] = useState<number | null>(null);

  // Age ticks up — they are still alive.
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setAges((a) => a.map((n) => n + 1)), 2400);
    return () => clearInterval(id);
  }, [reduce]);

  // System clock.
  useEffect(() => {
    if (reduce) return;
    const update = () =>
      setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    const kick = setTimeout(update, 0);
    const id = setInterval(update, 1000);
    return () => {
      clearTimeout(kick);
      clearInterval(id);
    };
  }, [reduce]);

  // A new agent boots, inherits everything, then leaves. The credentials remain.
  useEffect(() => {
    if (reduce) return;
    let hide: ReturnType<typeof setTimeout>;
    const show = () => {
      setAgent(20 + Math.floor(Math.random() * 79));
      hide = setTimeout(() => setAgent(null), 3200);
    };
    const first = setTimeout(show, 4000);
    const id = setInterval(show, 9000);
    return () => {
      clearTimeout(first);
      clearTimeout(hide);
      clearInterval(id);
    };
  }, [reduce]);

  return (
    <div className="w-full max-w-310 mx-auto space-y-10">
      {/* Copy */}
      <div className="max-w-2xl space-y-4">
        <span className="inline-block rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-bold font-mono bg-[#c03a2b]/10 dark:bg-amber/10 text-[#c03a2b] dark:text-amber border border-[#c03a2b]/20 dark:border-amber/20 select-none">
          SEC. 1 — THE STANDING SECRET
        </span>
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-tight">
          {"The problem isn't a breach. It's the inventory."}
        </h2>
        <p className="text-sm md:text-base text-ink-muted dark:text-[#928b7d] leading-relaxed">
          Every credential your agents can reach is permanent, over-scoped, and
          inherited by every new worker. Most never expire.
        </p>
      </div>

      {/* The register */}
      <div className="rounded-xl border border-ink-border bg-panel overflow-hidden shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_var(--color-ink-border)] transition-colors duration-300">
        {/* Register header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-border bg-paper font-mono text-[10px] uppercase tracking-wider select-none">
          <span className="font-bold text-[#17150f] dark:text-[#ece7dd]">
            Inventory of standing credentials
          </span>
          <span className="flex items-center gap-4 text-ink-muted dark:text-[#928b7d]">
            <span className="tabular-nums hidden sm:inline">
              sys {clock || "--:--:--"}
            </span>
            <span className="flex items-center gap-1.5 text-[#ef4444] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
              Unresolved
            </span>
          </span>
        </div>

        {/* Column labels (desktop) */}
        <div
          className={`hidden sm:grid ${COLS} gap-x-4 px-5 py-2 border-b border-dashed border-ink-border dark:border-[#38332b] font-mono text-[9px] uppercase tracking-wider text-ink-muted/70 dark:text-[#928b7d]/70 select-none`}
        >
          <span>Credential</span>
          <span>Status</span>
          <span>Scope</span>
          <span>Age</span>
          <span>Expires</span>
          <span>Rotation</span>
        </div>

        {/* Rows — static; only the age moves */}
        <div className="px-5">
          {CREDENTIALS.map((c, i) => (
            <div
              key={c.name}
              className={`grid grid-cols-1 ${COLS} gap-x-4 gap-y-1.5 py-4 border-b border-dashed border-ink-border/60 dark:border-[#38332b]/60 last:border-b-0 font-mono text-[11px]`}
            >
              {/* Credential */}
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shrink-0" />
                <span className="font-bold text-[13px] text-[#17150f] dark:text-[#ece7dd]">
                  {c.name}
                </span>
              </div>

              <Field label="Status">
                <span className="text-[#17150f] dark:text-[#ece7dd]">ACTIVE</span>
              </Field>
              <Field label="Scope">
                <span className="text-[#ef4444] font-semibold">everything</span>
              </Field>
              <Field label="Age">
                <span className="text-[#17150f] dark:text-[#ece7dd] tabular-nums">
                  {ages[i].toLocaleString()} days
                </span>
                <span className="text-[#ef4444] ml-1" aria-hidden="true">
                  &#8593;
                </span>
              </Field>
              <Field label="Expires">
                <span className="text-[#ef4444] font-semibold">Never</span>
              </Field>
              <Field label="Rotation">
                <span className="text-[#ef4444] font-semibold">Never</span>
              </Field>
            </div>
          ))}
        </div>

        {/* A new worker inherits everything, then leaves */}
        <div className="px-5 py-2.5 border-t border-ink-border bg-paper min-h-[2.4rem] flex items-center font-mono text-[10px]">
          <AnimatePresence mode="wait">
            {agent !== null ? (
              <motion.span
                key={agent}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="text-ink-muted dark:text-[#928b7d]"
              >
                <span className="text-[#ef4444]">&#8627;</span> agent-
                {String(agent).padStart(2, "0")} booted &middot; inherited{" "}
                <span className="text-[#17150f] dark:text-[#ece7dd]">
                  all 4 standing credentials
                </span>
              </motion.span>
            ) : (
              <span className="text-ink-muted/50 dark:text-[#928b7d]/50 select-none">
                awaiting next agent&hellip;
              </span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Closing — large, quiet, no animation */}
      <p className="font-sans text-2xl md:text-3xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-snug text-center max-w-2xl mx-auto pt-2">
        Nothing expires.{" "}
        <span className="text-[#c03a2b] dark:text-amber">
          Every new agent inherits all of it.
        </span>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="sm:hidden text-[9px] uppercase tracking-wider text-ink-muted/60 dark:text-[#928b7d]/60 w-16 shrink-0">
        {label}
      </span>
      <span className="flex items-center">{children}</span>
    </div>
  );
}
