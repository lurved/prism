import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Receives "add a company / new category" requests and emails the site owner.
 *
 * The destination address is NEVER exposed to the client (masked). Delivery is
 * server-side via whichever provider is configured (set env vars in Vercel):
 *
 *   Option A — Web3Forms (recommended; no account, key emailed instantly):
 *     WEB3FORMS_ACCESS_KEY   the access key (maps to the owner's email on
 *                            Web3Forms' side, so the address is never in the repo)
 *
 *   Option B — Resend:
 *     RESEND_API_KEY         Resend API key
 *     REQUEST_TO_EMAIL       recipient address (server-side only)
 *     REQUEST_FROM_EMAIL     optional, defaults to onboarding@resend.dev
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields; humans never see them. Pretend success, drop.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const requestType = String(body.requestType ?? "").slice(0, 80);
  const target = String(body.target ?? "").slice(0, 200);
  const name = String(body.name ?? "").slice(0, 120);
  const email = String(body.email ?? "").slice(0, 200);
  const message = String(body.message ?? "").slice(0, 4000);

  if (!requestType || !message.trim()) {
    return NextResponse.json({ error: "Please choose a request type and add a message." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That email address doesn't look valid." }, { status: 400 });
  }

  const web3Key = process.env.WEB3FORMS_ACCESS_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.REQUEST_TO_EMAIL;

  const subject = `[ESG Tracker] ${requestType}${target ? `: ${target}` : ""}`;

  try {
    // ── Option A: Web3Forms (recipient is mapped to the key, never sent here) ──
    if (web3Key) {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: web3Key,
          subject,
          from_name: "ESG Tracker",
          ...(email ? { replyto: email } : {}),
          "Request type": requestType,
          "Company / category": target || "—",
          "From name": name || "—",
          "Reply email": email || "—",
          Message: message,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) return NextResponse.json({ ok: true });
      return NextResponse.json({ error: "Could not send your request. Please try again later." }, { status: 502 });
    }

    // ── Option B: Resend ──
    if (resendKey && to) {
      const from = process.env.REQUEST_FROM_EMAIL || "ESG Tracker <onboarding@resend.dev>";
      const text =
        `New ESG Tracker request\n\n` +
        `Type:             ${requestType}\n` +
        `Company/Category: ${target || "—"}\n` +
        `From:             ${name || "—"}\n` +
        `Reply-to:         ${email || "—"}\n\n` +
        `Message:\n${message}\n`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, text, ...(email ? { reply_to: email } : {}) }),
      });
      if (res.ok) return NextResponse.json({ ok: true });
      return NextResponse.json({ error: "Could not send your request. Please try again later." }, { status: 502 });
    }

    // Neither provider configured.
    return NextResponse.json(
      { error: "The request inbox isn't configured yet. Please try again later." },
      { status: 503 },
    );
  } catch {
    return NextResponse.json({ error: "Could not send your request. Please try again later." }, { status: 502 });
  }
}
