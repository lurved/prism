/**
 * GET /api/typeme/og?slug={slug}  → 1200×630 PNG share card.
 *  • no slug / 0 raters  → the INVITE card (brand-level, self-explaining)
 *  • ≥1 rater            → the RESULT card (name, code, portrait, mini spread)
 * Runs on the edge with @vercel/og. Brand fonts are shipped alongside the fn.
 */
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const C = { paper: "#F2F1ED", card: "#FBFAF7", ink: "#1C1B18", muted: "#918C7E", hair: "#DAD7CD", accent: "#2F6F62" };

const AXMAP = {
  EI: { left: "E", right: "I", ll: "Extrovert", rl: "Introvert" },
  SN: { left: "S", right: "N", ll: "Grounded", rl: "Abstract" },
  TF: { left: "T", right: "F", ll: "Logic", rl: "Heart" },
  JP: { left: "J", right: "P", ll: "Planned", rl: "Loose" },
};
const NAMES = { INTJ: "The Architect", INTP: "The Logician", ENTJ: "The Commander", ENTP: "The Debater", INFJ: "The Advocate", INFP: "The Mediator", ENFJ: "The Protagonist", ENFP: "The Campaigner", ISTJ: "The Logistician", ISFJ: "The Defender", ESTJ: "The Executive", ESFJ: "The Consul", ISTP: "The Virtuoso", ISFP: "The Adventurer", ESTP: "The Entrepreneur", ESFP: "The Entertainer" };

// plain-object element helper (JSX-equivalent for Satori)
function h(type, props, ...children) {
  return { type, props: { ...(props || {}), children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children } };
}

function dot(filled, accent) {
  return h("div", { style: { width: 18, height: 18, borderRadius: 9999, background: filled ? (accent ? C.accent : C.ink) : "transparent", border: filled ? "none" : `2px solid ${C.hair}` } });
}

function inviteCard() {
  return h("div", { style: { display: "flex", flexDirection: "column", width: "100%", height: "100%", background: C.paper, color: C.ink, padding: "72px 80px", justifyContent: "space-between" } },
    h("div", { style: { display: "flex", fontSize: 30, fontFamily: "Instrument Serif", color: C.muted } }, "pris.la"),
    h("div", { style: { display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", fontFamily: "Instrument Serif", fontSize: 132, letterSpacing: "-0.02em", lineHeight: 1 } },
        "Type ", h("span", { style: { fontStyle: "italic", color: C.accent, marginLeft: 18 } }, "Me")),
      h("div", { style: { display: "flex", fontFamily: "Inter", fontSize: 38, color: "#5C584E", marginTop: 28, maxWidth: 900, lineHeight: 1.3 } },
        "Get typed by the people who know you. Four taps, one verdict.")),
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" } },
      h("div", { style: { display: "flex", fontFamily: "Inter", fontSize: 30, color: C.muted } }, "The interesting part is where they disagree."),
      h("div", { style: { display: "flex", fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 36, color: C.ink } }, "type me")));
}

// `data` is the /api/typeme/subject JSON: { name, raterCount, code,
//   tallies: [{ key, leftCount, rightCount, leadLetter }] }
function resultCard(name, data) {
  const codeEls = data.tallies.map((t) => {
    const ax = AXMAP[t.key];
    if (t.leadLetter) return h("div", { style: { display: "flex", fontFamily: "Instrument Serif", fontSize: 150, lineHeight: 1 } }, t.leadLetter);
    return h("div", { style: { display: "flex", flexDirection: "column", color: C.accent, fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 70, lineHeight: 0.92, justifyContent: "center" } },
      h("div", { style: { display: "flex" } }, ax.left),
      h("div", { style: { display: "flex", opacity: 0.55 } }, ax.right));
  });

  const heroLine = data.code ? (NAMES[data.code] || "") : "Still deciding — one more friend settles it";

  const rows = data.tallies.map((t) => {
    const ax = AXMAP[t.key];
    const left = t.leftCount, right = t.rightCount;
    const filledL = []; for (let i = 0; i < left; i++) filledL.push(dot(true, false)); for (let i = 0; i < right; i++) filledL.push(dot(false, false));
    return h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 } },
      h("div", { style: { display: "flex", fontFamily: "Inter", fontSize: 22, color: left >= right ? C.ink : C.muted, width: 200 } }, ax.ll),
      h("div", { style: { display: "flex", gap: 8 } }, ...filledL),
      h("div", { style: { display: "flex", fontFamily: "Inter", fontSize: 22, color: right > left ? C.ink : C.muted, width: 160, justifyContent: "flex-end" } }, ax.rl));
  });

  return h("div", { style: { display: "flex", width: "100%", height: "100%", background: C.paper, color: C.ink, padding: "64px 76px" } },
    // left column: name, code, portrait
    h("div", { style: { display: "flex", flexDirection: "column", width: 620, justifyContent: "space-between" } },
      h("div", { style: { display: "flex", flexDirection: "column" } },
        h("div", { style: { display: "flex", fontFamily: "Inter", fontSize: 26, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted } }, `How ${name} comes across`),
        h("div", { style: { display: "flex", alignItems: "center", gap: 10, marginTop: 18, height: 160 } }, ...codeEls),
        h("div", { style: { display: "flex", fontFamily: "Instrument Serif", fontSize: 64, marginTop: 8, lineHeight: 1.05, maxWidth: 560 } }, heroLine)),
      h("div", { style: { display: "flex", fontFamily: "Instrument Serif", fontSize: 30, color: C.muted } },
        "Type ", h("span", { style: { fontStyle: "italic", color: C.accent, marginLeft: 10 } }, "Me"), h("span", { style: { color: C.hair, marginLeft: 18, marginRight: 18 } }, "·"), "pris.la")),
    // right column: mini spread
    h("div", { style: { display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", paddingLeft: 56, borderLeft: `2px solid ${C.hair}` } }, ...rows));
}

export default async function handler(req) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") || "";

  const interData = await fetch(new URL("./fonts/Inter-Regular.woff", import.meta.url)).then((r) => r.arrayBuffer());
  const serifData = await fetch(new URL("./fonts/InstrumentSerif-Regular.ttf", import.meta.url)).then((r) => r.arrayBuffer());
  const serifItalic = await fetch(new URL("./fonts/InstrumentSerif-Italic.ttf", import.meta.url)).then((r) => r.arrayBuffer());
  const fonts = [
    { name: "Inter", data: interData, style: "normal", weight: 400 },
    { name: "Instrument Serif", data: serifData, style: "normal", weight: 400 },
    { name: "Instrument Serif", data: serifItalic, style: "italic", weight: 400 },
  ];

  // Edge can't open a TCP Redis connection, so read the subject through the
  // Node JSON API on this same deployment. Falls back to the invite card.
  let element = inviteCard();
  try {
    if (slug) {
      const res = await fetch(`${url.origin}/api/typeme/subject?slug=${encodeURIComponent(slug)}`, { headers: { "x-og": "1" } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.raterCount > 0) element = resultCard(data.name, data);
      }
    }
  } catch (err) {
    console.error("og:", err);
    element = inviteCard();
  }

  return new ImageResponse(element, {
    width: 1200,
    height: 630,
    fonts,
    headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" },
  });
}
