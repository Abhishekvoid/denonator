"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: "Why isn't Vault enough?",
    a: "Vault brokers secrets; Broker brokers runtime capabilities. Vault can issue dynamic, short-lived credentials, but your application still decides when to request them, how to scope them, and how to use them safely. Broker sits in the execution path, issuing task-scoped capabilities with expiry and one audit trail across everything an agent touches. The two compose.",
  },
  {
    q: "Why not GitHub Apps?",
    a: "GitHub Apps solve identity for GitHub. Autonomous agents also touch databases, cloud APIs, SaaS platforms, and internal services. Broker applies one runtime trust model across every resource instead of a different identity system for each provider.",
  },
  {
    q: "Why not fine-grained PATs?",
    a: "Fine-grained PATs narrow what a token can do, but they are still standing credentials: minted once, valid for weeks, sitting in an environment variable until someone rotates them. Broker's capabilities are minted per task and expire automatically after the task completes or its lifetime ends.",
  },
  {
    q: "Why not OIDC?",
    a: "OIDC and workload identity federation establish the identity of a trusted workload. Broker builds on that identity to delegate narrowly scoped, short-lived capabilities to autonomous execution. When an agent coordinates work across providers, services, or delegated tasks, Broker carries scope, expiry, and audit with every capability. Where OIDC is available, Broker complements it rather than replacing it.",
  },
  {
    q: "What happens if Broker fails?",
    a: "Capability requests fail closed. If Broker cannot mint a capability, the operation does not execute. Resources are never left protected by standing credentials that depend on Broker remaining available.",
  },
  {
    q: "Can I self-host it?",
    a: "Self-hosting is planned. The authority that issues capabilities is designed so it can operate inside your own trust boundary rather than requiring a permanently hosted third-party control plane.",
  },
  {
    q: "When can I use it?",
    a: "GitHub is the reference implementation in progress today. Register above to receive the CLI wrapper and documentation as soon as Phase 1 is available.",
  },
  {
    q: "Isn't this just a secrets manager for agents?",
    a: "No. Identity providers prove who a human is. Secret managers protect long-lived credentials. Broker governs what autonomous software is allowed to do while it runs, issuing short-lived, task-scoped capabilities in the execution path. Storing a secret and governing runtime authority are different problems, and the second one needs its own primitive.",
  },
];

export default function Appendix() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full max-w-3xl text-left">
      <div className="flex items-center justify-between mb-6 font-mono text-[10px] uppercase tracking-wider text-ink-muted dark:text-[#928b7d] select-none">
        <span className="font-bold text-[#17150f] dark:text-[#ece7dd]">
          Appendix · Frequently asked
        </span>
        <span>{FAQS.length} entries</span>
      </div>

      <div className="border-t border-ink-border dark:border-[#38332b]">
        {FAQS.map((f, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={f.q}
              className="border-b border-dashed border-ink-border/60 dark:border-[#38332b]/60"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-start justify-between gap-4 py-4 text-left cursor-pointer select-none group font-inherit bg-transparent border-0 outline-none"
              >
                <span className="flex items-start gap-2.5">
                  <span className="font-mono text-[10px] text-ink-muted/60 dark:text-[#928b7d]/60 pt-1 tabular-nums select-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-sans text-sm md:text-base font-semibold text-[#17150f] dark:text-[#ece7dd] group-hover:text-[#c03a2b] dark:group-hover:text-amber transition-colors">
                    {f.q}
                  </span>
                </span>
                <span
                  className={`text-[#c03a2b] dark:text-amber font-mono text-lg leading-none pt-0.5 transition-transform duration-300 shrink-0 select-none ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="pb-4 pl-[2.1rem] pr-8 text-sm text-ink-muted dark:text-[#928b7d] leading-relaxed">
                      {f.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
