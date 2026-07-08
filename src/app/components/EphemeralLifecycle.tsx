"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import CapabilitiesGrid, {
  initialCapabilities,
  type Capability,
} from "./CapabilitiesGrid";
import AuditLedger, { type LedgerEntry } from "./AuditLedger";

const RE_MINT_DELAY = 3000; // ms a token sits expired before the runtime auto re-mints

function stamp() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

// FIG.2 — the invented object dissected like a labeled engineering drawing.
const ANATOMY: { field: string; value: string; note: string }[] = [
  { field: "scope", value: '"s3:read"', note: "least privilege, one verb" },
  { field: "resource", value: '"aws/prod-store"', note: "exact target, not the account" },
  { field: "ttl", value: "450s", note: "self-expiring, no rotation" },
  { field: "audit_ref", value: '"BRK-0047"', note: "permanent record on expiry" },
];

/**
 * Owns the ephemeral-token lifecycle for SEC.03 and wires it to the ledger:
 * tokens count down in the runtime grid, and the exact moment one expires (or
 * auto re-mints) a real row appends to the paper ledger below. One cause, one
 * effect, on screen.
 */
export default function EphemeralLifecycle() {
  const [capabilities, setCapabilities] = useState<Capability[]>(initialCapabilities);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  const capsRef = useRef(capabilities);
  const brk = useRef(46); // next audit ref -> first expiry records BRK-0047

  useEffect(() => {
    capsRef.current = capabilities;
  }, [capabilities]);

  const nextRef = () => {
    brk.current += 1;
    return `BRK-${String(brk.current).padStart(4, "0")}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const events: LedgerEntry[] = [];

      const next = capsRef.current.map<Capability>((cap) => {
        if (cap.status === "expired") {
          if (cap.expiredAt && now - cap.expiredAt > RE_MINT_DELAY) {
            const seconds = 20 + Math.floor(Math.random() * 40); // 20-60s
            events.push({
              id: `${cap.id}-i-${now}`,
              ref: nextRef(),
              scope: cap.scope,
              resource: cap.name,
              event: "ISSUED",
              ts: stamp(),
            });
            return {
              ...cap,
              maxTTL: seconds,
              currentTTL: seconds,
              status: "granted",
              expiredAt: undefined,
            };
          }
          return cap;
        }

        const nextTTL = cap.currentTTL - 1;
        if (nextTTL <= 0) {
          events.push({
            id: `${cap.id}-e-${now}`,
            ref: nextRef(),
            scope: cap.scope,
            resource: cap.name,
            event: "EXPIRED",
            ts: stamp(),
          });
          return { ...cap, currentTTL: 0, status: "expired", expiredAt: now };
        }
        return { ...cap, currentTTL: nextTTL, status: nextTTL < 15 ? "expiring" : "granted" };
      });

      capsRef.current = next;
      setCapabilities(next);
      if (events.length) setLedger((l) => [...l, ...events].slice(-40));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRenew = (id: string) => {
    const cap = capsRef.current.find((c) => c.id === id);
    if (!cap) return;
    const seconds = 20 + Math.floor(Math.random() * 40);
    const minted: LedgerEntry = {
      id: `${cap.id}-i-${Date.now()}`,
      ref: nextRef(),
      scope: cap.scope,
      resource: cap.name,
      event: "ISSUED",
      ts: stamp(),
    };
    const next = capsRef.current.map<Capability>((c) =>
      c.id === id
        ? { ...c, maxTTL: seconds, currentTTL: seconds, status: "granted", expiredAt: undefined }
        : c,
    );
    capsRef.current = next;
    setCapabilities(next);
    setLedger((l) => [...l, minted].slice(-40));
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 lg:h-full lg:flex lg:flex-col lg:justify-between space-y-6 lg:space-y-0"
        >
          <div className="space-y-5 flex flex-col items-start">
            <span className="inline-block rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-bold font-mono bg-[#c03a2b]/10 dark:bg-amber/10 text-[#c03a2b] dark:text-amber border border-[#c03a2b]/20 dark:border-amber/20 select-none">
              SEC. 3 — EPHEMERAL LIFE
            </span>
            <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-tight text-left">
              The capability, and the record it leaves
            </h2>
            <p className="text-sm md:text-base text-[#17150f] dark:text-[#ece7dd]/90 leading-relaxed font-sans font-medium text-left">
              Every capability is scoped to one action and expires in seconds.
              Rather than broad access, it delegates a minimal, execution-locked
              grant that cannot outlive its task.
            </p>
            <p className="text-sm text-ink-muted dark:text-[#928b7d] leading-relaxed font-sans text-left">
              Watch a token expire in the runtime grid. The same instant, a
              permanent line appends to the ledger below. The secret dies; the
              record is born.
            </p>
          </div>

          {/* FIG.2 — anatomy of a capability */}
          <div className="w-full pt-4 lg:pt-0">
            <div className="p-1.25 rounded-2xl bg-[#17150f]/5 dark:bg-white/5 border border-ink-border dark:border-[#38332b]/60 shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_#38332b] select-none transition-all duration-300">
              <div className="p-4 bg-[#faf9f5] dark:bg-[#211e1a] rounded-[calc(1rem-5px)] font-mono text-[10.5px] space-y-2.5 text-ink-muted dark:text-[#928b7d] transition-colors duration-300 text-left">
                <p className="text-[#17150f] dark:text-[#ece7dd] font-bold border-b border-dashed border-ink-border dark:border-[#38332b] pb-2 uppercase tracking-wider text-[10px]">
                  Fig.2 — Anatomy of a capability
                </p>
                <div className="space-y-2">
                  {ANATOMY.map((row) => (
                    <div
                      key={row.field}
                      className="grid grid-cols-[4.75rem_1fr] gap-x-2 items-baseline"
                    >
                      <span className="text-ink-muted/75 dark:text-[#928b7d]/75">
                        {row.field}
                      </span>
                      <span>
                        <span className="text-[#c03a2b] dark:text-amber font-semibold">
                          {row.value}
                        </span>
                        <span className="block text-[9px] mt-0.5 text-ink-muted/70 dark:text-[#928b7d]/70 font-sans">
                          {row.note}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Runtime block: tokens live and expire here */}
        <div className="lg:col-span-8">
          <CapabilitiesGrid capabilities={capabilities} onRenew={handleRenew} />
        </div>
      </div>

      {/* Paper: the append-only record the runtime leaves behind */}
      <AuditLedger entries={ledger} />
    </div>
  );
}
