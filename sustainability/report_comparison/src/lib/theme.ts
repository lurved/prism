/**
 * JS mirror of the design tokens declared in globals.css (:root), which in
 * turn mirror the pris.la design system (repo tokens/colors.css).
 *
 * Recharts sets colours/fonts as SVG presentation attributes, which don't
 * resolve `var(--token)`, and static export has no getComputedStyle at build
 * time — so chart internals need real strings. Import from here instead of
 * hardcoding hex/font names in components, so there's one place to change.
 */
export const T = {
  bg: "#262a4f",
  card: "#2e3360",
  line: "#393d63",
  line2: "#313457",
  line3: "#444876",
  ink: "#ecebf3",
  ink2: "#dcdbe8",
  body: "#b9b8cd",
  soft: "#9897b7",
  muted2: "#807f9f",
  muted3: "#6f6e8f",
  nd: "#5b5a7a",
  accent: "#f0a8b8",
  onAccent: "#262a4f",
  ok: "#2faa5c",
  // Status accents (light pastels tuned to read on the navy surfaces)
  up: "#8FC49F",
  down: "#E8A79D",
  link: "#8FB9C9",
} as const;

export const FONT = {
  serif: "Newsreader, Georgia, serif",
  sans: "'Hanken Grotesk', system-ui, sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
} as const;
