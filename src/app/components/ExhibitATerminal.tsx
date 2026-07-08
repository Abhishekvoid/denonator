"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

export default function ExhibitATerminal() {
  const [state, setState] = useState<"static" | "revoking" | "redacted" | "active">("static");
  const [patText, setPatText] = useState("ghp_xK7q9f2LmNz8");
  const [countdown, setCountdown] = useState(900); // 15:00
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);

  // Autoplay trigger
  useEffect(() => {
    autoplayTimer.current = setTimeout(() => {
      if (state === "static") {
        handleRevoke();
      }
    }, 4500);

    return () => {
      if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
    };
  }, [state]);

  // Countdown timer for short-lived token
  useEffect(() => {
    if (state !== "active") return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  const handleRevoke = async () => {
    if (state !== "static") return;
    setState("revoking");
    
    // Simulate typing/redacting
    const originalText = "ghp_xK7q9f2LmNz8";
    for (let i = originalText.length; i >= 0; i--) {
      await new Promise((r) => setTimeout(r, 60));
      setPatText("█".repeat(originalText.length - i) + originalText.substring(0, i));
    }
    setPatText("████████████████");
    setState("redacted");

    setTimeout(() => {
      setState("active");
    }, 800);
  };

  const handleReset = () => {
    if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
    setState("static");
    setPatText("ghp_xK7q9f2LmNz8");
    setCountdown(900);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative bg-[#211e1a] text-[#ece7dd] p-5 font-mono text-xs md:text-sm border border-[#d4d0c5] dark:border-[#38332b] shadow-xl overflow-hidden max-w-full">
      {/* Terminal Title Bar (IDE styling) */}
      <div className="flex justify-between items-center border-b border-[#38332b] pb-3 mb-4 select-none relative z-10">
        <div className="flex items-center gap-2">
          {/* Window control dots */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block opacity-85" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffb000] inline-block opacity-85" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block opacity-85" />
          </div>
          <span className="text-[#928b7d] font-medium text-[10px] tracking-wider uppercase">terminal_session.sh</span>
        </div>
        <div className="flex items-center gap-2">
          {state === "static" && (
            <span className="text-[9px] text-[#ffb000] bg-[#ffb000]/10 px-2 py-0.5 border border-[#ffb000]/20 uppercase tracking-wider">
              Unsecured PAT
            </span>
          )}
          {state === "active" && (
            <span className="text-[9px] text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 border border-[#10b981]/20 uppercase tracking-wider">
              Active Capability
            </span>
          )}
        </div>
      </div>

      {/* Terminal content */}
      <div className="space-y-4 relative z-10">
        {/* Step 1: Check Env */}
        <div>
          <p className="text-[#928b7d] font-normal">$ cat .env</p>
          <div className="flex items-center gap-3 mt-1 h-6 flex-wrap">
            <span className={`transition-all duration-300 font-medium ${state !== "static" ? "text-[#928b7d]/40 line-through" : "text-[#ece7dd]"}`}>
              GITHUB_PAT={patText}
            </span>
            <AnimatePresence>
              {state !== "static" && (
                <motion.div
                  initial={{ scale: 2, rotate: -45, opacity: 0 }}
                  animate={{ scale: 1, rotate: -6, opacity: 0.95 }}
                  exit={{ opacity: 0 }}
                  className="void-stamp"
                >
                  VOIDED
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Step 2: Revocation trigger */}
        <div>
          <p className="text-[#928b7d]">$ python agent.py</p>
          <p className="text-[#ece7dd] mt-1"><span className="text-[#ffb000]">from</span> broker <span className="text-[#ffb000]">import</span> GitHub</p>
          <p className="text-[#ece7dd]">gh = GitHub()</p>
        </div>

        {/* Step 3: ephemeral credential issuance & logs */}
        <AnimatePresence>
          {(state === "redacted" || state === "active") && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-2 pt-3 border-t border-[#38332b]"
            >
              <div className="flex items-center gap-2 text-[#10b981]">
                <span className="text-[12px] font-bold">✓</span>
                <span>Broker intercepted: Dynamic delegation initialized</span>
              </div>
              <div className="flex items-center gap-2 text-[#ece7dd] pl-6 flex-wrap">
                <span>Scope: <span className="text-[#8f95a3]">repo:read</span></span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  TTL: 
                  <span className="text-[#ffb000] font-semibold tabular-nums">
                    {formatTime(countdown)}
                  </span>
                </span>
              </div>
              <div className="text-[#928b7d] pl-6">
                Audit Log: <span className="text-[#8f95a3]">BRK_TX_98f4a · ENCRYPTED</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Terminal Interactive Controls */}
      <div className="mt-6 pt-4 border-t border-[#38332b] flex items-center justify-between flex-wrap gap-3 relative z-10">
        <span className="text-[9px] text-[#928b7d] uppercase tracking-widest">
          {state === "static" ? "Click button to trigger spec revocation" : "Revocation simulator running"}
        </span>
        <div className="flex items-center gap-2">
          {state === "static" ? (
            <button
              onClick={handleRevoke}
              className="bg-[#c03a2b] hover:bg-[#a12d20] text-white px-4 py-2 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 text-xs active:translate-y-[1px] cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              broker revoke
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="bg-[#38332b] hover:bg-[#2d313d] text-[#ece7dd] border border-[#2d313d] px-4 py-2 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 text-xs active:translate-y-[1px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
