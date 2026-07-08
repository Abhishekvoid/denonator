"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Finding {
  name: string;
  prefix: string; // visible prefix before the redaction bar
  redact: string; // tailwind width of the redaction bar
  age: string;
}

// The structure of the problem is the argument. No invented stats — just the
// four credentials almost every codebase actually ships, each a standing audit
// finding: permanent, over-scoped, never rotated.
const CREDENTIALS: Finding[] = [
  { name: "GITHUB_PAT", prefix: "ghp_", redact: "w-28 sm:w-36", age: "14 months" },
  { name: "AWS_ACCESS_KEY", prefix: "AKIA", redact: "w-24 sm:w-32", age: "8 months" },
  { name: "DB_PASSWORD", prefix: "", redact: "w-32 sm:w-44", age: "22 months" },
  { name: "SLACK_BOT_TOKEN", prefix: "xoxb-", redact: "w-28 sm:w-40", age: "5 months" },
];

function ScrambleRedactor({ prefix, defaultWidth }: { prefix: string; defaultWidth: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [scrambledText, setScrambledText] = useState("");

  useEffect(() => {
    if (!isHovered) {
      setScrambledText("");
      return;
    }

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const dummyLength = 16;
    let iterations = 0;

    const interval = setInterval(() => {
      let result = "";
      for (let i = 0; i < dummyLength; i++) {
        if (i < iterations) {
          result += "x89jKdf81s9d8s1j"[i] || "x";
        } else {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      setScrambledText(result);
      iterations += 0.5;

      if (iterations >= dummyLength) {
        clearInterval(interval);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="inline-flex items-center cursor-help group/scramble py-0.5 select-none font-mono text-xs text-ink-muted dark:text-[#928b7d]"
    >
      {prefix}
      {isHovered ? (
        <span className="ml-1 text-[#ef4444] font-mono text-[11px] tracking-wider select-all font-semibold">
          {scrambledText || "scanning..."}
        </span>
      ) : (
        <span
          className={`inline-block align-middle h-[0.9em] ${defaultWidth} ml-0.5 rounded-[1px] bg-[#17150f] dark:bg-[#5a5242] transition-all duration-300 group-hover/scramble:opacity-40`}
          aria-label="redacted"
        />
      )}
    </span>
  );
}

export default function StandingSecretInventory() {
  const reduce = useReducedMotion();

  return (
    <div className="w-full max-w-310 mx-auto space-y-10">
      {/* Section copy */}
      <div className="max-w-2xl space-y-4">
        <span className="inline-block rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-bold font-mono bg-[#c03a2b]/10 dark:bg-amber/10 text-[#c03a2b] dark:text-amber border border-[#c03a2b]/20 dark:border-amber/20 select-none">
          SEC. 1 — THE STANDING SECRET
        </span>
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-tight">
          {"The problem isn't a breach. It's the inventory."}
        </h2>
        <p className="text-sm md:text-base text-ink-muted dark:text-[#928b7d] leading-relaxed">
          Every credential your agents can reach is permanent, over-scoped, and
          never rotated. It sits in plaintext across .env files, CI variables,
          and container images.
        </p>
      </div>

      {/* The inventory: a paper audit document */}
      <div className="rounded-xl border border-ink-border bg-panel overflow-hidden shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_var(--color-ink-border)] transition-colors duration-300">
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-border bg-paper font-mono text-[10px] uppercase tracking-wider select-none">
          <span className="font-bold text-[#17150f] dark:text-[#ece7dd]">
            Inventory of standing credentials
          </span>
          <span className="flex items-center gap-1.5 text-[#ef4444] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
            Status: Unresolved
          </span>
        </div>

        <div className="px-5">
          {CREDENTIALS.map((c, i) => (
            <motion.div
              key={c.name}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-[13rem_1fr] gap-x-5 gap-y-2 py-4 border-b border-dashed border-ink-border/60 dark:border-[#38332b]/60 last:border-b-0"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shrink-0" />
                <span className="font-mono text-xs font-bold text-[#17150f] dark:text-[#ece7dd]">
                  {c.name}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-x-6 gap-y-2">
                <ScrambleRedactor prefix={c.prefix} defaultWidth={c.redact} />
                <span className="font-mono text-[11px] text-ink-muted dark:text-[#928b7d] whitespace-nowrap select-none">
                  age {c.age} · scope:{" "}
                  <span className="text-[#ef4444] font-semibold">everything</span> ·
                  rotated: <span className="text-[#ef4444] font-semibold">never</span>
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Closing line — the structure is damning enough */}
      <p className="font-sans text-xl md:text-2xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-snug max-w-2xl">
        Every agent that boots inherits{" "}
        <span className="text-[#c03a2b] dark:text-amber">all of them</span>.
      </p>
    </div>
  );
}
