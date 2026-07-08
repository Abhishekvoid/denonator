"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const TRUST: { who: string; layer: string; missing?: boolean }[] = [
  { who: "Humans", layer: "Okta" },
  { who: "Services", layer: "Vault" },
  { who: "Autonomous software", layer: "nothing", missing: true },
];

export default function Position() {
  const reduce = useReducedMotion();

  return (
    <div className="border-b border-dashed border-ink-border dark:border-[#38332b] bg-paper dark:bg-[#1a1815] transition-colors duration-300">
      {/* IDE Panel Header */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#faf9f5]/80 dark:bg-[#211e1a]/80 border-b border-ink-border dark:border-[#38332b]/60 text-[10px] font-mono text-ink-muted dark:text-[#928b7d] select-none uppercase tracking-wider">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-[#3b82f6] font-extrabold">&gt;</span>
          <span>POSITION</span>
        </div>
        <div className="font-semibold">
          [<span className="text-[#3b82f6] font-bold">5</span>/6]
        </div>
      </div>

      <div className="p-6 md:p-12">
        <div className="w-full max-w-4xl mx-auto space-y-10">
          <div className="space-y-5">
            <span className="inline-block rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-bold font-mono bg-[#c03a2b]/10 dark:bg-amber/10 text-[#c03a2b] dark:text-amber border border-[#c03a2b]/20 dark:border-amber/20 select-none">
              SEC. 5 — POSITION
            </span>
            <h2 className="font-sans text-4xl md:text-5xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-[1.05] max-w-2xl">
              {"Your agents don't need your secrets."}
            </h2>
          </div>

          {/* Trust-layer comparison */}
          <div className="border-t border-ink-border dark:border-[#38332b]">
            {TRUST.map((t, i) => (
              <motion.div
                key={t.who}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center gap-x-4 py-5 border-b border-dashed border-ink-border/60 dark:border-[#38332b]/60"
              >
                <span className="font-sans text-lg md:text-xl font-semibold text-[#17150f] dark:text-[#ece7dd]">
                  {t.who}
                </span>
                <span className="hidden sm:block font-mono text-[10px] uppercase tracking-wider text-ink-muted/70 dark:text-[#928b7d]/70 text-center">
                  authenticates through
                </span>
                <span
                  className={`justify-self-end sm:justify-self-start font-mono text-base md:text-lg font-bold ${
                    t.missing
                      ? "text-[#ef4444]"
                      : "text-[#17150f] dark:text-[#ece7dd]"
                  }`}
                >
                  {t.missing ? "nothing" : t.layer}
                  {t.missing && (
                    <span className="block text-[10px] font-sans font-normal text-ink-muted dark:text-[#928b7d] mt-0.5">
                      it just inherits yours
                    </span>
                  )}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Resolution */}
          <div className="space-y-5 max-w-2xl">
            <p className="font-sans text-2xl md:text-3xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-snug">
              Broker is the trust layer{" "}
              <span className="text-[#c03a2b] dark:text-amber">
                autonomous software has been missing.
              </span>
            </p>
            <p className="text-sm md:text-base text-ink-muted dark:text-[#928b7d] leading-relaxed">
              Identity, scope, and expiry, issued to an agent at runtime. It
              proves what it may do, does it, and forgets, without ever holding a
              standing secret of yours.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#c03a2b] dark:text-amber hover:gap-2.5 transition-all group"
            >
              Read the full vision
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
