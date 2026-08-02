/**
 * Renders werewolf/og.png — the static share card for /werewolf.
 *
 * The card has no per-room content, so it ships as a committed PNG (like
 * /sides and /talk) rather than a Serverless Function: the project sits at
 * Vercel's per-deployment function cap. Re-run after changing the copy:
 *
 *   npm i --no-save @vercel/og && node scripts/werewolf-og.mjs
 */
import { ImageResponse } from "@vercel/og";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Navy design-system tokens (kept in sync with tokens/colors.css).
const C = { paper: "#262a4f", ink: "#ecebf3", muted: "#9897b7", hair: "#393d63", accent: "#f0a8b8" };

// plain-object element helper (JSX-equivalent for Satori)
function h(type, props, ...children) {
  return {
    type,
    props: {
      ...(props || {}),
      children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children,
    },
  };
}

// One filled dot among the outlines — the wolf hiding in the group.
function dot(isWolf) {
  return h("div", {
    style: {
      width: 34, height: 34, borderRadius: 9999,
      background: isWolf ? C.accent : "transparent",
      border: isWolf ? "none" : `2px solid ${C.hair}`,
    },
  });
}

function card() {
  const group = [false, false, true, false, false, false, false];
  return h("div", { style: { display: "flex", flexDirection: "column", width: "100%", height: "100%", background: C.paper, color: C.ink, padding: "72px 80px", justifyContent: "space-between" } },
    h("div", { style: { display: "flex", fontSize: 30, fontFamily: "Instrument Serif", color: C.muted } }, "pris.la"),
    h("div", { style: { display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", alignItems: "baseline" } },
        h("div", { style: { display: "flex", fontFamily: "Instrument Serif", fontSize: 132, letterSpacing: "-0.02em", lineHeight: 1 } }, "Werewolf"),
        h("div", { style: { display: "flex", fontFamily: "Inter", fontSize: 26, letterSpacing: "0.16em", textTransform: "uppercase", color: C.accent, marginLeft: 24 } }, "Secret roles")),
      h("div", { style: { display: "flex", fontFamily: "Inter", fontSize: 38, color: C.muted, marginTop: 28, maxWidth: 940, lineHeight: 1.3 } },
        "Secret roles for a werewolf game played in person. One phone each — you run the night out loud."),
      h("div", { style: { display: "flex", gap: 16, marginTop: 40 } }, ...group.map(dot))),
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" } },
      h("div", { style: { display: "flex", fontFamily: "Inter", fontSize: 30, color: C.muted } }, "A moderator plus 4 or more players."),
      h("div", { style: { display: "flex", fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 36, color: C.ink } }, "pris.la/werewolf")));
}

const fontDir = path.join(ROOT, "api/typeme/fonts");
const fonts = [
  { name: "Inter", data: await readFile(path.join(fontDir, "Inter-Regular.woff")), style: "normal", weight: 400 },
  { name: "Instrument Serif", data: await readFile(path.join(fontDir, "InstrumentSerif-Regular.ttf")), style: "normal", weight: 400 },
  { name: "Instrument Serif", data: await readFile(path.join(fontDir, "InstrumentSerif-Italic.ttf")), style: "italic", weight: 400 },
];

const res = new ImageResponse(card(), { width: 1200, height: 630, fonts });
const out = path.join(ROOT, "werewolf/og.png");
await writeFile(out, Buffer.from(await res.arrayBuffer()));
console.log("wrote", path.relative(ROOT, out));
