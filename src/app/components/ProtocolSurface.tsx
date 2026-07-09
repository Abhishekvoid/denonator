"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Network, FileCode, Check } from "lucide-react";

type Tier = "reference" | "specification";

interface Target {
  name: string;
  cap: string;
  status: "IN BUILD" | "SPECIFIED";
  tier: Tier;
  routes: { method: string; path: string }[];
  policy: string;
}

// SEC.4 — Protocol Surface.
// The honesty section, reframed. Not "here is our roadmap" but "here is one
// runtime contract, and every target implements it the same way." GitHub is the
// reference implementation; the rest are specified against the identical four
// fields. Repetition is the proof, so the CONTRACT CONFORMANCE strip is byte-for-
// byte identical on every row — that sameness is the argument.
const TARGETS: Target[] = [
  {
    name: "GitHub",
    cap: "repo:read · pr:write",
    status: "IN BUILD",
    tier: "reference",
    routes: [
      { method: "GET", path: "/repos/{owner}/{repo}/pulls" },
      { method: "POST", path: "/repos/{owner}/{repo}/comments" },
      { method: "PATCH", path: "/repos/{owner}/{repo}/issues/{id}" },
    ],
    policy: `# policy.yaml · github.com
identity: agent-auth-release      # Identity
scope:    repo:read, pr:write     # Scope
ttl:      300s                    # Lifetime (TTL)
audit:    append-only             # Audit
action:   allow`,
  },
  {
    name: "PostgreSQL",
    cap: "table:read · row:write",
    status: "SPECIFIED",
    tier: "specification",
    routes: [
      { method: "SELECT", path: "FROM billing.subscriptions" },
      { method: "INSERT", path: "INTO core.user_records" },
    ],
    policy: `# policy.yaml · postgresql://db.internal
identity: agent-billing-sync      # Identity
scope:    table:read, row:write   # Scope
ttl:      60s                     # Lifetime (TTL)
audit:    append-only             # Audit
action:   dry-run`,
  },
  {
    name: "Slack",
    cap: "chat:write",
    status: "SPECIFIED",
    tier: "specification",
    routes: [
      { method: "POST", path: "/api/chat.postMessage" },
      { method: "GET", path: "/api/users.info" },
    ],
    policy: `# policy.yaml · slack.com/api
identity: agent-notifier          # Identity
scope:    chat:write              # Scope
ttl:      120s                    # Lifetime (TTL)
audit:    append-only             # Audit
action:   dry-run`,
  },
  {
    name: "AWS",
    cap: "s3:read · kms:sign",
    status: "SPECIFIED",
    tier: "specification",
    routes: [
      { method: "GET", path: "aws://s3/bucket/production-artifacts/*" },
      { method: "POST", path: "aws://kms/sign-payload" },
    ],
    policy: `# policy.yaml · aws::s3::bucket
identity: agent-deployer          # Identity
scope:    s3:read, kms:sign       # Scope
ttl:      900s                    # Lifetime (TTL)
audit:    append-only             # Audit
action:   dry-run`,
  },
  {
    name: "Stripe",
    cap: "charge:create",
    status: "SPECIFIED",
    tier: "specification",
    routes: [
      { method: "POST", path: "/v1/charges" },
      { method: "GET", path: "/v1/customers/{id}" },
    ],
    policy: `# policy.yaml · api.stripe.com
identity: agent-processor         # Identity
scope:    charge:create           # Scope
ttl:      15s                     # Lifetime (TTL)
audit:    append-only             # Audit
action:   dry-run`,
  },
];

// The four contract pillars. Rendered identically under every target: the
// checkmarks mean "the contract defines this field," a spec-level property, not
// "this is running in production." Maturity is carried by the row's status badge.
const CONTRACT = [
  { field: "Identity", gloss: "who is acting" },
  { field: "Scope", gloss: "what it may touch" },
  { field: "Lifetime (TTL)", gloss: "when it expires" },
  { field: "Audit", gloss: "what was recorded" },
] as const;

// Every number in this section is derived from the data above, so a visitor can
// scroll down and verify it. No invented denominators. The reference tier is
// named (GitHub) rather than counted, because a canonical implementation is an
// identity, not a quantity.
const REFERENCE_COUNT = TARGETS.filter((t) => t.tier === "reference").length;
const SPEC_COUNT = TARGETS.filter((t) => t.tier === "specification").length;
const TARGET_COUNT = TARGETS.length;
const REFERENCE_NAME =
  TARGETS.filter((t) => t.tier === "reference")[0]?.name ??
  String(REFERENCE_COUNT);

function TargetRow({
  row,
  isExpanded,
  onToggle,
}: {
  row: Target;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const inBuild = row.status === "IN BUILD";

  return (
    <div className="border-b border-dashed border-ink-border/60 dark:border-[#38332b]/60 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[12rem_1fr_9rem_2rem] gap-x-4 gap-y-1 items-center py-4 text-left transition-all hover:bg-[#faf9f5]/60 dark:hover:bg-[#211e1a]/60 px-5 cursor-pointer select-none"
      >
        <span className="font-mono text-sm font-bold text-[#17150f] dark:text-[#ece7dd] flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              inBuild
                ? "bg-amber animate-pulse"
                : "bg-[#5c574a] dark:bg-[#928b7d] opacity-55"
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
            <div className="p-5 space-y-5 text-left font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: intercepted surface */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-[9px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider font-bold select-none">
                    <Network className="w-3.5 h-3.5 text-[#3b82f6] opacity-80" />
                    <span>Intercepted surface</span>
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

                {/* Right: the policy, contract fields annotated */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-[9px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider font-bold select-none">
                    <FileCode className="w-3.5 h-3.5 text-[#c03a2b] dark:text-amber opacity-85" />
                    <span>Policy · the contract, filled in</span>
                  </div>
                  <div className="relative border border-[#d4d0c5]/50 dark:border-[#38332b]/50 bg-paper dark:bg-[#1a1815] p-3 text-[10.5px] text-[#5c574a] dark:text-[#928b7d] overflow-x-auto leading-normal">
                    <pre className="whitespace-pre">{row.policy}</pre>
                  </div>
                </div>
              </div>

              {/* The witness. Identical on every row, IN BUILD or SPECIFIED. */}
              <div className="border-t border-dashed border-ink-border/40 pt-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[9px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider font-bold select-none">
                  <span>Contract conformance</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CONTRACT.map((c) => (
                    <span
                      key={c.field}
                      className="inline-flex items-center gap-1.5 border border-emerald/25 bg-emerald/5 rounded-sm px-2 py-1 text-[10px] text-[#17150f] dark:text-[#ece7dd]"
                    >
                      <Check className="w-3 h-3 text-emerald" strokeWidth={3} />
                      {c.field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProtocolSurface() {
  const [expandedRow, setExpandedRow] = useState<string | null>("GitHub");

  const references = TARGETS.filter((t) => t.tier === "reference");
  const specifications = TARGETS.filter((t) => t.tier === "specification");

  const toggle = (name: string) =>
    setExpandedRow((cur) => (cur === name ? null : name));

  return (
    <div className="border-b border-dashed border-ink-border bg-panel/70 transition-colors duration-300">
      {/* IDE Panel Header */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-paper/80 border-b border-ink-border text-[10px] font-mono text-ink-muted dark:text-[#928b7d] select-none uppercase tracking-wider">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-[#3b82f6] font-extrabold">&gt;</span>
          <span>PROTOCOL_SURFACE</span>
        </div>
        <div className="font-semibold">
          [<span className="text-[#3b82f6] font-bold">4</span>/6]
        </div>
      </div>

      <div className="px-6 py-6 md:py-12">
        <div className="w-full max-w-310 mx-auto space-y-8">
          {/* Heading */}
          <div className="max-w-2xl space-y-4">
            <span className="inline-block rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-bold font-mono bg-[#c03a2b]/10 dark:bg-amber/10 text-[#c03a2b] dark:text-amber border border-[#c03a2b]/20 dark:border-amber/20 select-none">
              SEC. 4 — PROTOCOL SURFACE
            </span>
            <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-tight text-balance">
              One protocol. Five targets. One runtime contract.
            </h2>
            <p className="text-sm md:text-base text-ink-muted dark:text-[#928b7d] leading-relaxed">
              Not a GitHub integration. One runtime contract every target
              implements the same way, with GitHub as the reference implementation
              and the rest specified against the identical fields.
            </p>
          </div>

          {/* Protocol contract — the centerpiece. The law every target answers to. */}
          <div className="rounded-xl border border-[#c03a2b]/25 dark:border-amber/30 bg-[#c03a2b]/[0.03] dark:bg-amber/[0.04] overflow-hidden shadow-[6px_6px_0px_#d4d0c5] dark:shadow-[6px_6px_0px_var(--color-ink-border)] transition-colors duration-300">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#c03a2b]/20 dark:border-amber/20 bg-paper/60 font-mono text-[10px] uppercase tracking-wider select-none">
              <span className="font-bold text-[#c03a2b] dark:text-amber">
                Protocol contract
              </span>
              <span className="text-ink-muted dark:text-[#928b7d] normal-case tracking-normal">
                MUST as defined in RFC 2119
              </span>
            </div>
            <div className="px-5 py-6 md:py-8 space-y-5">
              <p className="font-sans text-lg md:text-xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd]">
                Every target{" "}
                <span className="text-[#c03a2b] dark:text-amber">MUST</span>{" "}
                implement all four.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CONTRACT.map((c) => (
                  <div
                    key={c.field}
                    className="border border-ink-border dark:border-[#38332b] bg-paper rounded-md px-3.5 py-3.5 space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <Check
                        className="w-3.5 h-3.5 text-emerald shrink-0"
                        strokeWidth={3}
                      />
                      <span className="font-mono text-[13px] font-bold text-[#17150f] dark:text-[#ece7dd]">
                        {c.field}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-ink-muted dark:text-[#928b7d] leading-snug">
                      {c.gloss}
                    </p>
                  </div>
                ))}
              </div>
              <p className="font-mono text-xs font-bold text-[#c03a2b] dark:text-amber tracking-wide select-none">
                No exceptions.
              </p>
            </div>
          </div>

          {/* Verification strip — quiet, every value verifiable in the surface below */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-ink-muted dark:text-[#928b7d] select-none">
            <span>
              <span className="text-[#17150f] dark:text-[#ece7dd] font-bold">
                {REFERENCE_NAME}
              </span>{" "}
              reference implementation
            </span>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span>
              <span className="text-[#17150f] dark:text-[#ece7dd] font-bold">
                {SPEC_COUNT}
              </span>{" "}
              specifications
            </span>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span>
              <span className="text-[#17150f] dark:text-[#ece7dd] font-bold">
                {TARGET_COUNT}
              </span>{" "}
              targets
            </span>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span>
              <span className="text-[#17150f] dark:text-[#ece7dd] font-bold">1</span>{" "}
              runtime contract
            </span>
          </div>

          {/* The surface itself — reference implementation, then specifications */}
          <div className="rounded-xl border border-ink-border bg-paper overflow-hidden shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_var(--color-ink-border)] transition-colors duration-300">
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink-border bg-panel font-mono text-[10px] uppercase tracking-wider select-none">
              <span className="font-bold text-[#17150f] dark:text-[#ece7dd]">
                RFC-004 · Protocol surface
              </span>
              <span className="text-ink-muted dark:text-[#928b7d]">
                {REFERENCE_COUNT} reference impl · {SPEC_COUNT} specified
              </span>
            </div>

            {/* Reference implementation group — the canonical anchor */}
            <div className="flex items-center justify-between px-5 py-2 bg-amber/[0.06] border-b border-dashed border-ink-border/70 font-mono text-[9px] uppercase tracking-[0.18em] select-none">
              <span className="flex items-center gap-1.5 text-[#8a6a00] dark:text-amber font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                Reference implementation
              </span>
              <span className="text-ink-muted dark:text-[#928b7d] normal-case tracking-normal">
                canonical
              </span>
            </div>
            {references.map((row) => (
              <TargetRow
                key={row.name}
                row={row}
                isExpanded={expandedRow === row.name}
                onToggle={() => toggle(row.name)}
              />
            ))}

            {/* Specifications group */}
            <div className="px-5 py-2 bg-panel/50 border-y border-dashed border-ink-border/70 font-mono text-[9px] uppercase tracking-[0.18em] text-[#5c574a] dark:text-[#928b7d] select-none">
              Specifications
            </div>
            {specifications.map((row) => (
              <TargetRow
                key={row.name}
                row={row}
                isExpanded={expandedRow === row.name}
                onToggle={() => toggle(row.name)}
              />
            ))}
          </div>

          <p className="font-mono text-[11px] text-ink-muted dark:text-[#928b7d] leading-relaxed max-w-2xl">
            Honesty is evidence, not apology. Protocols begin with one canonical
            implementation, then earn the rest one specified target at a time.
          </p>
        </div>
      </div>
    </div>
  );
}
