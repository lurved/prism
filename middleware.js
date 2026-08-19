export const config = {
  matcher: ['/sustainability/sr2026', '/sustainability/sr2026/(.*)', '/api/pet'],
};

const COOKIE_NAME = 'sr2026_auth';
// Password lives in the project environment, never in source. No default:
// the gate fails closed (503) if it is unset rather than shipping a secret.
const PASSWORD = process.env.SR2026_PASSWORD;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const encoder = new TextEncoder();

// HMAC-SHA256 over Web Crypto (available in the Vercel Edge runtime).
async function hmacHex(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time compare of two equal-length hex strings.
function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

// Session token = "<expiryMs>.<hmac(password, expiryMs)>" — self-expiring and
// unforgeable without the password. Replaces the old static "granted" cookie
// that any visitor could set by hand to bypass the gate.
async function issueToken() {
  const exp = String(Date.now() + SESSION_TTL_MS);
  return `${exp}.${await hmacHex(PASSWORD, exp)}`;
}

async function isValidToken(token) {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return timingSafeEqualHex(sig, await hmacHex(PASSWORD, exp));
}

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SP Group · Sustainability Report FY25/26</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #292F45 0%, #4F5A60 60%, #3384E1 100%);
      padding: 1rem;
    }
    .card {
      background: #fff;
      border-radius: 1.25rem;
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 24px 60px rgba(41,47,69,0.25);
      text-align: center;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px; height: 48px;
      border-radius: 12px;
      background: #00B0B2;
      color: #fff;
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: 1.25rem;
    }
    h1 { font-size: 1.125rem; font-weight: 700; color: #292F45; margin-bottom: 0.25rem; }
    p  { font-size: 0.8125rem; color: #818A91; margin-bottom: 1.75rem; }
    label { display: block; text-align: left; font-size: 0.75rem; font-weight: 600;
            color: #292F45; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.4rem; }
    input[type=password] {
      width: 100%; padding: 0.75rem 1rem;
      border: 1.5px solid #BFC9CF; border-radius: 0.625rem;
      font-size: 0.9375rem; font-family: inherit;
      color: #292F45; background: #FAFDFF;
      outline: none; transition: border-color 0.2s;
      margin-bottom: 1rem;
    }
    input[type=password]:focus { border-color: #00B0B2; }
    button {
      width: 100%; padding: 0.8rem;
      background: #00B0B2; color: #fff;
      border: none; border-radius: 0.625rem;
      font-size: 0.9375rem; font-weight: 600;
      font-family: inherit; cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #00878A; }
    .error {
      margin-top: 0.875rem;
      padding: 0.625rem 0.875rem;
      background: #FFF0F5; border: 1px solid #F291B0;
      border-radius: 0.5rem;
      font-size: 0.8125rem; color: #C2748D;
      display: none;
    }
    .error.show { display: block; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">SP</div>
    <h1>Sustainability Report FY25/26</h1>
    <p>This report is password protected.<br/>Please enter the access password to continue.</p>
    <form method="POST">
      <label for="pw">Password</label>
      <input type="password" id="pw" name="password" placeholder="Enter password" autofocus autocomplete="current-password"/>
      <button type="submit">Access Report</button>
      <div class="error SHOW_ERROR">Incorrect password. Please try again.</div>
    </form>
  </div>
</body>
</html>`;


/* ── /api/pet — the global pat counter for Pris, the desk pet ──────────
   This lives in middleware rather than api/pet.js on purpose: Vercel counts
   every api/*.js file as a Serverless Function and this project already sits
   on the plan's per-deployment cap (see api/werewolf/index.js). Middleware
   does not count against it, and a single INCR needs nothing more.

     GET  /api/pet            -> { total }
     POST /api/pet  { n }     -> { total }   n clamped to 1..20

   Storage is the Upstash REST API already configured for /api/chat. With no
   credentials set the endpoint answers { total: null } so the widget quietly
   falls back to its local count instead of erroring.

     pet:pats            str   lifetime pats
     pet:rl:{ip}:{min}   str   per-IP rate-limit counter (60s TTL)          */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const PAT_RATE_LIMIT = 60; // pats per IP per minute

const petJson = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// Upstash REST pipeline: one round trip, returns an array of results.
async function redisPipeline(commands) {
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return (await res.json()).map((r) => r.result);
}

async function handlePet(request) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return petJson({ total: null });

  try {
    if (request.method === 'GET') {
      const [raw] = await redisPipeline([['GET', 'pet:pats']]);
      return petJson({ total: Number(raw) || 0 });
    }

    if (request.method === 'POST') {
      const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
      const key = `pet:rl:${ip}:${Math.floor(Date.now() / 60000)}`;
      const [hits] = await redisPipeline([['INCR', key], ['EXPIRE', key, 60]]);
      if (hits > PAT_RATE_LIMIT) return petJson({ error: 'rate-limited' }, 429);

      let n = 1;
      try {
        const body = await request.json();
        n = Math.min(20, Math.max(1, Math.floor(Number(body?.n)) || 1));
      } catch {
        // No body, or not JSON — one pat is a fine default.
      }
      const [total] = await redisPipeline([['INCRBY', 'pet:pats', n]]);
      return petJson({ total: Number(total) || 0 });
    }

    return petJson({ error: 'method-not-allowed' }, 405);
  } catch {
    // A counter is not worth a visible failure; the widget falls back locally.
    return petJson({ total: null });
  }
}

export default async function middleware(request) {
  const { pathname } = new URL(request.url);

  if (pathname === '/api/pet') return handlePet(request);

  // Only guard /sustainability/sr2026 paths
  if (!pathname.startsWith('/sustainability/sr2026')) {
    return undefined;
  }

  // Fail closed if the gate is not configured — never fall back to a
  // source-embedded password.
  if (!PASSWORD) {
    return new Response(
      'Access is not configured. Set SR2026_PASSWORD in the project environment.',
      { status: 503, headers: { 'Content-Type': 'text/plain' } },
    );
  }

  // Check signed auth cookie
  const cookies = request.headers.get('cookie') || '';
  const token = cookies
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  if (await isValidToken(token)) return undefined; // pass through

  // Handle POST (form submission)
  if (request.method === 'POST') {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const submitted = params.get('password');

    if (submitted != null && submitted.length > 0 && submitted === PASSWORD) {
      // Set signed session cookie and redirect back to the protected page
      return new Response(null, {
        status: 302,
        headers: {
          Location: pathname,
          'Set-Cookie': `${COOKIE_NAME}=${await issueToken()}; Path=/sustainability/sr2026; HttpOnly; SameSite=Lax; Secure; Max-Age=${SESSION_TTL_MS / 1000}`,
        },
      });
    }

    // Wrong password — show form with error
    return new Response(LOGIN_HTML.replace('SHOW_ERROR', 'show'), {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // GET — show login form
  return new Response(LOGIN_HTML.replace('SHOW_ERROR', ''), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}
