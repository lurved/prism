/* Werewolf — role dealer for an in-person werewolf game. Vanilla JS SPA (no build
   step, matches the rest of pris.la).

   The app's whole job is to hand each player a private role and hand the host —
   who is the moderator — the full roster. The game itself is played face to
   face, so there are no phases, votes or chat here. */
(function () {
  "use strict";

  // ── tiny DOM helper (same shape as typeme/app.js) ──
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

  const store = {
    get() {
      try { return JSON.parse(localStorage.getItem("who:session")); } catch (e) { return null; }
    },
    set(s) { localStorage.setItem("who:session", JSON.stringify(s)); },
    clear() { localStorage.removeItem("who:session"); },
  };

  const ROLE_INFO = {
    moderator: {
      glyph: "◆", label: "Moderator",
      blurb: "You run the game. Call the night, wake each role in turn, and keep the story moving. You can see everyone's role below.",
    },
    werewolf: {
      glyph: "●", label: "Werewolf",
      blurb: "When the moderator calls the night, open your eyes and agree with your fellow wolves on someone to eliminate. Say nothing in daylight.",
    },
    seer: {
      glyph: "◉", label: "Seer",
      blurb: "Each night the moderator will wake you to point at one player, and show you whether they're a werewolf. Reveal what you know carefully.",
    },
    doctor: {
      glyph: "✚", label: "Doctor",
      blurb: "Each night the moderator will wake you to choose one player to protect from the werewolves. You may pick yourself.",
    },
    villager: {
      glyph: "○", label: "Villager",
      blurb: "You have no special power and you sleep through every night. Listen closely by day and vote out whoever you think is a wolf.",
    },
  };
  const ROLE_ORDER = ["werewolf", "seer", "doctor", "villager"];

  // The whole API is one endpoint, routed on `op` (see api/werewolf/index.js).
  async function request(url, opts) {
    const res = await fetch(url, opts);
    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || "request-failed");
      err.code = data && data.error;
      err.status = res.status;
      throw err;
    }
    return data;
  }
  function apiPost(op, payload) {
    return request("/api/werewolf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op, ...payload }),
    });
  }
  function apiState(s) {
    const q = new URLSearchParams({ op: "state", code: s.code, playerId: s.playerId, token: s.token });
    return request("/api/werewolf?" + q.toString());
  }

  // ── app state ──
  let session = store.get(); // { code, playerId, token, name }
  let gameState = null;
  let view = "landing";      // landing | name  (once in a room, phase drives it)
  let intent = null;         // "host" | "join"
  let joinCodeDraft = "";
  let nameDraft = "";
  let formError = "";
  let submitting = false;
  let revealed = false;      // players tap to reveal, so a neighbour can't peek
  let seenRound = 0;         // re-hide the card whenever a new round is dealt
  let pollTimer = null;

  function currentView() {
    if (gameState) return gameState.phase; // lobby | dealt
    return view;
  }

  async function poll() {
    if (!session) return;
    try {
      const data = await apiState(session);
      // A fresh deal must never leave the previous role on screen.
      if (data.round !== seenRound) {
        seenRound = data.round;
        revealed = false;
      }
      gameState = data;
      formError = "";
      render();
    } catch (err) {
      if (err.status === 403 || err.status === 404) {
        store.clear();
        session = null;
        gameState = null;
        stopPolling();
        view = "landing";
        formError = "That game is no longer available.";
        render();
      }
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, 2500);
  }
  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && session) poll();
  });

  // ── actions ──
  async function hostGame(name) {
    submitting = true; render();
    try {
      const data = await apiPost("create", { name });
      session = { code: data.code, playerId: data.playerId, token: data.token, name };
      store.set(session);
      submitting = false;
      startPolling();
      await poll();
    } catch (err) {
      submitting = false;
      formError = "Couldn't create the room. Try again.";
      render();
    }
  }

  async function joinGame(code, name) {
    submitting = true; render();
    try {
      const data = await apiPost("join", { code: code.toUpperCase(), name });
      session = { code: data.code, playerId: data.playerId, token: data.token, name };
      store.set(session);
      submitting = false;
      startPolling();
      await poll();
    } catch (err) {
      submitting = false;
      formError = err.code === "room-not-found" ? "No room with that code."
        : err.code === "already-dealt" ? "That game has already dealt its roles."
        : err.code === "name-taken" ? "Someone's already using that name."
        : err.code === "room-full" ? "That room is full."
        : "Couldn't join that room.";
      render();
    }
  }

  async function dealRoles() {
    submitting = true; render();
    try {
      await apiPost("deal", session);
      submitting = false;
      await poll();
    } catch (err) {
      submitting = false;
      formError = err.code === "not-enough-players"
        ? "You need more players before dealing."
        : "Couldn't deal the roles.";
      render();
    }
  }

  async function hostAction(action, targetId) {
    submitting = true; render();
    try {
      await apiPost("host", { ...session, action, targetId });
      submitting = false;
      await poll();
    } catch (err) {
      submitting = false;
      render();
    }
  }

  function leaveGame() {
    store.clear();
    session = null;
    gameState = null;
    stopPolling();
    view = "landing";
    intent = null;
    joinCodeDraft = "";
    nameDraft = "";
    formError = "";
    revealed = false;
    seenRound = 0;
    render();
  }

  // ── shared bits ──
  function brand() {
    return el("div", { class: "who-brand" },
      el("span", { class: "glyph" }, "●"),
      el("h1", null, "Werewolf"),
      el("span", { class: "tag" }, "Secret roles"),
    );
  }

  function copyText(text, btn) {
    navigator.clipboard?.writeText(text).then(() => {
      if (!btn) return;
      const original = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => { btn.textContent = original; }, 1400);
    });
  }

  // "2 werewolves · 1 seer · 1 doctor · 4 villagers"
  function compositionLine(comp) {
    const parts = [];
    for (const role of ROLE_ORDER) {
      const n = comp[role] || 0;
      if (!n) continue;
      const label = ROLE_INFO[role].label.toLowerCase();
      parts.push(`${n} ${n === 1 ? label : label + "s"}`);
    }
    return parts.join(" · ");
  }

  // ── screens ──
  function screenLanding() {
    return el("div", null,
      brand(),
      el("p", { class: "lede" },
        "Deals everyone a secret role for a werewolf game played in person. " +
        "You run the night out loud — this just handles the cards."),
      el("div", { class: "choice-row" },
        el("button", { class: "choice-card", onclick: () => { intent = "host"; view = "name"; formError = ""; render(); } },
          el("h3", null, "Host a game"),
          el("p", null, "You'll be the moderator. Share the code, then deal the roles."),
        ),
        el("button", { class: "choice-card", onclick: () => { intent = "join"; view = "name"; formError = ""; render(); } },
          el("h3", null, "Join a game"),
          el("p", null, "Have a room code? Get your secret role on your own phone."),
        ),
      ),
      formError ? el("p", { class: "error-msg", style: { marginTop: "14px", textAlign: "center" } }, formError) : null,
      el("p", { class: "hint" }, "Needs a moderator plus at least 4 players."),
    );
  }

  function screenName() {
    const isHost = intent === "host";
    return el("div", null,
      brand(),
      el("button", { class: "back-link", onclick: () => { view = "landing"; formError = ""; render(); } }, "← Back"),
      el("div", { class: "panel" },
        el("h2", { class: "panel-title" }, isHost ? "Host a game" : "Join a game"),
        el("p", { class: "panel-sub" }, isHost
          ? "You'll moderate rather than play. You get a room code to share, and you'll see everyone's role."
          : "Enter the room code your moderator shared, and pick a name."),
        !isHost ? el("div", { class: "field" },
          el("label", null, "Room code"),
          el("input", {
            type: "text", placeholder: "e.g. WOLF", maxlength: "6", value: joinCodeDraft,
            style: { textTransform: "uppercase", letterSpacing: "0.08em" },
            oninput: (e) => { joinCodeDraft = e.target.value.toUpperCase(); },
          }),
        ) : null,
        el("div", { class: "field" },
          el("label", null, "Your name"),
          el("input", {
            type: "text", placeholder: "What should we call you?", maxlength: "24", value: nameDraft,
            autofocus: true,
            oninput: (e) => { nameDraft = e.target.value; },
          }),
        ),
        formError ? el("p", { class: "error-msg" }, formError) : null,
        el("button", {
          class: "btn btn-primary", disabled: submitting,
          onclick: () => {
            const name = nameDraft.trim();
            if (!name) { formError = "Enter a name first."; render(); return; }
            if (isHost) return hostGame(name);
            const code = joinCodeDraft.trim();
            if (!code) { formError = "Enter the room code."; render(); return; }
            joinGame(code, name);
          },
        }, submitting ? "Please wait…" : isHost ? "Create room" : "Join room"),
      ),
    );
  }

  function rosterList(g, { withRoles }) {
    return el("ul", { class: "player-list" },
      g.players.map((p) => {
        const isWolf = withRoles && p.role === "werewolf";
        return el("li", { class: "player-row" + (isWolf ? " role-werewolf" : "") },
          el("span", { class: "dot" }),
          el("span", null, p.name),
          p.isHost
            ? el("span", { class: "role-tag mod" }, "Moderator")
            : withRoles && p.role
              ? el("span", { class: "role-tag" }, ROLE_INFO[p.role] ? ROLE_INFO[p.role].label : p.role)
              : (g.you.isHost && g.phase === "lobby"
                  ? el("button", { class: "role-tag kick", onclick: () => hostAction("kick", p.id) }, "Remove")
                  : null),
        );
      }),
    );
  }

  function screenLobby() {
    const g = gameState;
    const link = `${location.origin}/werewolf?join=${g.code}`;
    const short = ((g.minPlayers - g.playerCount) > 0) ? g.minPlayers - g.playerCount : 0;

    if (!g.you.isHost) {
      return el("div", null,
        brand(),
        el("div", { class: "panel" },
          el("p", { class: "panel-sub", style: { textAlign: "center", margin: "0 0 2px" } }, "Room code"),
          el("div", { class: "room-code" }, g.code),
          el("p", { class: "hint", style: { margin: "0 0 4px" } },
            `You're in, ${g.you.name}. Waiting for the moderator to deal the roles…`),
        ),
        el("div", { class: "panel" },
          el("div", { class: "progress-label" }, `In the room — ${g.playerCount} player${g.playerCount === 1 ? "" : "s"}`),
          rosterList(g, { withRoles: false }),
        ),
        el("button", { class: "back-link", onclick: leaveGame }, "Leave game"),
      );
    }

    return el("div", null,
      brand(),
      el("div", { class: "panel" },
        el("p", { class: "panel-sub", style: { textAlign: "center", margin: "0 0 2px" } }, "Room code"),
        el("div", { class: "room-code" }, g.code),
        el("div", { class: "share-link" },
          el("span", null, link),
          el("button", { onclick: (e) => copyText(link, e.target) }, "Copy"),
        ),
        el("p", { class: "panel-sub", style: { margin: "0 0 10px" } },
          `${g.playerCount} player${g.playerCount === 1 ? "" : "s"} joined · you're the moderator and won't be dealt a role`),
        rosterList(g, { withRoles: false }),
        g.playerCount >= g.minPlayers
          ? el("p", { class: "hint", style: { margin: "12px 0 14px" } },
              "This deal: " + compositionLine(g.composition))
          : null,
        formError ? el("p", { class: "error-msg" }, formError) : null,
        el("button", {
          class: "btn btn-primary", disabled: short > 0 || submitting,
          onclick: dealRoles,
        }, short > 0 ? `Need ${short} more player${short === 1 ? "" : "s"}` : "Deal roles"),
      ),
      el("button", { class: "back-link", onclick: leaveGame }, "Close room"),
    );
  }

  function screenDealt() {
    const g = gameState;
    return g.you.isHost ? screenModerator(g) : screenPlayerRole(g);
  }

  function screenPlayerRole(g) {
    const info = ROLE_INFO[g.you.role] || ROLE_INFO.villager;
    const isWolf = g.you.role === "werewolf";

    return el("div", null,
      brand(),
      el("p", { class: "hint", style: { margin: "0 0 16px" } }, `Room ${g.code} · Round ${g.round}`),
      revealed
        ? el("div", { class: "panel" },
            el("div", { class: "role-card" + (isWolf ? " is-werewolf" : "") },
              el("div", { class: "role-glyph" }, info.glyph),
              el("h2", null, info.label),
              el("p", null, info.blurb),
            ),
            el("button", { class: "btn btn-outline", style: { marginTop: "18px" }, onclick: () => { revealed = false; render(); } },
              "Hide"),
          )
        : el("button", {
            class: "panel reveal-card",
            onclick: () => { revealed = true; render(); },
          },
            el("div", { class: "role-glyph" }, "?"),
            el("h2", null, "Tap to see your role"),
            el("p", null, "Keep the screen to yourself."),
          ),
      el("p", { class: "hint" }, "The moderator runs the game from here — listen for the night to be called."),
      el("button", { class: "back-link", onclick: leaveGame }, "Leave game"),
    );
  }

  function screenModerator(g) {
    const info = ROLE_INFO.moderator;
    return el("div", null,
      brand(),
      el("p", { class: "hint", style: { margin: "0 0 16px" } }, `Room ${g.code} · Round ${g.round}`),
      el("div", { class: "panel" },
        el("div", { class: "role-card is-moderator" },
          el("div", { class: "role-glyph" }, info.glyph),
          el("h2", null, info.label),
          el("p", null, info.blurb),
        ),
      ),
      el("div", { class: "panel" },
        el("div", { class: "progress-label" }, "This game — " + compositionLine(g.composition)),
        rosterList(g, { withRoles: true }),
      ),
      el("div", { class: "btn-row", style: { marginBottom: "16px" } },
        el("button", { class: "btn btn-outline", disabled: submitting, onclick: dealRoles }, "Deal again"),
        el("button", { class: "btn btn-outline", disabled: submitting, onclick: () => hostAction("reopen") }, "Back to lobby"),
      ),
      el("p", { class: "hint" }, "“Deal again” reshuffles the same group. “Back to lobby” reopens the room so more people can join."),
      el("button", { class: "back-link", onclick: leaveGame }, "Close room"),
    );
  }

  function render() {
    const v = currentView();
    if (v === "name") mount(screenName());
    else if (v === "lobby") mount(screenLobby());
    else if (v === "dealt") mount(screenDealt());
    else mount(screenLanding());
  }

  // ── boot ──
  async function init() {
    if (session) {
      await poll();
      if (session) { startPolling(); return; }
    }
    const j = new URLSearchParams(location.search).get("join");
    if (j) {
      intent = "join";
      joinCodeDraft = j.toUpperCase();
      view = "name";
    }
    render();
  }

  init();
})();
