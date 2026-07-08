"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Capability {
  id: string;
  name: string;
  scope: string;
  maxTTL: number; // in seconds
  currentTTL: number; // in seconds
  status: "granted" | "expiring" | "expired";
  description?: string;
}

const initialCapabilities: Capability[] = [
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
            className={`p-[6px] rounded-[1.25rem] bg-[#17150f]/5 dark:bg-white/5 border border-[#d4d0c5] dark:border-[#1b1e25]/60 shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_#1b1e25] flex flex-col h-full transition-all duration-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#d4d0c5] dark:hover:shadow-[2px_2px_0px_#1b1e25] ${
              cap.status === "expiring" ? "animate-pulse border-[#ef4444]/60 dark:border-[#ef4444]" : ""
            }`}
          >
            <div
              className={`p-5 bg-[#faf9f5] dark:bg-[#0d0f13] rounded-[calc(1.25rem-6px)] flex flex-col justify-between h-full relative overflow-hidden shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15)] select-none border border-transparent dark:border-[#ffffff]/5 transition-colors duration-300 ${
                cap.status === "expiring" ? "bg-[#ef4444]/[0.015] dark:bg-[#ef4444]/[0.035]" : ""
              }`}
            >
              {/* Clean solid linear decay progress bar with laser glow */}
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#d4d0c5]/25 dark:bg-[#1b1e25]/40 rounded-t-[1.25rem]">
                <div
                  className={`h-full rounded-l-[1.25rem] transition-[width] duration-1000 ease-linear ${
                    cap.status === "expiring" 
                      ? "bg-[#ef4444] shadow-[0_0_10px_#ef4444,0_0_4px_#ef4444]" 
                      : cap.id === "cap-1" || cap.id === "cap-4"
                      ? "bg-[#10b981] shadow-[0_0_10px_#10b981,0_0_4px_#10b981]"
                      : "bg-[#17150f] dark:bg-[#ffb000] shadow-[0_0_10px_#ffb000,0_0_4px_#ffb000]"
                  }`}
                  style={{ width: `${ttlRatio * 100}%` }}
                />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start font-mono text-xs gap-4 w-full">
                <div className="flex-1">
                  <span className="text-[10px] text-[#5c574a] dark:text-[#737b8c] uppercase block tracking-wider">CAPABILITY</span>
                  <span className="font-semibold text-[#17150f] dark:text-[#e6e8eb] text-sm block mt-0.5">{cap.name}</span>
                  {isWide && (
                    <p className="text-[11px] text-[#5c574a]/85 dark:text-[#737b8c]/85 leading-relaxed mt-2 select-text text-left max-w-md font-sans">
                      {cap.description}
                    </p>
                  )}
                </div>
                <span className="px-2 py-0.5 border border-[#d4d0c5] dark:border-[#1b1e25] bg-[#f6f5f0] dark:bg-[#08090c] text-[#5c574a] dark:text-[#737b8c] text-[9px] uppercase font-mono transition-colors duration-300 shrink-0">
                  {cap.scope}
                </span>
              </div>

              <div className="relative z-10 flex flex-wrap justify-between items-center gap-3 mt-6 pt-3 border-t border-dashed border-[#d4d0c5] dark:border-[#1b1e25] font-mono text-xs">
                <span className="flex items-center gap-1.5 text-[#5c574a] dark:text-[#737b8c]">
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      cap.status === "expiring" ? "bg-[#ef4444] animate-ping" : "bg-[#10b981]"
                    }`}
                  />
                  <span>STATUS:</span>
                  <span className={cap.status === "expiring" ? "text-[#ef4444] font-bold" : "text-[#17150f] dark:text-[#e6e8eb]"}>
                    {cap.status === "expiring" ? "EXPIRING" : "GRANTED"}
                  </span>
                </span>

                <span className="flex items-center gap-2 text-[#5c574a] dark:text-[#737b8c]">
                  <span>TTL:</span>
                  <span
                    className={`font-bold tabular-nums px-1.5 py-0.5 rounded text-xs transition-colors duration-300 ${
                      cap.status === "expiring"
                        ? "bg-[#ef4444] text-white animate-pulse"
                        : "bg-[#17150f] dark:bg-[#ffb000] text-[#f6f5f0] dark:text-[#08090c]"
                    }`}
                  >
                    {formatTime(cap.currentTTL)}
                  </span>
                </span>
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
            <div className="p-5 bg-[#faf9f5] dark:bg-[#0d0f13] rounded-[calc(1.25rem-6px)] flex flex-col justify-between items-center text-center h-full relative overflow-hidden shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.1)] border border-transparent dark:border-[#ffffff]/5 select-none transition-colors duration-300">
              <div className="font-mono text-xs text-[#ef4444] space-y-1 pt-3">
                <p className="font-bold tracking-widest text-[10px] uppercase">CAPABILITY EXPIRED</p>
                <p className="text-[#5c574a] dark:text-[#737b8c] text-[11px] font-mono">
                  Token for <strong className="text-[#17150f] dark:text-[#e6e8eb] font-mono">{cap.name}</strong> dissolved.
                </p>
              </div>
              <button
                onClick={() => onRenew(cap.id)}
                className="mt-4 w-full bg-[#17150f] dark:bg-[#ffb000] text-[#f6f5f0] dark:text-[#08090c] text-[10px] font-bold uppercase px-4 py-2 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.97] cursor-pointer rounded-md shadow-sm border border-[#17150f] dark:border-[#ffb000]"
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

export default function CapabilitiesGrid() {
  const [capabilities, setCapabilities] = useState<Capability[]>(initialCapabilities);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCapabilities((prev) =>
        prev.map((cap) => {
          if (cap.status === "expired") return cap;

          const nextTTL = cap.currentTTL - 1;
          let status: Capability["status"] = cap.status;

          if (nextTTL <= 0) {
            status = "expired";
          } else if (nextTTL < 15) {
            status = "expiring";
          }

          return { ...cap, currentTTL: nextTTL, status };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRenew = (id: string) => {
    setCapabilities((prev) =>
      prev.map((cap) => {
        if (cap.id === id) {
          const seconds = (Math.floor(Math.random() * 10) + 5) * 60; // 5-15 min
          return { ...cap, maxTTL: seconds, currentTTL: seconds, status: "granted" };
        }
        return cap;
      })
    );
  };

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
    <div className="space-y-6">
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {capabilities.map((cap) => (
          <CapabilityCard key={cap.id} cap={cap} onRenew={handleRenew} />
        ))}
      </div>
    </div>
  );
}
