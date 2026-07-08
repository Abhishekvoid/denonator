"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ArrowRight, Play, Fingerprint } from "lucide-react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ExhibitATerminal from "./components/ExhibitATerminal";
import RuntimePulse from "./components/RuntimePulse";
import CapabilitiesGrid from "./components/CapabilitiesGrid";
import ParticleField from "./components/ParticleField";
import TiltCard from "./components/TiltCard";

gsap.registerPlugin(ScrollTrigger);

// The View Transitions API is not yet in the DOM lib typings; narrow the shape we use.
type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

// Theme is derived from the `dark` class on <html>, which is the single source of
// truth. useSyncExternalStore reads it (SSR-safe) and re-renders when it changes,
// so we never need to sync theme into state from inside an effect.
function subscribeToTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getThemeSnapshot(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getThemeServerSnapshot(): "light" | "dark" {
  return "light";
}

function useTheme() {
  return useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
}

// Premium Magnetic Wrapper for Buttons
function MagneticButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150, mass: 0.15 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    // Magnetic pull displacement (cap at 12px)
    const pullX = Math.max(-12, Math.min(12, distanceX * 0.3));
    const pullY = Math.max(-12, Math.min(12, distanceY * 0.3));

    x.set(pullX);
    y.set(pullY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// Inline Hover Redaction Pill
function DecryptPill({
  initialText,
  targetText,
}: {
  initialText: string;
  targetText: string;
}) {
  const [text, setText] = useState(initialText);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

    if (isHovered) {
      let iterations = 0;
      interval = setInterval(() => {
        setText(() =>
          targetText
            .split("")
            .map((_char, index) => {
              if (index < iterations) {
                return targetText[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join(""),
        );
        iterations += 1 / 2;
        if (iterations >= targetText.length) {
          setText(targetText);
          clearInterval(interval);
        }
      }, 25);
    } else {
      let iterations = 0;
      interval = setInterval(() => {
        setText(() =>
          initialText
            .split("")
            .map((_char, index) => {
              if (index < iterations) {
                return initialText[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join(""),
        );
        iterations += 1 / 2;
        if (iterations >= initialText.length) {
          setText(initialText);
          clearInterval(interval);
        }
      }, 25);
    }
    return () => clearInterval(interval);
  }, [isHovered, initialText, targetText]);

  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="font-mono text-xs px-2 py-0.5 border border-ink-border dark:border-[#1b1e25] bg-paper dark:bg-[#08090c] cursor-help relative inline-block text-[#17150f] dark:text-[#e6e8eb] font-bold tracking-wide select-none group rounded-sm"
    >
      {text}
      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#17150f] text-paper text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-ink-border/20 font-mono tracking-normal">
        {isHovered ? "SECURED BY BROKER" : "UNSECURED KEY"}
      </span>
    </span>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [waitlistState, setWaitlistState] = useState<
    "idle" | "submitting" | "registered"
  >("idle");
  const [ticketNumber, setTicketNumber] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const theme = useTheme();

  const waitlistRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const capabilitiesCopyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply the user's preferred color scheme on mount. The `dark` class on <html>
    // is the source of truth; useTheme() observes it, so this only touches the DOM
    // (an external system) and never calls setState.
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (systemPrefersDark) {
      document.documentElement.classList.add("dark");
    }

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;
    if (typeof window !== "undefined") {
      (window as unknown as { lenis?: Lenis }).lenis = lenis;
    }

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Section 3 copy reveals first, just ahead of the capability cards
  // staggering in (see CapabilitiesGrid's own ScrollTrigger). One-time, no pin.
  useEffect(() => {
    if (!capabilitiesCopyRef.current) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from(capabilitiesCopyRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        scrollTrigger: {
          trigger: capabilitiesCopyRef.current,
          start: "top 85%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  const toggleTheme = (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const targetTheme = theme === "light" ? "dark" : "light";
    const doc = document as DocumentWithViewTransition;

    // Toggling the class updates the theme via the useTheme() store observer.
    if (!doc.startViewTransition) {
      document.documentElement.classList.toggle("dark", targetTheme === "dark");
      return;
    }

    const transition = doc.startViewTransition(() => {
      document.documentElement.classList.toggle("dark", targetTheme === "dark");
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 600,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  const handleWaitlistSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setWaitlistState("submitting");

    // Simulate cryptographic registry insertion
    setTimeout(() => {
      const randomId = Math.floor(Math.random() * 9000 + 1000);
      setTicketNumber(`BRK-${randomId}`);
      setWaitlistState("registered");
    }, 1500);
  };

  // Event handler (runs on click), so reading lenisRef.current here is safe.
  const scrollToSection = (selector: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (lenisRef.current) {
      lenisRef.current.scrollTo(selector, { duration: 1.2 });
    } else {
      document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleHeroMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const { clientX, clientY } = e;
    const { left, top } = heroRef.current.getBoundingClientRect();
    setMousePos({ x: clientX - left, y: clientY - top });
  };

  // Staggered entry animation variables
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const lineVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: {
      y: "0%",
      opacity: 1,
      transition: {
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  const fadeVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-paper dark:bg-[#08090c] transition-colors duration-300">
      {/* Digital Noise / Paper grain texture */}
      <div className="digital-noise" />

      {/* Header, Nav & SEC. 0 — Hero Section (Abstract) - 100% Viewport Width */}
      <div className="w-full relative z-10 transition-colors duration-300">
        {/* Document Header Metadata / RFC Border Top */}
        <div className="border-b border-[#17150f] dark:border-[#1b1e25] bg-paper dark:bg-[#08090c] transition-colors duration-300">
          <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-stretch text-[10px] md:text-xs font-mono text-ink-muted dark:text-[#737b8c]">
            <div className="px-6 py-3.5 border-b md:border-b-0 md:border-r border-ink-border dark:border-[#1b1e25] font-bold text-[#c03a2b] dark:text-amber tracking-wider select-none flex items-center">
              BRK / SPEC-001
            </div>
            <div className="px-6 py-3.5 border-b md:border-b-0 md:border-r border-ink-border dark:border-[#1b1e25] flex-1 text-center md:text-left tracking-widest uppercase select-none flex items-center justify-center md:justify-start">
              RUNTIME TRUST SPECIFICATION FOR MACHINE ECONOMY
            </div>
            <div className="px-6 py-3.5 text-right tracking-wider select-none flex items-center justify-end">
              DRAFT v0.1.2 · JUL 2026
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="px-6 py-5 border-b border-dashed border-ink-border dark:border-[#1b1e25] bg-[#faf9f5] dark:bg-[#0d0f13] transition-colors duration-300">
          <div className="w-full max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 select-none">
              <Fingerprint className="w-5 h-5 text-[#c03a2b] dark:text-amber" />
              <span className="font-sans font-bold text-2xl tracking-tighter text-[#17150f] dark:text-[#e6e8eb]">
                Broker
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-10 font-mono text-xs text-ink-muted dark:text-[#737b8c]">
              <a
                href="#how-it-works"
                onClick={(e) => scrollToSection("#how-it-works", e)}
                className="hover:text-[#17150f] dark:hover:text-[#e6e8eb] transition-colors"
              >
                01. HOW IT WORKS
              </a>
              <a
                href="#capabilities"
                onClick={(e) => scrollToSection("#capabilities", e)}
                className="hover:text-[#17150f] dark:hover:text-[#e6e8eb] transition-colors"
              >
                02. CAPABILITIES
              </a>
              <a
                href="#vision"
                onClick={(e) => scrollToSection("#vision", e)}
                className="hover:text-[#17150f] dark:hover:text-[#e6e8eb] transition-colors"
              >
                03. VISION
              </a>
            </nav>

            <div className="flex items-center gap-3">
              {/* Technical Sun/Moon Theme Switcher */}
              <button
                onClick={toggleTheme}
                className="px-3 py-2 border border-ink-border dark:border-[#1b1e25] bg-paper dark:bg-[#08090c] hover:bg-[#17150f]/5 dark:hover:bg-[#e6e8eb]/5 text-[#17150f] dark:text-[#e6e8eb] transition-all cursor-pointer font-mono text-[10px] flex items-center gap-1.5 active:translate-y-px rounded-sm select-none"
                title="Switch visual profile"
              >
                {theme === "light" ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#17150f] inline-block" />
                    <span>DARK_THEME</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber inline-block" />
                    <span>LIGHT_THEME</span>
                  </>
                )}
              </button>

              <button
                onClick={(e) => scrollToSection("#vision", e)}
                className="bg-[#17150f] dark:bg-amber hover:bg-ink-light dark:hover:bg-[#ffa500] text-paper dark:text-[#08090c] font-mono font-bold text-xs px-5 py-2.5 transition-all shadow-xs active:translate-y-px cursor-pointer"
              >
                Join Early Access
              </button>
            </div>
          </div>
        </div>

        {/* SEC. 0 — Hero Section (Abstract) */}
        <div
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
          className="p-0 border-b border-dashed border-ink-border dark:border-[#1b1e25] bg-[#faf9f5] dark:bg-[#0d0f13] relative overflow-hidden transition-colors duration-300 flex justify-center items-center"
        >
          {/* Interactive Grid Overlay (Base 32px) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#d4d0c5_1px,transparent_1px),linear-gradient(to_bottom,#d4d0c5_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1b1e25_1px,transparent_1px),linear-gradient(to_bottom,#1b1e25_1px,transparent_1px)] bg-size-[2rem_2rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-[0.1] dark:opacity-[0.15] pointer-events-none z-0" />

          {/* Cursor-Reacting Glowing Grid Lines */}
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#c03a2b_1px,transparent_1px),linear-gradient(to_bottom,#c03a2b_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffb000_1px,transparent_1px),linear-gradient(to_bottom,#ffb000_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-35 dark:opacity-20 pointer-events-none z-0 transition-opacity duration-300"
            style={{
              maskImage: `radial-gradient(120px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
              WebkitMaskImage: `radial-gradient(120px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
            }}
          />

          {/* Desktop IDE Simulator Shell */}
          <div className="relative z-10 w-full bg-[#faf9f5]/95 dark:bg-[#0d0f13]/95 flex flex-col transition-all duration-300">
            {/* IDE Header / Title Bar */}
            <div className="h-9 bg-[#faf9f5] dark:bg-[#0d0f13] border-b border-ink-border dark:border-[#1b1e25]/60 flex items-center justify-between px-4 font-mono text-[10px] select-none text-ink-muted dark:text-[#737b8c]">
              <div className="flex items-center gap-1.5 w-1/4">
                <span className="w-2.5 h-2.5 rounded-full bg-crimson opacity-80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber opacity-80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald opacity-80" />
              </div>
              <div className="flex-1 text-center font-semibold text-[#17150f] dark:text-[#e6e8eb]">
                broker — README.md
              </div>
              <div className="w-1/4 flex justify-end items-center gap-3">
                {/* Split Pane Icon */}
                <svg
                  className="w-3.5 h-3.5 fill-current opacity-70 hover:opacity-100 cursor-pointer"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1zm-7-12h2v10h-2z" />
                </svg>
                {/* Sidebar Toggle Icon */}
                <svg
                  className="w-3.5 h-3.5 fill-current opacity-70 hover:opacity-100 cursor-pointer"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm2 4v8c0 .55.45 1 1 1h3V7H7c-.55 0-1 .45-1 1z" />
                </svg>
              </div>
            </div>

            {/* IDE Workspace (Editor Workspace Only) */}
            <div className="flex-1 flex overflow-hidden min-h-120">
              {/* Main Tabbed Editor Workspace */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Editor Tab Headers */}
                <div className="h-8 bg-[#faf9f5]/45 dark:bg-[#0d0f13]/45 border-b border-ink-border dark:border-[#1b1e25]/60 flex items-center font-mono text-[10px] select-none text-ink-muted dark:text-[#737b8c]">
                  <div className="px-4 h-full flex items-center gap-2 border-r border-ink-border dark:border-[#1b1e25]/60 bg-[#faf9f5] dark:bg-[#0d0f13] text-[#17150f] dark:text-[#e6e8eb] border-t-2 border-t-[#c03a2b] dark:border-t-amber">
                    <span>README.md</span>
                    <span className="opacity-60 hover:opacity-100 cursor-pointer">
                      ×
                    </span>
                  </div>
                  <div className="px-4 h-full flex items-center gap-2 border-r border-ink-border dark:border-[#1b1e25]/60 hover:bg-[#faf9f5]/30 dark:hover:bg-[#0d0f13]/30 cursor-pointer transition-colors">
                    <span>terminal_session.sh</span>
                  </div>
                </div>

                {/* Split Pane Editor Area */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
                  {/* Left Split Pane: Editor Preview (Markdown Preview / Marketing Copy) */}
                  <div className="md:col-span-6 p-8 md:p-12 flex flex-col justify-between space-y-6 overflow-y-auto text-left relative">
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <div className="overflow-hidden">
                          <motion.span
                            variants={lineVariants}
                            className="font-mono text-xs font-bold text-[#c03a2b] dark:text-amber tracking-widest uppercase block"
                          >
                            SEC. 0 — ABSTRACT
                          </motion.span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="overflow-hidden py-1">
                            <motion.h1
                              variants={lineVariants}
                              className="font-sans text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-[#17150f] dark:text-[#e6e8eb]"
                            >
                              Delete your GitHub
                            </motion.h1>
                          </div>
                          <div className="overflow-hidden py-1">
                            <motion.h1
                              variants={lineVariants}
                              className="font-sans text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-[#17150f] dark:text-[#e6e8eb] flex items-center flex-wrap gap-x-3"
                            >
                              <DecryptPill
                                initialText="GITHUB_PAT"
                                targetText="██████████"
                              />
                              .
                            </motion.h1>
                          </div>
                          <div className="overflow-hidden py-1">
                            <motion.h1
                              variants={lineVariants}
                              className="font-sans text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-[#c03a2b] dark:text-amber"
                            >
                              Your agent keeps working.
                            </motion.h1>
                          </div>
                        </div>

                        <motion.p
                          variants={fadeVariants}
                          className="text-sm md:text-base leading-relaxed text-ink-muted dark:text-[#737b8c] max-w-lg"
                        >
                          Broker replaces permanent credentials in autonomous
                          software with ephemeral, least-privilege capability
                          tokens issued at runtime. Scoped. Audited. Expired by
                          default.
                        </motion.p>
                      </div>

                      <motion.div
                        variants={fadeVariants}
                        className="flex flex-wrap items-center gap-4 pt-2"
                      >
                        <MagneticButton
                          onClick={(e) => scrollToSection("#vision", e)}
                          className="bg-[#17150f] dark:bg-amber hover:bg-ink-light dark:hover:bg-[#ffa500] text-paper dark:text-[#08090c] font-sans font-bold text-xs px-5 py-3 border border-[#17150f] dark:border-amber transition-all flex items-center gap-2 shadow-md active:translate-y-px cursor-pointer group"
                        >
                          Join Early Access
                          <motion.span
                            className="inline-block"
                            whileHover={{ x: 4 }}
                            transition={{
                              type: "spring",
                              stiffness: 200,
                              damping: 10,
                            }}
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </motion.span>
                        </MagneticButton>

                        <MagneticButton
                          onClick={() => setDemoOpen(true)}
                          className="bg-paper dark:bg-[#08090c] text-[#17150f] dark:text-[#e6e8eb] font-sans font-bold text-xs px-5 py-3 border border-ink-border dark:border-[#1b1e25] hover:bg-[#17150f]/5 dark:hover:bg-[#e6e8eb]/5 transition-all flex items-center gap-2 active:translate-y-px cursor-pointer group"
                        >
                          <motion.span
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              ease: "easeInOut",
                            }}
                          >
                            <Play className="w-3.5 h-3.5 text-[#c03a2b] dark:text-amber fill-[#c03a2b] dark:fill-amber" />
                          </motion.span>
                          Watch 90-sec demo
                        </MagneticButton>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Right Split Pane: Code Execution / Interactive Terminal */}
                  <div className="md:col-span-6 p-8 md:p-12 border-t md:border-t-0 md:border-l border-ink-border dark:border-[#1b1e25]/60 bg-[#faf9f5]/30 dark:bg-[#0d0f13]/30 flex flex-col justify-center relative overflow-hidden z-10">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.8 }}
                      className="flex flex-col relative z-10 w-full"
                    >
                      <span className="font-mono text-[9px] text-ink-muted dark:text-[#737b8c] mb-2 tracking-widest uppercase block text-left">
                        EXHIBIT A — RUNTIME CAPTURE
                      </span>
                      <ExhibitATerminal />
                      <span className="font-mono text-[10px] text-ink-muted dark:text-[#737b8c] mt-2.5 text-center block">
                        Fig. 1 — Revoking a permanent credential. Workload
                        transitions to ephemeral runtime authorization.
                      </span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* IDE Footer / Status Bar */}
            <div className="h-6 bg-[#faf9f5] dark:bg-[#0d0f13] border-t border-ink-border dark:border-[#1b1e25]/60 flex items-center justify-between px-3 font-mono text-[9.5px] text-ink-muted dark:text-[#737b8c] select-none relative z-10">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-ping inline-block" />
                  <span>Connected</span>
                </span>
                <span>git: main</span>
              </div>
              <div className="flex items-center gap-3">
                <span>UTF-8</span>
                <span>TypeScript 5.4</span>
                <span>broker workspace</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust/Vision Band */}
      <div className="border-b border-dashed border-ink-border dark:border-[#1b1e25] bg-paper dark:bg-[#08090c] transition-colors duration-300">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 select-none divide-y md:divide-y-0 md:divide-x divide-ink-border dark:divide-[#1b1e25]">
          {/* Metric 1 */}
          <div className="py-8 px-6 flex flex-col justify-between items-start bg-paper dark:bg-[#08090c] hover:bg-[#faf9f5] dark:hover:bg-[#0d0f13] transition-all group relative overflow-hidden min-h-35 text-left">
            <div className="flex justify-between w-full font-mono text-[9px] text-ink-muted dark:text-[#737b8c]">
              <span>[REF-01]</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#c03a2b] dark:text-amber font-bold">
                VERIFIED
              </span>
            </div>
            <div className="mt-4 space-y-1 w-full">
              <span className="font-mono text-[10px] text-ink-muted dark:text-[#737b8c] uppercase tracking-wider block">
                Secrets Stored
              </span>
              <span className="font-sans font-extrabold text-2xl md:text-3xl text-[#c03a2b] dark:text-amber tracking-tight block">
                0
              </span>
            </div>
            <p className="mt-2 font-mono text-[9px] text-ink-muted dark:text-[#737b8c]/60 leading-normal opacity-0 group-hover:opacity-100 transition-opacity max-w-full duration-300">
              No credentials written to database or disk logs.
            </p>
          </div>

          {/* Metric 2 */}
          <div className="py-8 px-6 flex flex-col justify-between items-start bg-paper dark:bg-[#08090c] hover:bg-[#faf9f5] dark:hover:bg-[#0d0f13] transition-all group relative overflow-hidden min-h-35 text-left">
            <div className="flex justify-between w-full font-mono text-[9px] text-ink-muted dark:text-[#737b8c]">
              <span>[REF-02]</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#c03a2b] dark:text-amber font-bold">
                ENFORCED
              </span>
            </div>
            <div className="mt-4 space-y-1 w-full">
              <span className="font-mono text-[10px] text-ink-muted dark:text-[#737b8c] uppercase tracking-wider block">
                Enforcement
              </span>
              <span className="font-sans font-extrabold text-2xl md:text-3xl text-[#17150f] dark:text-[#e6e8eb] group-hover:text-[#c03a2b] dark:group-hover:text-amber transition-colors tracking-tight block">
                Ephemeral
              </span>
            </div>
            <p className="mt-2 font-mono text-[9px] text-ink-muted dark:text-[#737b8c]/60 leading-normal opacity-0 group-hover:opacity-100 transition-opacity max-w-full duration-300">
              Keys expire automatically after workload completion.
            </p>
          </div>

          {/* Metric 3 */}
          <div className="py-8 px-6 flex flex-col justify-between items-start bg-paper dark:bg-[#08090c] hover:bg-[#faf9f5] dark:hover:bg-[#0d0f13] transition-all group relative overflow-hidden min-h-35 text-left">
            <div className="flex justify-between w-full font-mono text-[9px] text-ink-muted dark:text-[#737b8c]">
              <span>[REF-03]</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#c03a2b] dark:text-amber font-bold">
                IMMUTABLE
              </span>
            </div>
            <div className="mt-4 space-y-1 w-full">
              <span className="font-mono text-[10px] text-ink-muted dark:text-[#737b8c] uppercase tracking-wider block">
                Audit Trails
              </span>
              <span className="font-sans font-extrabold text-2xl md:text-3xl text-[#17150f] dark:text-[#e6e8eb] group-hover:text-[#c03a2b] dark:group-hover:text-amber transition-colors tracking-tight block">
                Append-only
              </span>
            </div>
            <p className="mt-2 font-mono text-[9px] text-ink-muted dark:text-[#737b8c]/60 leading-normal opacity-0 group-hover:opacity-100 transition-opacity max-w-full duration-300">
              Cryptographic append-only trails record access actions.
            </p>
          </div>

          {/* Metric 4 */}
          <div className="py-8 px-6 flex flex-col justify-between items-start bg-paper dark:bg-[#08090c] hover:bg-[#faf9f5] dark:hover:bg-[#0d0f13] transition-all group relative overflow-hidden min-h-35 text-left">
            <div className="flex justify-between w-full font-mono text-[9px] text-ink-muted dark:text-[#737b8c]">
              <span>[REF-04]</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#c03a2b] dark:text-amber font-bold">
                NATIVE
              </span>
            </div>
            <div className="mt-4 space-y-1 w-full">
              <span className="font-mono text-[10px] text-ink-muted dark:text-[#737b8c] uppercase tracking-wider block">
                Integration
              </span>
              <span className="font-sans font-extrabold text-2xl md:text-3xl text-[#17150f] dark:text-[#e6e8eb] group-hover:text-[#c03a2b] dark:group-hover:text-amber transition-colors tracking-tight block">
                Zero-Code
              </span>
            </div>
            <p className="mt-2 font-mono text-[9px] text-ink-muted dark:text-[#737b8c]/60 leading-normal opacity-0 group-hover:opacity-100 transition-opacity max-w-full duration-300">
              Works transparently within existing process execution.
            </p>
          </div>
        </div>
      </div>

      {/* Subsequent sections - enclosed in the 1360px boxed container */}
      <div className="max-w-340 mx-auto px-6 md:px-8 py-10 md:py-16 relative z-10">
        <div className="border border-ink-border dark:border-[#1b1e25] bg-paper dark:bg-[#08090c] shadow-xl transition-colors duration-300">
          {/* SEC. 01 — THE PROBLEM */}
          <div
            className="p-6 md:p-12 border-b border-dashed border-ink-border dark:border-[#1b1e25] bg-paper dark:bg-[#08090c] transition-colors duration-300 relative overflow-hidden"
            id="how-it-works"
          >
            {/* Interactive Background Particle Constellation */}
            <ParticleField />

            <div className="w-full max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                <div className="lg:col-span-4 space-y-4">
                  <span className="font-mono text-xs font-bold text-[#c03a2b] dark:text-amber tracking-widest uppercase block">
                    SEC. 1 — THE CORE CRITICAL PATH
                  </span>
                  <h2 className="font-sans text-2xl md:text-3xl font-bold tracking-tight text-[#17150f] dark:text-[#e6e8eb] leading-tight flex flex-wrap gap-x-1.5 gap-y-0.5">
                    {"The credential gap in autonomous software"
                      .split(" ")
                      .map((word, idx) => (
                        <span
                          key={idx}
                          className="inline-block overflow-hidden relative py-0.5"
                        >
                          <motion.span
                            initial={{ y: "100%", opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{
                              duration: 0.75,
                              delay: idx * 0.05,
                              ease: [0.16, 1, 0.3, 1] as [
                                number,
                                number,
                                number,
                                number,
                              ],
                            }}
                            className="inline-block origin-bottom"
                          >
                            {word}
                          </motion.span>
                        </span>
                      ))}
                  </h2>
                  <p className="text-sm text-ink-muted dark:text-[#737b8c] leading-relaxed">
                    Traditional IAM and secret managers are built for static
                    workloads. Autonomous software makes dynamic, run-time
                    decisions, requiring granular capabilities rather than
                    credentials.
                  </p>
                </div>

                {/* Scroll Triggered Staggered Container */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6"
                >
                  {/* Point 1 */}
                  <motion.div variants={fadeVariants} className="w-full h-full">
                    <TiltCard className="border border-ink-border dark:border-[#1b1e25] bg-[#faf9f5]/80 dark:bg-[#0d0f13]/80 shadow-sm transition-colors duration-300 flex flex-col h-full rounded-none overflow-hidden group">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-ink-border dark:border-[#1b1e25]/60 bg-paper dark:bg-[#08090c] text-[10px] font-mono text-ink-muted dark:text-[#737b8c] select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c03a2b] dark:bg-amber opacity-80" />
                          <span className="font-bold">privilege.json</span>
                        </div>
                        <span className="opacity-60 hover:opacity-100 cursor-pointer">
                          ×
                        </span>
                      </div>
                      <div className="p-5 flex-1 font-mono text-left text-xs leading-relaxed space-y-1.5 select-text">
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            01
                          </span>
                          <div className="flex-1">
                            <span className="text-[#c03a2b] dark:text-amber font-bold">
                              {"{"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            02
                          </span>
                          <div className="flex-1 pl-4">
                            <span className="text-ink-muted dark:text-[#737b8c]">
                              &quot;title&quot;:
                            </span>{" "}
                            <span className="text-[#17150f] dark:text-[#e6e8eb] font-semibold">
                              &quot;Excessive Privilege&quot;
                            </span>
                            ,
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            03
                          </span>
                          <div className="flex-1 pl-4">
                            <span className="text-ink-muted dark:text-[#737b8c]">
                              &quot;risk&quot;:
                            </span>{" "}
                            <span className="text-[#17150f] dark:text-[#e6e8eb]">
                              &quot;AI agents inherit far more access than they
                              actually need. Compromise of a single PAT unlocks
                              the entire system.&quot;
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            04
                          </span>
                          <div className="flex-1">
                            <span className="text-[#c03a2b] dark:text-amber font-bold">
                              {"}"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>

                  {/* Point 2 */}
                  <motion.div variants={fadeVariants} className="w-full h-full">
                    <TiltCard className="border border-ink-border dark:border-[#1b1e25] bg-[#faf9f5]/80 dark:bg-[#0d0f13]/80 shadow-sm transition-colors duration-300 flex flex-col h-full rounded-none overflow-hidden group">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-ink-border dark:border-[#1b1e25]/60 bg-paper dark:bg-[#08090c] text-[10px] font-mono text-ink-muted dark:text-[#737b8c] select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c03a2b] dark:bg-amber opacity-80" />
                          <span className="font-bold">secrets.yaml</span>
                        </div>
                        <span className="opacity-60 hover:opacity-100 cursor-pointer">
                          ×
                        </span>
                      </div>
                      <div className="p-5 flex-1 font-mono text-left text-xs leading-relaxed space-y-1.5 select-text">
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            01
                          </span>
                          <div className="flex-1">
                            <span className="text-[#c03a2b] dark:text-amber font-bold">
                              permanent_secrets:
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            02
                          </span>
                          <div className="flex-1 pl-4">
                            <span className="text-ink-muted dark:text-[#737b8c]">
                              state:
                            </span>{" "}
                            <span className="text-[#17150f] dark:text-[#e6e8eb] font-semibold">
                              &quot;Permanent&quot;
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            03
                          </span>
                          <div className="flex-1 pl-4">
                            <span className="text-ink-muted dark:text-[#737b8c]">
                              exposure:
                            </span>{" "}
                            <span className="text-[#17150f] dark:text-[#e6e8eb]">
                              &quot;Credentials live in configurations for weeks or
                              months. Rotating them is expensive, leaking them
                              in terminal contexts.&quot;
                            </span>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>

                  {/* Point 3 */}
                  <motion.div variants={fadeVariants} className="w-full h-full">
                    <TiltCard className="border border-ink-border dark:border-[#1b1e25] bg-[#faf9f5]/80 dark:bg-[#0d0f13]/80 shadow-sm transition-colors duration-300 flex flex-col h-full rounded-none overflow-hidden group">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-ink-border dark:border-[#1b1e25]/60 bg-paper dark:bg-[#08090c] text-[10px] font-mono text-ink-muted dark:text-[#737b8c] select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c03a2b] dark:bg-amber opacity-80" />
                          <span className="font-bold">visibility.log</span>
                        </div>
                        <span className="opacity-60 hover:opacity-100 cursor-pointer">
                          ×
                        </span>
                      </div>
                      <div className="p-5 flex-1 font-mono text-left text-xs leading-relaxed space-y-1.5 select-text">
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            01
                          </span>
                          <div className="flex-1">
                            <span className="text-crimson font-bold">
                              {"[WARN]"}
                            </span>{" "}
                            <span className="text-[#17150f] dark:text-[#e6e8eb] font-bold">
                              Zero Visibility
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            02
                          </span>
                          <div className="flex-1">
                            <span className="text-ink-muted dark:text-[#737b8c]">
                              No mechanism exists to answer: which specific
                              agent requested this token, who authorized it, and
                              for what specific background run loop?
                            </span>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>

                  {/* Point 4 */}
                  <motion.div variants={fadeVariants} className="w-full h-full">
                    <TiltCard className="border border-ink-border dark:border-[#1b1e25] bg-[#faf9f5]/80 dark:bg-[#0d0f13]/80 shadow-sm transition-colors duration-300 flex flex-col h-full rounded-none overflow-hidden group">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-ink-border dark:border-[#1b1e25]/60 bg-paper dark:bg-[#08090c] text-[10px] font-mono text-ink-muted dark:text-[#737b8c] select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald opacity-80" />
                          <span className="font-bold">interception.sh</span>
                        </div>
                        <span className="opacity-60 hover:opacity-100 cursor-pointer">
                          ×
                        </span>
                      </div>
                      <div className="p-5 flex-1 font-mono text-left text-xs leading-relaxed space-y-1.5 select-text">
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            01
                          </span>
                          <div className="flex-1">
                            <span className="text-[#c03a2b] dark:text-amber font-bold">
                              #!/bin/bash
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            02
                          </span>
                          <div className="flex-1">
                            <span className="text-emerald font-bold">
                              broker wrap
                            </span>{" "}
                            <span className="text-ink-muted dark:text-[#737b8c]">
                              --intercept && {"{"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            03
                          </span>
                          <div className="flex-1 pl-4">
                            <span className="text-[#17150f] dark:text-[#e6e8eb]">
                              Developers change zero business logic. Broker maps
                              and issues temporary, scoped credentials at
                              runtime.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-ink-muted/40 dark:text-[#737b8c]/30 select-none text-[10px] w-4 text-right">
                            04
                          </span>
                          <div className="flex-1">
                            <span className="text-ink-muted dark:text-[#737b8c]">
                              {"}"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* SEC. 02 — THE RUNTIME PULSE DIAGRAM */}
          <div className="p-6 md:p-12 border-b border-dashed border-ink-border dark:border-[#1b1e25] bg-[#faf9f5] dark:bg-[#0d0f13] transition-colors duration-300">
            <div className="w-full max-w-6xl mx-auto">
              <RuntimePulse />
            </div>

            {/* SEC. 03 — CAPABILITIES GRID */}
            <div
              className="p-6 md:p-12 border-b border-dashed border-ink-border dark:border-[#1b1e25] bg-paper dark:bg-[#08090c] transition-colors duration-300"
              id="capabilities"
            >
              <div className="w-full max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div
                    ref={capabilitiesCopyRef}
                    className="lg:col-span-4 lg:h-full lg:flex lg:flex-col lg:justify-between space-y-6 lg:space-y-0"
                  >
                    <div className="space-y-5 flex flex-col items-start">
                      <span className="inline-block rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-bold font-mono bg-[#c03a2b]/10 dark:bg-amber/10 text-[#c03a2b] dark:text-amber border border-[#c03a2b]/20 dark:border-amber/20 select-none">
                        SEC. 3 — EPHEMERAL LIFE
                      </span>
                      <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-[#17150f] dark:text-[#e6e8eb] leading-tight text-left">
                        Capabilities born, used, and expired
                      </h2>
                      <p className="text-sm md:text-base text-[#17150f] dark:text-[#e6e8eb]/90 leading-relaxed font-sans font-medium text-left">
                        Every capability token has an exact lifetime in seconds.
                        Rather than broad access, they delegate minimal,
                        execution-locked scopes.
                      </p>
                      <p className="text-sm text-ink-muted dark:text-[#737b8c] leading-relaxed font-sans text-left">
                        Notice how tokens count down in the grid. Once expired,
                        they dissolve instantly from runtime memory space and
                        are garbage-collected.
                      </p>
                    </div>

                    <div className="w-full pt-4 lg:pt-0">
                      <div className="p-1.25 rounded-2xl bg-[#17150f]/5 dark:bg-white/5 border border-ink-border dark:border-[#1b1e25]/60 shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_#1b1e25] select-none transition-all duration-300">
                        <div className="p-4 bg-[#faf9f5] dark:bg-[#0d0f13] rounded-[calc(1rem-5px)] font-mono text-[10.5px] space-y-3 text-ink-muted dark:text-[#737b8c] transition-colors duration-300 text-left">
                          <p className="text-[#17150f] dark:text-[#e6e8eb] font-bold border-b border-dashed border-ink-border dark:border-[#1b1e25] pb-2 uppercase tracking-wider text-[10px]">
                            Capability Principles
                          </p>
                          <div className="space-y-2.5">
                            <div className="group flex items-start gap-2.5 cursor-default transition-all duration-300 hover:translate-x-1">
                              <span className="text-ink-muted/75 dark:text-[#737b8c]/75 font-bold shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:text-[#17150f] dark:group-hover:text-[#e6e8eb]">
                                [01]
                              </span>
                              <span>
                                <strong className="text-[#17150f] dark:text-[#e6e8eb] transition-colors duration-300">
                                  LEAST PRIVILEGE
                                </strong>
                                <span className="block text-[9.5px] mt-0.5 text-ink-muted/85 dark:text-[#737b8c]/85 font-sans transition-colors duration-300">
                                  Scope only the single action needed
                                </span>
                              </span>
                            </div>
                            <div className="group flex items-start gap-2.5 cursor-default transition-all duration-300 hover:translate-x-1">
                              <span className="text-ink-muted/75 dark:text-[#737b8c]/75 font-bold shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:text-[#17150f] dark:group-hover:text-[#e6e8eb]">
                                [02]
                              </span>
                              <span>
                                <strong className="text-[#17150f] dark:text-[#e6e8eb] transition-colors duration-300">
                                  SHORTEST LIFE
                                </strong>
                                <span className="block text-[9.5px] mt-0.5 text-ink-muted/85 dark:text-[#737b8c]/85 font-sans transition-colors duration-300">
                                  TTL strictly limited to task runtime
                                </span>
                              </span>
                            </div>
                            <div className="group flex items-start gap-2.5 cursor-default transition-all duration-300 hover:translate-x-1">
                              <span className="text-ink-muted/75 dark:text-[#737b8c]/75 font-bold shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:text-[#17150f] dark:group-hover:text-[#e6e8eb]">
                                [03]
                              </span>
                              <span>
                                <strong className="text-[#17150f] dark:text-[#e6e8eb] transition-colors duration-300">
                                  VISIBILITY
                                </strong>
                                <span className="block text-[9.5px] mt-0.5 text-ink-muted/85 dark:text-[#737b8c]/85 font-sans transition-colors duration-300">
                                  Cryptographic trace IDs for auditing
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-8">
                      <CapabilitiesGrid />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEC. 04 — REGISTRY WAITLIST */}
            <div
              className="bg-[#faf9f5] dark:bg-[#0d0f13] transition-colors duration-300"
              ref={waitlistRef}
              id="vision"
            >
              {/* IDE Panel Header */}
              <div className="flex items-center justify-between px-6 py-2.5 bg-paper dark:bg-[#08090c]/80 border-b border-ink-border dark:border-[#1b1e25]/60 text-[10px] font-mono text-ink-muted dark:text-[#737b8c] select-none uppercase tracking-wider">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-[#3b82f6] font-extrabold">&gt;</span>
                  <span>ACCESS_CONTROL_REGISTRY</span>
                </div>
                <div className="font-semibold">
                  [<span className="text-[#3b82f6] font-bold">4</span>/4]
                </div>
              </div>

              <div className="p-6 md:p-12">
                <div className="w-full max-w-6xl mx-auto">
                  <div className="max-w-2xl mx-auto text-center space-y-8 py-8">
                    <div className="space-y-4">
                      <span className="font-mono text-xs font-bold text-[#c03a2b] dark:text-amber tracking-widest uppercase block">
                        SEC. 4 — JOIN EARLY ACCESS
                      </span>
                      <h2 className="font-sans text-3xl font-bold tracking-tight text-[#17150f] dark:text-[#e6e8eb]">
                        Make autonomous software trustworthy by default
                      </h2>
                      <p className="text-sm text-ink-muted dark:text-[#737b8c] max-w-lg mx-auto">
                        Validate demand for the Phase 1 release: Delete your
                        GITHUB_PAT. We&apos;ll send you early access documentation
                        and CLI download instructions as soon as they are ready.
                      </p>
                    </div>

                    <AnimatePresence mode="wait">
                      {waitlistState !== "registered" ? (
                        <motion.div
                          key="form-terminal"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="w-full max-w-md mx-auto rounded-lg border border-ink-border dark:border-[#1b1e25]/60 bg-[#faf9f5] dark:bg-[#0d0f13] shadow-[4px_4px_0px_#d4d0c5] dark:shadow-[4px_4px_0px_#1b1e25] overflow-hidden flex flex-col font-mono text-[11px] text-[#17150f] dark:text-[#e6e8eb] text-left"
                        >
                          {/* Terminal header */}
                          <div className="h-8 bg-[#faf9f5]/50 dark:bg-[#0d0f13]/50 border-b border-ink-border dark:border-[#1b1e25]/60 flex items-center justify-between px-3 select-none text-ink-muted dark:text-[#737b8c]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-crimson opacity-80" />
                              <span className="w-2 h-2 rounded-full bg-amber opacity-80" />
                              <span className="w-2 h-2 rounded-full bg-emerald opacity-80" />
                            </div>
                            <span className="text-[10px] opacity-75">
                              sh — broker register
                            </span>
                            <div className="w-9" />
                          </div>

                          {/* Terminal body */}
                          <form
                            onSubmit={handleWaitlistSubmit}
                            className="p-4 space-y-3.5"
                          >
                            <div className="space-y-1">
                              <p className="text-ink-muted dark:text-[#737b8c] select-none">
                                # Execute wrapper to register interest
                              </p>
                              <p className="flex items-center gap-1.5">
                                <span className="text-[#c03a2b] dark:text-amber select-none">
                                  $
                                </span>
                                <span className="font-bold">
                                  broker waitlist --join
                                </span>
                              </p>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <label
                                htmlFor="terminal-email"
                                className="text-ink-muted dark:text-[#737b8c] select-none block"
                              >
                                Enter developer email:
                              </label>
                              <div className="relative flex items-center bg-paper/40 dark:bg-[#08090c]/40 border border-ink-border dark:border-[#1b1e25]/60 rounded px-2.5 py-2">
                                <span className="text-ink-muted dark:text-[#737b8c] mr-2 select-none font-bold">
                                  &gt;
                                </span>
                                <input
                                  id="terminal-email"
                                  type="email"
                                  required
                                  placeholder="developer@enterprise.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  disabled={waitlistState === "submitting"}
                                  className="flex-1 bg-transparent text-[#17150f] dark:text-[#e6e8eb] placeholder-[#737b8c]/50 focus:outline-none font-mono text-[11px]"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={waitlistState === "submitting"}
                              className="w-full bg-[#17150f] dark:bg-amber hover:bg-ink-light dark:hover:bg-[#ffa500] text-paper dark:text-[#08090c] font-sans font-bold text-xs py-2.5 transition-all select-none flex items-center justify-center gap-2 border border-[#17150f] dark:border-amber active:translate-y-[0.5px] cursor-pointer disabled:opacity-50"
                            >
                              {waitlistState === "submitting" ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-paper dark:bg-[#08090c] animate-ping" />
                                  <span>RECORDING...</span>
                                </>
                              ) : (
                                <span>EXECUTE REGISTRATION</span>
                              )}
                            </button>
                          </form>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="success-terminal"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full max-w-md mx-auto rounded-lg border border-emerald/30 dark:border-emerald/40 bg-[#faf9f5] dark:bg-[#0d0f13] shadow-[4px_4px_0px_#10b981]/30 overflow-hidden flex flex-col font-mono text-[11px] text-[#17150f] dark:text-[#e6e8eb] text-left"
                        >
                          {/* Terminal header */}
                          <div className="h-8 bg-emerald/5 border-b border-emerald/20 flex items-center justify-between px-3 select-none text-emerald">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald" />
                              <span className="w-2 h-2 rounded-full bg-emerald/60" />
                              <span className="w-2 h-2 rounded-full bg-emerald/40" />
                            </div>
                            <span className="text-[10px] font-bold">
                              SUCCESS — ticket_signature.bin
                            </span>
                            <div className="w-9" />
                          </div>

                          {/* Success output body */}
                          <div className="p-4 space-y-3 relative">
                            {/* Fingerprint decorative watermark in background */}
                            <div className="absolute right-4 bottom-4 opacity-5 text-emerald pointer-events-none">
                              <Fingerprint className="w-16 h-16" />
                            </div>

                            <div className="space-y-1.5 pb-1 border-b border-dashed border-emerald/20">
                              <p className="text-emerald font-bold">
                                ✓ CRYPTOGRAPHIC REGISTRY COMPLETE
                              </p>
                              <p className="text-ink-muted dark:text-[#737b8c]">
                                Payload signed with broker authority public key.
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-y-1 text-[10px]">
                              <span className="text-ink-muted dark:text-[#737b8c]">
                                TICKET_REF:
                              </span>
                              <span className="col-span-2 font-bold text-[#c03a2b] dark:text-amber">
                                {ticketNumber}
                              </span>

                              <span className="text-ink-muted dark:text-[#737b8c]">
                                STATUS:
                              </span>
                              <span className="col-span-2 text-emerald font-bold">
                                ACTIVE
                              </span>

                              <span className="text-ink-muted dark:text-[#737b8c]">
                                SCOPE:
                              </span>
                              <span className="col-span-2">
                                registry:early_access_beta
                              </span>
                            </div>

                            <p className="text-[10px] text-ink-muted dark:text-[#737b8c] leading-relaxed pt-2 border-t border-dashed border-emerald/20">
                              Welcome to the machine trust model. Instructions
                              for downloading the broker CLI wrap client will be
                              delivered to{" "}
                              <span className="underline">{email}</span>.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* RFC Registry Index Footer */}
            <div className="border-t border-dashed border-ink-border dark:border-[#1b1e25]/60 bg-[#faf9f5] dark:bg-[#0d0f13] select-none transition-colors duration-300">
              <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-ink-border dark:divide-[#1b1e25]/60 text-[10px] font-mono text-ink-muted dark:text-[#737b8c]">
                <div className="px-6 py-6 space-y-2">
                  <p className="text-[#17150f] dark:text-[#e6e8eb] font-bold tracking-wider">
                    BROKER SPECIFICATIONS INDEX
                  </p>
                  <div className="space-y-1 opacity-80">
                    <p>RFC-001: Scoped capabilities model (DRAFT)</p>
                    <p>
                      RFC-002: Active runtime interception layers (PLANNING)
                    </p>
                    <p>
                      RFC-003: Cryptographic Capability delegation (PLANNING)
                    </p>
                  </div>
                </div>
                <div className="px-6 py-6 flex flex-col justify-between space-y-4 md:space-y-0 text-left">
                  <div className="flex items-center gap-1.5 text-[#c03a2b] dark:text-amber font-bold">
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Broker: Runtime Trust layer for AI agents</span>
                  </div>
                  <p className="text-[9px] text-ink-muted/85 dark:text-[#737b8c]/85 leading-normal">
                    © 2026 Broker Inc. Specification Adaptive Workspace. All
                    rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Overlay Modal */}
        <AnimatePresence>
          {demoOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0d0f13]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-paper dark:bg-[#08090c] border border-[#17150f] dark:border-[#1b1e25] p-6 max-w-2xl w-full rounded-lg shadow-2xl space-y-4 relative"
              >
                <div className="flex justify-between items-center border-b border-ink-border dark:border-[#1b1e25] pb-3">
                  <span className="font-mono text-xs font-bold text-[#c03a2b] dark:text-amber uppercase">
                    SEC. 0.1 — 90-SECOND DEMO CAPTURE
                  </span>
                  <button
                    onClick={() => setDemoOpen(false)}
                    className="font-mono text-xs bg-[#17150f] dark:bg-amber text-paper dark:text-[#08090c] px-3 py-1.5 hover:bg-[#c03a2b] dark:hover:bg-[#ffa500] border border-[#17150f] dark:border-amber font-bold cursor-pointer"
                  >
                    [ CLOSE ]
                  </button>
                </div>

                {/* Demo video placeholder matching aesthetic */}
                <div className="aspect-video bg-[#0d0f13] border border-[#1b1e25] flex flex-col items-center justify-center p-6 text-center text-[#e6e8eb] font-mono space-y-4 relative overflow-hidden select-none">
                  <div className="absolute inset-0 opacity-15 flex items-center justify-center pointer-events-none">
                    <Fingerprint className="w-48 h-48 text-amber" />
                  </div>
                  <div className="z-10 space-y-2">
                    <Play className="w-12 h-12 text-[#c03a2b] dark:text-amber mx-auto animate-pulse" />
                    <p className="text-sm font-sans font-semibold tracking-wider text-white">
                      BROKER DEMO SCREENCAST
                    </p>
                    <p className="text-[10px] text-[#737b8c] max-w-sm mx-auto">
                      Visualizing runtime interception in under 90 seconds.
                      Showing how GITHUB_PAT environment variables are instantly
                      deleted and replaced by a local broker client wrapper.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted dark:text-[#737b8c]">
                  <span>DRAFT_DEMO_v1.04.mp4</span>
                  <span>DURATION: 1:30</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
