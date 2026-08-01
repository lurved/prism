/**
 * GET /api/who/og → 1200×630 PNG share card for the /who landing page.
 * Static invite card (no per-room state) — runs on the edge with @vercel/og,
 * reusing the same bundled brand fonts as /api/typeme/og.
 */
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

// Navy design-system tokens (kept in sync with tokens/colors.css).
const C = { paper: "#262a4f", card: "#2e3360", ink: "#ecebf3", muted: "#9897b7", hair: "#393d63", accent: "#f0a8b8" };

// plain-object element helper (JSX-equivalent for Satori)
function h(type, props, ...children) {
  return { type, props: { ...(props || {}), children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children } };
}

function dot(isWolf) {
  return h("div", {
    style: {
      width: 34, height: 34, borderRadius: 9999,
      background: isWolf ? C.accent : "transparent",
      border: isWolf ? "none" : `2px solid ${C.hair}`,
    },
  });
}

function inviteCard() {
  const players = [false, false, true, false, false, false, false];
  return h("div", { style: { display: "flex", flexDirection: "column", width: "100%", height: "100%", background: C.paper, color: C.ink, padding: "72px 80px", justifyContent: "space-between" } },
    h("div", { style: { display: "flex", fontSize: 30, fontFamily: "Instrument Serif", color: C.muted } }, "pris.la"),
    h("div", { style: { display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", alignItems: "baseline" } },
        h("div", { style: { display: "flex", fontFamily: "Instrument Serif", fontSize: 132, letterSpacing: "-0.02em", lineHeight: 1 } }, "Who"),
        h("div", { style: { display: "flex", fontFamily: "Inter", fontSize: 26, letterSpacing: "0.16em", textTransform: "uppercase", color: C.accent, marginLeft: 24 } }, "Werewolf")),
      h("div", { style: { display: "flex", fontFamily: "Inter", fontSize: 38, color: C.muted, marginTop: 28, maxWidth: 900, lineHeight: 1.3 } },
        "Someone at the table is a werewolf. Host a room, everyone joins on their own phone."),
      h("div", { style: { display: "flex", gap: 16, marginTop: 40 } }, ...players.map(dot))),
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" } },
      h("div", { style: { display: "flex", fontFamily: "Inter", fontSize: 30, color: C.muted } }, "Best with 5–12 players. One phone each."),
      h("div", { style: { display: "flex", fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 36, color: C.ink } }, "pris.la/who")));
}

export default async function handler() {
  const interData = await fetch(new URL("./fonts/Inter-Regular.woff", import.meta.url)).then((r) => r.arrayBuffer());
  const serifData = await fetch(new URL("./fonts/InstrumentSerif-Regular.ttf", import.meta.url)).then((r) => r.arrayBuffer());
  const serifItalic = await fetch(new URL("./fonts/InstrumentSerif-Italic.ttf", import.meta.url)).then((r) => r.arrayBuffer());
  const fonts = [
    { name: "Inter", data: interData, style: "normal", weight: 400 },
    { name: "Instrument Serif", data: serifData, style: "normal", weight: 400 },
    { name: "Instrument Serif", data: serifItalic, style: "italic", weight: 400 },
  ];

  return new ImageResponse(inviteCard(), {
    width: 1200,
    height: 630,
    fonts,
    headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600" },
  });
}
