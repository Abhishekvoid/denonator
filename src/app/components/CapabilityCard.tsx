/**
 * The capability card — one component, two tones.
 *
 * This is the canonical "minted capability" object. The Hero runtime loop
 * (RuntimeLoop) renders it as an always-dark runtime terminal object
 * (tone="terminal"); SEC.2 (InterceptionFlow) renders it inside the paper
 * document panel (tone="document", theme-aware). Same markup, tokens switch by
 * tone, so the two can never drift.
 *
 * Purely presentational: no timers, no lifecycle. Each host supplies its own
 * motion wrapper (Hero's blur-dissolve, SEC.2's appear) and drives state via
 * props. The card itself never animates except the CSS ping on the status dot.
 */

export type CapabilityTone = "terminal" | "document";
export type CapabilityStatus = "granted" | "expiring";

const SEGMENTS_DEFAULT = 12;

interface CapabilityCardProps {
  tone: CapabilityTone;
  status: CapabilityStatus;
  /** Formatted TTL, e.g. "00:08". */
  ttl: string;
  /** How many decay segments are lit. */
  filled: number;
  segments?: number;
  /** Show the "GET /pulls -> 200 OK" request line. */
  showRequest?: boolean;
  scope?: string;
  className?: string;
}

interface ToneTokens {
  box: string;
  boxExpiring: string;
  label: string;
  chip: string;
  statusGranted: string;
  statusExpiring: string;
  dotGranted: string;
  dotExpiring: string;
  ttlWrap: string;
  ttlGranted: string;
  ttlExpiring: string;
  request: string;
  decayLabel: string;
  segEmpty: string;
}

const TONES: Record<CapabilityTone, ToneTokens> = {
  terminal: {
    box: "border-[#212836] bg-[#141a24]",
    boxExpiring: "border-[#ef4444]/60 bg-[#141a24]",
    label: "text-[#8a99ad]",
    chip: "border-[#212836] bg-[#0d1013] text-[#8a99ad]",
    statusGranted: "text-[#f1f5f9]",
    statusExpiring: "text-[#ef4444]",
    dotGranted: "bg-[#10b981]",
    dotExpiring: "bg-[#ef4444] animate-ping",
    ttlWrap: "text-[#8a99ad]",
    ttlGranted: "bg-[#ffb000] text-[#0d1013]",
    ttlExpiring: "bg-[#ef4444] text-white",
    request: "text-[#8a99ad]",
    decayLabel: "text-[#8a99ad]/70",
    segEmpty: "bg-[#212836]",
  },
  document: {
    box: "border-ink-border bg-paper",
    boxExpiring: "border-[#ef4444]/60 bg-paper",
    label: "text-ink-muted dark:text-[#928b7d]",
    chip: "border-ink-border bg-panel text-ink-muted dark:text-[#928b7d]",
    statusGranted: "text-[#17150f] dark:text-[#ece7dd]",
    statusExpiring: "text-[#ef4444]",
    dotGranted: "bg-[#10b981]",
    dotExpiring: "bg-[#ef4444] animate-ping",
    ttlWrap: "text-ink-muted dark:text-[#928b7d]",
    ttlGranted: "bg-amber text-[#17150f]",
    ttlExpiring: "bg-[#ef4444] text-white",
    request: "text-ink-muted dark:text-[#928b7d]",
    decayLabel: "text-ink-muted/70 dark:text-[#928b7d]/70",
    segEmpty: "bg-ink-border/60 dark:bg-[#38332b]",
  },
};

export default function CapabilityCard({
  tone,
  status,
  ttl,
  filled,
  segments = SEGMENTS_DEFAULT,
  showRequest = false,
  scope = "repo:read",
  className = "",
}: CapabilityCardProps) {
  const t = TONES[tone];
  const expiring = status === "expiring";
  const segFill = expiring ? "bg-[#ef4444]" : "bg-[#10b981]";

  return (
    <div
      className={`w-full rounded-lg border p-3 font-mono text-xs transition-colors duration-300 ${
        expiring ? t.boxExpiring : t.box
      } ${className}`}
    >
      {/* Capability label + scope */}
      <div className="flex items-center justify-between text-[10px]">
        <span className={`uppercase tracking-wider ${t.label}`}>Capability</span>
        <span className={`px-1.5 py-0.5 border uppercase ${t.chip}`}>{scope}</span>
      </div>

      {/* Status + TTL */}
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${expiring ? t.dotExpiring : t.dotGranted}`}
          />
          <span className={`font-bold ${expiring ? t.statusExpiring : t.statusGranted}`}>
            {expiring ? "EXPIRING" : "GRANTED"}
          </span>
        </span>
        <span className={`flex items-center gap-1.5 ${t.ttlWrap}`}>
          TTL
          <span
            className={`font-bold tabular-nums px-1.5 py-0.5 rounded ${
              expiring ? t.ttlExpiring : t.ttlGranted
            }`}
          >
            {ttl}
          </span>
        </span>
      </div>

      {/* Request line — reserved height so the card never jumps */}
      <div className={`mt-2 h-4 ${t.request}`}>
        {showRequest && (
          <span>
            GET /pulls <span className="text-[#10b981] font-bold">&rarr; 200 OK</span>
          </span>
        )}
      </div>

      {/* Decay meter */}
      <div className="mt-2 flex items-center gap-2">
        <span className={`text-[9px] uppercase tracking-wider ${t.decayLabel}`}>Decay</span>
        <div className="flex-1 grid grid-cols-12 gap-[3px]">
          {Array.from({ length: segments }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-[1px] transition-colors duration-300 ${
                i < filled ? segFill : t.segEmpty
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
