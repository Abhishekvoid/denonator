"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/**
 * SEC.3 — Capability Runtime.
 *
 * The altitude above the Hero: not one token's life story, but the runtime that
 * holds many at once. A live monitor streams capability objects that mint and
 * expire continuously; one is focused (auto-cycled, or pinned on hover/click)
 * and dissected into its four facets — identity, scope, lifetime, audit —
 * folding the old FIG.2 anatomy onto a living object. The streaming rows plus
 * the focused audit facet ARE the audit trail at scale, so there is no separate
 * ledger echoing the Hero.
 *
 * The ACTIVE counter is a labelled simulation, not production telemetry.
 * Reduced motion renders a single static frame.
 */

type Facet = "identity" | "scope" | "lifetime" | "audit";
type Status = "granted" | "expiring" | "expired";

interface RtObject {
  id: string; // BRK-####
  resource: string;
  scope: string;
  ttl: number; // seconds remaining
  maxTtl: number;
  status: Status;
  event: "ISSUED" | "EXPIRED";
  ts: string;
  expiredAt?: number; // tick index it expired on
}

// Pool the runtime mints from (client-only randomness, never at init).
const SERVICES: { resource: string; scope: string }[] = [
  { resource: "github/acme-api", scope: "repo:read" },
  { resource: "aws/prod-store", scope: "s3:read" },
  { resource: "postgres/users", scope: "users:write" },
  { resource: "slack/alerts", scope: "chat:write" },
  { resource: "stripe/charges", scope: "charges:read" },
  { resource: "gcp/secrets", scope: "secret:access" },
  { resource: "vault/kv-prod", scope: "kv:read" },
  { resource: "k8s/prod-west", scope: "pods:exec" },
  { resource: "datadog/metrics", scope: "metrics:read" },
  { resource: "snowflake/warehouse", scope: "query:run" },
];

const BASE_ACTIVE = 2847;

// Fixed initial frame so server and client render identically (no hydration
// mismatch). The tick effect takes over with live randomness on the client.
const INITIAL_POOL: RtObject[] = [
  { id: "BRK-2801", resource: "github/acme-api", scope: "repo:read", ttl: 41, maxTtl: 60, status: "granted", event: "ISSUED", ts: "14:22:07" },
  { id: "BRK-2802", resource: "aws/prod-store", scope: "s3:read", ttl: 12, maxTtl: 45, status: "expiring", event: "ISSUED", ts: "14:22:09" },
  { id: "BRK-2803", resource: "postgres/users", scope: "users:write", ttl: 33, maxTtl: 40, status: "granted", event: "ISSUED", ts: "14:22:10" },
  { id: "BRK-2804", resource: "slack/alerts", scope: "chat:write", ttl: 8, maxTtl: 30, status: "expiring", event: "ISSUED", ts: "14:22:12" },
  { id: "BRK-2805", resource: "stripe/charges", scope: "charges:read", ttl: 27, maxTtl: 50, status: "granted", event: "ISSUED", ts: "14:22:13" },
  { id: "BRK-2806", resource: "gcp/secrets", scope: "secret:access", ttl: 19, maxTtl: 35, status: "granted", event: "ISSUED", ts: "14:22:15" },
  { id: "BRK-2807", resource: "vault/kv-prod", scope: "kv:read", ttl: 5, maxTtl: 25, status: "expiring", event: "ISSUED", ts: "14:22:16" },
  { id: "BRK-2808", resource: "k8s/prod-west", scope: "pods:exec", ttl: 46, maxTtl: 60, status: "granted", event: "ISSUED", ts: "14:22:18" },
  { id: "BRK-2809", resource: "datadog/metrics", scope: "metrics:read", ttl: 22, maxTtl: 40, status: "granted", event: "ISSUED", ts: "14:22:19" },
  { id: "BRK-2810", resource: "snowflake/warehouse", scope: "query:run", ttl: 14, maxTtl: 45, status: "granted", event: "ISSUED", ts: "14:22:21" },
  { id: "BRK-2811", resource: "github/acme-api", scope: "actions:write", ttl: 37, maxTtl: 55, status: "granted", event: "ISSUED", ts: "14:22:22" },
];

const ANAPHORA: { facet: Facet; text: string }[] = [
  { facet: "identity", text: "Its own identity." },
  { facet: "scope", text: "Its own scope." },
  { facet: "lifetime", text: "Its own lifetime." },
  { facet: "audit", text: "Its own audit trail." },
];

const FACET_ACCENT: Record<Facet, string> = {
  identity: "#c03a2b",
  scope: "#3b82f6",
  lifetime: "#ffb000",
  audit: "#10b981",
};

const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
const rndService = () => SERVICES[Math.floor(Math.random() * SERVICES.length)];

export default function EphemeralLifecycle() {
  const reduce = useReducedMotion();

  const [pool, setPool] = useState<RtObject[]>(INITIAL_POOL);
  const [active, setActive] = useState(BASE_ACTIVE);
  const [autoIdx, setAutoIdx] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [lockedId, setLockedId] = useState<string | null>(null);
  const [hlFacet, setHlFacet] = useState<Facet | null>(null);

  const poolRef = useRef(pool);
  const nextId = useRef(2811);
  const tick = useRef(0);
  useEffect(() => {
    poolRef.current = pool;
  }, [pool]);

  // Which object feeds the inspector: pinned > hovered > auto-cycled.
  const focusId =
    (lockedId && pool.some((o) => o.id === lockedId) ? lockedId : null) ??
    (hoveredId && pool.some((o) => o.id === hoveredId) ? hoveredId : null) ??
    pool[autoIdx % pool.length]?.id ??
    null;
  const focused = pool.find((o) => o.id === focusId) ?? pool[0];

  const focusRef = useRef(focusId);
  useEffect(() => {
    focusRef.current = focusId;
  }, [focusId]);

  // Runtime tick: age every object, expire + re-mint, drift the counter.
  useEffect(() => {
    if (reduce) return;
    const iv = setInterval(() => {
      tick.current += 1;
      const now = tick.current;
      let minted = 0;
      let expired = 0;

      let next = poolRef.current.map<RtObject>((o) => {
        if (o.status === "expired") return o;
        // The inspected object holds still while you look at it.
        if (o.id === focusRef.current) return o;
        const ttl = o.ttl - 1;
        if (ttl <= 0) {
          expired += 1;
          return { ...o, ttl: 0, status: "expired", event: "EXPIRED", ts: stamp(), expiredAt: now };
        }
        return { ...o, ttl, status: ttl <= 10 ? "expiring" : "granted" };
      });

      // Replace objects that expired a tick ago with freshly minted ones.
      next = next.map<RtObject>((o) => {
        if (o.status === "expired" && o.expiredAt !== undefined && now - o.expiredAt >= 1) {
          minted += 1;
          nextId.current += 1;
          const svc = rndService();
          const life = 20 + Math.floor(Math.random() * 40);
          return {
            id: `BRK-${nextId.current}`,
            resource: svc.resource,
            scope: svc.scope,
            ttl: life,
            maxTtl: life,
            status: "granted",
            event: "ISSUED",
            ts: stamp(),
          };
        }
        return o;
      });

      poolRef.current = next;
      setPool(next);
      // Illustrative drift around the base, nudged by live mint/expire events.
      setActive((a) => {
        const drift = minted - expired + (Math.floor(Math.random() * 7) - 3);
        return Math.max(BASE_ACTIVE - 60, Math.min(BASE_ACTIVE + 90, a + drift));
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [reduce]);

  // Auto-advance the focused object unless the visitor has pinned or is hovering.
  useEffect(() => {
    if (reduce || lockedId || hoveredId) return;
    const iv = setInterval(() => setAutoIdx((i) => i + 1), 3500);
    return () => clearInterval(iv);
  }, [reduce, lockedId, hoveredId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
      {/* Left: the claim */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="lg:col-span-4 space-y-6 text-left"
      >
        <span className="inline-block rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-bold font-mono bg-[#c03a2b]/10 dark:bg-amber/10 text-[#c03a2b] dark:text-amber border border-[#c03a2b]/20 dark:border-amber/20 select-none">
          SEC. 3 — CAPABILITY RUNTIME
        </span>

        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-tight">
          Every capability is an independent runtime object.
        </h2>

        {/* Anaphora — each line pairs with a facet on the focused object */}
        <ul className="space-y-1.5 border-l border-ink-border dark:border-[#38332b] pl-4">
          {ANAPHORA.map(({ facet, text }) => {
            const on = hlFacet === facet;
            return (
              <li
                key={facet}
                onMouseEnter={() => setHlFacet(facet)}
                onMouseLeave={() => setHlFacet(null)}
                className="flex items-center gap-2.5 cursor-default select-none"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200"
                  style={{
                    backgroundColor: FACET_ACCENT[facet],
                    transform: on ? "scale(1.9)" : "scale(1)",
                  }}
                />
                <span
                  className={`font-sans text-base md:text-lg font-medium transition-colors duration-200 ${
                    on
                      ? "text-[#17150f] dark:text-[#ece7dd]"
                      : "text-ink-muted dark:text-[#928b7d]"
                  }`}
                >
                  {text}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="text-sm md:text-base text-[#17150f] dark:text-[#ece7dd]/90 leading-relaxed font-sans font-medium">
          Broker manages{" "}
          <span className="font-bold text-[#c03a2b] dark:text-amber tabular-nums">
            thousands
          </span>{" "}
          simultaneously. Each mints on request and dissolves on expiry, on its
          own clock, leaving its own record.
        </p>
      </motion.div>

      {/* Right: the live runtime monitor */}
      <div className="lg:col-span-8">
        <div className="rounded-xl border border-ink-border dark:border-[#38332b] bg-[#faf9f5] dark:bg-[#1f1c17] overflow-hidden shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_#38332b] transition-colors duration-300 font-mono">
          {/* Monitor header */}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-ink-border dark:border-[#38332b] bg-paper dark:bg-[#1a1815] text-[10px] uppercase tracking-wider select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] opacity-80" />
                <span className="w-2 h-2 rounded-full bg-[#ffb000] opacity-80" />
                <span className="w-2 h-2 rounded-full bg-[#10b981] opacity-80" />
              </span>
              <span className="font-bold text-[#17150f] dark:text-[#ece7dd] truncate">
                capability.runtime
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-ink-border dark:border-[#38332b] text-[8.5px] text-ink-muted dark:text-[#928b7d] shrink-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-amber ${reduce ? "" : "animate-pulse"}`}
                />
                Simulated Runtime
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-ink-muted dark:text-[#928b7d]">Active</span>
              <span className="font-bold tabular-nums text-[#17150f] dark:text-[#ece7dd] text-xs">
                {active.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Inspector — the focused object, dissected into its four facets */}
          {focused && (
            <div className="px-4 py-3.5 border-b border-ink-border dark:border-[#38332b] bg-[#f6f5f0] dark:bg-[#211e1a] transition-colors duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] uppercase tracking-wider text-ink-muted dark:text-[#928b7d]">
                  Inspecting object
                  {lockedId ? " · pinned" : ""}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-ink-muted/70 dark:text-[#928b7d]/70">
                  {hoveredId || lockedId ? "hold to inspect" : "auto-cycling"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <FacetCell
                  facet="identity"
                  label="Identity"
                  value={focused.id}
                  note="one object, one identity"
                  hl={hlFacet}
                  setHl={setHlFacet}
                />
                <FacetCell
                  facet="scope"
                  label="Scope"
                  value={focused.scope}
                  note={focused.resource}
                  hl={hlFacet}
                  setHl={setHlFacet}
                />
                <FacetCell
                  facet="lifetime"
                  label="Lifetime"
                  value={mmss(focused.ttl)}
                  note="self-expiring"
                  hl={hlFacet}
                  setHl={setHlFacet}
                  meter={focused.ttl / focused.maxTtl}
                  expiring={focused.status === "expiring"}
                />
                <FacetCell
                  facet="audit"
                  label="Audit"
                  value={focused.event}
                  note={`${focused.id} · ${focused.ts}`}
                  hl={hlFacet}
                  setHl={setHlFacet}
                />
              </div>
            </div>
          )}

          {/* Stream — many objects, live */}
          <div className="px-2 py-2 max-h-[19rem] overflow-hidden relative">
            <AnimatePresence initial={false}>
              {pool.map((o) => {
                const isFocus = o.id === focusId;
                const dot =
                  o.status === "expired"
                    ? "#ef4444"
                    : o.status === "expiring"
                      ? "#ffb000"
                      : "#10b981";
                return (
                  <motion.button
                    key={o.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: o.status === "expired" ? 0.5 : 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    onMouseEnter={() => setHoveredId(o.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() =>
                      setLockedId((cur) => (cur === o.id ? null : o.id))
                    }
                    className={`w-full grid grid-cols-[auto_5.5rem_1fr_auto] sm:grid-cols-[auto_5.5rem_1fr_5rem_auto] gap-x-3 items-center px-2 py-2 rounded-md text-left text-[11px] transition-colors duration-200 cursor-pointer ${
                      isFocus
                        ? "bg-paper dark:bg-[#2a2620] ring-1 ring-inset ring-[#c03a2b]/30 dark:ring-amber/30"
                        : "hover:bg-paper/60 dark:hover:bg-[#241f1a]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        o.status === "expiring" && !reduce ? "animate-pulse" : ""
                      }`}
                      style={{ backgroundColor: dot }}
                    />
                    <span className="font-bold tabular-nums text-[#c03a2b] dark:text-amber truncate">
                      {o.id}
                    </span>
                    <span className="truncate text-[#17150f] dark:text-[#ece7dd]">
                      {o.resource}
                      <span className="text-ink-muted/70 dark:text-[#928b7d]/70">
                        {" "}
                        · {o.scope}
                      </span>
                    </span>
                    {/* TTL micro-meter */}
                    <span className="hidden sm:flex items-center gap-1.5">
                      <span className="relative w-12 h-1 rounded-full bg-ink-border/60 dark:bg-[#38332b] overflow-hidden">
                        <span
                          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
                          style={{
                            width: `${Math.max(0, Math.min(100, (o.ttl / o.maxTtl) * 100))}%`,
                            backgroundColor: dot,
                          }}
                        />
                      </span>
                      <span className="tabular-nums text-ink-muted dark:text-[#928b7d] w-9">
                        {mmss(o.ttl)}
                      </span>
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wide text-right ${
                        o.event === "EXPIRED" ? "text-[#ef4444]" : "text-[#10b981]"
                      }`}
                    >
                      {o.event}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
            {/* Fade suggesting the rest of the fleet below the fold */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#faf9f5] dark:from-[#1f1c17] to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FacetCell({
  facet,
  label,
  value,
  note,
  hl,
  setHl,
  meter,
  expiring,
}: {
  facet: Facet;
  label: string;
  value: string;
  note: string;
  hl: Facet | null;
  setHl: (f: Facet | null) => void;
  meter?: number;
  expiring?: boolean;
}) {
  const accent = FACET_ACCENT[facet];
  const on = hl === facet;
  return (
    <div
      onMouseEnter={() => setHl(facet)}
      onMouseLeave={() => setHl(null)}
      className="rounded-lg border p-2.5 bg-[#faf9f5] dark:bg-[#1a1815] transition-all duration-200"
      style={{
        borderColor: on ? accent : undefined,
        boxShadow: on ? `0 0 0 1px ${accent}` : undefined,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <span className="text-[8.5px] uppercase tracking-wider text-ink-muted dark:text-[#928b7d]">
          {label}
        </span>
      </div>
      <div
        className="mt-1 font-bold text-xs truncate"
        style={{ color: on ? accent : undefined }}
      >
        <span className={on ? "" : "text-[#17150f] dark:text-[#ece7dd]"}>
          {value}
        </span>
      </div>
      {meter !== undefined ? (
        <div className="mt-1.5 relative w-full h-1 rounded-full bg-ink-border/60 dark:bg-[#38332b] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.max(0, Math.min(100, meter * 100))}%`,
              backgroundColor: expiring ? "#ef4444" : accent,
            }}
          />
        </div>
      ) : (
        <div className="mt-1 text-[9px] text-ink-muted/70 dark:text-[#928b7d]/70 truncate">
          {note}
        </div>
      )}
      {meter !== undefined && (
        <div className="mt-1 text-[9px] text-ink-muted/70 dark:text-[#928b7d]/70 truncate">
          {note}
        </div>
      )}
    </div>
  );
}
