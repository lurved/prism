/** Format an ISO-ish date string ("2026", "2026-06", "2026-06-15") for display. */
export function formatReportDate(iso: string | null | undefined): string {
  if (!iso) return "Not stated";
  const [y, m, d] = iso.split("-");
  const months = ["", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const mi = m ? Number(m) : 0;
  const monthName = mi >= 1 && mi <= 12 ? months[mi] : "";
  if (d && monthName) return `${monthName} ${Number(d)}, ${y}`;
  if (monthName) return `${monthName} ${y}`;
  return y ?? "Not stated";
}

/** Pick the latest ISO-ish date from a list (lexical sort works for zero-padded ISO). */
export function latestDate(dates: (string | null | undefined)[]): string | null {
  const valid = dates.filter((d): d is string => !!d).sort();
  return valid.length ? valid[valid.length - 1] : null;
}
