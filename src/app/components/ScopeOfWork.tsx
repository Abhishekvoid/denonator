"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Network, FileCode } from "lucide-react";

interface ScopeRow {
  name: string;
  cap: string;
  status: "IN BUILD" | "SPECIFIED";
  routes: { method: string; path: string }[];
  policy: string;
}

// The honesty section, weaponized. Pre-MVP truth as an interactive spec table.
const SCOPE: ScopeRow[] = [
  {
    name: "GitHub",
    cap: "repo:read · pr:write",
    status: "IN BUILD",
    routes: [
      { method: "GET", path: "/repos/{owner}/{repo}/pulls" },
      { method: "POST", path: "/repos/{owner}/{repo}/comments" },
      { method: "PATCH", path: "/repos/{owner}/{repo}/issues/{id}" },
    ],
    policy: `# policy.yaml
target: github.com
action: allow
identity: agent-auth-release
scope: repo:read, pr:write
ttl: 300s`,
  },
  {
    name: "PostgreSQL",
    cap: "table:read · row:write",
    status: "SPECIFIED",
    routes: [
      { method: "SELECT", path: "FROM billing.subscriptions" },
      { method: "INSERT", path: "INTO core.user_records" },
    ],
    policy: `# policy.yaml
target: postgresql://db.internal
action: dry-run
identity: agent-billing-sync
scope: table:read, row:write
ttl: 60s`,
  },
  {
    name: "Slack",
    cap: "chat:write",
    status: "SPECIFIED",
    routes: [
      { method: "POST", path: "/api/chat.postMessage" },
      { method: "GET", path: "/api/users.info" },
    ],
    policy: `# policy.yaml
target: slack.com/api
action: dry-run
identity: agent-notifier
scope: chat:write
ttl: 120s`,
  },
  {
    name: "AWS",
    cap: "s3:read · kms:sign",
    status: "SPECIFIED",
    routes: [
      { method: "GET", path: "aws://s3/bucket/production-artifacts/*" },
      { method: "POST", path: "aws://kms/sign-payload" },
    ],
    policy: `# policy.yaml
target: aws::s3::bucket
action: dry-run
identity: agent-deployer
scope: s3:read, kms:sign
ttl: 900s`,
  },
  {
    name: "Stripe",
    cap: "charge:create",
    status: "SPECIFIED",
    routes: [
      { method: "POST", path: "/v1/charges" },
      { method: "GET", path: "/v1/customers/{id}" },
    ],
    policy: `# policy.yaml
target: api.stripe.com
action: dry-run
identity: agent-processor
scope: charge:create
ttl: 15s`,
  },
];

export default function ScopeOfWork() {
  const [expandedRow, setExpandedRow] = useState<string | null>("GitHub");

  return (
    <div className="border-b border-dashed border-ink-border bg-panel/70 transition-colors duration-300">
      {/* IDE Panel Header */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-paper/80 border-b border-ink-border text-[10px] font-mono text-ink-muted dark:text-[#928b7d] select-none uppercase tracking-wider">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-[#3b82f6] font-extrabold">&gt;</span>
          <span>SCOPE_OF_WORK</span>
        </div>
        <div className="font-semibold">
          [<span className="text-[#3b82f6] font-bold">4</span>/6]
        </div>
      </div>

      <div className="px-6 py-6 md:py-12">
        <div className="w-full max-w-310 mx-auto space-y-8">
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
          <div className="rounded-xl border border-ink-border bg-paper overflow-hidden shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_var(--color-ink-border)] transition-colors duration-300">
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink-border bg-panel font-mono text-[10px] uppercase tracking-wider select-none">
              <span className="font-bold text-[#17150f] dark:text-[#ece7dd]">
                RFC-004 · Integration scope
              </span>
              <span className="text-ink-muted dark:text-[#928b7d]">
                1 in build · 4 specified
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[12rem_1fr_9rem_2rem] gap-x-4 px-5 py-2 border-b border-dashed border-ink-border dark:border-[#38332b] font-mono text-[9px] uppercase tracking-wider text-ink-muted/70 dark:text-[#928b7d]/70 select-none">
              <span>Integration</span>
              <span className="hidden sm:block">Example capability</span>
              <span className="text-right sm:text-left">Status</span>
              <span className="hidden sm:block" />
            </div>

            <div className="px-0">
              {SCOPE.map((row) => {
                const inBuild = row.status === "IN BUILD";
                const isExpanded = expandedRow === row.name;

                return (
                  <div
                    key={row.name}
                    className="border-b border-dashed border-ink-border/60 dark:border-[#38332b]/60 last:border-b-0"
                  >
                    <button
                      onClick={() => setExpandedRow(isExpanded ? null : row.name)}
                      className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[12rem_1fr_9rem_2rem] gap-x-4 gap-y-1 items-center py-4 text-left transition-all hover:bg-[#faf9f5]/60 dark:hover:bg-[#211e1a]/60 px-5 cursor-pointer select-none"
                    >
                      <span className="font-mono text-sm font-bold text-[#17150f] dark:text-[#ece7dd] flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            inBuild ? "bg-amber animate-pulse" : "bg-[#5c574a] dark:bg-[#928b7d] opacity-55"
                          }`}
                        />
                        {row.name}
                      </span>
                      <span className="hidden sm:block font-mono text-[11px] text-ink-muted dark:text-[#928b7d]">
                        {row.cap}
                      </span>
                      <span className="justify-self-end sm:justify-self-start">
                        {inBuild ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-amber/15 text-[#8a6a00] dark:text-amber border border-amber/40">
                            In build
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-[#928b7d] border border-ink-border dark:border-[#38332b]">
                            Specified
                          </span>
                        )}
                      </span>
                      <span className="text-ink-muted dark:text-[#928b7d] justify-self-end">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden bg-panel/40 border-t border-dashed border-ink-border/40"
                        >
                          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-left font-mono">
                            {/* Left Column: Intercepted Routes */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-1.5 text-[9px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider font-bold select-none">
                                <Network className="w-3.5 h-3.5 text-[#3b82f6] opacity-80" />
                                <span>Intercepted Network Routes</span>
                              </div>
                              <div className="space-y-1.5">
                                {row.routes.map((rt, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 border border-[#d4d0c5]/50 dark:border-[#38332b]/50 p-2 bg-paper dark:bg-[#1a1815] text-[10px]"
                                  >
                                    <span
                                      className={`px-1.5 py-0.5 text-[8.5px] font-bold rounded-sm select-none ${
                                        rt.method === "GET" || rt.method === "SELECT"
                                          ? "bg-emerald/15 text-emerald"
                                          : "bg-[#3b82f6]/15 text-[#3b82f6]"
                                      }`}
                                    >
                                      {rt.method}
                                    </span>
                                    <span className="text-[#17150f] dark:text-[#ece7dd] truncate">
                                      {rt.path}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Right Column: YAML Security Policy */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-1.5 text-[9px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider font-bold select-none">
                                <FileCode className="w-3.5 h-3.5 text-[#c03a2b] dark:text-amber opacity-85" />
                                <span>YAML Security Policy Definition</span>
                              </div>
                              <div className="relative border border-[#d4d0c5]/50 dark:border-[#38332b]/50 bg-paper dark:bg-[#1a1815] p-3 text-[10.5px] text-[#5c574a] dark:text-[#928b7d] overflow-x-auto leading-normal">
                                <pre className="whitespace-pre">
                                  {row.policy}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
