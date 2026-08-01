/* Who — a werewolf party game. Vanilla JS SPA (no build step, matches the
   rest of pris.la). Server is the source of truth; this file polls
   /api/who/state and renders whatever phase the room is in. */
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
    werewolf: { glyph: "●", label: "Werewolf", blurb: "Each night, agree with your fellow wolves on a villager to eliminate. Stay hidden through the day's discussion." },
    seer: { glyph: "◉", label: "Seer", blurb: "Each night, peer at one player and learn whether they're a werewolf. Use what you learn carefully — revealing yourself makes you a target." },
    doctor: { glyph: "✡", label: "Doctor", blurb: "Each night, choose one player to protect from the werewolves. You can't protect the same person two nights running." },
    villager: { glyph: "○", label: "Villager", blurb: "You have no special power. Listen closely during the day and vote out whoever you think is a wolf." },
  };

  async function api(path, opts) {
    const res = await fetch("/api/who" + path, opts);
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

  // ── app state ──
  let session = store.get(); // { code, playerId, token, name }
  let gameState = null;      // last /state response
  let view = "landing";      // landing | name | (derived from phase once in a room)
  let intent = null;         // "host" | "join"
  let joinCodeDraft = "";
  let nameDraft = "";
  let formError = "";
  let submitting = false;
  let selectedTarget = null;
  let chatDraft = "";
  let pollTimer = null;

  function currentView() {
    if (gameState) return gameState.phase; // lobby | night | day | ended
    return view;
  }

  async function poll() {
    if (!session) return;
    try {
      const q = `?code=${encodeURIComponent(session.code)}&playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`;
      const data = await api("/state" + q);
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
    }, 2200);
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
      const data = await api("/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
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
      const data = await api("/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase(), name }),
      });
      session = { code: data.code, playerId: data.playerId, token: data.token, name };
      store.set(session);
      submitting = false;
      startPolling();
      await poll();
    } catch (err) {
      submitting = false;
      formError = err.code === "room-not-found" ? "No room with that code."
        : err.code === "already-started" ? "That game has already started."
        : err.code === "name-taken" ? "Someone's already using that name."
        : err.code === "room-full" ? "That room is full."
        : "Couldn't join that room.";
      render();
    }
  }

  async function startGame() {
    submitting = true; render();
    try {
      await api("/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });
      submitting = false;
      await poll();
    } catch (err) {
      submitting = false;
      formError = "Couldn't start the game.";
      render();
    }
  }

  async function submitAction(type, targetId) {
    submitting = true; render();
    try {
      await api("/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...session, type, targetId }),
      });
      submitting = false;
      selectedTarget = null;
      await poll();
    } catch (err) {
      submitting = false;
      formError = "That didn't go through — try again.";
      render();
    }
  }

  async function sendChat(text) {
    if (!text.trim()) return;
    chatDraft = "";
    render();
    try {
      await api("/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...session, type: "chat", text }),
      });
      await poll();
    } catch (err) { /* silent, will resync on next poll */ }
  }

  async function forceTally() {
    submitting = true; render();
    try {
      await api("/host", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...session, action: "force_tally" }),
      });
      submitting = false;
      await poll();
    } catch (err) {
      submitting = false;
      render();
    }
  }

  async function kickPlayer(targetId) {
    try {
      await api("/host", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...session, action: "kick", targetId }),
      });
      await poll();
    } catch (err) { /* ignore */ }
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
    render();
  }

  // ── screens ──
  function screenLanding() {
    return el("div", null,
      brand(),
      el("div", { class: "choice-row" },
        el("button", { class: "choice-card", onclick: () => { intent = "host"; view = "name"; formError = ""; render(); } },
          el("h3", null, "Host a game"),
          el("p", null, "Start a lobby, share the code, everyone joins on their own phone."),
        ),
        el("button", { class: "choice-card", onclick: () => { intent = "join"; view = "name"; formError = ""; render(); } },
          el("h3", null, "Join a game"),
          el("p", null, "Have a room code? Jump into a lobby that's already open."),
        ),
      ),
      formError ? el("p", { class: "error-msg", style: { marginTop: "14px", textAlign: "center" } }, formError) : null,
      el("p", { class: "hint" }, "Best with 5–12 players. One phone each.")
    );
  }

  function screenName() {
    const isHost = intent === "host";
    const codeField = !isHost ? el("div", { class: "field" },
      el("label", null, "Room code"),
      el("input", {
        type: "text", placeholder: "e.g. WOLF", maxlength: "6", value: joinCodeDraft,
        style: { textTransform: "uppercase", letterSpacing: "0.08em" },
        oninput: (e) => { joinCodeDraft = e.target.value.toUpperCase(); },
      }),
    ) : null;

    return el("div", null,
      brand(),
      el("button", { class: "back-link", onclick: () => { view = "landing"; formError = ""; render(); } }, "← Back"),
      el("div", { class: "panel" },
        el("h2", { class: "panel-title" }, isHost ? "Host a game" : "Join a game"),
        el("p", { class: "panel-sub" }, isHost
          ? "Pick a name — you'll get a room code to share."
          : "Enter the room code your host shared, and pick a name."),
        codeField,
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
            if (isHost) { hostGame(name); }
            else {
              const code = joinCodeDraft.trim();
              if (!code) { formError = "Enter the room code."; render(); return; }
              joinGame(code, name);
            }
          },
        }, submitting ? "Please wait…" : isHost ? "Create room" : "Join room"),
      ),
    );
  }

  function screenLobby() {
    const g = gameState;
    const link = `${location.origin}/who?join=${g.code}`;
    const isHost = g.you.isHost;
    const canStart = g.players.length >= g.minPlayers;

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
          `${g.players.length} joined · need at least ${g.minPlayers} to start${g.maxPlayers ? ` (max ${g.maxPlayers})` : ""}`),
        el("ul", { class: "player-list" },
          g.players.map((p) => el("li", { class: "player-row" },
            el("span", { class: "dot" }),
            el("span", null, p.name),
            p.isHost ? el("span", { class: "host-tag" }, "Host") :
              (isHost ? el("button", {
                class: "host-tag", style: { background: "none", border: "none", cursor: "pointer" },
                onclick: () => kickPlayer(p.id),
              }, "Remove") : null),
          )),
        ),
        isHost
          ? el("button", { class: "btn btn-primary", disabled: !canStart || submitting, onclick: startGame },
              canStart ? "Start game" : `Waiting for ${g.minPlayers - g.players.length} more player${g.minPlayers - g.players.length === 1 ? "" : "s"}`)
          : el("p", { class: "hint" }, "Waiting for the host to start…"),
      ),
      el("button", { class: "back-link", onclick: leaveGame }, "Leave game"),
    );
  }

  function targetGrid(candidates, onPick, extra) {
    return el("div", { class: "target-grid" },
      candidates.map((p) => el("button", {
        class: "target-btn" + (selectedTarget === p.id ? " selected" : ""),
        disabled: submitting,
        onclick: () => onPick(p.id),
      }, p.name)),
      extra || null,
    );
  }

  function progressBar(progress, label) {
    if (!progress) return null;
    const pct = progress.requiredCount ? Math.round((progress.submittedCount / progress.requiredCount) * 100) : 0;
    return el("div", { class: "progress-wrap" },
      el("div", { class: "progress-label" }, `${label} — ${progress.submittedCount}/${progress.requiredCount}`),
      el("div", { class: "progress-track" }, el("div", { class: "progress-fill", style: { width: pct + "%" } })),
    );
  }

  function seerHistory(g) {
    const checks = g.you.seerChecks || [];
    if (!checks.length) return null;
    return el("div", { class: "seer-log" },
      el("div", { class: "progress-label" }, "Your visions"),
      checks.slice().reverse().map((c) => el("div", { class: "seer-row" },
        el("span", null, `Night ${c.round}: ${c.targetName}`),
        el("span", { class: "verdict " + (c.isWolf ? "wolf" : "clear") }, c.isWolf ? "Werewolf" : "Not a wolf"),
      )),
    );
  }

  function eventLog(g, limit) {
    const entries = (g.log || []).slice(-(limit || 8)).reverse();
    if (!entries.length) return null;
    return el("div", { class: "panel" },
      el("div", { class: "progress-label" }, "What's happened"),
      el("ul", { class: "log-list" },
        entries.map((e) => el("li", { class: e.type }, e.round ? el("span", { class: "r" }, `N${e.round}`) : null, e.text)),
      ),
    );
  }

  function screenNight() {
    const g = gameState;
    const role = g.you.role;
    const info = ROLE_INFO[role] || ROLE_INFO.villager;
    const isWolf = role === "werewolf";

    if (!g.you.alive) {
      return el("div", null, brand(), deadBanner(g),
        progressBar(g.progress, "Night actions"),
        eventLog(g),
        el("button", { class: "back-link", onclick: leaveGame }, "Leave game"));
    }

    let body;
    if (!g.you.canAct) {
      body = el("div", { class: "panel" },
        el("div", { class: "role-card" },
          el("div", { class: "role-glyph" }, info.glyph),
          el("h2", null, info.label),
          el("p", null, info.blurb),
        ),
        el("p", { class: "hint" }, "The village sleeps. No action needed from you tonight."),
        progressBar(g.progress, "Night actions"),
      );
    } else if (g.you.submitted) {
      body = el("div", { class: "panel" },
        el("div", { class: "role-card" + (isWolf ? " is-werewolf" : "") },
          el("div", { class: "role-glyph" }, info.glyph),
          el("h2", null, info.label),
          el("p", null, "Choice locked in. Waiting on the rest of the village…"),
        ),
        progressBar(g.progress, "Night actions"),
        role === "seer" ? seerHistory(g) : null,
      );
    } else {
      let candidates = g.players.filter((p) => p.alive && p.id !== g.you.id);
      if (isWolf) candidates = candidates.filter((p) => p.role !== "werewolf");
      if (role === "doctor") candidates = candidates.filter((p) => p.id !== g.you.lastProtectedId);
      const actionType = g.you.actionType;
      body = el("div", { class: "panel" },
        el("div", { class: "role-card" + (isWolf ? " is-werewolf" : "") },
          el("div", { class: "role-glyph" }, info.glyph),
          el("h2", null, info.label),
          el("p", null, isWolf
            ? "Choose tonight's target together with your fellow wolves."
            : role === "seer" ? "Choose someone to see the truth about."
            : "Choose someone to protect tonight."),
        ),
        candidates.length
          ? targetGrid(candidates, (id) => submitAction(actionType, id))
          : el("p", { class: "hint" }, "No valid targets right now."),
        progressBar(g.progress, "Night actions"),
        role === "seer" ? seerHistory(g) : null,
      );
    }

    return el("div", null, brand(), roomHeader(g), body, eventLog(g),
      hostToolbar(g), el("button", { class: "back-link", onclick: leaveGame }, "Leave game"));
  }

  function screenDay() {
    const g = gameState;
    const chat = g.chat || [];
    let voteBody;

    if (!g.you.alive) {
      voteBody = el("p", { class: "hint" }, "You've been eliminated — watch the village decide.");
    } else if (g.you.submitted) {
      voteBody = el("div", null,
        el("p", { class: "hint" }, "Vote cast. Waiting on the rest of the village…"),
        progressBar(g.progress, "Votes in"),
      );
    } else {
      const candidates = g.players.filter((p) => p.alive && p.id !== g.you.id);
      voteBody = el("div", null,
        el("p", { class: "panel-sub" }, "Who do you think is a werewolf?"),
        targetGrid(candidates, (id) => submitAction("lynch_vote", id),
          el("button", { class: "target-btn skip", disabled: submitting, onclick: () => submitAction("lynch_vote", "skip") }, "Skip vote")),
        progressBar(g.progress, "Votes in"),
      );
    }

    return el("div", null, brand(), roomHeader(g),
      eventLog(g),
      el("div", { class: "panel" },
        el("h2", { class: "panel-title" }, "Discussion"),
        el("div", { class: "chat-box", id: "who-chat-box" },
          chat.length ? chat.map((m) => el("div", { class: "chat-msg" },
            el("span", { class: "who" + (m.playerId === g.you.id ? " me" : "") }, m.name + ":"),
            m.text,
          )) : el("p", { class: "hint", style: { margin: "10px 0" } }, "No messages yet — say hello."),
        ),
        el("form", {
          class: "chat-form",
          onsubmit: (e) => { e.preventDefault(); sendChat(chatDraft); },
        },
          el("input", {
            type: "text", placeholder: "Say something…", maxlength: "300", value: chatDraft,
            oninput: (e) => { chatDraft = e.target.value; },
          }),
          el("button", { type: "submit" }, "Send"),
        ),
        el("h2", { class: "panel-title" }, "Vote"),
        voteBody,
      ),
      hostToolbar(g),
      el("button", { class: "back-link", onclick: leaveGame }, "Leave game"),
    );
  }

  function screenEnded() {
    const g = gameState;
    const won = g.winner === "villagers";
    return el("div", null, brand(),
      el("div", { class: "panel" },
        el("div", { class: "winner-banner" },
          el("div", { class: "glyph" }, won ? "☀" : "●"),
          el("h2", null, won ? "The village wins" : "The werewolves win"),
          el("p", null, won ? "Every werewolf was found and voted out." : "The wolves outnumbered the village."),
        ),
      ),
      el("div", { class: "panel" },
        el("div", { class: "progress-label" }, "Final roles"),
        el("ul", { class: "player-list" },
          g.players.map((p) => el("li", { class: "player-row" + (!p.alive ? " dead" : "") + (p.role === "werewolf" ? " role-werewolf" : "") },
            el("span", { class: "dot" }),
            el("span", null, p.name),
            el("span", { class: "role-tag" }, (ROLE_INFO[p.role] || {}).label || p.role),
          )),
        ),
      ),
      eventLog(g, 30),
      el("button", { class: "btn btn-primary", onclick: leaveGame }, "Play again"),
    );
  }

  function deadBanner(g) {
    return el("div", { class: "panel" },
      el("div", { class: "role-card" },
        el("div", { class: "role-glyph" }, "†"),
        el("h2", null, "You're out"),
        el("p", null, "Keep watching — the game continues without you."),
      ),
    );
  }

  function roomHeader(g) {
    return el("p", { class: "hint", style: { margin: "0 0 16px" } },
      `Room ${g.code} · ${g.phase === "night" ? "Night " : "Day "}${g.round}`);
  }

  function hostToolbar(g) {
    if (!g.you.isHost || !g.progress) return null;
    if (g.progress.submittedCount >= g.progress.requiredCount) return null;
    return el("button", { class: "btn btn-outline", style: { marginBottom: "16px" }, disabled: submitting, onclick: forceTally },
      "Force tally now (skip stragglers)");
  }

  function brand() {
    return el("div", { class: "who-brand" },
      el("span", { class: "glyph" }, "●"),
      el("h1", null, "Who"),
      el("span", { class: "tag" }, "Werewolf"),
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

  function render() {
    const v = currentView();
    if (v === "landing") mount(screenLanding());
    else if (v === "name") mount(screenName());
    else if (v === "lobby") mount(screenLobby());
    else if (v === "night") mount(screenNight());
    else if (v === "day") mount(screenDay());
    else if (v === "ended") mount(screenEnded());
    else mount(screenLanding());

    const box = document.getElementById("who-chat-box");
    if (box) box.scrollTop = box.scrollHeight;
  }

  // ── boot ──
  async function init() {
    if (session) {
      try {
        await poll();
        startPolling();
        return;
      } catch (e) {
        store.clear();
        session = null;
      }
    }
    const params = new URLSearchParams(location.search);
    const j = params.get("join");
    if (j) {
      intent = "join";
      joinCodeDraft = j.toUpperCase();
      view = "name";
    }
    render();
  }

  init();
})();
