"use client";

import { motion, useReducedMotion } from "framer-motion";

interface ScopeRow {
  name: string;
  cap: string;
  status: "IN BUILD" | "SPECIFIED";
}

// The honesty section, weaponized. Pre-MVP truth as a spec table, not a hidden
// disclaimer. One integration in build, four specified, none GA yet.
const SCOPE: ScopeRow[] = [
  { name: "GitHub", cap: "repo:read · pr:write", status: "IN BUILD" },
  { name: "PostgreSQL", cap: "table:read · row:write", status: "SPECIFIED" },
  { name: "Slack", cap: "chat:write", status: "SPECIFIED" },
  { name: "AWS", cap: "s3:read · kms:sign", status: "SPECIFIED" },
  { name: "Stripe", cap: "charge:create", status: "SPECIFIED" },
];

export default function ScopeOfWork() {
  const reduce = useReducedMotion();

  return (
    <div className="border-b border-dashed border-ink-border dark:border-[#38332b] bg-[#faf9f5] dark:bg-[#211e1a] transition-colors duration-300">
      {/* IDE Panel Header */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-paper dark:bg-[#1a1815]/80 border-b border-ink-border dark:border-[#38332b]/60 text-[10px] font-mono text-ink-muted dark:text-[#928b7d] select-none uppercase tracking-wider">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-[#3b82f6] font-extrabold">&gt;</span>
          <span>SCOPE_OF_WORK</span>
        </div>
        <div className="font-semibold">
          [<span className="text-[#3b82f6] font-bold">4</span>/6]
        </div>
      </div>

      <div className="p-6 md:p-12">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          <div className="max-w-2xl space-y-4">
            <span className="inline-block rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-bold font-mono bg-[#c03a2b]/10 dark:bg-amber/10 text-[#c03a2b] dark:text-amber border border-[#c03a2b]/20 dark:border-amber/20 select-none">
              SEC. 4 — SCOPE OF WORK
            </span>
            <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-tight">
              {"What ships, and what's only specified."}
            </h2>
            <p className="text-sm md:text-base text-ink-muted dark:text-[#928b7d] leading-relaxed">
              One integration is in build. Four are specified. None are generally
              available yet. We publish the roadmap instead of dressing a
              prototype up as a product.
            </p>
          </div>

          {/* RFC status table */}
          <div className="rounded-xl border border-ink-border dark:border-[#38332b] bg-paper dark:bg-[#1f1c17] overflow-hidden shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_#38332b] transition-colors duration-300">
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink-border dark:border-[#38332b] bg-[#faf9f5] dark:bg-[#1a1815] font-mono text-[10px] uppercase tracking-wider select-none">
              <span className="font-bold text-[#17150f] dark:text-[#ece7dd]">
                RFC-004 · Integration scope
              </span>
              <span className="text-ink-muted dark:text-[#928b7d]">
                1 in build · 4 specified
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[9rem_1fr_9rem] gap-x-4 px-5 py-2 border-b border-dashed border-ink-border dark:border-[#38332b] font-mono text-[9px] uppercase tracking-wider text-ink-muted/70 dark:text-[#928b7d]/70 select-none">
              <span>Integration</span>
              <span className="hidden sm:block">Example capability</span>
              <span className="text-right sm:text-left">Status</span>
            </div>

            <div className="px-5">
              {SCOPE.map((row, i) => {
                const inBuild = row.status === "IN BUILD";
                return (
                  <motion.div
                    key={row.name}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-[1fr_auto] sm:grid-cols-[9rem_1fr_9rem] gap-x-4 gap-y-1 items-center py-3.5 border-b border-dashed border-ink-border/60 dark:border-[#38332b]/60 last:border-b-0"
                  >
                    <span className="font-mono text-sm font-bold text-[#17150f] dark:text-[#ece7dd]">
                      {row.name}
                    </span>
                    <span className="hidden sm:block font-mono text-[11px] text-ink-muted dark:text-[#928b7d]">
                      {row.cap}
                    </span>
                    <span className="justify-self-end sm:justify-self-start">
                      {inBuild ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-amber/15 text-[#8a6a00] dark:text-amber border border-amber/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                          In build
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-[#928b7d] border border-ink-border dark:border-[#38332b]">
                          Specified
                        </span>
                      )}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
