/**
 * CONTROLLED FRAMEWORK VOCABULARY.
 *
 * The datasets record frameworks as free text, so the same standard appears
 * under several spellings — "GRI" / "GRI 2021" / "GRI G4 Electric Utilities",
 * "TCFD" / "TCFD-aligned", "IFRS S2" / "HKFRS S2", "SASB" / "SASB (IF-EU)".
 * Rendered as chips side by side they look like different standards, and they
 * can never be counted or filtered.
 *
 * Every raw string resolves to exactly one canonical framework, keeping the
 * original for display detail. A raw string with no mapping fails the test
 * suite rather than silently becoming its own category — that is what stops
 * the vocabulary drifting again the next time a category is added.
 */

export type CanonicalFramework =
  | "GRI"
  | "IFRS S1"
  | "IFRS S2"
  | "TCFD"
  | "SASB"
  | "UN SDGs"
  | "SGX Core ESG"
  | "HKEX ESG Code"
  | "PCAF"
  | "SBTi"
  | "GHG Protocol"
  | "EU Taxonomy";

export interface ResolvedFramework {
  canonical: CanonicalFramework;
  /** Exactly as the dataset records it. */
  raw: string;
  /** Why the raw string is not identical to the canonical name. */
  qualifier?: string;
}

/**
 * raw → canonical. Jurisdictional adoptions (HKFRS) map to the ISSB standard
 * they implement, with the jurisdiction preserved as a qualifier rather than
 * asserting the two texts are identical.
 */
const ALIASES: Record<string, { canonical: CanonicalFramework; qualifier?: string }> = {
  "GRI": { canonical: "GRI" },
  "GRI 2021": { canonical: "GRI", qualifier: "GRI Standards 2021" },
  "GRI G4 Electric Utilities": { canonical: "GRI", qualifier: "G4 Electric Utilities sector supplement" },
  "IFRS S1": { canonical: "IFRS S1" },
  "IFRS S2": { canonical: "IFRS S2" },
  "HKFRS S1": { canonical: "IFRS S1", qualifier: "Hong Kong adoption (HKFRS S1)" },
  "HKFRS S2": { canonical: "IFRS S2", qualifier: "Hong Kong adoption (HKFRS S2)" },
  "TCFD": { canonical: "TCFD" },
  "TCFD-aligned": { canonical: "TCFD", qualifier: "described as TCFD-aligned, not full adoption" },
  "SASB": { canonical: "SASB" },
  "SASB (IF-EU)": { canonical: "SASB", qualifier: "Electric Utilities & Power Generators (IF-EU)" },
  "UN SDGs": { canonical: "UN SDGs" },
  "SGX Core ESG": { canonical: "SGX Core ESG" },
  "HKEX ESG Code": { canonical: "HKEX ESG Code" },
  "PCAF": { canonical: "PCAF" },
  "SBTi": { canonical: "SBTi" },
  "GHG Protocol": { canonical: "GHG Protocol" },
  "GHG Protocol (operational control)": { canonical: "GHG Protocol", qualifier: "operational-control consolidation" },
  "EU Taxonomy": { canonical: "EU Taxonomy" },
};

/** Resolve one raw string. Returns null when unmapped — the caller decides
 *  whether that is a display fallback or a test failure. */
export function resolveFramework(raw: string): ResolvedFramework | null {
  const hit = ALIASES[raw.trim()];
  return hit ? { canonical: hit.canonical, raw, qualifier: hit.qualifier } : null;
}

/** Resolve a list, de-duplicated by canonical name, preserving order. */
export function resolveFrameworks(raws: string[]): ResolvedFramework[] {
  const out: ResolvedFramework[] = [];
  for (const raw of raws) {
    const r = resolveFramework(raw);
    if (!r) continue;
    if (!out.some((x) => x.canonical === r.canonical)) out.push(r);
  }
  return out;
}

/** Raw strings that no alias covers — the drift detector. */
export function unmappedFrameworks(raws: string[]): string[] {
  return raws.filter((r) => !ALIASES[r.trim()]);
}

export const ALL_CANONICAL = Array.from(
  new Set(Object.values(ALIASES).map((a) => a.canonical)),
) as CanonicalFramework[];

/** Does this entity report under a given standard, whatever it calls it?
 *  The filter the free-text vocabulary made impossible. */
export function reportsUnder(raws: string[], canonical: CanonicalFramework): boolean {
  return resolveFrameworks(raws).some((f) => f.canonical === canonical);
}
