"use client";

/**
 * <CitedValue> — renders a single metric value with its citation.
 *
 * Every displayed figure on the comparison page flows through this component so
 * that no number ever appears without a status (confirmed / unverified) and a
 * source (§1). A `null` value renders "N/D" — never 0.
 *
 * Interaction: hover (desktop) / tap (mobile) / keyboard focus opens a popover
 * with the report name, page, published + extracted dates, and a "View report"
 * link — or an explicit "Unverified" marker when there is no citation.
 * The popover is portalled to <body> and fixed-positioned so it is never
 * clipped by the matrix's horizontal scroll container.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MetricValue } from "@/data/types";
import { formatReportDate } from "@/lib/formatDate";

interface CitedValueProps {
  mv: MetricValue;
  /** Formatted display text for a non-null value (e.g. "7.4M tCO₂e"). */
  display?: string;
  /** Extra classes for the value text. */
  className?: string;
  /** Best-performer emphasis (bold ink). */
  emphasis?: boolean;
  /** Label to show when value is null. Default "N/D". */
  ndLabel?: string;
  /**
   * Drop the default mono/underline value styling (used for serif headline
   * figures). The citation marker + popover behaviour are unchanged.
   */
  plain?: boolean;
}

export function CitedValue({ mv, display, className = "", emphasis = false, ndLabel = "N/D", plain = false }: CitedValueProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; below: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const isND = mv.value === null;
  const hasCitation = mv.citation !== null;
  const text = isND ? ndLabel : (display ?? String(mv.value));

  const position = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = r.top < 190; // flip below when near the top of the viewport
    setCoords({
      top: below ? r.bottom + 8 : r.top - 8,
      left: Math.min(Math.max(r.left + r.width / 2, 140), window.innerWidth - 140),
      below,
    });
  };

  useLayoutEffect(() => {
    if (open) position();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !popRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const valueColor = plain
    ? (isND ? "text-nd" : "")
    : (isND ? "text-nd" : emphasis ? "text-ink font-semibold" : "text-ink2");
  // Dotted-underline affordance signals "there's a citation here".
  const underline = plain
    ? ""
    : "underline decoration-dotted decoration-from-font underline-offset-[3px] decoration-[#C9C2B2]";
  const baseType = plain ? "" : "font-mono text-[13px] tracking-[-0.01em]";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={(e) => {
          // keep open if moving toward the popover
          if (!popRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!popRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
        className={`${baseType} ${valueColor} ${underline} bg-transparent border-0 p-0 cursor-help ${className}`}
      >
        {text}
        {hasCitation && <sup className="text-[#B0A99A] ml-[1px] text-[10px] font-normal select-none">°</sup>}
      </button>

      {open && coords && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            id={id}
            role="tooltip"
            onMouseLeave={() => setOpen(false)}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: coords.below ? "translate(-50%, 0)" : "translate(-50%, -100%)",
              zIndex: 200,
            }}
            className="w-[268px] max-w-[calc(100vw-24px)] text-left bg-ink text-paper rounded-[10px] shadow-[0_8px_28px_rgba(35,32,25,0.28)] p-[14px] pointer-events-auto"
          >
            <CitationBody mv={mv} />
          </div>,
          document.body,
        )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-[3px]">
      <span className="font-mono text-[10px] tracking-[0.06em] uppercase text-muted3">{label}</span>
      <span className="font-sans text-[12px] text-paper text-right leading-[1.4]">{children}</span>
    </div>
  );
}

function CitationBody({ mv }: { mv: MetricValue }) {
  const c = mv.citation;

  if (!c) {
    return (
      <div>
        <div className="flex items-center gap-1.5 font-sans font-semibold text-[12px] text-[#E8A79D] mb-1.5">
          <span aria-hidden>❌</span> Unverified — citation pending
        </div>
        <p className="font-sans text-[11px] leading-[1.5] text-[#CFC8B8] m-0">
          This metric is not disclosed in the source report, or was not confirmed during extraction.
          It is shown as <span className="font-mono">N/D</span> and never substituted with a figure.
        </p>
        {mv.notes && <p className="font-sans text-[11px] leading-[1.5] text-[#CFC8B8] mt-2 mb-0">{mv.notes}</p>}
        <div className="mt-2 pt-2 border-t border-white/15">
          <Row label="Fiscal year">{mv.fiscalYear}</Row>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="font-sans font-semibold text-[12px] leading-[1.35] text-paper mb-2 [text-wrap:pretty]">
        {c.reportName}
      </div>
      <Row label="Fiscal year">{mv.fiscalYear}</Row>
      <Row label="Page">{c.page !== null ? c.page : "—"}</Row>
      <Row label="Published">{formatReportDate(c.publishedDate)}</Row>
      <Row label="Extracted">{formatReportDate(c.extractedDate)}</Row>
      <Row label="Status">
        <span className={mv.status === "confirmed" ? "text-[#8FC49F]" : "text-[#E8A79D]"}>
          {mv.status === "confirmed" ? "Confirmed" : "Unverified"}
        </span>
      </Row>
      {mv.notes && (
        <p className="font-sans text-[11px] leading-[1.5] text-[#CFC8B8] mt-2 mb-0 [text-wrap:pretty]">{mv.notes}</p>
      )}
      {c.reportUrl && (
        <a
          href={c.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2.5 font-mono text-[11px] text-[#8FB9C9] hover:text-paper transition-colors"
        >
          View report →
        </a>
      )}
    </div>
  );
}
