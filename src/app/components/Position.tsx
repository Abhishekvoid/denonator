"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, User, Server, Cpu } from "lucide-react";

export default function Position() {
  const [brokerInjected, setBrokerInjected] = useState(false);

  return (
    <div className="border-b border-dashed border-ink-border bg-paper transition-colors duration-300">
      {/* IDE Panel Header */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-panel/80 border-b border-ink-border text-[10px] font-mono text-ink-muted dark:text-[#928b7d] select-none uppercase tracking-wider">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-[#3b82f6] font-extrabold">&gt;</span>
          <span>POSITION</span>
        </div>
        <div className="font-semibold">
          [<span className="text-[#3b82f6] font-bold">5</span>/6]
        </div>
      </div>

      <div className="px-6 py-6 md:py-12">
        <div className="w-full max-w-310 mx-auto space-y-10">
          <div className="space-y-5">
            <span className="inline-block rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-bold font-mono bg-[#c03a2b]/10 dark:bg-amber/10 text-[#c03a2b] dark:text-amber border border-[#c03a2b]/20 dark:border-amber/20 select-none">
              SEC. 5 — POSITION
            </span>
            <h2 className="font-sans text-4xl md:text-5xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-[1.05] max-w-2xl">
              {"Your agents don't need your secrets."}
            </h2>
          </div>

          {/* Simulation Toggle Switch */}
          <div className="flex flex-wrap justify-between items-center bg-panel border border-ink-border p-4 gap-4 font-mono text-xs select-none">
            <span className="text-[#5c574a] dark:text-[#928b7d] font-bold">
              TRUST ARCHITECTURE COMPILER
            </span>
            <button
              onClick={() => setBrokerInjected(!brokerInjected)}
              className={`px-3 py-1.5 cursor-pointer font-bold uppercase transition-all border active:translate-y-[0.5px] rounded-sm flex items-center gap-1.5 ${
                brokerInjected
                  ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]"
                  : "bg-crimson/15 text-crimson border-crimson/50 hover:bg-crimson/25"
              }`}
            >
              {brokerInjected ? "✔ Broker Trust Injected" : "✕ Click to Inject Broker Trust Layer"}
            </button>
          </div>

          {/* Three-Column Triad Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Humans */}
            <div className="border border-ink-border bg-panel/50 p-6 space-y-6 flex flex-col justify-between min-h-[320px] font-mono text-xs text-left relative overflow-hidden transition-colors duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider select-none font-bold">
                  <span>Persona 01</span>
                  <span className="text-[#10b981] font-bold">ESTABLISHED</span>
                </div>
                <div className="flex items-center gap-2 select-none">
                  <User className="w-5 h-5 text-[#3b82f6]" />
                  <h3 className="font-sans text-lg font-bold text-[#17150f] dark:text-[#ece7dd] tracking-tight">
                    Humans
                  </h3>
                </div>
                <p className="text-[11px] text-[#5c574a] dark:text-[#928b7d] leading-relaxed font-sans">
                  Humans authenticate via browsers or local terminals. Their access is validated dynamically on demand and bounded by identity providers.
                </p>
              </div>
              <div className="border-t border-dashed border-ink-border pt-4 space-y-1.5 text-[10px] select-none">
                <div className="flex justify-between">
                  <span className="text-[#5c574a] dark:text-[#928b7d]">AUTHENTICATOR:</span>
                  <span className="text-[#17150f] dark:text-[#ece7dd] font-bold">Okta / IAM / SSO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c574a] dark:text-[#928b7d]">BOUNDS:</span>
                  <span className="text-[#17150f] dark:text-[#ece7dd] font-bold">Session Cookies (8h)</span>
                </div>
              </div>
            </div>

            {/* Card 2: Services */}
            <div className="border border-ink-border bg-panel/50 p-6 space-y-6 flex flex-col justify-between min-h-[320px] font-mono text-xs text-left relative overflow-hidden transition-colors duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] text-[#5c574a] dark:text-[#928b7d] uppercase tracking-wider select-none font-bold">
                  <span>Persona 02</span>
                  <span className="text-[#10b981] font-bold">ESTABLISHED</span>
                </div>
                <div className="flex items-center gap-2 select-none">
                  <Server className="w-5 h-5 text-[#3b82f6]" />
                  <h3 className="font-sans text-lg font-bold text-[#17150f] dark:text-[#ece7dd] tracking-tight">
                    Services
                  </h3>
                </div>
                <p className="text-[11px] text-[#5c574a] dark:text-[#928b7d] leading-relaxed font-sans">
                  Server microservices authenticate using secure key vaults. Their access parameters are locked to specific application roles.
                </p>
              </div>
              <div className="border-t border-dashed border-ink-border pt-4 space-y-1.5 text-[10px] select-none">
                <div className="flex justify-between">
                  <span className="text-[#5c574a] dark:text-[#928b7d]">AUTHENTICATOR:</span>
                  <span className="text-[#17150f] dark:text-[#ece7dd] font-bold">HashiCorp Vault / KMS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c574a] dark:text-[#928b7d]">BOUNDS:</span>
                  <span className="text-[#17150f] dark:text-[#ece7dd] font-bold">Scoped App Roles</span>
                </div>
              </div>
            </div>

            {/* Card 3: Autonomous Software */}
            <div
              className={`border p-6 space-y-6 flex flex-col justify-between min-h-[320px] font-mono text-xs text-left relative overflow-hidden transition-all duration-300 ${
                brokerInjected
                  ? "border-[#10b981] bg-[#10b981]/5 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                  : "border-crimson bg-crimson/5 shadow-[0_0_12px_rgba(192,58,43,0.15)]"
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold select-none">
                  <span>Persona 03</span>
                  {brokerInjected ? (
                    <span className="text-[#10b981] flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                      SECURED
                    </span>
                  ) : (
                    <span className="text-crimson flex items-center gap-1 font-bold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                      TRUST GAP
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 select-none">
                  <Cpu
                    className={`w-5 h-5 transition-colors ${
                      brokerInjected ? "text-[#10b981]" : "text-crimson"
                    }`}
                  />
                  <h3 className="font-sans text-lg font-bold text-[#17150f] dark:text-[#ece7dd] tracking-tight">
                    Agents
                  </h3>
                </div>

                <p className="text-[11px] text-[#5c574a] dark:text-[#928b7d] leading-relaxed font-sans">
                  {brokerInjected
                    ? "Autonomous agents request credentials on demand through Broker. Access is intercepted, validated, and expired immediately after task completion."
                    : "Autonomous software operates raw CLI/API requests without local web sessions. It cannot solve MFA, so developers default to injecting standing secrets."}
                </p>
              </div>

              <div className="border-t border-dashed border-ink-border pt-4 space-y-1.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[#5c574a] dark:text-[#928b7d] select-none">AUTHENTICATOR:</span>
                  <motion.span
                    key={brokerInjected ? "secured" : "unsecured"}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`font-bold uppercase ${
                      brokerInjected ? "text-[#10b981]" : "text-crimson font-extrabold"
                    }`}
                  >
                    {brokerInjected ? "Broker Gateway" : "None (Inherits Yours)"}
                  </motion.span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c574a] dark:text-[#928b7d] select-none">BOUNDS:</span>
                  <motion.span
                    key={brokerInjected ? "bound-sec" : "bound-unsec"}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[#17150f] dark:text-[#ece7dd] font-bold uppercase"
                  >
                    {brokerInjected ? "Task-scoped & 300s TTL" : "Standing PATs (Unscoped)"}
                  </motion.span>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution */}
          <div className="space-y-5 max-w-2xl pt-4">
            <p className="font-sans text-2xl md:text-3xl font-bold tracking-tight text-[#17150f] dark:text-[#ece7dd] leading-snug text-left">
              Broker is the trust layer{" "}
              <span className="text-[#c03a2b] dark:text-amber">
                autonomous software has been missing.
              </span>
            </p>
            <p className="text-sm md:text-base text-ink-muted dark:text-[#928b7d] leading-relaxed text-left">
              Identity, scope, and expiry, issued to an agent at runtime. It
              proves what it may do, does it, and forgets, without ever holding a
              standing secret of yours.
            </p>
            <div className="text-left">
              <a
                href="#"
                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#c03a2b] dark:text-amber hover:gap-2.5 transition-all group"
              >
                Read the full vision
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
