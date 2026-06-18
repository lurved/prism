"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, Send, CheckCircle2, AlertCircle, Lock } from "lucide-react";

// Web3Forms access key — a PUBLIC token by design (it only permits submitting
// to the mapped inbox, never reading anything). The recipient email is NOT here;
// Web3Forms maps the key to the address on its servers, so the email stays masked.
const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

type Status = "idle" | "sending" | "sent" | "error";

export function RequestCta() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* CTA card */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">Want another company or category?</h3>
          <p className="text-xs text-brand-700/80 mt-0.5">
            Suggest a company to add or a new comparison category — requests go privately to the site owner.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Send a request
        </button>
      </div>

      {open && <RequestModal onClose={() => setOpen(false)} />}
    </>
  );
}

function RequestModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [msgLen, setMsgLen] = useState(0);
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const MAX_MSG = 4000;

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus?.(); // restore focus to the trigger on close
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    // Honeypot — if filled, a bot submitted it. Pretend success and drop.
    if (data.botcheck) { setStatus("sent"); return; }

    if (!WEB3FORMS_KEY) {
      setStatus("error");
      setErrorMsg("The request form isn't configured yet. Please try again later.");
      return;
    }

    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `[ESG Tracker] ${data.requestType}${data.target ? `: ${data.target}` : ""}`,
          from_name: "ESG Tracker Request",
          ...(data.email ? { replyto: data.email } : {}),
          "Request type": data.requestType,
          "Company / category": data.target || "—",
          "From": data.name || "—",
          "Reply email": data.email || "—",
          Message: data.message,
          botcheck: "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setStatus("sent");
      } else {
        setStatus("error");
        setErrorMsg(json.message || "Couldn't send your request. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="req-modal-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h2 id="req-modal-title" className="text-base font-semibold text-slate-900">Request a company or category</h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Sent privately to the site owner
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 p-1 -m-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {status === "sent" ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-800">Thank you — your request was sent.</p>
            <p className="text-xs text-slate-400 mt-1">We&apos;ll review suggestions for new companies and categories.</p>
            <button
              onClick={onClose}
              className="mt-5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Honeypot — off-screen (present in DOM so bots fill it, invisible to humans).
                Named "botcheck" so Web3Forms' native honeypot also rejects spam. */}
            <input
              type="text"
              name="botcheck"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            />

            <Field label="Request type" required>
              <select
                ref={firstFieldRef}
                name="requestType"
                required
                defaultValue=""
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="" disabled>Select…</option>
                <option value="Add a company">Add a company</option>
                <option value="New category">New comparison category</option>
                <option value="Correction">Data correction</option>
                <option value="Other">Other</option>
              </select>
            </Field>

            <Field label="Company or category name">
              <input
                name="target"
                type="text"
                placeholder="e.g. Keppel, or 'Water utilities'"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </Field>

            <Field label="Details" required>
              <textarea
                name="message"
                required
                rows={3}
                maxLength={MAX_MSG}
                onChange={(e) => setMsgLen(e.target.value.length)}
                placeholder="What would you like added, and why? Add a report link if you have one."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              />
              <span className="block text-right text-[10px] text-slate-300 mt-0.5">{msgLen}/{MAX_MSG}</span>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Your name">
                <input
                  name="name"
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </Field>
              <Field label="Your email">
                <input
                  name="email"
                  type="email"
                  placeholder="for a reply (optional)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </Field>
            </div>

            {status === "error" && (
              <p className="flex items-start gap-1.5 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {status === "sending" ? "Sending…" : <><Send className="w-4 h-4" /> Send request</>}
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Your email is used only to reply. The recipient address is never shown on this site.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
