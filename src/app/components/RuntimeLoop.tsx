"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import CapabilityCard from "./CapabilityCard";

/**
 * Hero "runtime capture" — a self-executing protocol loop the visitor watches:
 *   rm .env -> agent runs -> request pulse -> broker intercepts -> capability
 *   minted -> 200 OK -> TTL drains -> expires (dissolves) -> ledger row types in
 *   -> "The secret is gone. The record remains." -> loop.
 *
 * The living capability card + append-only ledger reuse SEC.3's visual language,
 * so the hero is the canonical instance of the signature. Always-dark (a runtime
 * terminal), isolated leaf, timers cleaned up. Reduced motion renders one static
 * resolved frame instead of looping.
 */

type Phase =
  | "boot"
  | "void"
  | "intercept"
  | "mint"
  | "request"
  | "countdown"
  | "expire"
  | "record"
  | "hold";

const SEQUENCE: { phase: Phase; ms: number }[] = [
  { phase: "boot", ms: 800 },
  { phase: "void", ms: 1000 },
  { phase: "intercept", ms: 1200 },
  { phase: "mint", ms: 800 },
  { phase: "request", ms: 1000 },
  { phase: "countdown", ms: 2600 },
  { phase: "expire", ms: 800 },
  { phase: "record", ms: 1200 },
  { phase: "hold", ms: 1000 },
];
const ORDER: Phase[] = SEQUENCE.map((s) => s.phase);
const idxOf = (p: Phase) => ORDER.indexOf(p);

const TTL_START = 8;
const SEGMENTS = 12;

interface LedgerRow {
  ref: string;
  ts: string;
}

const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
const rowText = (r: LedgerRow) => `${r.ref}  repo:read  ✓ recorded  ${r.ts}`;

function LedgerRowView({ r, dim }: { r: LedgerRow; dim?: boolean }) {
  return (
    <div
      className={`grid grid-cols-[5.5rem_1fr_auto] gap-x-3 items-center text-[10px] ${
        dim ? "opacity-45" : ""
      }`}
    >
      <span className={`font-bold tabular-nums ${dim ? "text-[#8a99ad]" : "text-[#ffb000]"}`}>
        {r.ref}
      </span>
      <span className="text-[#8a99ad]">
        repo:read <span className="text-[#10b981]">&#10003; recorded</span>
      </span>
      <span className="text-[#8a99ad]/60 tabular-nums">{r.ts}</span>
    </div>
  );
}

export default function RuntimeLoop() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("boot");
  const [ttl, setTtl] = useState(TTL_START);
  // Exactly two rows, always. Seed with two priors so the ledger is never short.
  const [ledger, setLedger] = useState<LedgerRow[]>([
    { ref: "BRK-0045", ts: "14:21:07" },
    { ref: "BRK-0046", ts: "14:21:52" },
  ]);
  const [typed, setTyped] = useState(0);
  const brk = useRef(46);

  // Main sequence loop.
  useEffect(() => {
    if (reduce) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const step = SEQUENCE[i];
      setPhase(step.phase);
      if (step.phase === "boot") setTtl(TTL_START);
      if (step.phase === "record") {
        brk.current += 1;
        const ref = `BRK-${String(brk.current).padStart(4, "0")}`;
        setLedger((l) => [...l, { ref, ts: stamp() }].slice(-2));
        setTyped(0);
      }
      i = (i + 1) % SEQUENCE.length;
      timer = setTimeout(tick, step.ms);
    };
    tick();
    return () => clearTimeout(timer);
  }, [reduce]);

  // TTL drain during countdown.
  useEffect(() => {
    if (reduce || phase !== "countdown") return;
    const iv = setInterval(() => setTtl((t) => (t > 0 ? t - 1 : 0)), 2600 / TTL_START);
    return () => clearInterval(iv);
  }, [phase, reduce]);

  // Type the newest ledger row when it is recorded (typed reset lives in the
  // sequence tick above, which runs async, so nothing is set synchronously here).
  useEffect(() => {
    if (reduce || phase !== "record") return;
    const iv = setInterval(() => setTyped((n) => n + 1), 26);
    return () => clearInterval(iv);
  }, [phase, reduce]);

  const idx = idxOf(phase);
  const at = (p: Phase) => reduce || idx >= idxOf(p);

  const voided = at("void");
  const showIntercept = at("intercept");
  const cardMounted = reduce || (idx >= idxOf("mint") && idx <= idxOf("hold"));
  const show200 = at("request");
  const dissolving = !reduce && idx >= idxOf("expire");
  const shownTtl = reduce ? 4 : ttl;
  const expiring = !reduce && phase === "countdown" && ttl <= 2;
  const filled = Math.max(0, Math.round((shownTtl / TTL_START) * SEGMENTS));
  const mmss = `00:${String(shownTtl).padStart(2, "0")}`;
  const showStatement = reduce || phase === "hold";

  const older = ledger[0];
  const newest = ledger[1];
  const newestFull = rowText(newest);
  const typing = !reduce && phase === "record" && typed < newestFull.length;

  const chip = reduce
    ? "text-[#10b981] border-[#10b981]/30 bg-[#10b981]/10"
    : idx >= idxOf("record")
      ? "text-[#8a99ad] border-[#212836] bg-[#141a24]"
      : idx >= idxOf("expire")
        ? "text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10"
        : idx >= idxOf("mint")
          ? "text-[#10b981] border-[#10b981]/30 bg-[#10b981]/10"
          : idx >= idxOf("void")
            ? "text-[#ffb000] border-[#ffb000]/30 bg-[#ffb000]/10"
            : "text-[#8a99ad] border-[#212836] bg-[#141a24]";
  const chipText = reduce
    ? "CAPABILITY ACTIVE"
    : idx >= idxOf("record")
      ? "RECORDED"
      : idx >= idxOf("expire")
        ? "EXPIRED"
        : idx >= idxOf("mint")
          ? "CAPABILITY ACTIVE"
          : idx >= idxOf("void")
            ? "INTERCEPTING"
            : "UNSECURED";

  return (
    <div className="relative bg-[#0d1013] text-[#f1f5f9] border border-[#212836] rounded-lg overflow-hidden font-mono shadow-xl select-none">
      {/* Title bar */}
      <div className="h-9 flex items-center justify-between px-4 border-b border-[#212836] text-[10px] text-[#8a99ad]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/85" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffb000]/85" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]/85" />
          <span className="ml-2 tracking-wider uppercase">terminal_session.sh</span>
        </div>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-sm transition-colors duration-300 ${chip}`}
        >
          {chipText}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 md:p-5 text-[11px] md:text-xs space-y-3 min-h-[22rem] flex flex-col">
        {/* rm .env */}
        <div>
          <p className="text-[#8a99ad]">$ rm .env</p>
          <p className="mt-0.5 flex items-center gap-2 flex-wrap">
            <span className={voided ? "text-[#8a99ad]/50 line-through" : ""}>
              GITHUB_PAT={voided ? "████████████" : "ghp_xK7q9f2LmNz8"}
            </span>
            {voided && (
              <span className="text-[9px] text-[#ef4444] border border-[#ef4444]/30 bg-[#ef4444]/10 px-1.5 py-0.5 uppercase tracking-wider rounded-sm">
                voided
              </span>
            )}
          </p>
        </div>

        {/* agent runs -> request pulse -> intercept */}
        <div className={showIntercept ? "" : "opacity-0"}>
          <p className="text-[#8a99ad]">$ agent.run()</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8a99ad]">
            <span className="uppercase tracking-wider">agent</span>
            <span className="relative h-px w-16 bg-[#212836]">
              {!reduce && phase === "intercept" && (
                <motion.span
                  className="absolute top-1/2 -mt-[3px] w-1.5 h-1.5 rounded-full bg-[#ffb000]"
                  initial={{ left: "0%", opacity: 0 }}
                  animate={{ left: "100%", opacity: [0, 1, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </span>
            <span className="uppercase tracking-wider">broker</span>
          </div>
          <p className="mt-1 text-[#f1f5f9]">
            <span className="text-[#ffb000]">&#8627;</span> broker intercepts the request
          </p>
        </div>

        {/* Living capability card */}
        <div className="min-h-[7.5rem]">
          <AnimatePresence>
            {cardMounted && (
              <motion.div
                key="cap"
                initial={reduce ? false : { opacity: 0, y: 10, scale: 0.96 }}
                animate={{
                  opacity: dissolving ? 0 : 1,
                  y: 0,
                  scale: dissolving ? 0.96 : 1,
                  filter: dissolving ? "blur(8px)" : "blur(0px)",
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <CapabilityCard
                  tone="terminal"
                  status={expiring ? "expiring" : "granted"}
                  ttl={mmss}
                  filled={filled}
                  segments={SEGMENTS}
                  showRequest={show200}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Append-only ledger — exactly two rows, newest types in */}
        <div className="pt-2 border-t border-dashed border-[#212836]">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-[#8a99ad]/70 mb-1.5">
            <span>Audit ledger · append-only</span>
            <span className="flex items-center gap-1 text-[#8a99ad]/60">
              <span className="text-[#10b981]">&#8635;</span> loop
            </span>
          </div>
          <div className="space-y-0.5">
            <LedgerRowView r={older} dim />
            {typing ? (
              <div className="text-[10px] text-[#8a99ad]">
                <span className="tabular-nums">{newestFull.slice(0, typed)}</span>
                <span className="text-[#ffb000] animate-pulse">&#9612;</span>
              </div>
            ) : (
              <LedgerRowView r={newest} />
            )}
          </div>
        </div>

        {/* Closing pause */}
        <div className="mt-auto min-h-[1.75rem] flex items-center justify-center pt-2">
          <AnimatePresence>
            {showStatement && (
              <motion.p
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center text-[11px] md:text-xs font-sans"
              >
                <span className="text-[#8a99ad]">The secret is gone.</span>{" "}
                <span className="text-[#10b981] font-semibold">The record remains.</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
