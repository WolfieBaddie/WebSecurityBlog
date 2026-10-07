// Client-side page guard for operator console pages.
// Server-side data protection lives in the Hono RBAC layer (requireAuth/requireRole) —
// every /api/* mutation and admin read is already enforced server-side.
// This guard only handles the UX: bounce anonymous visitors to the sign-in page.

(async () => {
  // Never guard the login page itself
  if (window.location.pathname.startsWith('/admin/login')) return;

  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (res.ok) return; // authenticated — carry on

    // 401 or unexpected: clear any stale cookie and bounce
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/admin/login?next=${next}&src=pageguard`);
  } catch {
    // network hiccup — do not bounce on transient errors
  }
})();
