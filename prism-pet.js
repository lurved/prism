/**
 * PRISM — the desk pet.
 *
 * A small prism creature that lives in the bottom-left corner of the site.
 * She watches the cursor, blinks, falls asleep when the page goes quiet, and
 * brightens a little every time someone pats her.
 *
 * Design notes:
 *  - Every colour is read from the design system at runtime (--ink, --accent,
 *    --viz-*), so she inherits whatever theme the page is wearing rather than
 *    carrying her own palette.
 *  - Pats are counted twice: locally (this browser, drives her brightness) and
 *    globally via /api/pet, which is served by middleware.js — the project sits
 *    on Vercel's per-deployment function cap, so she cannot have a Serverless
 *    Function of her own. If that endpoint is missing she falls back to the
 *    local count and nothing breaks.
 *  - She is the way into Priscilla's agent. Her button carries
 *    data-chat-toggle, so chat-widget.js opens the panel on the same click
 *    that pats her. Where a .chat-widget container exists she docks inside it
 *    as its launcher; anywhere else she floats in the bottom-left corner.
 *  - The render loop sleeps with her: no repaint while the tab is hidden, and
 *    a slow tick once she is asleep and nothing is animating.
 */
(function () {
  "use strict";

  if (window.__prismPet) return;              // never mount twice
  window.__prismPet = true;

  var SIZE = 112;                            // canvas edge, CSS px
  var CX = SIZE / 2, CY = SIZE / 2 + 6;      // she sits a little low in the box
  var R = 30;                                // body radius (centre → vertex)
  var SLEEP_AFTER = 45000;                   // ms of page-wide quiet
  var PATS_TO_FULL = 50;                     // pats to reach full brightness
  var STORE = "prisla.pet.pats";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── state ──────────────────────────────────────────────────────── */
  var pats = 0;
  try { pats = parseInt(localStorage.getItem(STORE), 10) || 0; } catch (e) {}
  var globalPats = null;                     // filled in from /api/pet
  var pending = 0;                           // pats not yet sent upstream

  var look = { x: 0, y: 0 }, lookTo = { x: 0, y: 0 };
  var blinkAt = 0, blink = 0;                // 0 = open, 1 = shut
  var squash = 0, squashV = 0;               // spring, +ve = squat
  var sparks = [];
  var happyUntil = 0;
  var lastActive = Date.now();
  var asleep = false;
  var wokeAt = 0;

  /* ── shell ──────────────────────────────────────────────────────── */
  var style = document.createElement("style");
  style.textContent = [
    ".prism-pet{pointer-events:none;display:flex;align-items:flex-end;gap:10px}",
    ".prism-pet.is-floating{position:fixed;left:clamp(10px,2.4vw,22px);",
      "bottom:clamp(10px,2.4vw,22px);z-index:55}",
    ".prism-pet.is-docked{flex-direction:row-reverse}",
    ".prism-pet-btn{pointer-events:auto;width:" + SIZE + "px;height:" + SIZE + "px;padding:0;",
      "border:0;background:none;cursor:pointer;display:block;line-height:0;",
      "-webkit-tap-highlight-color:transparent;touch-action:manipulation}",
    ".prism-pet-btn canvas{width:100%;height:100%;display:block}",
    ".prism-pet-btn:focus{outline:none}",
    ".prism-pet-btn:focus-visible{outline:2px solid var(--accent,#f0a8b8);outline-offset:-8px;border-radius:12px}",
    ".prism-pet-tip{pointer-events:none;opacity:0;transform:translateY(4px);",
      "transition:opacity .18s ease,transform .18s ease;margin-bottom:26px;",
      "padding:7px 11px;border-radius:3px;white-space:nowrap;",
      "background:var(--surface-card,#2e3360);border:1px solid var(--line,#393d63);",
      "font-family:var(--font-mono,'Space Mono',ui-monospace,monospace);font-size:10px;",
      "letter-spacing:.08em;text-transform:uppercase;color:var(--soft,#9897b7);line-height:1.7}",
    ".prism-pet-tip.on{opacity:1;transform:translateY(0)}",
    ".prism-pet-tip b{display:block;font-weight:400;color:var(--ink,#ecebf3);letter-spacing:.14em}",
    ".prism-pet-cta{display:block;color:var(--accent,#f0a8b8)}",
    ".prism-pet-count{display:block;opacity:.72}",
    "@media (max-width:640px){.prism-pet{transform:scale(.82)}",
      ".prism-pet.is-floating{transform-origin:left bottom}",
      ".prism-pet.is-docked{transform-origin:right bottom}}",
    "@media print{.prism-pet{display:none}}"
  ].join("");
  document.head.appendChild(style);

  // She is the agent's front door, so she lives in the chat widget where one
  // exists and the panel can open directly above her.
  var dock = document.querySelector(".chat-widget");

  var root = document.createElement("div");
  root.className = "prism-pet " + (dock ? "is-docked" : "is-floating");
  root.innerHTML =
    '<button class="prism-pet-btn" type="button" data-chat-toggle aria-expanded="false"' +
      ' aria-label="Prism. Press to talk to Priscilla\'s agent.">' +
      '<canvas width="1" height="1"></canvas>' +
    '</button>' +
    '<div class="prism-pet-tip" role="status">' +
      '<b>Prism</b><span class="prism-pet-cta">Talk to my agent &rarr;</span>' +
      '<span class="prism-pet-count"></span>' +
    '</div>';
  (dock || document.body).appendChild(root);

  var btn = root.querySelector(".prism-pet-btn");
  var cv = root.querySelector("canvas");
  var ctx = cv.getContext("2d");
  var tip = root.querySelector(".prism-pet-tip");
  var tipCount = tip.querySelector(".prism-pet-count");

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = SIZE * dpr; cv.height = SIZE * dpr;

  /* ── palette, borrowed from whatever theme the page is wearing ──── */
  var css = getComputedStyle(document.documentElement);
  function tok(name, fallback) {
    var v = css.getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }
  var INK = tok("--ink", "#ecebf3");
  var BG = tok("--bg", "#262a4f");
  var ACCENT = tok("--accent", "#f0a8b8");
  var SPARK = [
    tok("--viz-red", "#EA7267"), tok("--viz-amber", "#E39A4D"),
    tok("--viz-green", "#4FC17E"), tok("--viz-teal", "#52A8C4"),
    tok("--viz-blue", "#6E9BE8"), tok("--viz-purple", "#A78BE0"),
    ACCENT
  ];

  function rgba(hex, a) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  var glow = 0;
  function setGlow() { glow = Math.min(1, pats / PATS_TO_FULL); }
  setGlow();

  /* ── the global counter ─────────────────────────────────────────── */
  function fmt(n) { return n.toLocaleString(); }

  function renderTip() {
    if (globalPats != null) tipCount.textContent = fmt(globalPats) + " hellos so far";
    else if (pats > 0) tipCount.textContent = fmt(pats) + (pats === 1 ? " hello from you" : " hellos from you");
    else tipCount.textContent = "";
  }
  renderTip();

  function pullCount() {
    fetch("/api/pet", { headers: { accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && typeof d.total === "number") { globalPats = d.total; renderTip(); }
      })
      .catch(function () {});
  }

  // Pats are batched: a burst of happy clicking is one request, not twelve.
  var flushTimer = null;
  function flush() {
    flushTimer = null;
    if (!pending) return;
    var n = pending; pending = 0;
    fetch("/api/pet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ n: n })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && typeof d.total === "number") { globalPats = d.total; renderTip(); }
      })
      .catch(function () {});
  }
  function queueFlush() {
    if (globalPats != null) { globalPats += 1; renderTip(); }   // optimistic
    pending += 1;
    if (!flushTimer) flushTimer = setTimeout(flush, 1500);
  }
  window.addEventListener("pagehide", function () { if (pending) flush(); });

  /* ── interaction ────────────────────────────────────────────────── */
  var panel = document.getElementById("chat-panel");
  function chatOpen() { return !!(panel && panel.classList.contains("open")); }

  function wake() {
    lastActive = Date.now();
    if (asleep) { asleep = false; wokeAt = performance.now(); squashV -= 0.5; }
  }

  function pat() {
    wake();
    pats += 1;
    try { localStorage.setItem(STORE, String(pats)); } catch (e) {}
    setGlow();
    happyUntil = performance.now() + 1100;
    if (!reduced) {
      squashV += 1.6;
      for (var i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        var s = 1.1 + Math.random() * 1.5;
        sparks.push({
          x: CX + (Math.random() - 0.5) * 16, y: CY - 6,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: 1, c: SPARK[(Math.random() * SPARK.length) | 0]
        });
      }
    }
    renderTip();
    queueFlush();
    if (typeof window.track === "function") window.track("pet_patted", { pats: pats, opensChat: !!panel });
  }

  btn.addEventListener("click", function () {
    pat();
    // chat-widget.js handles the toggle via data-chat-toggle; read the result
    // back so her button reports the panel's real state.
    setTimeout(function () { btn.setAttribute("aria-expanded", String(chatOpen())); }, 0);
  });
  btn.addEventListener("pointerenter", function () { tip.classList.add("on"); });
  btn.addEventListener("pointerleave", function () { tip.classList.remove("on"); });
  btn.addEventListener("focus", function () { tip.classList.add("on"); wake(); });
  btn.addEventListener("blur", function () { tip.classList.remove("on"); });

  window.addEventListener("pointermove", function (e) {
    wake();
    var r = cv.getBoundingClientRect();
    var dx = e.clientX - (r.left + r.width / 2);
    var dy = e.clientY - (r.top + r.height / 2);
    var d = Math.hypot(dx, dy) || 1;
    var reach = Math.min(1, d / 260);
    lookTo.x = (dx / d) * reach;
    lookTo.y = (dy / d) * reach;
  }, { passive: true });

  window.addEventListener("keydown", wake, { passive: true });
  window.addEventListener("scroll", wake, { passive: true });

  /* ── drawing ────────────────────────────────────────────────────── */
  function bodyPath(g, r) {
    // Rounded equilateral triangle, apex up.
    var pts = [], i;
    for (i = 0; i < 3; i++) {
      var a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    var round = r * 0.26;
    g.beginPath();
    for (i = 0; i < 3; i++) {
      var p = pts[i], n = pts[(i + 1) % 3], pv = pts[(i + 2) % 3];
      var toPrev = norm(pv.x - p.x, pv.y - p.y), toNext = norm(n.x - p.x, n.y - p.y);
      if (i === 0) g.moveTo(p.x + toPrev.x * round, p.y + toPrev.y * round);
      else g.lineTo(p.x + toPrev.x * round, p.y + toPrev.y * round);
      g.quadraticCurveTo(p.x, p.y, p.x + toNext.x * round, p.y + toNext.y * round);
    }
    g.closePath();
  }
  function norm(x, y) { var l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; }

  function eye(g, ex, ey, open, lx, ly, happy) {
    var rr = 5.2;
    if (happy) {                             // ^ ^ — the whole face smiles
      g.strokeStyle = INK; g.lineWidth = 1.8; g.lineCap = "round";
      g.beginPath();
      g.arc(ex, ey + 2, rr * 0.95, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
      return;
    }
    if (open < 0.12) {                       // shut — a small contented arc
      g.strokeStyle = INK; g.lineWidth = 1.6; g.lineCap = "round";
      g.beginPath();
      g.arc(ex, ey + 1, rr * 0.9, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
      return;
    }
    g.save();
    g.translate(ex, ey); g.scale(1, open); g.translate(-ex, -ey);
    g.fillStyle = INK;
    g.beginPath(); g.arc(ex, ey, rr, 0, Math.PI * 2); g.fill();
    g.fillStyle = BG;
    g.beginPath(); g.arc(ex + lx * 2.7, ey + ly * 2.7, rr * 0.42, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  function draw(now) {
    var t = now / 1000;

    // breathing / bobbing
    var bob = 0, breath = 1;
    if (!reduced) {
      bob = asleep ? Math.sin(t * 0.9) * 1.6 : Math.sin(t * 1.7) * 1.1;
      breath = asleep ? 1 + Math.sin(t * 0.9) * 0.022 : 1;
    }
    if (wokeAt && now - wokeAt < 500 && !reduced) {
      bob -= Math.sin(((now - wokeAt) / 500) * Math.PI) * 6;   // a little hop
    }

    // squash spring
    if (!reduced) {
      squashV += -squash * 26 * 0.016;
      squashV *= 0.86;
      squash += squashV * 0.016 * 26;
    } else { squash = 0; }

    // eyes
    look.x += (lookTo.x - look.x) * 0.12;
    look.y += (lookTo.y - look.y) * 0.12;
    if (asleep) { blink = 1; }
    else {
      if (now > blinkAt) { blinkAt = now + 2600 + Math.random() * 4200; blink = 1; }
      blink = Math.max(0, blink - 0.14);
    }
    var open = asleep ? 0 : 1 - blink;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    var lit = 0.45 + glow * 0.55;

    // her own little pool of light
    if (glow > 0.02) {
      var halo = ctx.createRadialGradient(CX, CY, 2, CX, CY, R * 2.1);
      halo.addColorStop(0, rgba(ACCENT, 0.16 * glow));
      halo.addColorStop(1, rgba(ACCENT, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }

    ctx.save();
    ctx.translate(CX, CY + bob);
    ctx.scale((1 + squash * 0.16), (1 - squash * 0.16) * breath);
    if (!reduced) ctx.rotate(look.x * 0.07);

    bodyPath(ctx, R);
    var g = ctx.createLinearGradient(-R, -R, R, R);
    g.addColorStop(0, rgba(INK, 0.20 * lit));
    g.addColorStop(1, rgba(ACCENT, 0.13 * lit));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = rgba(INK, 0.38 + 0.42 * glow);
    ctx.lineWidth = 1.4; ctx.stroke();

    // A specular streak just inside the left facet — the pink arc from the
    // logo, catching the light. Faded at both ends so it reads as a highlight
    // rather than a crack.
    var ax = -2.2, ay = -R * 0.54, bx = -R * 0.51, by = R * 0.21;
    var sheen = ctx.createLinearGradient(ax, ay, bx, by);
    sheen.addColorStop(0, rgba(ACCENT, 0));
    sheen.addColorStop(0.5, rgba(ACCENT, 0.5 + 0.4 * glow));
    sheen.addColorStop(1, rgba(ACCENT, 0));
    ctx.strokeStyle = sheen;
    ctx.lineWidth = 2.6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();

    // face sits in the wide lower half of the body
    var happy = now < happyUntil && !asleep;
    eye(ctx, -10, 6, open, look.x, look.y, happy);
    eye(ctx, 10, 6, open, look.x, look.y, happy);
    ctx.restore();

    // sparks
    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vy += 0.055; s.life -= 0.022;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = rgba(s.c, Math.max(0, s.life));
      ctx.beginPath(); ctx.arc(s.x, s.y, 1.7 * s.life + 0.5, 0, Math.PI * 2); ctx.fill();
    }

    // zzz
    if (asleep && !reduced) {
      for (var k = 0; k < 3; k++) {
        var ph = (t * 0.32 + k / 3) % 1;
        ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.5;
        ctx.fillStyle = INK;
        ctx.font = (7 + k * 2) + "px ui-monospace, monospace";
        ctx.fillText("z", CX + 20 + ph * 10, CY - 22 - ph * 20);
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ── loop: she sleeps, and so does the render ───────────────────── */
  var raf = null, lastFrame = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);

    if (chatOpen()) lastActive = Date.now();   // never nap mid-conversation
    if (!asleep && Date.now() - lastActive > SLEEP_AFTER) asleep = true;

    // While asleep with nothing animating there is nothing worth 60fps for.
    var busy = sparks.length || Math.abs(squash) > 0.005 || blink > 0 ||
               now < happyUntil || (wokeAt && now - wokeAt < 500);
    var interval = (asleep && !busy) ? 200 : 0;
    if (now - lastFrame < interval) return;
    lastFrame = now;

    draw(now);
  }

  function start() { if (raf == null) { lastFrame = 0; raf = requestAnimationFrame(frame); } }
  function stop() { if (raf != null) { cancelAnimationFrame(raf); raf = null; } }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else { wake(); start(); }
  });

  start();
  setTimeout(pullCount, 1200);
})();
