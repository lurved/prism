(function () {
  const SEED = "Hi! I'm Priscilla's agent. Tell me what you're working on — I'd love to explore if there's a way to connect.";

  let messages = [{ role: 'assistant', content: SEED }];
  let isOpen = false;
  let isWaiting = false;

  const panel = document.getElementById('chat-panel');
  const msgList = document.getElementById('chat-messages');
  const input = document.getElementById('chat-input');

  function scrollBottom() {
    msgList.scrollTop = msgList.scrollHeight;
  }

  function renderMessages() {
    msgList.innerHTML = '';
    messages.forEach(m => {
      const div = document.createElement('div');
      div.className = 'bubble ' + (m.role === 'assistant' ? 'bubble-agent' : 'bubble-user');
      div.textContent = m.content;
      msgList.appendChild(div);
    });
    const disc = document.createElement('div');
    disc.className = 'chat-disclaimer';
    disc.textContent = '⚠️ This agent is still being trained and may make mistakes. For anything important, verify with Priscilla at prisms@outlook.com.';
    msgList.appendChild(disc);
    scrollBottom();
  }

  function setOpen(open) {
    isOpen = open;
    if (open) {
      panel.classList.add('open');
      renderMessages();
      input.focus();
    } else {
      panel.classList.remove('open');
    }
  }

  async function send() {
    const text = input.value.trim();
    if (!text || isWaiting) return;
    input.value = '';
    messages.push({ role: 'user', content: text });
    renderMessages();

    isWaiting = true;
    const typing = document.createElement('div');
    typing.className = 'bubble bubble-typing';
    typing.id = 'typing-indicator';
    typing.textContent = 'Thinking…';
    msgList.insertBefore(typing, msgList.lastElementChild);
    scrollBottom();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      const reply = data.reply || "Something went wrong — reach Priscilla directly at prisms@outlook.com.";
      messages.push({ role: 'assistant', content: reply });
    } catch {
      messages.push({ role: 'assistant', content: "Something went wrong — reach Priscilla directly at prisms@outlook.com." });
    } finally {
      isWaiting = false;
      renderMessages();
    }
  }

  // Wire toggle buttons
  document.querySelectorAll('[data-chat-toggle]').forEach(el => {
    el.addEventListener('click', () => setOpen(!isOpen));
  });
  document.getElementById('chat-close').addEventListener('click', () => setOpen(false));
  document.getElementById('chat-send').addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send(); } });

  renderMessages();
})();
