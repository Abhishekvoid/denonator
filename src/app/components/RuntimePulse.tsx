"use client";

import { useState, useEffect, useRef } from "react";
import { motion, animate, AnimatePresence } from "framer-motion";
import { Terminal, ShieldAlert, Fingerprint } from "lucide-react";

type PulseType = "granted" | "temporary" | "denied";

const COLOR_MAP: Record<PulseType, string> = {
  granted: "#10b981",   // Emerald Green
  temporary: "#ffb000", // Amber Yellow
  denied: "#ef4444",    // Crimson Red
};

function SystemsViewExhibit() {
  const [step, setStep] = useState<"before" | "transitioning" | "after">("before");
  const [beforeText, setBeforeText] = useState(
    'import os\nfrom github import Github\n\n# Raw secret exposed in env\npat = os.getenv("GITHUB_PAT")\ngh = Github(pat)'
  );
  const [afterText, setAfterText] = useState("");
  const targetAfterText =
    '# Intercepted dynamically at runtime\nfrom broker import GitHub\n\n# Zero-secret agent execution\ngh = GitHub()';

  const runExhibitTransition = async () => {
    setStep("before");
    setBeforeText(
      'import os\nfrom github import Github\n\n# Raw secret exposed in env\npat = os.getenv("GITHUB_PAT")\ngh = Github(pat)'
    );
    setAfterText("");
    await new Promise((r) => setTimeout(r, 1000));

    setStep("transitioning");
    
    const lines = [
      'import os',
      'from github import Github',
      '',
      '# Raw secret exposed in env',
      'pat = os.getenv("GITHUB_PAT")',
      'gh = Github(pat)'
    ];

    for (let charIndex = lines[4].length; charIndex >= 0; charIndex--) {
      await new Promise((r) => setTimeout(r, 20));
      const redactedLine = '█'.repeat(lines[4].length - charIndex) + lines[4].substring(0, charIndex);
      setBeforeText(
        [lines[0], lines[1], lines[2], lines[3], redactedLine, lines[5]].join('\n')
      );
    }
    lines[4] = '█'.repeat(lines[4].length);

    for (let charIndex = lines[5].length; charIndex >= 0; charIndex--) {
      await new Promise((r) => setTimeout(r, 20));
      const redactedLine = '█'.repeat(lines[5].length - charIndex) + lines[5].substring(0, charIndex);
      setBeforeText(
        [lines[0], lines[1], lines[2], lines[3], lines[4], redactedLine].join('\n')
      );
    }
    lines[5] = '█'.repeat(lines[5].length);

    await new Promise((r) => setTimeout(r, 400));
    setStep("after");

    let currentText = "";
    for (let i = 0; i < targetAfterText.length; i++) {
      await new Promise((r) => setTimeout(r, 10));
      currentText += targetAfterText[i];
      setAfterText(currentText);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runExhibitTransition();
          }
        });
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="border border-[#d4d0c5] dark:border-[#38332b] rounded-none overflow-hidden font-mono text-[10px] relative">
      <div className="bg-[#f6f5f0] dark:bg-[#1a1815] border-b border-[#d4d0c5] dark:border-[#38332b] px-3 py-1.5 flex justify-between items-center text-[9px] text-[#5c574a] dark:text-[#928b7d] font-bold uppercase tracking-wider select-none">
        <span>Systems-View Exhibit</span>
        <button 
          onClick={runExhibitTransition} 
          className="text-[#c03a2b] dark:text-amber hover:underline uppercase font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none font-mono text-[9px]"
        >
          <span>[ Replay Exhibit ]</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 divide-y divide-[#d4d0c5] dark:divide-[#38332b] bg-[#faf9f5]/30 dark:bg-[#211e1a]/30 relative">
        <div className="p-3.5 space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[#ef4444] font-bold text-[8px] uppercase tracking-wider block">Before (Static Secret)</span>
            <span className="text-[8px] text-[#5c574a] dark:text-[#928b7d]">github (direct pat)</span>
          </div>
          
          <pre className="text-[#5c574a] dark:text-[#928b7d] leading-normal text-[9px] overflow-x-auto whitespace-pre font-mono min-h-16">
            {beforeText}
          </pre>

          <AnimatePresence>
            {step === "after" && (
              <motion.div
                initial={{ scale: 2, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: -8, opacity: 0.85 }}
                exit={{ opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-[#ef4444] text-[#ef4444] font-mono text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded bg-[#faf9f5] dark:bg-[#211e1a] pointer-events-none select-none shadow-lg z-10"
              >
                VOIDED (SECRET LEAK RISK)
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={`p-3.5 space-y-1.5 transition-colors duration-500 ${step === "after" ? "bg-[#10b981]/5 dark:bg-[#10b981]/2" : ""}`}>
          <div className="flex items-center justify-between">
            <span className={`font-bold text-[8px] uppercase tracking-wider block ${step === "after" ? "text-[#10b981]" : "text-[#5c574a]/50 dark:text-[#928b7d]/50"}`}>
              After (Broker Intercept)
            </span>
            <span className="text-[8px] text-[#5c574a]/50 dark:text-[#928b7d]/50 font-bold uppercase">Safe Intercept</span>
          </div>

          <pre className={`leading-normal text-[9px] overflow-x-auto whitespace-pre font-mono min-h-16 transition-colors duration-500 ${step === "after" ? "text-[#17150f] dark:text-[#ece7dd]" : "text-[#5c574a]/40 dark:text-[#928b7d]/40"}`}>
            {afterText || (step !== "after" ? "# Waiting for proxy initiation..." : "")}
            {step === "after" && afterText.length < targetAfterText.length && (
              <span className="inline-block w-1.5 h-3 ml-0.5 bg-[#10b981] animate-pulse" />
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function RuntimePulse() {
  const [activeType, setActiveType] = useState<PulseType>("granted");
  const [pulseCount, setPulseCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [brokerStatus, setBrokerStatus] = useState<"listening" | "verifying" | PulseType>("listening");
  const [leftWireColor, setLeftWireColor] = useState<string>("var(--stroke-wire)");
  const [rightWireColor, setRightWireColor] = useState<string>("var(--stroke-wire)");

  const [leftProgress, setLeftProgress] = useState(0);
  const [rightProgress, setRightProgress] = useState(0);
  const [brokerShake, setBrokerShake] = useState(false);
  const [githubActive, setGithubActive] = useState(false);
  const [agentActive, setAgentActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayedRef = useRef(false);

  // References to track and clean active animations/timers
  const timer1Ref = useRef<NodeJS.Timeout | null>(null);
  const timer2Ref = useRef<NodeJS.Timeout | null>(null);
  const timer3Ref = useRef<NodeJS.Timeout | null>(null);
  const apiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const agentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leftAnimRef = useRef<{ stop: () => void } | null>(null);
  const rightAnimRef = useRef<{ stop: () => void } | null>(null);

  const cleanUpAll = () => {
    if (timer1Ref.current) clearTimeout(timer1Ref.current);
    if (timer2Ref.current) clearTimeout(timer2Ref.current);
    if (timer3Ref.current) clearTimeout(timer3Ref.current);
    if (apiTimerRef.current) clearTimeout(apiTimerRef.current);
    if (agentTimerRef.current) clearTimeout(agentTimerRef.current);
    if (leftAnimRef.current) leftAnimRef.current.stop();
    if (rightAnimRef.current) rightAnimRef.current.stop();
  };

  const playFlow = (type: PulseType) => {
    cleanUpAll();
    
    setIsAnimating(true);
    setBrokerStatus("listening");
    setBrokerShake(false);
    setGithubActive(false);
    setAgentActive(true);

    // AI Agent only glows when pulse starts (first 500ms)
    agentTimerRef.current = setTimeout(() => {
      setAgentActive(false);
    }, 500);

    if (type === "denied") {
      setLeftWireColor("var(--stroke-wire)");
      setRightWireColor("var(--stroke-wire)");
      setLeftProgress(0);
      setRightProgress(0);

      // Animate left wire progress over 1.32s
      leftAnimRef.current = animate(0, 100, {
        duration: 1.32,
        ease: "easeInOut",
        onUpdate: (latest) => setLeftProgress(latest),
      });

      // 1. Reaches Broker at 1320ms
      timer1Ref.current = setTimeout(() => {
        setLeftWireColor(COLOR_MAP.denied);
        setBrokerStatus("verifying");
      }, 1320);

      // 2. Swings to DENIED status at 1600ms & plays physical shake
      timer2Ref.current = setTimeout(() => {
        setBrokerStatus("denied");
        setBrokerShake(true);
      }, 1600);

      // 3. Reset after animation completes + buffer (2700ms)
      timer3Ref.current = setTimeout(() => {
        setIsAnimating(false);
        setLeftWireColor("var(--stroke-wire)");
        setLeftProgress(0);
        setBrokerStatus("listening");
        setBrokerShake(false);
      }, 2700);
    } else {
      // Granted or Temporary flow
      const activeColor = COLOR_MAP[type];
      setLeftWireColor(activeColor); // Left wire starts glowing active color instantly
      setRightWireColor("var(--stroke-wire)");
      setLeftProgress(0);
      setRightProgress(0);

      // Animate left wire progress over 1.4s
      leftAnimRef.current = animate(0, 100, {
        duration: 1.4,
        ease: "easeInOut",
        onUpdate: (latest) => setLeftProgress(latest),
      });

      // 1. Reaches Broker at 1400ms
      timer1Ref.current = setTimeout(() => {
        setBrokerStatus("verifying");
      }, 1400);

      // 2. Swings to status, resets left wire, and starts right wire glow at 2100ms
      timer2Ref.current = setTimeout(() => {
        setLeftWireColor("var(--stroke-wire)");
        setLeftProgress(0);
        setRightWireColor(activeColor);
        setBrokerStatus(type);

        // Animate right wire progress over 1.4s
        rightAnimRef.current = animate(0, 100, {
          duration: 1.4,
          ease: "easeInOut",
          onUpdate: (latest) => setRightProgress(latest),
        });
      }, 2100);

      // 3. Reaches GitHub API at 3500ms -> Trigger card success ripple/glow
      apiTimerRef.current = setTimeout(() => {
        setGithubActive(true);
      }, 3500);

      // 4. Reset after animation completes + buffer (4500ms)
      timer3Ref.current = setTimeout(() => {
        setIsAnimating(false);
        setRightWireColor("var(--stroke-wire)");
        setRightProgress(0);
        setBrokerStatus("listening");
        setGithubActive(false);
      }, 4500);
    }
  };

  // Setup intersection observer for auto triggering on first view
  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPlayedRef.current) {
            hasPlayedRef.current = true;
            playFlow("granted");
          }
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      cleanUpAll();
    };
  }, []);

  // Color helper based on selected path
  const getColor = (type: PulseType) => COLOR_MAP[type];

  // Manual interactive trigger
  const triggerPulse = (type: PulseType) => {
    setActiveType(type);
    setPulseCount((prev) => prev + 1);
    playFlow(type);
  };

  const [countdownVal, setCountdownVal] = useState("04:59");

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownVal((prev) => {
        const [m, s] = prev.split(":").map(Number);
        let totalSecs = m * 60 + s - 1;
        if (totalSecs < 0) {
          totalSecs = 299; // reset to 4:59
        }
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full space-y-12">
      {/* Top Header Section */}
      <div className="text-left max-w-3xl space-y-4">
        <span className="font-mono text-xs font-bold text-[#c03a2b] dark:text-[#ffb000] tracking-widest uppercase block">
          SEC. 2 — FLOW SCHEMA
        </span>
        <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-tight">
          {"Intercepting credentials dynamically"}
        </h2>
        <p className="text-sm text-[#5c574a] dark:text-[#928b7d] leading-relaxed">
          Instead of injecting raw tokens, the Agent asks the Broker. The Broker validates the policy, contacts the identity provider for a short-lived scoped key, and handles the call transparently.
        </p>
      </div>

      {/* 1. Full-Width Visual Schematic Board */}
      <div className="border border-ink-border bg-panel p-4 md:p-6 font-mono text-xs md:text-sm relative overflow-hidden transition-colors duration-300">
        {/* Schematic Header */}
        <div className="flex justify-between items-center border-b border-ink-border pb-4 mb-6 select-none flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-crimson opacity-80" />
            <span className="w-2 h-2 rounded-full bg-amber opacity-80" />
            <span className="w-2 h-2 rounded-full bg-emerald opacity-80" />
            <span className="text-[#5c574a] dark:text-[#928b7d] text-[10px] font-bold tracking-widest uppercase ml-1.5">
              ACTIVE INTERCEPTION SCHEMATIC
            </span>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-[9px] md:text-[10px]">
            <button
               onClick={() => triggerPulse("granted")}
               className={`px-3 py-1.5 transition-all cursor-pointer border active:translate-y-[0.5px] rounded-sm font-semibold flex items-center gap-1 ${
                 activeType === "granted"
                   ? "border-[#10b981] bg-[#10b981]/10 text-[#10b981] font-bold"
                   : "border-ink-border bg-paper text-ink-muted hover:bg-ink/5"
               }`}
             >
              <span className="text-[#c03a2b] dark:text-amber font-bold mr-0.5">$</span>
              broker test --auth=ephemeral
            </button>
            <button
               onClick={() => triggerPulse("temporary")}
               className={`px-3 py-1.5 transition-all cursor-pointer border active:translate-y-[0.5px] rounded-sm font-semibold flex items-center gap-1 ${
                 activeType === "temporary"
                   ? "border-[#ffb000] bg-[#ffb000]/10 text-[#ffb000] font-bold"
                   : "border-ink-border bg-paper text-ink-muted hover:bg-ink/5"
               }`}
             >
              <span className="text-[#c03a2b] dark:text-amber font-bold mr-0.5">$</span>
              broker test --auth=delegated
            </button>
            <button
              onClick={() => triggerPulse("denied")}
              className={`px-3 py-1.5 transition-all cursor-pointer border active:translate-y-[0.5px] rounded-sm font-semibold flex items-center gap-1 ${
                activeType === "denied"
                  ? "border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444] font-bold"
                   : "border-ink-border bg-paper text-ink-muted hover:bg-ink/5"
               }`}
            >
              <span className="text-[#c03a2b] dark:text-amber font-bold mr-0.5">$</span>
              broker test --auth=violation
            </button>
          </div>
        </div>

        {/* Diagram Canvas */}
        <div className="relative h-64 md:h-48 flex items-center px-2 md:px-10 py-4 z-10">
          {/* SVG Wires (Behind Nodes) */}
          <div className="absolute left-[44px] md:left-[104px] right-[44px] md:right-[104px] h-[2px] top-1/2 -translate-y-1/2 z-0 pointer-events-none">
            <svg className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="left-wire-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset={`${leftProgress}%`} stopColor={leftWireColor} />
                  <stop offset={`${leftProgress}%`} stopColor="var(--stroke-wire)" />
                </linearGradient>
                <linearGradient id="right-wire-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset={`${rightProgress}%`} stopColor={rightWireColor} />
                  <stop offset={`${rightProgress}%`} stopColor="var(--stroke-wire)" />
                </linearGradient>
              </defs>
              {/* Left Wire Line (Agent -> Broker) */}
              <line
                x1="0%"
                y1="0"
                x2="50%"
                y2="0"
                stroke="url(#left-wire-gradient)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="animate-flow-wire transition-colors duration-300"
              />
              {/* Right Wire Line (Broker -> GitHub API) */}
              <line
                x1="50%"
                y1="0"
                x2="100%"
                y2="0"
                stroke="url(#right-wire-gradient)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="animate-flow-wire transition-colors duration-300"
              />
            </svg>

            {/* Pulse Dot */}
            {isAnimating && (
              <motion.div
                key={`pulse-${pulseCount}`}
                className="absolute w-2.5 h-2.5 rounded-full -translate-y-1/2 -translate-x-1/2 top-1/2 z-0 shadow-md"
                style={{ backgroundColor: getColor(activeType) }}
                initial={{ left: "0%", opacity: 1 }}
                animate={{
                  left: activeType === "denied" ? ["0%", "50%", "50%"] : ["0%", "50%", "50%", "100%"],
                  opacity: activeType === "denied" ? [1, 1, 0] : [1, 1, 1, 0],
                }}
                transition={{
                  duration: activeType === "denied" ? 2.2 : 3.5,
                  times: activeType === "denied" ? [0, 0.6, 1.0] : [0, 0.4, 0.6, 1.0],
                  ease: activeType === "denied" ? ["easeInOut", "linear"] : ["easeInOut", "linear", "easeInOut"],
                }}
              />
            )}
          </div>

          {/* Node 1: Agent */}
          <motion.div
            animate={agentActive ? { scale: 1.04 } : { scale: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="z-10 relative w-[100px] md:w-40 shrink-0 select-none transition-colors duration-300 font-mono"
          >
            {/* 3D Back Box */}
            <div 
              className="absolute inset-0 translate-x-[8px] -translate-y-[8px] border border-dashed border-[#d4d0c5] dark:border-[#38332b] bg-paper/30 dark:bg-[#1a1815]/30 transition-all duration-300 pointer-events-none z-0" 
              style={{
                borderColor: agentActive ? COLOR_MAP[activeType] : undefined
              }}
            />

            {/* Front Box */}
            <div 
              className="relative z-10 flex flex-col bg-[#faf9f5]/90 dark:bg-[#211e1a]/90 border border-[#d4d0c5] dark:border-[#38332b] w-full rounded-none overflow-hidden transition-all duration-300"
              style={{
                filter: agentActive
                  ? (activeType === "denied"
                    ? "drop-shadow(0px 0px 8px rgba(239,68,68,0.5))"
                    : activeType === "temporary"
                    ? "drop-shadow(0px 0px 8px rgba(255,176,0,0.5))"
                    : "drop-shadow(0px 0px 8px rgba(16,185,129,0.5))")
                  : "drop-shadow(0px 0px 0px rgba(0,0,0,0))"
              }}
            >
              {/* Mini Window Tab Bar */}
              <div className="flex items-center justify-between px-2 py-1 bg-[#f6f5f0] dark:bg-[#1a1815] border-b border-[#d4d0c5] dark:border-[#38332b] text-[9px] text-[#5c574a] dark:text-[#928b7d] font-bold">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] opacity-80" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb000] opacity-80" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] opacity-80" />
                </div>
                <span>client.py</span>
                <span className="opacity-50">×</span>
              </div>

              {/* Body Content */}
              <div className="p-2 md:p-3 flex flex-col items-center justify-center gap-1 text-center">
                <Terminal className="w-4 h-4 md:w-5 md:h-5 text-[#c03a2b] dark:text-[#ffb000] opacity-80" />
                <span className="text-[9px] md:text-[10px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider font-bold">CLIENT</span>
                <span className="text-[10px] md:text-xs font-bold text-[#17150f] dark:text-[#ece7dd]">AI Agent</span>
              </div>
            </div>
          </motion.div>

          {/* Wire 1 flex gap filler */}
          <div className="flex-1 min-w-[10px] md:min-w-[16px] h-6 relative mx-0.5 md:mx-2" />

          {/* Node 2: Interceptor (Broker Runtime) */}
          <motion.div
            animate={brokerShake ? { x: [0, -6, 6, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
            className="z-10 relative w-[120px] md:w-48 shrink-0 select-none transition-colors duration-300 font-mono"
          >
            {/* 3D Back Box */}
            <div 
              className="absolute inset-0 translate-x-[8px] -translate-y-[8px] border border-dashed border-[#ffb000]/30 bg-[#17150f]/50 pointer-events-none z-0 transition-all duration-300" 
              style={{
                borderColor: brokerStatus !== "listening" ? COLOR_MAP[activeType] : undefined
              }}
            />

            {/* Front Box */}
            <div 
              className="relative z-10 flex flex-col bg-[#17150f] dark:bg-[#17150f] border border-[#17150f] dark:border-[#423c32] w-full rounded-none overflow-hidden transition-all duration-300"
              style={{
                filter: brokerStatus !== "listening"
                  ? (activeType === "denied"
                    ? "drop-shadow(0px 0px 8px rgba(239,68,68,0.5))"
                    : activeType === "temporary"
                    ? "drop-shadow(0px 0px 8px rgba(255,176,0,0.5))"
                    : "drop-shadow(0px 0px 8px rgba(16,185,129,0.5))")
                  : "drop-shadow(0px 0px 0px rgba(0,0,0,0))"
              }}
            >
              {/* Vertical Scanning Laser Sweep */}
              <div className="absolute inset-x-0 h-[1.5px] bg-[#ffb000] dark:bg-[#ffb000] opacity-50 blur-[0.5px] shadow-[0_0_8px_#ffb000] animate-laser-sweep pointer-events-none z-20" />

              {/* Mini Window Tab Bar */}
              <div className="flex items-center justify-between px-2 py-1 bg-[#2c2923] dark:bg-[#1c1a16] border-b border-[#3e3a31] dark:border-[#2f2b23] text-[9px] text-[#faf9f5]/70 font-bold z-10">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] opacity-80" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb000] opacity-80" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] opacity-80" />
                </div>
                <span>broker.go</span>
                <span className="opacity-50">×</span>
              </div>

              {/* Body Content */}
              <div className="p-2 md:p-3 flex flex-col items-center justify-center gap-1.5 text-center z-10">
                <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-[#ffb000] opacity-90 animate-pulse" />
                <span className="text-[9px] md:text-[10px] text-[#faf9f5]/65 uppercase tracking-wider font-bold">GATEWAY</span>
                
                {/* Status Indicators inside Broker */}
                <div className="mt-1 text-[9px] md:text-[10px] font-mono select-none px-1.5 py-0.5 rounded-none border border-[#3e3a31] bg-[#211e1a] w-full text-center text-[#ece7dd]">
                  {brokerStatus === "listening" && (
                    <span className="text-[#928b7d]">LISTENING</span>
                  )}
                  {brokerStatus === "verifying" && (
                    <span className="text-[#ffb000] font-bold animate-pulse">VERIFYING</span>
                  )}
                  {brokerStatus === "granted" && (
                    <span className="text-[#10b981] font-bold">GRANTED</span>
                  )}
                  {brokerStatus === "temporary" && (
                    <span className="text-[#ffb000] font-bold">TEMP CAP</span>
                  )}
                  {brokerStatus === "denied" && (
                    <span className="text-[#ef4444] font-bold animate-pulse">DENIED</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Wire 2 flex gap filler */}
          <div className="flex-1 min-w-[10px] md:min-w-[16px] h-6 relative mx-0.5 md:mx-2" />

          {/* Node 3: Resource */}
          <motion.div
            animate={githubActive ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="z-10 relative w-[100px] md:w-40 shrink-0 select-none transition-colors duration-300 font-mono"
          >
            {/* 3D Back Box */}
            <div 
              className="absolute inset-0 translate-x-[8px] -translate-y-[8px] border border-dashed border-[#d4d0c5] dark:border-[#38332b] bg-paper/30 dark:bg-[#1a1815]/30 transition-all duration-300 pointer-events-none z-0" 
              style={{
                borderColor: githubActive ? COLOR_MAP[activeType] : undefined
              }}
            />

            {/* Front Box */}
            <div 
              className="relative z-10 flex flex-col bg-[#faf9f5]/90 dark:bg-[#211e1a]/90 border border-[#d4d0c5] dark:border-[#38332b] w-full rounded-none overflow-hidden transition-all duration-300"
              style={{
                filter: githubActive
                  ? (activeType === "temporary"
                    ? "drop-shadow(0px 0px 8px rgba(255,176,0,0.5))"
                    : "drop-shadow(0px 0px 8px rgba(16,185,129,0.5))")
                  : "drop-shadow(0px 0px 0px rgba(0,0,0,0))"
              }}
            >
              {/* Mini Window Tab Bar */}
              <div className="flex items-center justify-between px-2 py-1 bg-paper border-b border-ink-border text-[9px] text-ink-muted font-bold">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] opacity-80" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb000] opacity-80" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] opacity-80" />
                </div>
                <span>endpoint.api</span>
                <span className="opacity-50">×</span>
              </div>

              {/* Body Content */}
              <div className="p-2 md:p-3 flex flex-col items-center justify-center gap-1 text-center">
                <Fingerprint className="w-4 h-4 md:w-5 md:h-5 text-[#10b981] opacity-80" />
                <span className="text-[9px] md:text-[10px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider font-bold">ENDPOINT</span>
                <span className="text-[10px] md:text-xs font-bold text-[#17150f] dark:text-[#ece7dd]">GitHub API</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Narrative Legend */}
        <div className="mt-4 border-t border-ink-border pt-3 text-[11px] text-ink-muted leading-relaxed relative z-10">
          {activeType === "granted" && (
            <p>
              <span className="font-bold text-[#10b981]">✔ Ephemeral Access:</span> Agent requests resources transparently. Broker intercepts the call, maps the identity, generates a scoped short-lived token, and releases it safely to the external API.
            </p>
          )}
          {activeType === "temporary" && (
            <p>
              <span className="font-bold text-[#ffb000]">⏳ Capability delegation:</span> Token is created with a 15-minute Time-To-Live (TTL) countdown. Upon expiration, it automatically dissolves, restricting access immediately unless a new credential is generated.
            </p>
          )}
          {activeType === "denied" && (
            <p>
              <span className="font-bold text-[#ef4444]">✕ Access Revoked:</span> If access parameters are violated, or a PAT is revoked, Broker intercepts and instantly blocks the outgoing call, preventing credentials leak or unauthorized execution.
            </p>
          )}
        </div>
      </div>

      {/* 2. Three-Column Grid representing Request · Mint · Expire */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Request */}
        <div className="border border-ink-border bg-panel p-5 space-y-4 text-left flex flex-col justify-between min-h-[350px]">
          <div className="space-y-2">
            <div className="flex justify-between items-center font-mono text-[9px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider select-none">
              <span>Step 01 // Trigger</span>
              <span className="font-bold text-[#c03a2b] dark:text-[#ffb000]">1. REQUEST</span>
            </div>
            <h3 className="font-sans text-lg font-bold text-[#17150f] dark:text-[#ece7dd]">
              Agent Initiates Request
            </h3>
            <p className="text-[11px] text-[#5c574a] dark:text-[#928b7d] leading-relaxed">
              AI agent initiates a network call. The local broker wrapper intercepts the outbound request, blocks access to the environment variables, and redirects to the Broker gateway.
            </p>
          </div>
          <div className="pt-2">
            <SystemsViewExhibit />
          </div>
        </div>

        {/* Column 2: Mint */}
        <div className="border border-ink-border bg-panel p-5 space-y-4 text-left flex flex-col justify-between min-h-[350px]">
          <div className="space-y-2">
            <div className="flex justify-between items-center font-mono text-[9px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider select-none">
              <span>Step 02 // Interception</span>
              <span className="font-bold text-[#10b981]">2. MINT</span>
            </div>
            <h3 className="font-sans text-lg font-bold text-[#17150f] dark:text-[#ece7dd]">
              Validate & Mint Scoped Key
            </h3>
            <p className="text-[11px] text-[#5c574a] dark:text-[#928b7d] leading-relaxed">
              The Broker validates the agent&apos;s identity and policy context. It requests a short-lived capability key from Vault/Okta, mapping permissions strictly to the active task scope.
            </p>
          </div>
          
          {/* Live Minted Token Preview */}
          <div className="border border-ink-border p-3.5 bg-panel/50 font-mono text-[10px] space-y-3 relative overflow-hidden select-none">
            <div className="flex justify-between items-center text-[9px] text-ink-muted uppercase tracking-wider border-b border-ink-border/60 pb-1.5">
              <span>Minted Token</span>
              <span className="text-[#10b981] font-bold">ACTIVE</span>
            </div>
            <div className="space-y-1 text-[9.5px]">
              <div className="flex justify-between">
                <span className="text-[#5c574a] dark:text-[#928b7d]">SCOPE:</span>
                <span className="text-[#17150f] dark:text-[#ece7dd] font-bold">repo:read · pr:write</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c574a] dark:text-[#928b7d]">RESOURCE:</span>
                <span className="text-[#17150f] dark:text-[#ece7dd] font-bold">github.com/org/repo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5c574a] dark:text-[#928b7d]">TTL:</span>
                <span className="text-[#10b981] font-bold flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                  {countdownVal}s
                </span>
              </div>
            </div>
            {/* Decaying progress bar visual */}
            <div className="h-[2px] bg-ink-border w-full mt-2 relative">
              <div className="absolute left-0 top-0 bottom-0 bg-[#10b981] w-[60%] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Column 3: Expire */}
        <div className="border border-ink-border bg-panel p-5 space-y-4 text-left flex flex-col justify-between min-h-[350px]">
          <div className="space-y-2">
            <div className="flex justify-between items-center font-mono text-[9px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider select-none">
              <span>Step 03 // Resolution</span>
              <span className="font-bold text-[#ef4444]">3. EXPIRE</span>
            </div>
            <h3 className="font-sans text-lg font-bold text-[#17150f] dark:text-[#ece7dd]">
              Automatic Key Expiry
            </h3>
            <p className="text-[11px] text-[#5c574a] dark:text-[#928b7d] leading-relaxed">
              When the task completes or the TTL timer runs out, the token is automatically dissolved. An immutable, signed cryptographic record is appended to the audit ledger.
            </p>
          </div>

          {/* Micro Audit Ledger */}
          <div className="border border-ink-border p-3.5 bg-panel/50 font-mono text-[10px] space-y-2 select-none">
            <div className="flex justify-between items-center text-[9px] text-ink-muted uppercase tracking-wider border-b border-ink-border/60 pb-1.5">
              <span>Audit Ledger</span>
              <span className="text-[#ef4444] font-bold">REVOKED</span>
            </div>
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between">
                <span className="text-[#5c574a] dark:text-[#928b7d]">EVENT:</span>
                <span className="text-[#ef4444] font-bold">TOKEN_EXPIRED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c574a] dark:text-[#928b7d]">REF_ID:</span>
                <span className="text-[#17150f] dark:text-[#ece7dd] font-bold">BRK-TX-98F4A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c574a] dark:text-[#928b7d]">SIG:</span>
                <span className="text-[#17150f] dark:text-[#ece7dd] font-bold underline truncate max-w-[80px]">sec_d47a...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
