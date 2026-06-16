import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Receives "add a company / new category" requests and emails the site owner.
 *
 * The destination address is NEVER exposed to the client — it lives only in the
 * server-side env var REQUEST_TO_EMAIL (masked). Delivery uses Resend's HTTP API.
 *
 * Required env vars (set in the Vercel project, not committed):
 *   REQUEST_TO_EMAIL    the owner's inbox (recipient — masked; never in the repo)
 *   RESEND_API_KEY      Resend API key
 *   REQUEST_FROM_EMAIL  optional, defaults to "ESG Tracker <onboarding@resend.dev>"
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

  const to = process.env.REQUEST_TO_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REQUEST_FROM_EMAIL || "ESG Tracker <onboarding@resend.dev>";

  if (!to || !apiKey) {
    return NextResponse.json(
      { error: "The request inbox isn't configured yet. Please try again later." },
      { status: 503 },
    );
  }

  const text =
    `New ESG Tracker request\n\n` +
    `Type:        ${requestType}\n` +
    `Company/Category: ${target || "—"}\n` +
    `From:        ${name || "—"}\n` +
    `Reply-to:    ${email || "—"}\n\n` +
    `Message:\n${message}\n`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `[ESG Tracker] ${requestType}${target ? `: ${target}` : ""}`,
        text,
        ...(email ? { reply_to: email } : {}),
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Could not send your request. Please try again later." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not send your request. Please try again later." }, { status: 502 });
  }
}
