/**
 * One cell of the comparison matrix — the single place a spine figure is
 * rendered, on every category page.
 *
 * The five states are visually distinct on purpose:
 *   disclosed  the value, with a provenance mark and a citation popover
 *   N/D        applies to this entity, not disclosed in the report
 *   N/A        does not apply to this business model — with a mandatory reason
 *   scope      disclosed by the entity, in a document we do not read
 *   pending    the report has not been read yet (never a zero, never a blank)
 *
 * N/D and "scope" look different because they say different things about the
 * entity: one is a gap in their reporting, the other a boundary in ours.
 *
 * Provenance marks follow the one ladder in provenance.ts:
 *   ✅ confirmed (page recorded) · • reported · ⚠️ estimated · ❌ unverified
 */
import { TIER_META } from "@/data/provenance";
import type { Cell, SeriesPoint } from "@/data/spine";
import { USABILITY_LABEL, type UsabilityVerdict } from "@/data/spine/usability";

const TONE: Record<string, string> = {
  confirmed: "text-good",
  reported: "text-muted2",
  estimated: "text-sc",
  unverified: "text-nd",
};

function ProvenanceMark({ tier }: { tier: keyof typeof TIER_META }) {
  const meta = TIER_META[tier];
  return (
    <span className={`font-mono text-[11px] ${TONE[tier] ?? "text-nd"} align-middle`} title={`${meta.label} — provenance`} aria-label={meta.label}>
      {meta.icon}
    </span>
  );
}

/** Pure CSS hover/focus popover — SSR-safe, no portal, no client JS. */
function Popover({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-block group align-middle">
      <button
        type="button"
        className="font-mono text-[10px] text-muted3 border-b border-dotted border-muted3 cursor-help focus:outline-none focus-visible:text-ink"
      >
        {label}
      </button>
      <span className="pointer-events-none invisible group-hover:visible group-focus-within:visible absolute z-40 right-0 top-full mt-1 w-72 rounded-[10px] border border-hairline bg-card p-3 text-left shadow-lg">
        {children}
      </span>
    </span>
  );
}

/**
 * Comparatives (IFRS S1). Shows the prior disclosed period and the change, so
 * a figure is readable as a direction rather than a lone number. A gap in the
 * series breaks the comparison — it is never interpolated through.
 */
function Comparative({ series }: { series: SeriesPoint[] }) {
  const points = series.filter((p) => p.value !== null) as { year: string; value: number }[];
  if (points.length < 2) return null;
  const [prev, latest] = [points[points.length - 2], points[points.length - 1]];
  if (prev.value === 0) return null;
  const pct = ((latest.value - prev.value) / Math.abs(prev.value)) * 100;
  const up = pct > 0;
  const flat = Math.abs(pct) < 0.05;
  return (
    <span
      className="font-mono text-[10px] text-muted3"
      title={points.map((p) => `${p.year}: ${p.value.toLocaleString()}`).join(" · ")}
    >
      {prev.year} → {latest.year}{" "}
      <span className={flat ? "text-muted3" : up ? "text-sc" : "text-good"}>
        {flat ? "flat" : `${up ? "+" : ""}${pct.toFixed(1)}%`}
      </span>
    </span>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span className="flex justify-between gap-3 py-[2px]">
      <span className="font-mono text-[10px] tracking-[0.05em] uppercase text-muted3">{label}</span>
      <span className="font-sans text-[11px] text-ink2 text-right">{value}</span>
    </span>
  );
}

/**
 * Decision-usefulness marker. A thin bar rather than another badge: an analyst
 * scanning a column needs to see at a glance which figures carry weight,
 * without the row turning into a wall of icons.
 */
function UsabilityBar({ verdict }: { verdict: UsabilityVerdict }) {
  const tone =
    verdict.grade === "high" ? "bg-good"
    : verdict.grade === "moderate" ? "bg-sm"
    : verdict.grade === "limited" ? "bg-sc"
    : "bg-hairline";
  const title = [
    `Decision-usefulness: ${USABILITY_LABEL[verdict.grade]}`,
    ...verdict.limitations.map((l) => `• ${l}`),
  ].join("\n");
  return (
    <span
      className={`inline-block w-[18px] h-[3px] rounded-full ${tone} align-middle`}
      title={title}
      aria-label={title}
    />
  );
}

export function SpineCell({
  cell,
  isWinner = false,
  usability,
}: {
  cell: Cell | undefined;
  isWinner?: boolean;
  usability?: UsabilityVerdict;
}) {
  if (!cell) {
    return <span className="font-mono text-[13px] text-nd">—</span>;
  }

  if (cell.state === "pending") {
    return (
      <span className="font-mono text-[12px] text-muted3 italic" title="Report not yet read — not a zero">
        pending
      </span>
    );
  }

  if (cell.state === "na") {
    return (
      <div className="text-right">
        <span className="font-mono text-[13px] text-nd">N/A</span>
        <div className="mt-[3px]">
          <Popover label="why">
            <span className="block font-sans font-semibold text-[11px] text-ink2 mb-1">Not applicable</span>
            <span className="block font-sans text-[11px] leading-[1.5] text-muted">{cell.reason}</span>
            <span className="block font-sans text-[10px] leading-[1.5] text-muted2 mt-2">
              Shown as N/A, not N/D — this is not a disclosure gap.
            </span>
          </Popover>
        </div>
      </div>
    );
  }

  if (cell.state === "out_of_scope") {
    return (
      <div className="text-right">
        <span
          className="font-mono text-[12px] text-muted3"
          title="Disclosed by the entity, outside this comparison's source scope"
        >
          out of scope
        </span>
        <div className="mt-[3px]">
          <Popover label="why">
            <span className="block font-sans font-semibold text-[11px] text-ink2 mb-1">
              Outside the source scope
            </span>
            <span className="block font-sans text-[11px] leading-[1.5] text-muted">{cell.reason}</span>
            <span className="block font-sans text-[10px] leading-[1.5] text-muted2 mt-2">
              Shown here rather than as N/D, because the entity does disclose it — this comparison
              reads sustainability reporting only.
            </span>
          </Popover>
        </div>
      </div>
    );
  }

  if (cell.state === "nd") {
    return (
      <div className="text-right">
        <span className="font-mono text-[13px] text-nd">N/D</span>
        {cell.note && (
          <div className="mt-[3px]">
            <Popover label="note">
              <span className="block font-sans font-semibold text-[11px] text-ink2 mb-1">Not disclosed</span>
              <span className="block font-sans text-[11px] leading-[1.5] text-muted">{cell.note}</span>
            </Popover>
          </div>
        )}
      </div>
    );
  }

  const c = cell.citation;
  return (
    <div className="text-right">
      <span className="inline-flex items-center justify-end gap-[6px]">
        {isWinner && <span className="w-[7px] h-[7px] rounded-full bg-good" title="Best performer — envelopes agree" />}
        <span className={`font-mono text-[13px] ${isWinner ? "text-ink font-semibold" : "text-ink2"}`}>{cell.display}</span>
        <ProvenanceMark tier={cell.provenance} />
        {usability && <UsabilityBar verdict={usability} />}
      </span>
      {cell.series && (
        <div className="mt-[2px]">
          <Comparative series={cell.series} />
        </div>
      )}
      <div className="mt-[3px]">
        {c ? (
          <Popover label="cite">
            <span className="block font-serif font-semibold text-[12px] text-ink leading-[1.25]">{c.reportTitle}</span>
            <span className="mt-2 block">
              <Line label="Year" value={cell.year} />
              <Line label="Page" value={c.page ?? c.pageNote ?? "not recorded"} />
              <Line label="Provenance" value={TIER_META[cell.provenance].label} />
              {c.publishedDate && <Line label="Published" value={c.publishedDate} />}
              <Line label="Extracted" value={c.extractedDate} />
            </span>
            {cell.note && (
              <span className="block font-sans text-[11px] leading-[1.5] text-muted mt-2 [text-wrap:pretty]">{cell.note}</span>
            )}
            {c.url && (
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="block mt-2 font-mono text-[10px] text-good">
                View source →
              </a>
            )}
          </Popover>
        ) : (
          <Popover label="no source">
            <span className="block font-sans text-[11px] leading-[1.5] text-muted">
              {cell.note ?? "No citation recorded — renders unverified per the no-interpolation rule."}
            </span>
          </Popover>
        )}
      </div>
    </div>
  );
}
