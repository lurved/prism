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

import { companies } from "../esgData";
import { peerCompanies } from "../peerData";
import { bankCompanies } from "../bankData";
import { healthcareEntities, healthcareExcluded } from "../healthcareData";
import { fromCompany, fromPeer, fromHealthcare } from "./adapters";
import type { Entity } from "./types";

/** The four categories, on one shape. */
export const temasekEntities: Entity[] = companies.map((c) => fromCompany(c, "temasek"));
export const utilityEntities: Entity[] = peerCompanies.map((c) => fromPeer(c, "utility"));
export const bankEntities: Entity[] = bankCompanies.map((c) => fromPeer(c, "banks"));
export const healthcareSpineEntities: Entity[] = healthcareEntities.map((e) => fromHealthcare(e, "healthcare"));
export const healthcareExcludedEntities: Entity[] = healthcareExcluded.map((e) => fromHealthcare(e, "healthcare"));

/** Every entity across every category — the cross-category view the old
 *  per-category schemas made impossible. */
export const allEntities: Entity[] = [
  ...temasekEntities,
  ...utilityEntities,
  ...bankEntities,
  ...healthcareSpineEntities,
];
