"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface LedgerEntry {
  id: string;
  ref: string; // BRK-00xx
  scope: string; // e.g. s3:read
  resource: string; // capability name
  event: "ISSUED" | "EXPIRED";
  ts: string; // HH:MM:SS
}

const MAX_VISIBLE = 6;

/**
 * Append-only "paper" ledger. Presentational: receives the entries the runtime
 * produces. Every time a token expires (or re-mints) in the grid above, a row
 * types in at the bottom here. The secret dies in the runtime block; the record
 * is born on the ledger.
 */
export default function AuditLedger({ entries }: { entries: LedgerEntry[] }) {
  const reduce = useReducedMotion();
  const visible = entries.slice(-MAX_VISIBLE);

  return (
    <div className="rounded-xl border border-ink-border dark:border-[#38332b] bg-[#faf9f5] dark:bg-[#1f1c17] overflow-hidden shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_#38332b] transition-colors duration-300">
      {/* Ledger header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-border dark:border-[#38332b] bg-paper dark:bg-[#1a1815] font-mono text-[10px] uppercase tracking-wider text-ink-muted dark:text-[#928b7d] select-none">
        <span className="font-bold text-[#17150f] dark:text-[#ece7dd]">
          Audit Ledger
          <span className="ml-2 font-normal text-ink-muted dark:text-[#928b7d]">
            append-only
          </span>
        </span>
        <span className="tabular-nums">{entries.length} records</span>
      </div>

      {/* Column labels */}
      <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[7rem_7rem_1fr_9rem_auto] gap-x-3 px-4 py-2 border-b border-dashed border-ink-border dark:border-[#38332b] font-mono text-[9px] uppercase tracking-wider text-ink-muted/70 dark:text-[#928b7d]/70 select-none">
        <span>Ref</span>
        <span className="hidden sm:block">Scope</span>
        <span>Resource</span>
        <span>Event</span>
        <span className="hidden sm:block text-right">Time</span>
      </div>

      {/* Rows */}
      <div className="px-4 py-1.5 font-mono text-[11px] min-h-[9.5rem]">
        {visible.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-ink-muted/70 dark:text-[#928b7d]/70">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span>Awaiting first expiry in the runtime block above…</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((e, i) => {
              const isNewest = i === visible.length - 1;
              const isExpired = e.event === "EXPIRED";
              return (
                <motion.div
                  key={e.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: isNewest ? 1 : 0.55, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={`grid grid-cols-[auto_1fr_auto] sm:grid-cols-[7rem_7rem_1fr_9rem_auto] gap-x-3 items-center py-1.5 border-b border-dashed border-ink-border/50 dark:border-[#38332b]/50 last:border-b-0 ${
                    isNewest ? "text-[#17150f] dark:text-[#ece7dd]" : "text-ink-muted dark:text-[#928b7d]"
                  }`}
                >
                  <span
                    className={`font-bold tabular-nums ${
                      isNewest ? "text-[#c03a2b] dark:text-amber" : ""
                    }`}
                  >
                    {e.ref}
                  </span>
                  <span className="hidden sm:block truncate text-ink-muted dark:text-[#928b7d]">
                    {e.scope}
                  </span>
                  <span className="truncate">{e.resource}</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`font-bold ${
                        isExpired ? "text-[#ef4444]" : "text-[#10b981]"
                      }`}
                    >
                      {e.event}
                    </span>
                    <span className="text-ink-muted/70 dark:text-[#928b7d]/70">
                      {isExpired ? "✓ recorded" : "✓ minted"}
                    </span>
                  </span>
                  <span className="hidden sm:block text-right tabular-nums text-ink-muted/70 dark:text-[#928b7d]/70">
                    {e.ts}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
