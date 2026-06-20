/* Type Me — single-page app (vanilla JS, no build step to match pris.la).
   Look, copy, questions, type portraits and the spread-bar component are ported
   verbatim from the prototype (type-me.jsx). This file adds the things the
   prototype couldn't: real subjects/ratings, the subject/rater split, the
   owner-only share tools, and the tie → "one more friend" growth loop. */
(function () {
  "use strict";
  const { C, AXES, TYPES, TARGET_RATERS } = window.TM;
  const AXIS = Object.fromEntries(AXES.map((a) => [a.key, a]));
  const ORIGIN = location.origin;
  const isLocal = ["localhost", "127.0.0.1", ""].includes(location.hostname);

  // ── tiny DOM helper ─────────────────────────────────────────────
  function el(tag, props, ...kids) {
    const node = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === "style") Object.assign(node.style, v);
        else if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
        else node.setAttribute(k, v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    }
    return node;
  }
  const root = () => document.getElementById("app");
  function mount(node) {
    const r = root();
    r.innerHTML = "";
    r.appendChild(node);
  }

  // ── local storage (owner token per slug, one rater token per browser) ──
  const store = {
    ownerToken: (slug) => localStorage.getItem("tm:owner:" + slug),
    setOwnerToken: (slug, t) => localStorage.setItem("tm:owner:" + slug, t),
    raterToken: () => {
      let t = localStorage.getItem("tm:raterToken");
      if (!t) { t = "r_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("tm:raterToken", t); }
      return t;
    },
    markRated: (slug, round) => localStorage.setItem("tm:rated:" + slug, String(round || 1)),
    hasRated: (slug, round) => localStorage.getItem("tm:rated:" + slug) === String(round || 1),
  };

  // ── scoring (mirror of server _lib.score, for the local mock) ──
  function scoreClient(ratings) {
    const raterCount = ratings.length;
    const F = { EI: "ei", SN: "sn", TF: "tf", JP: "jp" };
    const tallies = AXES.map((axis) => {
      let leftCount = 0;
      ratings.forEach((r) => { if (r[F[axis.key]] === axis.left.letter) leftCount++; });
      const rightCount = raterCount - leftCount;
      let leadLetter = null;
      if (leftCount > rightCount) leadLetter = axis.left.letter;
      else if (rightCount > leftCount) leadLetter = axis.right.letter;
      const split = raterCount ? Math.min(leftCount, rightCount) / raterCount : 0;
      return { key: axis.key, leftCount, rightCount, leadLetter, split };
    });
    const tiedAxes = tallies.filter((t) => raterCount > 0 && t.leadLetter === null).map((t) => t.key);
    const hasTie = tiedAxes.length > 0;
    let code = null, portrait = null;
    if (raterCount > 0 && !hasTie) { code = tallies.map((t) => t.leadLetter).join(""); portrait = TYPES[code] || null; }
    return { raterCount, tallies, hasTie, tiedAxes, code, portrait };
  }

  // ── API client: real serverless in prod, localStorage mock on localhost ──
  const realApi = {
    async createSubject(name) {
      const r = await fetch("/api/typeme/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Could not create link.");
      return r.json();
    },
    async getSubject(slug) {
      const ot = store.ownerToken(slug);
      const r = await fetch(`/api/typeme/subject?slug=${encodeURIComponent(slug)}${ot ? "&ownerToken=" + encodeURIComponent(ot) : ""}`);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("Could not load.");
      return r.json();
    },
    async addRating(slug, letters) {
      const body = { ...letters, raterToken: store.raterToken() };
      const r = await fetch(`/api/typeme/ratings?slug=${encodeURIComponent(slug)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Could not submit.");
      return r.json();
    },
    async resetSubject(slug) {
      const r = await fetch(`/api/typeme/reset?slug=${encodeURIComponent(slug)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerToken: store.ownerToken(slug) }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Could not reset.");
      return r.json();
    },
  };

  const mockApi = {
    _key: (slug) => "tm:mock:" + slug,
    _read(slug) { try { return JSON.parse(localStorage.getItem(this._key(slug)) || "null"); } catch { return null; } },
    _write(slug, v) { localStorage.setItem(this._key(slug), JSON.stringify(v)); },
    async createSubject(name) {
      const slug = Math.random().toString(36).slice(2, 10);
      const ownerToken = "owner_" + Math.random().toString(36).slice(2);
      this._write(slug, { name, ownerToken, round: 1, ratings: [] });
      return { slug, ownerToken };
    },
    async getSubject(slug) {
      const s = this._read(slug);
      if (!s) return null;
      const res = scoreClient(s.ratings);
      return { name: s.name, round: s.round || 1, ...res, isOwner: store.ownerToken(slug) === s.ownerToken };
    },
    async addRating(slug, letters) {
      const s = this._read(slug);
      if (!s) throw new Error("Not found");
      const rt = store.raterToken();
      if (s.ratings.some((x) => x.rt === rt)) return { ok: true, already: true, raterCount: s.ratings.length };
      s.ratings.push({ ei: letters.EI, sn: letters.SN, tf: letters.TF, jp: letters.JP, rt });
      this._write(slug, s);
      return { ok: true, already: false, raterCount: s.ratings.length };
    },
    async resetSubject(slug) {
      const s = this._read(slug);
      if (!s) throw new Error("Not found");
      if (store.ownerToken(slug) !== s.ownerToken) throw new Error("Not authorized");
      s.round = (s.round || 1) + 1;
      s.ratings = [];
      this._write(slug, s);
      return { ok: true, raterCount: 0, round: s.round };
    },
  };
  const API = isLocal ? mockApi : realApi;

  // ── toast ───────────────────────────────────────────────────────
  let toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = el("div", { class: "toast" }); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── routing ─────────────────────────────────────────────────────
  let justRated = false; // in-memory: triggers the reveal banner after rating
  function parseRoute() {
    const p = location.pathname.replace(/\/+$/, "") || "/typeme";
    const m = p.match(/^\/typeme\/u\/([^/]+)(\/rate)?$/);
    if (m) return { screen: m[2] ? "rate" : "hub", slug: m[1] };
    return { screen: "create" };
  }
  function navigate(path, opts) {
    if (opts && opts.justRated) justRated = true;
    history.pushState({}, "", path);
    render();
  }
  window.addEventListener("popstate", () => { justRated = false; render(); });

  // ── shared atoms ────────────────────────────────────────────────
  const wordmark = (size, mb) => el("div", { class: "wordmark", style: { fontSize: size + "px", marginBottom: mb + "px", color: C.ink } }, "Type ", el("em", null, "Me"));
  const eyebrow = (text) => el("span", { class: "eyebrow" }, text);

  // ── Create (landing) ────────────────────────────────────────────
  function renderCreate() {
    let name = "";
    let busy = false;
    const input = el("input", {
      class: "tm-input", placeholder: "e.g. Priscilla", value: "",
      style: { marginTop: "8px" },
      oninput: (e) => { name = e.target.value; btn.disabled = !name.trim() || busy; },
      onkeydown: (e) => { if (e.key === "Enter" && name.trim()) submit(); },
    });
    const btn = el("button", { class: "btn-primary", disabled: true, style: { marginTop: "18px", display: "inline-block" }, onclick: () => submit() }, "Create my link");

    async function submit() {
      if (busy || !name.trim()) return;
      busy = true; btn.disabled = true; btn.textContent = "Creating…";
      try {
        const { slug, ownerToken } = await API.createSubject(name.trim());
        store.setOwnerToken(slug, ownerToken);
        navigate(`/typeme/u/${slug}`);
      } catch (err) {
        busy = false; btn.disabled = false; btn.textContent = "Create my link";
        toast(err.message || "Something went wrong.");
      }
    }

    const view = el("div", { class: "rise", style: { paddingTop: "24px" } },
      wordmark(23, 30),
      eyebrow("Find out how you come across"),
      el("h1", { style: { fontFamily: C ? "'Instrument Serif', Georgia, serif" : "", fontWeight: "400", fontSize: "46px", lineHeight: "1.04", letterSpacing: "-0.01em", margin: "14px 0 0" } },
        "Your friends", el("br"), "type ", el("span", { style: { fontStyle: "italic" } }, "you.")),
      el("p", { style: { color: C.muted, fontSize: "16px", lineHeight: "1.5", margin: "18px 0 0", maxWidth: "360px" } },
        "Set up your link, send it to a few friends, and see how they actually read you — four traits, and where they can't agree."),
      el("label", { style: { display: "block", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, fontWeight: "500", margin: "32px 0 0" } }, "Your name"),
      input,
      el("div", null, btn),
      el("p", { style: { color: C.muted, fontSize: "13px", marginTop: "16px", lineHeight: "1.5" } },
        "This makes a shareable link. Send it with ", el("span", { style: { color: C.ink } }, "“type me 👀”"), " — the people who know you do the rest."),
    );
    mount(view);
    setTimeout(() => input.focus(), 30);
  }

  // ── Hub (public page for one subject) ───────────────────────────
  async function renderHub(slug) {
    mount(el("div", { class: "rise", style: { paddingTop: "40px", color: C.muted, fontSize: "15px" } }, "Loading…"));
    let data;
    try { data = await API.getSubject(slug); }
    catch { mount(errorView("Couldn't load this page. Try again.")); return; }
    if (!data) { mount(notFoundView()); return; }

    const { name, raterCount, isOwner } = data;
    const ratedAlready = store.hasRated(slug, data.round);
    const showReveal = justRated;
    justRated = false;

    const head = el("div", { class: "rise" },
      wordmark(18, 18),
      eyebrow(raterCount > 0 ? `How ${name} comes across · ${raterCount} ${raterCount === 1 ? "friend" : "friends"}` : "Type Me"),
    );

    const body = el("div", null);
    if (raterCount === 0) {
      body.appendChild(emptyState(name));
    } else {
      body.appendChild(resultBlock(data));
    }

    // Fresh visitor who can still rate → surface the ask up top, with the
    // current spread below as the hook (page stays fully public — the result
    // is the shareable brag, the rate prompt is the recruiting nudge).
    const topCta = (!isOwner && !ratedAlready && raterCount > 0)
      ? el("div", { class: "rise", style: { marginTop: "16px", background: C.accentSoft, borderRadius: "16px", padding: "16px 18px" } },
          el("div", { style: { fontSize: "15px", color: C.ink, fontWeight: "600" } }, `Add your read on ${name}.`),
          el("p", { style: { fontSize: "13px", color: C.muted, margin: "4px 0 12px", lineHeight: "1.5" } }, "Four taps, anonymous — then see how everyone landed."),
          el("button", { class: "btn-accent", onclick: () => navigate(`/typeme/u/${slug}/rate`) }, `Rate ${name}`))
      : null;

    // Calls to action — different for owner vs visitor.
    const cta = el("div", { style: { marginTop: "24px" } });
    if (showReveal) {
      cta.appendChild(el("div", { style: { background: C.accentSoft, borderRadius: "14px", padding: "14px 16px", marginBottom: "16px", fontSize: "14px", color: C.ink, lineHeight: "1.5" } },
        `Thanks — your read is in. Here's where ${name}'s friends are landing.`));
    }

    if (isOwner) {
      cta.appendChild(ownerTools(slug, name, data));
    } else if (ratedAlready) {
      cta.appendChild(el("p", { style: { fontSize: "13px", color: C.muted, margin: "0 0 14px" } }, `You've already weighed in on ${name}.`));
      cta.appendChild(makeYourOwn());
    } else {
      cta.appendChild(el("button", { class: "btn-accent", style: { fontSize: "15px", padding: "15px" }, onclick: () => navigate(`/typeme/u/${slug}/rate`) }, `Rate ${name}`));
      cta.appendChild(el("p", { style: { fontSize: "12px", color: C.muted, margin: "12px 0 0", textAlign: "center" } }, "Four taps. Anonymous — they only ever see the counts."));
    }

    const footnote = el("p", { style: { marginTop: "28px", paddingTop: "18px", borderTop: `1px solid ${C.hair}`, fontSize: "12px", lineHeight: "1.5", color: C.muted } },
      `This is how ${name}'s friends see ${name} — not a personality test, and not the truth about who they are. The interesting part is where they disagree.`);

    mount(el("div", { style: { paddingTop: "8px" } }, head, topCta, body, cta, footnote));
  }

  function emptyState(name) {
    return el("div", { class: "rise", style: { marginTop: "16px" } },
      el("h1", { style: { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: "400", fontSize: "40px", lineHeight: "1.06", letterSpacing: "-0.01em", margin: "14px 0 0" } },
        "Be the first to", el("br"), "rate ", el("span", { style: { fontStyle: "italic" } }, name + ".")),
      el("p", { style: { color: C.muted, fontSize: "16px", lineHeight: "1.5", margin: "16px 0 0", maxWidth: "360px" } },
        `Four quick taps on how ${name} comes across. Your answer joins the spread — the fun part is seeing where everyone disagrees.`));
  }

  // ── Result block (code → portrait → split caption → spread → gate) ──
  function resultBlock(data) {
    const { name, raterCount, tallies, portrait, hasTie } = data;
    const wrap = el("div", { style: { marginTop: "14px" } });

    // 1. Code with split letters faded teal
    const codeRow = el("div", { class: "rise", style: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "64px", letterSpacing: "0.06em", margin: "8px 0 6px", display: "flex", gap: "4px" } });
    tallies.forEach((t) => codeRow.appendChild(codeLetter(t)));
    wrap.appendChild(codeRow);

    // 2. Hero: portrait, or the tie message (don't force a type)
    if (portrait) {
      wrap.appendChild(el("div", { class: "rise" },
        el("p", { style: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "27px", margin: "0", lineHeight: "1.1" } }, portrait.name),
        el("p", { style: { fontSize: "15px", lineHeight: "1.6", color: "#5C584E", margin: "10px 0 0", maxWidth: "400px" } }, portrait.line)));
    } else if (hasTie) {
      const tk = data.tiedAxes[0];
      const ax = AXIS[tk];
      wrap.appendChild(el("div", { class: "rise" },
        el("p", { style: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "27px", margin: "0", lineHeight: "1.1" } },
          "Still split on ", el("span", { style: { fontStyle: "italic", color: C.accent } }, ax.left.label + " / " + ax.right.label)),
        el("p", { style: { fontSize: "15px", lineHeight: "1.6", color: "#5C584E", margin: "10px 0 0", maxWidth: "400px" } },
          `${name}'s friends are dead even on this one. ${ax.splitDesc} One more friend settles it.`)));
    }

    // 3. Spread bars led by the compact split caption
    const headlineAxis = [...tallies].sort((a, b) => b.split - a.split)[0];
    const spread = el("div", { style: { marginTop: "30px" } });
    spread.appendChild(el("div", { style: { marginBottom: "14px" } }, headline(headlineAxis)));
    const shownDots = reduceMotion;
    tallies.forEach((t, i) => spread.appendChild(spreadBar(t, raterCount, i * 90, t.key === headlineAxis.key)));
    wrap.appendChild(spread);

    // animate dots in
    if (!reduceMotion) requestAnimationFrame(() => requestAnimationFrame(() => wrap.querySelectorAll(".spread-dot").forEach((d) => { d.style.opacity = d.dataset.filled === "1" || d.dataset.empty === "1" ? "1" : "0"; d.style.transform = "none"; })));

    // 4. Growth gate
    wrap.appendChild(gate(raterCount));
    return wrap;
  }

  function codeLetter(t) {
    if (t.leadLetter) return el("span", null, t.leadLetter);
    const ax = AXIS[t.key];
    return el("span", { style: { color: C.accent, fontSize: "30px", display: "inline-flex", flexDirection: "column", lineHeight: "0.92", alignSelf: "center", fontStyle: "italic" } },
      el("span", null, ax.left.letter),
      el("span", { style: { opacity: "0.55" } }, ax.right.letter));
  }

  function headline(t) {
    const ax = AXIS[t.key];
    const line = t.leftCount === t.rightCount
      ? `Split clean down the middle: ${ax.left.label.toLowerCase()} vs ${ax.right.label.toLowerCase()}.`
      : `Read mostly as ${(t.leftCount > t.rightCount ? ax.left : ax.right).label.toLowerCase()} — but not everyone agrees.`;
    return el("p", { style: { fontSize: "14px", lineHeight: "1.45", color: C.accent, fontWeight: "500", margin: "0" } }, line);
  }

  function spreadBar(t, n, delay, isHeadline) {
    const ax = AXIS[t.key];
    const { leftCount, rightCount } = t;
    const dot = (filled, idx) => {
      const d = el("span", { class: "spread-dot", style: {
        background: filled ? (isHeadline ? C.accent : C.ink) : "transparent",
        border: filled ? "none" : `1px solid ${C.hair}`,
        opacity: reduceMotion ? "1" : "0",
        transform: reduceMotion ? "none" : "scale(.4)",
        transitionDelay: (delay + idx * 45) + "ms",
      } });
      d.dataset.filled = filled ? "1" : "0";
      return d;
    };
    const leftDots = el("div", { style: { display: "flex", gap: "5px" } });
    for (let i = 0; i < leftCount; i++) leftDots.appendChild(dot(true, i));
    for (let i = 0; i < n - leftCount; i++) leftDots.appendChild(dot(false, leftCount + i));
    const rightDots = el("div", { style: { display: "flex", gap: "5px" } });
    for (let i = 0; i < n - rightCount; i++) rightDots.appendChild(dot(false, i));
    for (let i = 0; i < rightCount; i++) rightDots.appendChild(dot(true, n - rightCount + i));

    return el("div", { style: { padding: "16px 0", borderTop: `1px solid ${C.hair}` } },
      el("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: C.muted, marginBottom: "11px" } },
        el("span", { style: { fontWeight: leftCount >= rightCount ? "600" : "400", color: leftCount >= rightCount ? C.ink : C.muted } }, ax.left.label),
        el("span", { style: { fontWeight: rightCount > leftCount ? "600" : "400", color: rightCount > leftCount ? C.ink : C.muted } }, ax.right.label)),
      el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, leftDots, rightDots));
  }

  function gate(n) {
    const remaining = Math.max(0, TARGET_RATERS - n);
    const pct = Math.min(100, (n / TARGET_RATERS) * 100);
    return el("div", { style: { marginTop: "26px", background: C.accentSoft, borderRadius: "16px", padding: "18px 20px" } },
      el("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: C.ink, marginBottom: "10px" } },
        el("span", { style: { fontWeight: "500" } }, `${n} ${n === 1 ? "friend has" : "friends have"} weighed in`),
        el("span", { style: { color: C.accent } }, remaining > 0 ? `${remaining} more to lock it in` : "full read unlocked")),
      el("div", { style: { height: "4px", background: "rgba(47,111,98,0.18)", borderRadius: "3px", overflow: "hidden" } },
        el("div", { style: { height: "100%", width: pct + "%", background: C.accent, transition: "width .6s ease" } })));
  }

  // ── Owner-only share tools ──────────────────────────────────────
  function ownerTools(slug, name, data) {
    const link = `${ORIGIN}/typeme/u/${slug}`;
    const hasResult = data.raterCount > 0;
    const copyBtn = el("button", { class: "btn-accent", style: { fontSize: "15px", padding: "15px" }, onclick: copyLink }, "Copy your link");

    async function copyLink() {
      try { await navigator.clipboard.writeText(link); toast("Link copied — send “type me 👀”"); }
      catch { toast(link); }
    }
    function nativeShare() {
      if (navigator.share) navigator.share({ title: "Type Me", text: "type me 👀", url: link }).catch(() => {});
      else copyLink();
    }

    return el("div", { class: "rise" },
      el("div", { style: { fontSize: "15px", color: C.ink, fontWeight: "600", marginBottom: "4px" } }, "This is your page."),
      el("p", { style: { fontSize: "14px", color: C.muted, lineHeight: "1.5", margin: "0 0 14px", maxWidth: "380px" } },
        hasResult ? "Send the link to more friends to sharpen the read — three is the magic number." : "You can't type yourself — send this to a few friends and watch the spread fill in."),
      copyBtn,
      navigator.share ? el("button", { class: "link-quiet", style: { display: "block", margin: "14px auto 0", textDecoration: "none" }, onclick: nativeShare }, "or share…") : null,
      hasResult ? resetControl(slug, data.raterCount) : null);
  }

  // Owner-only "start fresh" — wipes all reads, with an inline confirm.
  function resetControl(slug, raterCount) {
    const wrap = el("div", { style: { marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${C.hair}` } });
    const label = `${raterCount} ${raterCount === 1 ? "read" : "reads"}`;

    function idle() {
      wrap.innerHTML = "";
      wrap.appendChild(el("button", { class: "link-quiet", onclick: confirm }, "Start fresh — clear all reads"));
    }
    function confirm() {
      wrap.innerHTML = "";
      wrap.appendChild(el("p", { style: { fontSize: "13px", color: C.ink, lineHeight: "1.5", margin: "0 0 12px" } },
        `Clear all ${label}? This can't be undone — friends who already rated can rate again.`));
      const yes = el("button", { style: { background: C.ink, color: C.card, border: "none", borderRadius: "999px", padding: "10px 18px", fontSize: "13px", fontWeight: "500" }, onclick: doReset }, "Yes, reset");
      const no = el("button", { class: "link-quiet", style: { marginLeft: "14px" }, onclick: idle }, "Cancel");
      wrap.appendChild(el("div", { style: { display: "flex", alignItems: "center" } }, yes, no));
    }
    async function doReset() {
      wrap.innerHTML = "";
      wrap.appendChild(el("p", { style: { fontSize: "13px", color: C.muted, margin: "0" } }, "Clearing…"));
      try {
        await API.resetSubject(slug);
        toast("Reset — your page is fresh");
        render();
      } catch (err) {
        toast(err.message || "Couldn't reset.");
        idle();
      }
    }
    idle();
    return wrap;
  }

  function makeYourOwn() {
    return el("button", { class: "btn-accent", style: { fontSize: "15px", padding: "15px" }, onclick: () => navigate("/typeme") }, "Get typed yourself →");
  }

  // ── Rate flow (the 4-question rater journey) ────────────────────
  async function renderRate(slug) {
    mount(el("div", { class: "rise", style: { paddingTop: "40px", color: C.muted, fontSize: "15px" } }, "Loading…"));
    let data;
    try { data = await API.getSubject(slug); } catch { mount(errorView("Couldn't load. Try again.")); return; }
    if (!data) { mount(notFoundView()); return; }
    const name = data.name;

    // already rated this round → straight to the reveal
    if (store.hasRated(slug, data.round)) { navigate(`/typeme/u/${slug}`); return; }

    let step = 0;
    const answers = {};
    let locked = false;

    function pick(axis, letter) {
      if (locked) return;
      answers[axis.key] = letter;
      locked = true;
      setTimeout(async () => {
        if (step < AXES.length - 1) { step++; locked = false; draw(); }
        else { await submit(); }
      }, reduceMotion ? 0 : 180);
    }

    async function submit() {
      mount(el("div", { class: "rise", style: { paddingTop: "40px", color: C.muted, fontSize: "15px" } }, "Submitting your read…"));
      try {
        await API.addRating(slug, answers);
        store.markRated(slug, data.round);
        navigate(`/typeme/u/${slug}`, { justRated: true });
      } catch (err) {
        toast(err.message || "Couldn't submit.");
        locked = false; draw();
      }
    }

    function draw() {
      const axis = AXES[step];
      const progress = el("div", { style: { display: "flex", gap: "6px", alignItems: "center" } });
      for (let i = 0; i < AXES.length; i++) progress.appendChild(el("div", { style: { height: "3px", flex: "1", borderRadius: "2px", background: i <= step ? C.ink : C.hair, transition: "background .3s ease" } }));

      const view = el("div", { class: "rise", style: { paddingTop: "8px" }, key: axis.key },
        el("div", { class: "eyebrow", style: { display: "block", marginBottom: "16px" } }, `Typing ${name}`),
        progress,
        el("p", { style: { fontSize: "22px", lineHeight: "1.3", margin: "26px 0 22px", fontWeight: "500", letterSpacing: "-0.01em" } }, axis.prompt),
        option(axis.a.text, () => pick(axis, axis.a.letter)),
        option(axis.b.text, () => pick(axis, axis.b.letter)));
      mount(view);
    }
    draw();
  }

  function option(text, onClick) {
    return el("button", { class: "opt", onclick: onClick }, text);
  }

  // ── error / not-found ───────────────────────────────────────────
  function notFoundView() {
    return el("div", { class: "rise", style: { paddingTop: "24px" } },
      wordmark(23, 24),
      el("h1", { style: { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: "400", fontSize: "36px", margin: "0 0 12px" } }, "This link's gone cold."),
      el("p", { style: { color: C.muted, fontSize: "16px", lineHeight: "1.5", maxWidth: "360px" } }, "We couldn't find that page. Want to make your own?"),
      el("div", { style: { marginTop: "18px" } }, el("button", { class: "btn-primary", onclick: () => navigate("/typeme") }, "Create my link")));
  }
  function errorView(msg) {
    return el("div", { class: "rise", style: { paddingTop: "24px" } },
      wordmark(23, 24),
      el("p", { style: { color: C.muted, fontSize: "16px" } }, msg),
      el("div", { style: { marginTop: "16px" } }, el("button", { class: "link-quiet", onclick: () => render() }, "Retry")));
  }

  // ── render dispatch ─────────────────────────────────────────────
  function render() {
    const r = parseRoute();
    if (r.screen === "create") return renderCreate();
    if (r.screen === "hub") return renderHub(r.slug);
    if (r.screen === "rate") return renderRate(r.slug);
  }

  // intercept in-app link clicks if any added later; for now just render
  render();
})();
