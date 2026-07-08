"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface Capability {
  id: string;
  name: string;
  scope: string;
  maxTTL: number; // in seconds
  currentTTL: number; // in seconds
  status: "granted" | "expiring" | "expired";
  description?: string;
  expiredAt?: number; // epoch ms the token expired (drives auto re-mint)
}

export const initialCapabilities: Capability[] = [
  { 
    id: "cap-1", 
    name: "GitHub Repository", 
    scope: "repo:read", 
    maxTTL: 900, 
    currentTTL: 24, 
    status: "granted",
    description: "Allows reading code metadata, commit history, and branches for validation. Dissolves upon task completion."
  },
  { 
    id: "cap-2", 
    name: "PostgreSQL Database", 
    scope: "users:write", 
    maxTTL: 300, 
    currentTTL: 8, 
    status: "granted"
  },
  { 
    id: "cap-3", 
    name: "Slack Copilot alerts", 
    scope: "chat:write", 
    maxTTL: 600, 
    currentTTL: 42, 
    status: "granted"
  },
  { 
    id: "cap-4", 
    name: "AWS CloudStorage", 
    scope: "s3:read", 
    maxTTL: 450, 
    currentTTL: 14, 
    status: "granted",
    description: "Grants read access to designated S3 buckets for loading configuration blueprints and model checkpoints."
  },
];

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

function CapabilityCard({
  cap,
  onRenew,
}: {
  cap: Capability;
  onRenew: (id: string) => void;
}) {
  const ttlRatio = Math.max(0, Math.min(1, cap.currentTTL / cap.maxTTL));
  const isWide = !!cap.description;

  // Flat segmented decay meter: 12 mono ticks that deplete as the token's TTL burns down.
  const SEGMENTS = 12;
  const filledSegments = Math.max(1, Math.round(ttlRatio * SEGMENTS));
  const lifePct = Math.round(ttlRatio * 100);

  return (
    <div className={`relative flex flex-col h-full min-h-[180px] ${isWide ? "md:col-span-2" : "md:col-span-1"}`}>
      <AnimatePresence mode="wait">
        {cap.status !== "expired" ? (
          <motion.div
            key="active-cap"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            transition={{ duration: 0.4 }}
            className={`p-[6px] rounded-[1.25rem] bg-[#17150f]/5 dark:bg-white/5 border border-[#d4d0c5] dark:border-[#38332b]/60 shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_#38332b] flex flex-col h-full transition-all duration-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#d4d0c5] dark:hover:shadow-[2px_2px_0px_#38332b] ${
              cap.status === "expiring" ? "animate-pulse border-[#ef4444]/60 dark:border-[#ef4444]" : ""
            }`}
          >
            <div
              className={`p-5 bg-[#faf9f5] dark:bg-[#211e1a] rounded-[calc(1.25rem-6px)] flex flex-col justify-between h-full relative overflow-hidden shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15)] select-none border border-transparent dark:border-[#ffffff]/5 transition-colors duration-300 ${
                cap.status === "expiring" ? "bg-[#ef4444]/[0.015] dark:bg-[#ef4444]/[0.035]" : ""
              }`}
            >
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start font-mono text-xs gap-4 w-full">
                <div className="flex-1">
                  <span className="text-[10px] text-[#5c574a] dark:text-[#928b7d] uppercase block tracking-wider">CAPABILITY</span>
                  <span className="font-semibold text-[#17150f] dark:text-[#ece7dd] text-sm block mt-0.5">{cap.name}</span>
                  {isWide && (
                    <p className="text-[11px] text-[#5c574a]/85 dark:text-[#928b7d]/85 leading-relaxed mt-2 select-text text-left max-w-md font-sans">
                      {cap.description}
                    </p>
                  )}
                </div>
                <span className="px-2 py-0.5 border border-[#d4d0c5] dark:border-[#38332b] bg-[#f6f5f0] dark:bg-[#1a1815] text-[#5c574a] dark:text-[#928b7d] text-[9px] uppercase font-mono transition-colors duration-300 shrink-0">
                  {cap.scope}
                </span>
              </div>

              <div className="relative z-10 mt-6">
                <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-dashed border-[#d4d0c5] dark:border-[#38332b] font-mono text-xs">
                  <span className="flex items-center gap-1.5 text-[#5c574a] dark:text-[#928b7d]">
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ${
                        cap.status === "expiring" ? "bg-[#ef4444] animate-ping" : "bg-[#10b981]"
                      }`}
                    />
                    <span>STATUS:</span>
                    <span className={cap.status === "expiring" ? "text-[#ef4444] font-bold" : "text-[#17150f] dark:text-[#ece7dd]"}>
                      {cap.status === "expiring" ? "EXPIRING" : "GRANTED"}
                    </span>
                  </span>

                  <span className="flex items-center gap-2 text-[#5c574a] dark:text-[#928b7d]">
                    <span>TTL:</span>
                    <span
                      className={`font-bold tabular-nums px-1.5 py-0.5 rounded text-xs transition-colors duration-300 ${
                        cap.status === "expiring"
                          ? "bg-[#ef4444] text-white animate-pulse"
                          : "bg-[#17150f] dark:bg-[#ffb000] text-[#f6f5f0] dark:text-[#1a1815]"
                      }`}
                    >
                      {formatTime(cap.currentTTL)}
                    </span>
                  </span>
                </div>

                {/* Flat segmented decay meter - live TTL depletion, no glow */}
                <div
                  className="mt-3 flex items-center gap-2 font-mono"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={lifePct}
                  aria-label={`${cap.name} token life remaining`}
                >
                  <span className="text-[9px] uppercase tracking-wider text-[#5c574a]/70 dark:text-[#928b7d]/70 shrink-0">
                    DECAY
                  </span>
                  <div className="flex-1 grid grid-cols-12 gap-[3px]" aria-hidden="true">
                    {Array.from({ length: SEGMENTS }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 rounded-[1px] transition-colors duration-500 ${
                          i < filledSegments
                            ? cap.status === "expiring"
                              ? "bg-[#ef4444]"
                              : "bg-[#10b981]"
                            : "bg-[#d4d0c5]/60 dark:bg-[#38332b]"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] tabular-nums text-[#5c574a]/70 dark:text-[#928b7d]/70 shrink-0 w-8 text-right">
                    {lifePct}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expired-cap"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-[6px] rounded-[1.25rem] bg-[#ef4444]/5 dark:bg-[#ef4444]/10 border border-dashed border-[#ef4444]/30 dark:border-[#ef4444]/50 shadow-[4px_4px_0px_rgba(239,68,68,0.15)] flex flex-col h-full transition-all duration-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(239,68,68,0.15)]"
          >
            <div className="p-5 bg-[#faf9f5] dark:bg-[#211e1a] rounded-[calc(1.25rem-6px)] flex flex-col justify-between items-center text-center h-full relative overflow-hidden shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.1)] border border-transparent dark:border-[#ffffff]/5 select-none transition-colors duration-300">
              <div className="font-mono text-xs text-[#ef4444] space-y-1 pt-3">
                <p className="font-bold tracking-widest text-[10px] uppercase">CAPABILITY EXPIRED</p>
                <p className="text-[#5c574a] dark:text-[#928b7d] text-[11px] font-mono">
                  Token for <strong className="text-[#17150f] dark:text-[#ece7dd] font-mono">{cap.name}</strong> dissolved.
                </p>
              </div>
              <button
                onClick={() => onRenew(cap.id)}
                className="mt-4 w-full bg-[#17150f] dark:bg-[#ffb000] text-[#f6f5f0] dark:text-[#1a1815] text-[10px] font-bold uppercase px-4 py-2 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.97] cursor-pointer rounded-md shadow-sm border border-[#17150f] dark:border-[#ffb000]"
              >
                {/* Inline SVG refresh icon */}
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 12c0 3.86-3.14 7-7 7s-7-3.14-7-7 3.14-7 7-7c1.9 0 3.63.76 4.9 2H14c-.55 0-1 .45-1 1s.45 1 1 1h4c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1s-1 .45-1 1v1.7C16.63 4.78 14.44 4 12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8c0-.55-.45-1-1-1s-1 .45-1 1z"/>
                </svg>
                <span>Request New Capability</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CapabilitiesGrid({
  capabilities,
  onRenew,
}: {
  capabilities: Capability[];
  onRenew: (id: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Bento grids stagger sequence on entry
  useEffect(() => {
    if (!gridRef.current) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = gridRef.current.children;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(cards, { opacity: 1, scale: 1, y: 0 });
        return;
      }
      gsap.from(cards, {
        opacity: 0,
        scale: 0.92,
        y: 16,
        duration: 0.6,
        stagger: 0.12,
        delay: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 78%",
          once: true,
        },
      });
    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {capabilities.map((cap) => (
        <CapabilityCard key={cap.id} cap={cap} onRenew={onRenew} />
      ))}
    </div>
  );
}
