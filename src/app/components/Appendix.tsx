interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: "How is Broker different from Vault?",
    a: "Vault stores long-lived secrets and hands them to services you configure ahead of time. Broker issues short-lived capabilities to agents at runtime and expires them automatically. There is no secret to store, rotate, or leak.",
  },
  {
    q: "Why not just use fine-grained GitHub tokens or GitHub Apps?",
    a: "Those solve GitHub. Broker applies the same runtime-trust model across every resource an agent touches, databases, clouds, and SaaS, behind one scope model and one audit trail.",
  },
  {
    q: "What happens if Broker is down?",
    a: "Agents fail closed. No capability is minted, so nothing runs with standing access. Your resources are never left holding a permanent key that depends on our uptime.",
  },
  {
    q: "Can I self-host it?",
    a: "Self-hosting is on the roadmap. The broker authority is designed to run inside your own trust boundary, not as a mandatory third party in the request path.",
  },
  {
    q: "When can I use it?",
    a: "GitHub is in build now. Sign the register above to get the CLI wrap client and documentation the moment Phase 1 ships.",
  },
];

export default function Appendix() {
  return (
    <div className="w-full max-w-2xl mx-auto pt-14 mt-14 border-t border-dashed border-ink-border dark:border-[#38332b] text-left">
      <div className="flex items-center justify-between mb-6 font-mono text-[10px] uppercase tracking-wider text-ink-muted dark:text-[#928b7d] select-none">
        <span className="font-bold text-[#17150f] dark:text-[#ece7dd]">
          Appendix · Frequently asked
        </span>
        <span>{FAQS.length} entries</span>
      </div>

      <div className="border-t border-ink-border dark:border-[#38332b]">
        {FAQS.map((f, i) => (
          <details
            key={f.q}
            className="group border-b border-dashed border-ink-border/60 dark:border-[#38332b]/60"
          >
            <summary className="flex items-start justify-between gap-4 py-4 cursor-pointer list-none select-none">
              <span className="flex items-start gap-2.5">
                <span className="font-mono text-[10px] text-ink-muted/60 dark:text-[#928b7d]/60 pt-1 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-sans text-sm md:text-base font-semibold text-[#17150f] dark:text-[#ece7dd]">
                  {f.q}
                </span>
              </span>
              <span className="text-[#c03a2b] dark:text-amber font-mono text-lg leading-none pt-0.5 transition-transform duration-300 group-open:rotate-45 shrink-0">
                +
              </span>
            </summary>
            <p className="pb-4 pl-[2.1rem] pr-8 text-sm text-ink-muted dark:text-[#928b7d] leading-relaxed">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
