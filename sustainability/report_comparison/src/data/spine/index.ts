/**
 * SPINE — public surface.
 *
 * Everything downstream (matrix, export, page template, tests) imports from
 * here, so the four legacy data shapes stay behind the adapters.
 */
export * from "./types";
export * from "./registry";
export * from "./comparability";
export { ENVELOPES, FISCAL_YEAR_END, UNKNOWN_ENVELOPE } from "./envelopes";
export { fromCompany, fromPeer, fromHealthcare } from "./adapters";
export { OUT_OF_SCOPE, applySourceScope } from "./scope";

import { companies } from "../esgData";
import { peerCompanies } from "../peerData";
import { bankCompanies } from "../bankData";
import { healthcareEntities, healthcareExcluded } from "../healthcareData";
import { fromCompany, fromPeer, fromHealthcare } from "./adapters";
import { applySourceScope } from "./scope";
import type { Entity } from "./types";

/** The four categories, on one shape.
 *
 *  Every entity passes through applySourceScope, so the rule about which
 *  documents are read is declared once (scope.ts) and applied identically
 *  across categories rather than drifting per adapter. */
export const temasekEntities: Entity[] = companies.map((c) => applySourceScope(fromCompany(c, "temasek")));
export const utilityEntities: Entity[] = peerCompanies.map((c) => applySourceScope(fromPeer(c, "utility")));
export const bankEntities: Entity[] = bankCompanies.map((c) => applySourceScope(fromPeer(c, "banks")));
export const healthcareSpineEntities: Entity[] = healthcareEntities.map((e) => applySourceScope(fromHealthcare(e, "healthcare")));
export const healthcareExcludedEntities: Entity[] = healthcareExcluded.map((e) => applySourceScope(fromHealthcare(e, "healthcare")));

/** Every entity across every category — the cross-category view the old
 *  per-category schemas made impossible. */
export const allEntities: Entity[] = [
  ...temasekEntities,
  ...utilityEntities,
  ...bankEntities,
  ...healthcareSpineEntities,
];
