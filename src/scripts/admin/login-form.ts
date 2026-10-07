export function createLoginForm({ next }: { next: string }) {
  return {
    identifier: '',
    password: '',
    isSubmitting: false,
    error: null as string | null,

    async submit() {
      if (!this.identifier.trim() || !this.password) {
        this.error = 'Username and password are required';
        return;
      }

      this.isSubmitting = true;
      this.error = null;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            identifier: this.identifier.trim(),
            password: this.password,
          }),
        });

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error?.message || 'Authentication failed');
        }

        // Cookie is set by the API; land the operator on their target page
        const safeNext = next.startsWith('/admin') ? next : '/admin';
        window.location.href = safeNext;
      } catch (err: any) {
        this.error = err.message;
        this.isSubmitting = false;
      }
    },
  };
}

// ── Order-safe Alpine registration ─────────────────────────────
function registerLoginForm(Alpine: any) {
  Alpine.data('createLoginForm', (opts?: { next?: string }) =>
    createLoginForm(opts ?? { next: '/admin' })
  );
}

if ((window as any).Alpine) {
  registerLoginForm((window as any).Alpine);
  queueMicrotask(() => (window as any).Alpine.initTree?.(document.body));
} else {
  document.addEventListener(
    'alpine:init',
    () => registerLoginForm((window as any).Alpine),
    { once: true }
  );
}
