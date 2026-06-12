export const config = {
  matcher: ['/sustainability/sr2026', '/sustainability/sr2026/(.*)'],
};

const CORRECT_PASSWORD = 'susi2026';
const COOKIE_NAME = 'sr2026_auth';
const COOKIE_VALUE = 'granted';

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

export default async function middleware(request) {
  const { pathname } = new URL(request.url);

  // Only guard /sustainability/sr2026 paths
  if (!pathname.startsWith('/sustainability/sr2026')) {
    return undefined;
  }

  // Check auth cookie
  const cookies = request.headers.get('cookie') || '';
  const isAuthed = cookies.split(';').some(c => {
    const [k, v] = c.trim().split('=');
    return k === COOKIE_NAME && v === COOKIE_VALUE;
  });

  if (isAuthed) return undefined; // pass through

  // Handle POST (form submission)
  if (request.method === 'POST') {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const submitted = params.get('password');

    if (submitted === CORRECT_PASSWORD) {
      // Set cookie and redirect back to the protected page
      return new Response(null, {
        status: 302,
        headers: {
          Location: pathname,
          'Set-Cookie': `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/sustainability/sr2026; HttpOnly; SameSite=Lax; Max-Age=86400`,
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
