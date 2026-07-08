"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * SEC.2 — Runtime interception. One question: when an agent asks for a
 * credential, what happens? One answer, shown not explained:
 *
 *   agent --pulse--> broker (intercept · PAUSE) --mint capability--> github (200 OK)
 *
 * The pulse is the story; the pause at the broker is the teaching frame. No
 * architecture, no boxes-and-arrows, no decorative effects. Reuses the
 * capability-card language. Reduced motion shows one static resolved frame.
 */

type Phase = "idle" | "send" | "intercept" | "mint" | "forward" | "respond" | "hold";

const SEQUENCE: { phase: Phase; ms: number }[] = [
  { phase: "idle", ms: 600 },
  { phase: "send", ms: 1400 },
  { phase: "intercept", ms: 1500 },
  { phase: "mint", ms: 900 },
  { phase: "forward", ms: 1400 },
  { phase: "respond", ms: 800 },
  { phase: "hold", ms: 1800 },
];
const ORDER: Phase[] = SEQUENCE.map((s) => s.phase);
const idxOf = (p: Phase) => ORDER.indexOf(p);

const AGENT_X = 12;
const BROKER_X = 50;
const GITHUB_X = 88;

export default function InterceptionFlow() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const i = useRef(0);

  useEffect(() => {
    if (reduce) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const step = SEQUENCE[i.current];
      setPhase(step.phase);
      i.current = (i.current + 1) % SEQUENCE.length;
      timer = setTimeout(tick, step.ms);
    };
    tick();
    return () => clearTimeout(timer);
  }, [reduce]);

  const idx = idxOf(phase);

  const agentActive = !reduce && phase === "send";
  const brokerActive = !reduce && (phase === "intercept" || phase === "mint");
  const githubActive = reduce || phase === "respond" || phase === "hold";
  const showCard = reduce || (idx >= idxOf("mint") && idx <= idxOf("hold"));
  const show200 = reduce || phase === "respond" || phase === "hold";
  const showCaption = reduce || phase === "hold";

  // Pulse position / look per phase.
  let pulseLeft = `${AGENT_X}%`;
  let pulseOpacity = 0;
  let pulseColor = "#ffb000";
  let pulseDur = 0.3;
  let pulseEase: "linear" | "easeInOut" = "easeInOut";
  if (phase === "send") {
    pulseLeft = `${BROKER_X}%`;
    pulseOpacity = 1;
    pulseDur = 1.4;
    pulseEase = "linear";
  } else if (phase === "intercept") {
    pulseLeft = `${BROKER_X}%`;
    pulseOpacity = 1;
  } else if (phase === "mint") {
    pulseLeft = `${BROKER_X}%`;
    pulseOpacity = 0; // absorbed — becomes the capability
  } else if (phase === "forward") {
    pulseLeft = `${GITHUB_X}%`;
    pulseOpacity = 1;
    pulseColor = "#10b981"; // now an authorized, scoped capability
    pulseDur = 1.4;
    pulseEase = "linear";
  } else if (phase === "respond") {
    pulseLeft = `${GITHUB_X}%`;
    pulseOpacity = 0;
    pulseColor = "#10b981";
    pulseDur = 0.4;
  }

  return (
    <div className="w-full max-w-310 mx-auto space-y-10">
      {/* Copy */}
      <div className="max-w-2xl space-y-4">
        <span className="inline-block rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-bold font-mono bg-[#c03a2b]/10 dark:bg-amber/10 text-[#c03a2b] dark:text-amber border border-[#c03a2b]/20 dark:border-amber/20 select-none">
          SEC. 2 — RUNTIME INTERCEPTION
        </span>
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-tight">
          Every request is intercepted.
        </h2>
        <p className="text-sm md:text-base text-ink-muted dark:text-[#928b7d] leading-relaxed">
          Broker never hands a permanent credential to an agent. Every request is
          paused, verified, issued a temporary capability, and forwarded.
        </p>
      </div>

      {/* The protocol */}
      <div className="rounded-xl border border-ink-border bg-panel overflow-hidden shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_var(--color-ink-border)] transition-colors duration-300">
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-border bg-paper font-mono text-[10px] uppercase tracking-wider select-none text-ink-muted dark:text-[#928b7d]">
          <span className="font-bold text-[#17150f] dark:text-[#ece7dd]">
            One request
          </span>
          <span
            className={`transition-colors duration-300 ${
              brokerActive ? "text-[#ffb000]" : githubActive ? "text-[#10b981]" : ""
            }`}
          >
            {brokerActive ? "intercepted" : githubActive ? "forwarded · 200 ok" : "listening"}
          </span>
        </div>

        <div className="px-6 md:px-10 pt-10 pb-8">
          {/* Track: agent — broker — github */}
          <div className="relative h-24">
            {/* wire */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-px bg-ink-border"
              style={{ left: `${AGENT_X}%`, right: `${100 - GITHUB_X}%` }}
            />

            {/* pulse */}
            <motion.div
              className="absolute top-1/2 w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ boxShadow: `0 0 10px 1px ${pulseColor}` }}
              initial={false}
              animate={{ left: pulseLeft, opacity: pulseOpacity, backgroundColor: pulseColor }}
              transition={{ duration: pulseDur, ease: pulseEase }}
            />

            <Node x={AGENT_X} label="Agent" active={agentActive} />
            <Node
              x={BROKER_X}
              label="Broker"
              active={brokerActive}
              broker
              badge={
                phase === "intercept"
                  ? "INTERCEPTED"
                  : brokerActive
                    ? "MINTING"
                    : undefined
              }
            />
            <Node x={GITHUB_X} label="GitHub" active={githubActive} />

            {/* 200 OK near github */}
            <AnimatePresence>
              {show200 && (
                <motion.span
                  initial={reduce ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute font-mono text-[10px] font-bold text-[#10b981] -translate-x-1/2"
                  style={{ left: `${GITHUB_X}%`, top: "-1.6rem" }}
                >
                  200 OK
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Minted capability — reused card language, appears under the broker */}
          <div className="mt-4 min-h-[6.5rem] flex justify-center">
            <AnimatePresence>
              {showCard && (
                <motion.div
                  key="cap"
                  initial={reduce ? false : { opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-sm rounded-lg border border-ink-border bg-paper p-3 font-mono transition-colors duration-300"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-ink-muted dark:text-[#928b7d] uppercase tracking-wider">
                      Capability
                    </span>
                    <span className="px-1.5 py-0.5 border border-ink-border bg-panel text-ink-muted dark:text-[#928b7d] uppercase">
                      repo:read
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                      <span className="font-bold text-[#17150f] dark:text-[#ece7dd]">
                        GRANTED
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-ink-muted dark:text-[#928b7d]">
                      TTL
                      <span className="font-bold tabular-nums px-1.5 py-0.5 rounded bg-amber text-[#17150f]">
                        00:08
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-12 gap-[3px]">
                    {Array.from({ length: 12 }).map((_, k) => (
                      <span key={k} className="h-1.5 rounded-[1px] bg-[#10b981]" />
                    ))}
                  </div>
                  <p className="mt-2 text-[9.5px] text-ink-muted/80 dark:text-[#928b7d]/80">
                    issued for this request · scope: read pull requests
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quiet takeaway */}
          <div className="min-h-[1.5rem] flex justify-center pt-3">
            <AnimatePresence>
              {showCaption && (
                <motion.p
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-center text-[11px] md:text-xs font-sans text-ink-muted dark:text-[#928b7d]"
                >
                  The agent never received the secret.{" "}
                  <span className="text-[#17150f] dark:text-[#ece7dd] font-semibold">
                    Broker received the request.
                  </span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function Node({
  x,
  label,
  active,
  broker,
  badge,
}: {
  x: number;
  label: string;
  active?: boolean;
  broker?: boolean;
  badge?: string;
}) {
  return (
    <div
      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ left: `${x}%` }}
    >
      <span
        className={`rounded-full border-2 bg-panel transition-all duration-300 ${
          broker ? "w-5 h-5" : "w-3.5 h-3.5"
        } ${
          active
            ? "border-[#ffb000] shadow-[0_0_10px_1px_rgba(255,176,0,0.5)]"
            : "border-ink-border"
        }`}
      />
      <span className="absolute top-full mt-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted dark:text-[#928b7d] whitespace-nowrap">
        {label}
      </span>
      <AnimatePresence>
        {badge && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full mb-2.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#ffb000] whitespace-nowrap"
          >
            {badge}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
