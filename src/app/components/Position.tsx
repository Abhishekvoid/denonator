"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { User, Server, Cpu, ArrowRight } from "lucide-react";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_?";

function randomScramble(len: number) {
  let out = "";
  for (let i = 0; i < len; i++)
    out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
  return out;
}

// Rendered only once the missing layer is compiled. Scrambles a placeholder
// into BROKER, so "compiling" reads visually as an unresolved symbol resolving,
// rhyming with the hero's DecryptPill. Mounts fresh on each compile.
function SymbolResolve({ reduce }: { reduce: boolean | null }) {
  const target = "BROKER";
  const [text, setText] = useState(() =>
    reduce ? target : randomScramble(target.length),
  );

  useEffect(() => {
    if (reduce) return;
    let iterations = 0;
    const id = setInterval(() => {
      setText(
        target
          .split("")
          .map((_c, i) =>
            i < iterations
              ? target[i]
              : SCRAMBLE_CHARS[
                  Math.floor(Math.random() * SCRAMBLE_CHARS.length)
                ],
          )
          .join(""),
      );
      iterations += 1 / 3;
      if (iterations >= target.length) {
        setText(target);
        clearInterval(id);
      }
    }, 40);
    return () => clearInterval(id);
  }, [reduce]);

  return <span>{text}</span>;
}

// The two settled eras: history, quiet and already resolved. They exist to
// establish the pattern the reader completes on the third row.
const HISTORY = [
  {
    era: "THE WEB",
    actor: "Humans",
    primitive: "Identity Providers",
    Icon: User,
  },
  {
    era: "THE CLOUD",
    actor: "Services",
    primitive: "Secret Managers",
    Icon: Server,
  },
] as const;

function Connector() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <div className="w-px h-5 bg-ink-border" />
    </div>
  );
}

export default function Position() {
  const reduce = useReducedMotion();
  // The compile does real work: the interactive default is unresolved. Under
  // reduced motion we default to resolved so the argument is complete without
  // interaction. Once the reader clicks, their override wins.
  const [override, setOverride] = useState<boolean | null>(null);
  const compiled = override ?? !!reduce;

  const rowReveal = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.5 },
          transition: {
            duration: 0.6,
            delay: i * 0.12,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          },
        };

  return (
    <div className="border-b border-dashed border-ink-border bg-paper transition-colors duration-300 relative overflow-hidden">
      {/* IDE Panel Header */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-panel/80 border-b border-ink-border text-[10px] font-mono text-ink-muted dark:text-[#928b7d] select-none uppercase tracking-wider">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-[#3b82f6] font-extrabold">&gt;</span>
          <span>THE_MISSING_LAYER</span>
        </div>
        <div className="font-semibold">
          [<span className="text-[#3b82f6] font-bold">5</span>/6]
        </div>
      </div>

      <div className="px-6 py-6 md:py-12">
        <div className="w-full max-w-310 mx-auto space-y-10">
          {/* Headline: states the historical law, withholds Broker */}
          <div className="space-y-5">
            <span className="inline-block rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-bold font-mono bg-[#c03a2b]/10 dark:bg-amber/10 text-[#c03a2b] dark:text-amber border border-[#c03a2b]/20 dark:border-amber/20 select-none">
              SEC. 5 — THE MISSING LAYER
            </span>
            <h2 className="font-sans text-4xl md:text-5xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-[1.05] max-w-3xl">
              Every era of computing minted a new way to prove trust.{" "}
              <span className="text-[#c03a2b] dark:text-amber">
                Autonomous software never got one.
              </span>
            </h2>
          </div>

          {/* Compiler control */}
          <div className="flex flex-wrap justify-between items-center bg-panel border border-ink-border p-4 gap-4 font-mono text-xs select-none">
            <span className="text-[#5c574a] dark:text-[#928b7d] font-bold tracking-wider">
              TRUST ARCHITECTURE COMPILER
            </span>
            <button
              onClick={() => setOverride(!compiled)}
              aria-pressed={compiled}
              className={`px-3 py-1.5 cursor-pointer font-bold uppercase transition-all border active:translate-y-[0.5px] rounded-sm flex items-center gap-1.5 ${
                compiled
                  ? "bg-emerald/15 text-emerald border-emerald"
                  : "bg-crimson/15 text-crimson border-crimson/50 hover:bg-crimson/25"
              }`}
            >
              {compiled ? "✓ Trust Model Resolved" : "▶ Compile Missing Layer"}
            </button>
          </div>

          {/* The timeline: history settled and quiet, the present alive */}
          <div>
            {HISTORY.map(({ era, actor, primitive, Icon }, i) => (
              <div key={era}>
                <motion.div
                  {...rowReveal(i)}
                  className="grid grid-cols-12 items-center gap-3 border border-ink-border bg-panel/40 px-5 py-4"
                >
                  <div className="col-span-12 md:col-span-3 font-mono text-[10px] tracking-[0.2em] uppercase text-[#5c574a] dark:text-[#928b7d] font-bold">
                    {era}
                  </div>
                  <div className="col-span-8 md:col-span-6 flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#3b82f6] shrink-0" />
                    <span className="font-sans text-sm font-bold text-[#17150f] dark:text-[#ece7dd]">
                      {actor}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#5c574a] dark:text-[#928b7d] shrink-0" />
                    <span className="font-mono text-xs text-[#5c574a] dark:text-[#928b7d]">
                      {primitive}
                    </span>
                  </div>
                  <div className="col-span-4 md:col-span-3 flex justify-end">
                    <span className="font-mono text-[10px] font-bold text-emerald flex items-center gap-1.5 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                      RESOLVED
                    </span>
                  </div>
                </motion.div>
                <Connector />
              </div>
            ))}

            {/* The live era: the reader compiles the missing primitive here */}
            <motion.div
              {...rowReveal(HISTORY.length)}
              className={`grid grid-cols-12 items-start gap-3 border-2 px-5 py-6 md:py-7 transition-all duration-500 ${
                compiled
                  ? "border-emerald bg-emerald/5 shadow-[0_0_24px_rgba(16,185,129,0.12)]"
                  : "border-crimson bg-crimson/5 shadow-[0_0_24px_rgba(192,58,43,0.12)]"
              }`}
            >
              <div className="col-span-12 md:col-span-3 font-mono text-[10px] tracking-[0.2em] uppercase text-[#5c574a] dark:text-[#928b7d] font-bold">
                AUTONOMY
              </div>

              <div className="col-span-12 md:col-span-6 space-y-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Cpu
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      compiled ? "text-emerald" : "text-crimson"
                    }`}
                  />
                  <span className="font-sans text-base font-bold text-[#17150f] dark:text-[#ece7dd]">
                    Agents
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#5c574a] dark:text-[#928b7d] shrink-0" />
                  <span className="font-sans text-lg md:text-xl font-extrabold tracking-tight">
                    <span
                      className={
                        compiled
                          ? "text-[#c03a2b] dark:text-amber"
                          : "text-crimson"
                      }
                    >
                      {compiled ? <SymbolResolve reduce={reduce} /> : "?"}
                    </span>
                    {compiled && (
                      <span className="text-[#5c574a] dark:text-[#928b7d] font-mono text-xs font-normal">
                        {" "}
                        · Runtime Trust Layer
                      </span>
                    )}
                  </span>
                </div>

                <div className="border-t border-dashed border-ink-border pt-3 flex flex-col gap-1.5 font-mono text-[10px] max-w-xs">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#5c574a] dark:text-[#928b7d] select-none">
                      AUTHENTICATOR
                    </span>
                    <motion.span
                      key={compiled ? "auth-secured" : "auth-gap"}
                      initial={reduce ? false : { opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`font-bold uppercase text-right ${
                        compiled ? "text-emerald" : "text-crimson"
                      }`}
                    >
                      {compiled ? "Broker Gateway" : "None (inherits yours)"}
                    </motion.span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#5c574a] dark:text-[#928b7d] select-none">
                      BOUNDS
                    </span>
                    <motion.span
                      key={compiled ? "bounds-secured" : "bounds-gap"}
                      initial={reduce ? false : { opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-bold uppercase text-right text-[#17150f] dark:text-[#ece7dd]"
                    >
                      {compiled ? "Task-scoped, 300s TTL" : "Standing PAT, unscoped"}
                    </motion.span>
                  </div>
                </div>
              </div>

              <div className="col-span-12 md:col-span-3 flex md:justify-end">
                {compiled ? (
                  <span className="font-mono text-[10px] font-bold text-emerald flex items-center gap-1.5 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-ping" />
                    RESOLVED
                  </span>
                ) : (
                  <span className="font-mono text-[10px] font-bold text-crimson flex items-center gap-1.5 select-none animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                    TRUST GAP
                  </span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Payoff: always in the DOM so the argument never depends on the click.
              The accent intensifies once the missing layer is compiled. */}
          <div className="pt-2 max-w-2xl">
            <p className="font-sans text-2xl md:text-3xl font-bold tracking-tight leading-snug text-[#17150f] dark:text-[#ece7dd]">
              Broker is{" "}
              <span
                className={`transition-colors duration-500 ${
                  compiled
                    ? "text-[#c03a2b] dark:text-amber"
                    : "text-[#5c574a]/60 dark:text-[#928b7d]/60"
                }`}
              >
                the runtime trust layer
              </span>{" "}
              autonomous software has never had.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
