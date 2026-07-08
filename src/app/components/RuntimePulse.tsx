"use client";

import { useState, useEffect, useRef } from "react";
import { motion, animate } from "framer-motion";
import { Terminal, ShieldAlert, Fingerprint } from "lucide-react";

type PulseType = "granted" | "temporary" | "denied";

const COLOR_MAP: Record<PulseType, string> = {
  granted: "#10b981",   // Emerald Green
  temporary: "#ffb000", // Amber Yellow
  denied: "#ef4444",    // Crimson Red
};

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

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
        {/* Console Details & Interactive Hub (Now Left on Desktop, Bottom on Mobile) */}
        <div className="lg:col-span-4 space-y-5 text-left lg:order-1 order-2">
          <span className="font-mono text-xs font-bold text-[#c03a2b] dark:text-[#ffb000] tracking-widest uppercase block">SEC. 2 — FLOW SCHEMA</span>
          
          {/* Staggered Word Reveal Heading */}
          <h2 className="font-sans text-2xl md:text-3xl font-bold tracking-tight text-[#17150f] dark:text-[#e6e8eb] leading-tight flex flex-wrap gap-x-1.5 gap-y-0.5">
            {"Intercepting credentials dynamically".split(" ").map((word, idx) => (
              <span key={idx} className="inline-block overflow-hidden relative py-0.5">
                <motion.span
                  initial={{ y: "100%", opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    duration: 0.75,
                    delay: idx * 0.05,
                    ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
                  }}
                  className="inline-block origin-bottom"
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h2>

          <p className="text-sm text-[#5c574a] dark:text-[#737b8c] leading-relaxed">
            Instead of injecting raw tokens, the Agent asks the Broker. The Broker validates the policy, contacts the identity provider for a short-lived scoped key, and handles the call transparently.
          </p>

          {/* Interactive Legend Console */}
          <div className="space-y-3 pt-2">
            <span className="font-mono text-[9px] text-[#5c574a] dark:text-[#737b8c] uppercase tracking-wider block">INTERACTIVE HUB (SELECT PATH TO RUN FLOW)</span>
            
            <div className="space-y-2 font-mono text-xs">
              {/* Legend Item 1 */}
              <button
                onClick={() => triggerPulse("granted")}
                className={`w-full p-3 border transition-all cursor-pointer rounded-none text-left flex flex-col gap-1.5 font-mono ${
                  activeType === "granted"
                    ? "border-[#10b981] bg-[#10b981]/5 text-[#10b981]"
                    : "border-[#d4d0c5] dark:border-[#1b1e25] bg-paper dark:bg-[#08090c] text-[#5c574a] dark:text-[#737b8c] hover:bg-[#faf9f5] dark:hover:bg-[#0d0f13]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#c03a2b] dark:text-[#ffb000] font-bold select-none">$</span>
                  <span className="font-bold font-mono">broker test --auth=ephemeral</span>
                </div>
                <div className="flex items-center justify-between text-[10px] pl-3.5 select-none opacity-85">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block ${activeType === "granted" ? "animate-ping" : ""}`} />
                    <span>Green = Ephemeral Access</span>
                  </div>
                  <span className="text-[9px] uppercase font-bold">GRANTED</span>
                </div>
              </button>

              {/* Legend Item 2 */}
              <button
                onClick={() => triggerPulse("temporary")}
                className={`w-full p-3 border transition-all cursor-pointer rounded-none text-left flex flex-col gap-1.5 font-mono ${
                  activeType === "temporary"
                    ? "border-[#ffb000] bg-[#ffb000]/5 text-[#ffb000]"
                    : "border-[#d4d0c5] dark:border-[#1b1e25] bg-paper dark:bg-[#08090c] text-[#5c574a] dark:text-[#737b8c] hover:bg-[#faf9f5] dark:hover:bg-[#0d0f13]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#c03a2b] dark:text-[#ffb000] font-bold select-none">$</span>
                  <span className="font-bold font-mono">broker test --auth=delegated</span>
                </div>
                <div className="flex items-center justify-between text-[10px] pl-3.5 select-none opacity-85">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full bg-[#ffb000] inline-block ${activeType === "temporary" ? "animate-ping" : ""}`} />
                    <span>Amber = Scoped Delegation</span>
                  </div>
                  <span className="text-[9px] uppercase font-bold">15M TTL</span>
                </div>
              </button>

              {/* Legend Item 3 */}
              <button
                onClick={() => triggerPulse("denied")}
                className={`w-full p-3 border transition-all cursor-pointer rounded-none text-left flex flex-col gap-1.5 font-mono ${
                  activeType === "denied"
                    ? "border-[#ef4444] bg-[#ef4444]/5 text-[#ef4444]"
                    : "border-[#d4d0c5] dark:border-[#1b1e25] bg-paper dark:bg-[#08090c] text-[#5c574a] dark:text-[#737b8c] hover:bg-[#faf9f5] dark:hover:bg-[#0d0f13]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#c03a2b] dark:text-[#ffb000] font-bold select-none">$</span>
                  <span className="font-bold font-mono">broker test --auth=violation</span>
                </div>
                <div className="flex items-center justify-between text-[10px] pl-3.5 select-none opacity-85">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full bg-[#ef4444] inline-block ${activeType === "denied" ? "animate-ping" : ""}`} />
                    <span>Red = Policy Violation</span>
                  </div>
                  <span className="text-[9px] uppercase font-bold">BLOCKED</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Visual Schematic Board (Now Right on Desktop, Top on Mobile) */}
        <div className="lg:col-span-8 lg:order-2 order-1">
          <div className="border border-[#d4d0c5] dark:border-[#1b1e25] bg-[#faf9f5] dark:bg-[#0d0f13] p-4 md:p-6 font-mono text-xs md:text-sm relative overflow-hidden transition-colors duration-300">
            {/* Schematic Header */}
            <div className="flex justify-between items-center border-b border-[#d4d0c5] dark:border-[#1b1e25] pb-3 mb-6 select-none flex-wrap gap-2 relative z-10">
              <span className="text-[#5c574a] dark:text-[#737b8c] text-[10px] tracking-widest uppercase">SEC. 02 — THE RUNTIME TRUST FLOW</span>
              <div className="flex gap-2">
                {(["granted", "temporary", "denied"] as PulseType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => triggerPulse(type)}
                    className={`px-2 py-1 text-[10px] uppercase font-bold border transition-all active:translate-y-[1px] cursor-pointer rounded-sm ${
                      activeType === type
                        ? "bg-[#17150f] dark:bg-[#ffb000] text-[#f6f5f0] dark:text-[#08090c] border-[#17150f] dark:border-[#ffb000]"
                        : "bg-[#f6f5f0] dark:bg-[#08090c] text-[#5c574a] dark:text-[#737b8c] border-[#d4d0c5] dark:border-[#1b1e25] hover:bg-[#17150f]/5 dark:hover:bg-[#e6e8eb]/5"
                    }`}
                  >
                    {type}
                  </button>
                ))}
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

                {/* Pulse Dot (Moves from center of Node 1 to Broker/Node 3 with Broker validation pause) */}
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
                  className="absolute inset-0 translate-x-[8px] -translate-y-[8px] border border-dashed border-[#d4d0c5] dark:border-[#1b1e25] bg-paper/30 dark:bg-[#08090c]/30 transition-all duration-300 pointer-events-none z-0" 
                  style={{
                    borderColor: agentActive ? COLOR_MAP[activeType] : undefined
                  }}
                />

                {/* 3D Corner Connectors */}
                <svg className="absolute w-2 h-2 top-0 left-0 -translate-y-full pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={agentActive ? COLOR_MAP[activeType] : "currentColor"} 
                    className="text-[#d4d0c5] dark:text-[#1b1e25] transition-colors duration-300" 
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>
                <svg className="absolute w-2 h-2 top-0 -right-[8px] -translate-y-full pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={agentActive ? COLOR_MAP[activeType] : "currentColor"} 
                    className="text-[#d4d0c5] dark:text-[#1b1e25] transition-colors duration-300" 
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>
                <svg className="absolute w-2 h-2 bottom-0 left-0 pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={agentActive ? COLOR_MAP[activeType] : "currentColor"} 
                    className="text-[#d4d0c5] dark:text-[#1b1e25] transition-colors duration-300" 
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>
                <svg className="absolute w-2 h-2 bottom-0 -right-[8px] pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={agentActive ? COLOR_MAP[activeType] : "currentColor"} 
                    className="text-[#d4d0c5] dark:text-[#1b1e25] transition-colors duration-300" 
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>

                {/* Front Box */}
                <div 
                  className="relative z-10 flex flex-col bg-[#faf9f5]/90 dark:bg-[#0d0f13]/90 border border-[#d4d0c5] dark:border-[#1b1e25] w-full rounded-none overflow-hidden transition-all duration-300"
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
                  <div className="flex items-center justify-between px-2 py-1 bg-[#f6f5f0] dark:bg-[#08090c] border-b border-[#d4d0c5] dark:border-[#1b1e25] text-[9px] text-[#5c574a] dark:text-[#737b8c] font-bold">
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
                    <span className="text-[9px] md:text-[10px] text-[#5c574a] dark:text-[#737b8c] uppercase tracking-wider font-bold">CLIENT</span>
                    <span className="text-[10px] md:text-xs font-bold text-[#17150f] dark:text-[#e6e8eb]">AI Agent</span>
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

                {/* 3D Corner Connectors */}
                <svg className="absolute w-2 h-2 top-0 left-0 -translate-y-full pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={brokerStatus !== "listening" ? COLOR_MAP[activeType] : "#ffb000"} 
                    opacity={brokerStatus !== "listening" ? "0.8" : "0.3"} 
                    className="transition-all duration-300"
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>
                <svg className="absolute w-2 h-2 top-0 -right-[8px] -translate-y-full pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={brokerStatus !== "listening" ? COLOR_MAP[activeType] : "#ffb000"} 
                    opacity={brokerStatus !== "listening" ? "0.8" : "0.3"} 
                    className="transition-all duration-300"
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>
                <svg className="absolute w-2 h-2 bottom-0 left-0 pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={brokerStatus !== "listening" ? COLOR_MAP[activeType] : "#ffb000"} 
                    opacity={brokerStatus !== "listening" ? "0.8" : "0.3"} 
                    className="transition-all duration-300"
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>
                <svg className="absolute w-2 h-2 bottom-0 -right-[8px] pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={brokerStatus !== "listening" ? COLOR_MAP[activeType] : "#ffb000"} 
                    opacity={brokerStatus !== "listening" ? "0.8" : "0.3"} 
                    className="transition-all duration-300"
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>

                {/* Front Box */}
                <div 
                  className="relative z-10 flex flex-col bg-[#17150f] dark:bg-[#17150f] border border-[#17150f] dark:border-[#383a40] w-full rounded-none overflow-hidden transition-all duration-300"
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
                  {/* Vertical Glowing Scanning Laser Sweep */}
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
                    <div className="mt-1 text-[9px] md:text-[10px] font-mono select-none px-1.5 py-0.5 rounded-none border border-[#3e3a31] bg-[#0d0f13] w-full text-center text-[#e6e8eb]">
                      {brokerStatus === "listening" && (
                        <span className="text-[#737b8c]">LISTENING</span>
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
                  className="absolute inset-0 translate-x-[8px] -translate-y-[8px] border border-dashed border-[#d4d0c5] dark:border-[#1b1e25] bg-paper/30 dark:bg-[#08090c]/30 transition-all duration-300 pointer-events-none z-0" 
                  style={{
                    borderColor: githubActive ? COLOR_MAP[activeType] : undefined
                  }}
                />

                {/* 3D Corner Connectors */}
                <svg className="absolute w-2 h-2 top-0 left-0 -translate-y-full pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={githubActive ? COLOR_MAP[activeType] : "currentColor"} 
                    className="text-[#d4d0c5] dark:text-[#1b1e25] transition-colors duration-300" 
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>
                <svg className="absolute w-2 h-2 top-0 -right-[8px] -translate-y-full pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={githubActive ? COLOR_MAP[activeType] : "currentColor"} 
                    className="text-[#d4d0c5] dark:text-[#1b1e25] transition-colors duration-300" 
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>
                <svg className="absolute w-2 h-2 bottom-0 left-0 pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={githubActive ? COLOR_MAP[activeType] : "currentColor"} 
                    className="text-[#d4d0c5] dark:text-[#1b1e25] transition-colors duration-300" 
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>
                <svg className="absolute w-2 h-2 bottom-0 -right-[8px] pointer-events-none z-0 overflow-visible">
                  <line 
                    x1="0" y1="8" x2="8" y2="0" 
                    stroke={githubActive ? COLOR_MAP[activeType] : "currentColor"} 
                    className="text-[#d4d0c5] dark:text-[#1b1e25] transition-colors duration-300" 
                    strokeWidth="1" strokeDasharray="2 2" 
                  />
                </svg>

                {/* Front Box */}
                <div 
                  className="relative z-10 flex flex-col bg-[#faf9f5]/90 dark:bg-[#0d0f13]/90 border border-[#d4d0c5] dark:border-[#1b1e25] w-full rounded-none overflow-hidden transition-all duration-300"
                  style={{
                    filter: githubActive
                      ? (activeType === "temporary"
                        ? "drop-shadow(0px 0px 8px rgba(255,176,0,0.5))"
                        : "drop-shadow(0px 0px 8px rgba(16,185,129,0.5))")
                      : "drop-shadow(0px 0px 0px rgba(0,0,0,0))"
                  }}
                >
                  {/* Mini Window Tab Bar */}
                  <div className="flex items-center justify-between px-2 py-1 bg-[#f6f5f0] dark:bg-[#08090c] border-b border-[#d4d0c5] dark:border-[#1b1e25] text-[9px] text-[#5c574a] dark:text-[#737b8c] font-bold">
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
                    <span className="text-[9px] md:text-[10px] text-[#5c574a] dark:text-[#737b8c] uppercase tracking-wider font-bold">ENDPOINT</span>
                    <span className="text-[10px] md:text-xs font-bold text-[#17150f] dark:text-[#e6e8eb]">GitHub API</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Narrative Legend */}
            <div className="mt-4 border-t border-[#d4d0c5] dark:border-[#1b1e25] pt-3 text-[11px] text-[#5c574a] dark:text-[#737b8c] leading-relaxed relative z-10">
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
        </div>
      </div>
    </div>
  );
}
