"use client";

import { useState, useEffect, useRef } from "react";
import { motion, animate, useReducedMotion } from "framer-motion";
import { Terminal, ShieldAlert, Fingerprint } from "lucide-react";

/**
 * SEC.2 — Runtime interception, shown as a switchable flow schema.
 *
 * The visitor drives it: three scenarios (ephemeral / delegated / violation)
 * each run the same protocol through the same three windowed nodes
 *   client.py (Agent) -> broker.go (Gateway) -> endpoint.api (GitHub API)
 * with a pulse that pauses at the broker to be verified. The STEP strip under
 * the board tracks the live phase and adapts its labels per scenario.
 *
 * Auto-plays the granted flow once on first view, then replays on demand.
 * Reduced motion resolves straight to the scenario's end-state — no pulse,
 * laser, shake, or marching wires.
 */

type PulseType = "granted" | "temporary" | "denied";

const COLOR_MAP: Record<PulseType, string> = {
  granted: "#10b981", // emerald — ephemeral access
  temporary: "#ffb000", // amber — scoped delegation
  denied: "#ef4444", // crimson — policy violation
};

const WIRE = "var(--stroke-wire)";

// Phase names are constant; the payload label per phase changes per scenario.
const PHASES = ["TRIGGER", "INTERCEPTION", "RESOLUTION"] as const;
const STEP_LABELS: Record<PulseType, [string, string, string]> = {
  granted: ["REQUEST", "MINT", "FORWARD"],
  temporary: ["REQUEST", "MINT", "EXPIRE"],
  denied: ["REQUEST", "INTERCEPT", "BLOCKED"],
};

export default function InterceptionFlow() {
  const reduce = useReducedMotion();

  const [activeType, setActiveType] = useState<PulseType>("granted");
  const [pulseCount, setPulseCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [brokerStatus, setBrokerStatus] = useState<
    "listening" | "verifying" | PulseType
  >("listening");
  const [leftWireColor, setLeftWireColor] = useState(WIRE);
  const [rightWireColor, setRightWireColor] = useState(WIRE);
  const [leftProgress, setLeftProgress] = useState(0);
  const [rightProgress, setRightProgress] = useState(0);
  const [brokerShake, setBrokerShake] = useState(false);
  const [githubActive, setGithubActive] = useState(false);
  const [agentActive, setAgentActive] = useState(false);
  // 0 = idle, 1 = trigger, 2 = interception, 3 = resolution.
  const [activeStep, setActiveStep] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayedRef = useRef(false);

  const timer1Ref = useRef<NodeJS.Timeout | null>(null);
  const timer2Ref = useRef<NodeJS.Timeout | null>(null);
  const timer3Ref = useRef<NodeJS.Timeout | null>(null);
  const apiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const agentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leftAnimRef = useRef<{ stop: () => void } | null>(null);
  const rightAnimRef = useRef<{ stop: () => void } | null>(null);

  const cleanUpAll = () => {
    [timer1Ref, timer2Ref, timer3Ref, apiTimerRef, agentTimerRef].forEach(
      (t) => t.current && clearTimeout(t.current),
    );
    leftAnimRef.current?.stop();
    rightAnimRef.current?.stop();
  };

  // The persistent end-state a scenario settles into (also the reduced-motion
  // frame). Kept on screen after a run so the outcome stays legible.
  const settle = (type: PulseType) => {
    setIsAnimating(false);
    setAgentActive(false);
    setBrokerShake(false);
    setActiveStep(3);
    if (type === "denied") {
      setBrokerStatus("denied");
      setLeftWireColor(COLOR_MAP.denied);
      setLeftProgress(100);
      setRightWireColor(WIRE);
      setRightProgress(0);
      setGithubActive(false);
    } else {
      setBrokerStatus(type);
      setLeftWireColor(WIRE);
      setLeftProgress(0);
      setRightWireColor(COLOR_MAP[type]);
      setRightProgress(100);
      setGithubActive(true);
    }
  };

  const playFlow = (type: PulseType) => {
    cleanUpAll();

    setIsAnimating(true);
    setBrokerStatus("listening");
    setBrokerShake(false);
    setGithubActive(false);
    setAgentActive(true);
    setActiveStep(1);
    setLeftProgress(0);
    setRightProgress(0);
    setRightWireColor(WIRE);

    agentTimerRef.current = setTimeout(() => setAgentActive(false), 500);

    if (type === "denied") {
      setLeftWireColor(WIRE);
      leftAnimRef.current = animate(0, 100, {
        duration: 1.32,
        ease: "easeInOut",
        onUpdate: (v) => setLeftProgress(v),
      });
      timer1Ref.current = setTimeout(() => {
        setLeftWireColor(COLOR_MAP.denied);
        setBrokerStatus("verifying");
        setActiveStep(2);
      }, 1320);
      timer2Ref.current = setTimeout(() => {
        setBrokerStatus("denied");
        setBrokerShake(true);
        setActiveStep(3);
      }, 1600);
      timer3Ref.current = setTimeout(() => settle("denied"), 2700);
    } else {
      const activeColor = COLOR_MAP[type];
      setLeftWireColor(activeColor);
      leftAnimRef.current = animate(0, 100, {
        duration: 1.4,
        ease: "easeInOut",
        onUpdate: (v) => setLeftProgress(v),
      });
      timer1Ref.current = setTimeout(() => {
        setBrokerStatus("verifying");
        setActiveStep(2);
      }, 1400);
      timer2Ref.current = setTimeout(() => {
        setLeftWireColor(WIRE);
        setLeftProgress(0);
        setRightWireColor(activeColor);
        setBrokerStatus(type);
        rightAnimRef.current = animate(0, 100, {
          duration: 1.4,
          ease: "easeInOut",
          onUpdate: (v) => setRightProgress(v),
        });
      }, 2100);
      apiTimerRef.current = setTimeout(() => {
        setGithubActive(true);
        setActiveStep(3);
      }, 3500);
      timer3Ref.current = setTimeout(() => settle(type), 4500);
    }
  };

  const triggerPulse = (type: PulseType) => {
    setActiveType(type);
    setPulseCount((n) => n + 1);
    if (reduce) {
      cleanUpAll();
      settle(type);
    } else {
      playFlow(type);
    }
  };

  // Auto-run the granted flow once when the schematic first scrolls into view.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPlayedRef.current) {
            hasPlayedRef.current = true;
            if (reduce) settle("granted");
            else playFlow("granted");
          }
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cleanUpAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const activeColor = COLOR_MAP[activeType];
  const brokerEngaged = brokerStatus !== "listening";

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
        {/* Left: copy + interactive hub */}
        <div className="lg:col-span-4 space-y-5 text-left lg:order-1 order-2">
          <span className="font-mono text-xs font-bold text-[#c03a2b] dark:text-amber tracking-widest uppercase block">
            SEC. 2 — FLOW SCHEMA
          </span>

          <h2 className="font-sans text-2xl md:text-3xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-tight flex flex-wrap gap-x-1.5 gap-y-0.5">
            {"Intercepting credentials dynamically".split(" ").map((word, idx) => (
              <span key={idx} className="inline-block overflow-hidden relative py-0.5">
                <motion.span
                  initial={reduce ? false : { y: "100%", opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    duration: 0.75,
                    delay: idx * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="inline-block origin-bottom"
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h2>

          <p className="text-sm text-[#5c574a] dark:text-[#928b7d] leading-relaxed">
            Instead of injecting raw tokens, the Agent asks the Broker. The Broker
            validates the policy, contacts the identity provider for a short-lived
            scoped key, and handles the call transparently.
          </p>

          <div className="space-y-3 pt-2">
            <span className="font-mono text-[9px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider block">
              INTERACTIVE HUB (SELECT PATH TO RUN FLOW)
            </span>

            <div className="space-y-2 font-mono text-xs">
              <HubButton
                type="granted"
                active={activeType === "granted"}
                onClick={triggerPulse}
                command="broker test --auth=ephemeral"
                caption="Green = Ephemeral Access"
                tag="GRANTED"
              />
              <HubButton
                type="temporary"
                active={activeType === "temporary"}
                onClick={triggerPulse}
                command="broker test --auth=delegated"
                caption="Amber = Scoped Delegation"
                tag="15M TTL"
              />
              <HubButton
                type="denied"
                active={activeType === "denied"}
                onClick={triggerPulse}
                command="broker test --auth=violation"
                caption="Red = Policy Violation"
                tag="BLOCKED"
              />
            </div>
          </div>
        </div>

        {/* Right: schematic board */}
        <div className="lg:col-span-8 lg:order-2 order-1">
          <div className="border border-ink-border dark:border-[#38332b] bg-[#faf9f5] dark:bg-[#211e1a] p-4 md:p-6 font-mono text-xs md:text-sm relative overflow-hidden transition-colors duration-300">
            {/* Titlebar */}
            <div className="flex justify-between items-center border-b border-ink-border dark:border-[#38332b] pb-3 mb-6 select-none flex-wrap gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444] opacity-80" />
                  <span className="w-2 h-2 rounded-full bg-[#ffb000] opacity-80" />
                  <span className="w-2 h-2 rounded-full bg-[#10b981] opacity-80" />
                </span>
                <span className="text-[#5c574a] dark:text-[#928b7d] text-[10px] tracking-widest uppercase ml-1">
                  Active Interception Schematic
                </span>
              </div>
              <span
                className="text-[10px] uppercase font-bold tracking-wider transition-colors duration-300"
                style={{ color: brokerEngaged ? activeColor : undefined }}
              >
                {brokerStatus === "listening"
                  ? "idle"
                  : brokerStatus === "verifying"
                    ? "verifying"
                    : activeType === "denied"
                      ? "blocked"
                      : "resolved"}
              </span>
            </div>

            {/* Diagram canvas */}
            <div className="relative h-64 md:h-48 flex items-center px-2 md:px-10 py-4 z-10">
              {/* Wires behind nodes */}
              <div className="absolute left-[44px] md:left-[104px] right-[44px] md:right-[104px] h-[2px] top-1/2 -translate-y-1/2 z-0 pointer-events-none">
                <svg className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="if-left-wire" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset={`${leftProgress}%`} stopColor={leftWireColor} />
                      <stop offset={`${leftProgress}%`} stopColor={WIRE} />
                    </linearGradient>
                    <linearGradient id="if-right-wire" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset={`${rightProgress}%`} stopColor={rightWireColor} />
                      <stop offset={`${rightProgress}%`} stopColor={WIRE} />
                    </linearGradient>
                  </defs>
                  <line
                    x1="0%"
                    y1="0"
                    x2="50%"
                    y2="0"
                    stroke="url(#if-left-wire)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className={`${reduce ? "" : "animate-flow-wire"} transition-colors duration-300`}
                  />
                  <line
                    x1="50%"
                    y1="0"
                    x2="100%"
                    y2="0"
                    stroke="url(#if-right-wire)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className={`${reduce ? "" : "animate-flow-wire"} transition-colors duration-300`}
                  />
                </svg>

                {/* Travelling pulse */}
                {isAnimating && !reduce && (
                  <motion.div
                    key={`pulse-${pulseCount}`}
                    className="absolute w-2.5 h-2.5 rounded-full -translate-y-1/2 -translate-x-1/2 top-1/2 z-0 shadow-md"
                    style={{ backgroundColor: activeColor }}
                    initial={{ left: "0%", opacity: 1 }}
                    animate={{
                      left:
                        activeType === "denied"
                          ? ["0%", "50%", "50%"]
                          : ["0%", "50%", "50%", "100%"],
                      opacity:
                        activeType === "denied" ? [1, 1, 0] : [1, 1, 1, 0],
                    }}
                    transition={{
                      duration: activeType === "denied" ? 2.2 : 3.5,
                      times:
                        activeType === "denied"
                          ? [0, 0.6, 1.0]
                          : [0, 0.4, 0.6, 1.0],
                      ease:
                        activeType === "denied"
                          ? ["easeInOut", "linear"]
                          : ["easeInOut", "linear", "easeInOut"],
                    }}
                  />
                )}
              </div>

              {/* Node 1 — Agent */}
              <Node
                icon={<Terminal className="w-4 h-4 md:w-5 md:h-5 text-[#c03a2b] dark:text-amber opacity-80" />}
                file="client.py"
                role="CLIENT"
                name="AI Agent"
                active={agentActive}
                activeColor={activeColor}
                width="w-[100px] md:w-40"
                scale={agentActive ? 1.04 : 1}
              />

              <div className="flex-1 min-w-[10px] md:min-w-[16px] h-6 relative mx-0.5 md:mx-2" />

              {/* Node 2 — Broker / Gateway (always dark) */}
              <motion.div
                animate={brokerShake ? { x: [0, -6, 6, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
                className="z-10 relative w-[120px] md:w-48 shrink-0 select-none transition-colors duration-300 font-mono"
              >
                <div
                  className="absolute inset-0 translate-x-[8px] -translate-y-[8px] border border-dashed border-amber/30 bg-[#17150f]/50 pointer-events-none z-0 transition-all duration-300"
                  style={{ borderColor: brokerEngaged ? activeColor : undefined }}
                />
                <div
                  className="relative z-10 flex flex-col bg-[#17150f] border border-[#38332b] w-full overflow-hidden transition-all duration-300"
                  style={{
                    filter: brokerEngaged
                      ? `drop-shadow(0px 0px 8px ${activeColor}80)`
                      : "drop-shadow(0px 0px 0px rgba(0,0,0,0))",
                  }}
                >
                  {!reduce && (
                    <div className="absolute inset-x-0 h-[1.5px] bg-amber opacity-50 blur-[0.5px] shadow-[0_0_8px_#ffb000] animate-laser-sweep pointer-events-none z-20" />
                  )}
                  <div className="flex items-center justify-between px-2 py-1 bg-[#1c1a16] border-b border-[#2f2b23] text-[9px] text-[#faf9f5]/70 font-bold z-10">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] opacity-80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ffb000] opacity-80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] opacity-80" />
                    </div>
                    <span>broker.go</span>
                    <span className="opacity-50">×</span>
                  </div>
                  <div className="p-2 md:p-3 flex flex-col items-center justify-center gap-1.5 text-center z-10">
                    <ShieldAlert
                      className={`w-4 h-4 md:w-5 md:h-5 text-amber opacity-90 ${reduce ? "" : "animate-pulse"}`}
                    />
                    <span className="text-[9px] md:text-[10px] text-[#faf9f5]/65 uppercase tracking-wider font-bold">
                      GATEWAY
                    </span>
                    <div className="mt-1 text-[9px] md:text-[10px] font-mono select-none px-1.5 py-0.5 border border-[#3e3a31] bg-[#1a1815] w-full text-center text-[#ece7dd]">
                      {brokerStatus === "listening" && (
                        <span className="text-[#928b7d]">LISTENING</span>
                      )}
                      {brokerStatus === "verifying" && (
                        <span className="text-amber font-bold animate-pulse">
                          VERIFYING
                        </span>
                      )}
                      {brokerStatus === "granted" && (
                        <span className="text-[#10b981] font-bold">GRANTED</span>
                      )}
                      {brokerStatus === "temporary" && (
                        <span className="text-amber font-bold">TEMP CAP</span>
                      )}
                      {brokerStatus === "denied" && (
                        <span className="text-[#ef4444] font-bold animate-pulse">
                          DENIED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="flex-1 min-w-[10px] md:min-w-[16px] h-6 relative mx-0.5 md:mx-2" />

              {/* Node 3 — Endpoint */}
              <Node
                icon={<Fingerprint className="w-4 h-4 md:w-5 md:h-5 text-[#10b981] opacity-80" />}
                file="endpoint.api"
                role="ENDPOINT"
                name="GitHub API"
                active={githubActive}
                activeColor={activeColor}
                width="w-[100px] md:w-40"
                scale={githubActive ? 1.05 : 1}
              />
            </div>

            {/* STEP strip — tracks the live phase, labels adapt per scenario */}
            <div className="mt-6 grid grid-cols-3 gap-2 md:gap-3 relative z-10">
              {PHASES.map((phase, i) => {
                const reached = activeStep > i;
                const current = activeStep === i + 1;
                const isBlock = activeType === "denied" && i === 2;
                const stepColor = isBlock ? COLOR_MAP.denied : activeColor;
                return (
                  <div
                    key={phase}
                    className={`border p-2.5 md:p-3 transition-all duration-300 ${
                      reached
                        ? "bg-[#f6f5f0] dark:bg-[#1a1815]"
                        : "opacity-45 border-ink-border dark:border-[#38332b]"
                    } ${current && !reduce ? "animate-pulse" : ""}`}
                    style={{
                      borderColor: reached ? `${stepColor}66` : undefined,
                    }}
                  >
                    <div className="text-[8.5px] md:text-[9px] uppercase tracking-wider text-[#5c574a] dark:text-[#928b7d]">
                      STEP.0{i + 1}
                      {" // "}
                      {phase}
                    </div>
                    <div className="mt-1.5 font-bold text-xs md:text-sm flex items-baseline gap-1.5">
                      <span className="tabular-nums text-[10px] opacity-50">
                        0{i + 1}
                      </span>
                      <span
                        style={{ color: reached ? stepColor : undefined }}
                        className={reached ? "" : "text-[#5c574a] dark:text-[#928b7d]"}
                      >
                        {STEP_LABELS[activeType][i]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Narrative — one line per scenario */}
            <div className="mt-4 border-t border-ink-border dark:border-[#38332b] pt-3 text-[11px] text-[#5c574a] dark:text-[#928b7d] leading-relaxed relative z-10">
              {activeType === "granted" && (
                <p>
                  <span className="font-bold text-[#10b981]">
                    &#10003; Ephemeral Access:
                  </span>{" "}
                  Agent requests resources transparently. Broker intercepts the
                  call, maps the identity, generates a scoped short-lived token,
                  and releases it safely to the external API.
                </p>
              )}
              {activeType === "temporary" && (
                <p>
                  <span className="font-bold text-amber">
                    &#8987; Capability delegation:
                  </span>{" "}
                  Token is created with a 15-minute Time-To-Live (TTL) countdown.
                  Upon expiration it automatically dissolves, restricting access
                  immediately unless a new credential is generated.
                </p>
              )}
              {activeType === "denied" && (
                <p>
                  <span className="font-bold text-[#ef4444]">
                    &#10007; Access Revoked:
                  </span>{" "}
                  If access parameters are violated, or a PAT is revoked, Broker
                  intercepts and instantly blocks the outgoing call, preventing
                  credential leak or unauthorized execution.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HubButton({
  type,
  active,
  onClick,
  command,
  caption,
  tag,
}: {
  type: PulseType;
  active: boolean;
  onClick: (t: PulseType) => void;
  command: string;
  caption: string;
  tag: string;
}) {
  const color = COLOR_MAP[type];
  return (
    <button
      onClick={() => onClick(type)}
      className={`w-full p-3 border transition-all cursor-pointer text-left flex flex-col gap-1.5 font-mono active:translate-y-[1px] ${
        active
          ? "bg-[#faf9f5] dark:bg-[#1a1815]"
          : "border-ink-border dark:border-[#38332b] bg-paper dark:bg-[#211e1a] text-[#5c574a] dark:text-[#928b7d] hover:bg-[#faf9f5] dark:hover:bg-[#1a1815]"
      }`}
      style={active ? { borderColor: color, color } : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="text-[#c03a2b] dark:text-amber font-bold select-none">
          $
        </span>
        <span className="font-bold font-mono">{command}</span>
      </div>
      <div className="flex items-center justify-between text-[10px] pl-3.5 select-none opacity-85">
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: color }}
          />
          <span>{caption}</span>
        </div>
        <span className="text-[9px] uppercase font-bold">{tag}</span>
      </div>
    </button>
  );
}

// Light windowed node (Agent / Endpoint). The broker window is bespoke (dark).
function Node({
  icon,
  file,
  role,
  name,
  active,
  activeColor,
  width,
  scale,
}: {
  icon: React.ReactNode;
  file: string;
  role: string;
  name: string;
  active: boolean;
  activeColor: string;
  width: string;
  scale: number;
}) {
  return (
    <motion.div
      animate={{ scale }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={`z-10 relative ${width} shrink-0 select-none transition-colors duration-300 font-mono`}
    >
      <div
        className="absolute inset-0 translate-x-[8px] -translate-y-[8px] border border-dashed border-ink-border dark:border-[#38332b] bg-paper/30 dark:bg-[#1a1815]/30 transition-all duration-300 pointer-events-none z-0"
        style={{ borderColor: active ? activeColor : undefined }}
      />
      <div
        className="relative z-10 flex flex-col bg-[#faf9f5]/90 dark:bg-[#211e1a]/90 border border-ink-border dark:border-[#38332b] w-full overflow-hidden transition-all duration-300"
        style={{
          filter: active
            ? `drop-shadow(0px 0px 8px ${activeColor}80)`
            : "drop-shadow(0px 0px 0px rgba(0,0,0,0))",
        }}
      >
        <div className="flex items-center justify-between px-2 py-1 bg-[#f6f5f0] dark:bg-[#1a1815] border-b border-ink-border dark:border-[#38332b] text-[9px] text-[#5c574a] dark:text-[#928b7d] font-bold">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] opacity-80" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb000] opacity-80" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] opacity-80" />
          </div>
          <span>{file}</span>
          <span className="opacity-50">×</span>
        </div>
        <div className="p-2 md:p-3 flex flex-col items-center justify-center gap-1 text-center">
          {icon}
          <span className="text-[9px] md:text-[10px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider font-bold">
            {role}
          </span>
          <span className="text-[10px] md:text-xs font-bold text-[#17150f] dark:text-[#ece7dd]">
            {name}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
