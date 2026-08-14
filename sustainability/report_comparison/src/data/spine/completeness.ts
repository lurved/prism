/**
 * COMPLETENESS — separating our backlog from their disclosure.
 *
 * Every gap on this site has been rendered in one undifferentiated register,
 * which makes the page feel like an endless list of defects. It isn't. There
 * are two completely different things mixed together:
 *
 *   OURS    figures we have not extracted, pages we have not recorded,
 *           entities we have not refreshed. A finite backlog. It shrinks as we
 *           work and it can, in principle, reach zero.
 *
 *   THEIRS  metrics the entity did not disclose, accounting bases it did not
 *           state, comparisons its own reporting will not support. This is
 *           the FINDING. It is the product. It will never reach zero, and a
 *           version of this site where it did would be lying.
 *
 * Conflating them is what makes the work feel Sisyphean: you close two of your
 * own items and the count barely moves, because it was never mostly yours.
 *
 * This module computes the split so the UI can state it plainly.
 */
import type { Entity, SpineRow } from "./types";
import { isStale } from "./usability";

export interface OurBacklog {
  /** Cells we have not yet read from the source report. */
  pending: number;
  /** Disclosed figures with no page-level location recorded. */
  unpaged: number;
  /** Total disclosed figures, for the unpaged denominator. */
  disclosed: number;
  /** Entities whose newer report we hold but have not landed. */
  staleEntities: string[];
  /** True when there is nothing left for us to do. */
  clear: boolean;
}

export interface TheirDisclosure {
  /** Metrics the entity applies but does not disclose. */
  notDisclosed: number;
  /** Metrics that genuinely do not apply — not a gap at all. */
  notApplicable: number;
  /** Entities that do not state a GHG Protocol consolidation basis. */
  boundaryUnstated: number;
  entityCount: number;
}

export interface CompletenessSplit {
  ours: OurBacklog;
  theirs: TheirDisclosure;
  /**
   * Cells in NEITHER bucket: the entity discloses the figure, but in a
   * document this comparison does not read (see scope.ts). Counted apart
   * because adding it to `ours` would invent work we have decided not to do,
   * and adding it to `theirs` would blame the entity for a boundary we drew.
   */
  outOfScope: number;
}

export function completeness(entities: Entity[], rows: SpineRow[]): CompletenessSplit {
  let pending = 0;
  let unpaged = 0;
  let disclosed = 0;
  let notDisclosed = 0;
  let notApplicable = 0;
  let outOfScope = 0;

  for (const e of entities) {
    for (const row of rows) {
      const c = e.metrics[row.key];
      if (!c) continue;
      if (c.state === "pending") pending++;
      else if (c.state === "na") notApplicable++;
      else if (c.state === "out_of_scope") outOfScope++;
      else if (c.state === "nd") notDisclosed++;
      else {
        disclosed++;
        if (c.citation && c.citation.page === null) unpaged++;
      }
    }
  }

  const staleEntities = entities.filter(isStale).map((e) => e.shortName);
  return {
    ours: {
      pending,
      unpaged,
      disclosed,
      staleEntities,
      clear: pending === 0 && unpaged === 0 && staleEntities.length === 0,
    },
    theirs: {
      notDisclosed,
      notApplicable,
      boundaryUnstated: entities.filter((e) => e.envelope.consolidation === "unknown").length,
      entityCount: entities.length,
    },
    outOfScope,
  };
}

/**
 * The backlog as a short, closeable list — each item with what would close it.
 * Deliberately concrete: "16 figures across DBS and OCBC" is finite work,
 * "lots of flags" is not.
 */
export function backlogItems(entities: Entity[], rows: SpineRow[]): { label: string; detail: string }[] {
  const { ours } = completeness(entities, rows);
  const items: { label: string; detail: string }[] = [];

  if (ours.pending > 0) {
    const byEntity = entities
      .map((e) => ({
        name: e.shortName,
        n: rows.filter((r) => e.metrics[r.key]?.state === "pending").length,
      }))
      .filter((x) => x.n > 0);
    items.push({
      label: `${ours.pending} figures not yet extracted`,
      detail: `${byEntity.map((x) => `${x.name} ${x.n}`).join(", ")} — closed by reading the remaining sections of their reports.`,
    });
  }
  if (ours.staleEntities.length > 0) {
    items.push({
      label: `${ours.staleEntities.length} ${ours.staleEntities.length === 1 ? "entity" : "entities"} awaiting a period refresh`,
      detail: `${ours.staleEntities.join(", ")} — a newer report exists but could not be read here; closed by supplying a readable copy.`,
    });
  }
  if (ours.unpaged > 0) {
    items.push({
      label: `${ours.unpaged} of ${ours.disclosed} figures without a page reference`,
      detail:
        "Caps those figures at “reported” rather than “confirmed”. Closed by recording page numbers against the source PDFs — the only item here that is purely clerical.",
    });
  }
  return items;
}
