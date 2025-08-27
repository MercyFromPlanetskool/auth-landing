// services/authService.js
// Stubbed service that simulates server requests.
// Replace these with real API calls for production.
export const authService = {
  signInWithGoogle: () => {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 500));
  },

  login: async (email, password) => {
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
      const payload = { email, password };
      try { console.debug('[authService] login payload:', payload); } catch {}
      const res = await fetch(`${API_BASE}/api/v1/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 200) {
        const json = await res.json().catch(() => ({}));
        return { ok: true, ...json };
      }

      if (res.status === 400 || res.status === 401) {
        const errors = await res.json().catch(() => ({ non_field_errors: ['Invalid credentials'] }));
        try { console.debug('[authService] login error:', errors); } catch {}
        return { ok: false, errors };
      }

      const text = await res.text().catch(() => 'Unknown error');
      return { ok: false, errors: { non_field_errors: [text] } };
    } catch (err) {
      return { ok: false, errors: { non_field_errors: [err.message || 'Network error'] } };
    }
  },

  forgotPassword: (email) => {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true, email }), 600));
  },

  register: async (payload) => {
    // Sends payload produced by frontend serializer to backend register endpoint
    // Expected endpoint: POST /api/v1/users/register/ -> 201 Created or 400 Bad Request
    try {
  const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
  // Debug: show outgoing payload in dev
  try { console.debug('[authService] register payload:', payload); } catch {}
  const res = await fetch(`${API_BASE}/api/v1/users/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 201) {
        const json = await res.json().catch(() => ({}));
        return { ok: true, ...json };
      }

      if (res.status === 400) {
        const errors = await res.json().catch(() => ({ non_field_errors: ['Bad Request'] }));
        // Helpful debug output during development
        try { console.debug('[authService] register 400 errors:', errors); } catch {};
        return { ok: false, errors };
      }

      // Other non-expected statuses
      const text = await res.text().catch(() => 'Unknown error');
      return { ok: false, errors: { non_field_errors: [text] } };
    } catch (err) {
      return { ok: false, errors: { non_field_errors: [err.message || 'Network error'] } };
    }
  },

  /**
   * Check username availability against backend.
   * Tries GET {API_BASE}/api/v1/users/check_username/?username=<username>
   * Accepts an optional AbortSignal as second argument.
   * Falls back to local stub when network error occurs.
   */
  checkUsernameAvailability: async (username, signal) => {
    // Forbidden usernames (case-insensitive + simple variants)
    const FORBIDDEN = ['admin', 'root', 'planetskool'];

    const normalize = (u) => String(u || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const isForbidden = (u) => {
      if (!u) return false;
      const n = normalize(u);
      return FORBIDDEN.some(f => n === normalize(f));
    };

    // Helper: generate postfix-based username suggestions (3 unique)
    const generatePostfixSuggestions = (base, count = 3) => {
      const seedBase = String(base || 'user').toLowerCase().replace(/[^a-z0-9_.]/g, '');
      const year = new Date().getFullYear();
      const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
      const randLetters = (n) => {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        let out = '';
        for (let i = 0; i < n; i++) out += letters.charAt(randInt(0, letters.length - 1));
        return out;
      };

      const methods = [
        // numeric postfix
        () => `${seedBase}${randInt(10, 999)}`,
        // underscore + letters
        () => `${seedBase}_${randLetters(2)}`,
        // dot + letters
        () => `${seedBase}.${randLetters(2)}`,
        // year postfix
        () => `${seedBase}${year}`,
        // two digit postfix
        () => `${seedBase}${String(randInt(1, 99)).padStart(2, '0')}`,
      ];

      const out = new Set();
      let attempts = 0;
      while (out.size < count && attempts < 20) {
        attempts += 1;
        const gen = methods[Math.floor(Math.random() * methods.length)];
        const candidate = gen();
        if (candidate && candidate !== seedBase && !isForbidden(candidate)) out.add(candidate);
      }
      return Array.from(out).slice(0, count);
    };
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
      const url = `${API_BASE}/api/v1/users/check_username/`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        signal
      });

      // 200: { username: 'desired_username', available: true }
      if (res.status === 200) {
        const json = await res.json().catch(() => ({}));
        const available = !!json.available;
        const suggestions = (json.suggestions || []).length ? json.suggestions : (available ? [] : generatePostfixSuggestions(username, 3));
        return { available, username: json.username || username, suggestions };
      }

      // 400: { error: 'Username is required' } or other non-200
      if (res.status === 400) {
        const json = await res.json().catch(() => ({}));
        const suggestions = (json.suggestions || []).length ? json.suggestions : generatePostfixSuggestions(username, 3);
        return { available: false, error: json.error || 'Bad Request', suggestions };
      }

      // Other non-expected statuses: attempt to parse JSON then fall back
  const json = await res.json().catch(() => ({}));
  const available = !!json.available;
  const suggestions = (json.suggestions || []).length ? json.suggestions : (available ? [] : generatePostfixSuggestions(username, 3));
  return { available, username: json.username || username, suggestions };
    } catch (err) {
      if (err && err.name === 'AbortError') return { aborted: true };

      // Network error or backend missing: fall back to local stub
      return new Promise((resolve) => {
        const unavailable = ['admin', 'user', 'test', 'planetskool'];
          setTimeout(() => {
            const isAvailable = !unavailable.includes(String(username).toLowerCase()) && !isForbidden(username);
            resolve({ available: isAvailable, suggestions: isAvailable ? [] : generatePostfixSuggestions(username, 3) });
          }, 500);
      });
    }
  },

  /**
   * Check email availability against backend.
   * POST /api/v1/users/check_email/
   * Expected 200: { email: 'user@example.com', available: true }
   * Expected 400: { error: 'Email is required' }

   * NOTE: Original implementation is intentionally commented out across the
   * project for now. The full network and fallback logic was removed to
   * temporarily disable email-checking behavior. If you need to re-enable
   * the original code, see the commented block below and restore it.
   */
  checkEmailAvailability: async (email, signal) => {
    // --- ORIGINAL IMPLEMENTATION (COMMENTED OUT) ---
    /*
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
      const url = `${API_BASE}/api/v1/users/check_email/`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal
      });

      // 200: { email: 'user@example.com', available: true }
      if (res.status === 200) {
        const json = await res.json().catch(() => ({}));
        const available = !!json.available;
        return { available, email: json.email || email };
      }

      // 400: { error: 'Email is required' } or other validation errors
      if (res.status === 400) {
        const json = await res.json().catch(() => ({}));
        return { available: false, error: json.error || 'Bad Request' };
      }

      // Other non-expected statuses
      const json = await res.json().catch(() => ({}));
      const available = !!json.available;
      return { available, email: json.email || email };
    } catch (err) {
      if (err && err.name === 'AbortError') return { aborted: true };

      // Network error or backend missing: fall back to local stub
      return new Promise((resolve) => {
        const unavailableEmails = ['admin@planetskool.com', 'test@example.com', 'user@test.com'];
        setTimeout(() => {
          const isAvailable = !unavailableEmails.includes(String(email).toLowerCase());
          resolve({ available: isAvailable });
        }, 500);
      });
    }
    */

    // --- TEMPORARY STUB (safe, fast) ---
    // Return a resolved object immediately. Adjust as needed.
    try {
      return { available: true, email };
    } catch (e) {
      return { available: false, error: 'stub_error' };
    }
  },

  /**
   * Refresh access token using refresh token.
   * POST /api/v1/users/refresh_token/
   * Expected 200: { access_token: '...' }
   */
  refreshToken: async (refresh_token) => {
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
      const payload = { refresh_token };
      try { console.debug('[authService] refreshToken payload:', payload); } catch {}
      const res = await fetch(`${API_BASE}/api/v1/users/refresh_token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 200) {
        const json = await res.json().catch(() => ({}));
        // persist new access token
        if (json.access_token) try { localStorage.setItem('access_token', json.access_token); } catch {}
        return { ok: true, ...json };
      }

      if (res.status === 400 || res.status === 401) {
        const err = await res.json().catch(() => ({ error: 'Invalid refresh token' }));
        try { console.debug('[authService] refreshToken error:', err); } catch {}
        return { ok: false, errors: err };
      }

      const text = await res.text().catch(() => 'Unknown error');
      return { ok: false, errors: { non_field_errors: [text] } };
    } catch (err) {
      return { ok: false, errors: { non_field_errors: [err.message || 'Network error'] } };
    }
  },

  // Resend verification email to user
  resendVerification: async (email) => {
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
      const payload = { email };
      try { console.debug('[authService] resendVerification payload:', payload); } catch {}
      const res = await fetch(`${API_BASE}/api/v1/users/resend_verification/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 200) {
        const json = await res.json().catch(() => ({}));
        return { ok: true, ...json };
      }

      if (res.status === 400 || res.status === 404) {
        const errors = await res.json().catch(() => ({ error: 'Bad Request' }));
        try { console.debug('[authService] resendVerification error:', errors); } catch {}
        return { ok: false, errors };
      }

      const text = await res.text().catch(() => 'Unknown error');
      return { ok: false, errors: { non_field_errors: [text] } };
    } catch (err) {
      return { ok: false, errors: { non_field_errors: [err.message || 'Network error'] } };
    }
  },

  // Verify email using token
  verifyEmail: async (token) => {
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
      const payload = { token };
      try { console.debug('[authService] verifyEmail payload:', payload); } catch {}
      const res = await fetch(`${API_BASE}/api/v1/users/verify_email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 200) {
        const json = await res.json().catch(() => ({}));
        return { ok: true, ...json };
      }

      if (res.status === 400 || res.status === 404) {
        const errors = await res.json().catch(() => ({ token: ['Invalid verification token'], error: 'Invalid verification token' }));
        try { console.debug('[authService] verifyEmail error:', errors); } catch {}
        return { ok: false, errors };
      }

      const text = await res.text().catch(() => 'Unknown error');
      return { ok: false, errors: { non_field_errors: [text] } };
    } catch (err) {
      return { ok: false, errors: { non_field_errors: [err.message || 'Network error'] } };
    }
  },

  // Logout user and invalidate refresh token on server
  logout: async (refresh_token) => {
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
      const payload = { refresh_token };
      try { console.debug('[authService] logout payload:', payload); } catch {}
      const res = await fetch(`${API_BASE}/api/v1/users/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 200) {
        const json = await res.json().catch(() => ({}));
        // clear stored tokens
        try { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); localStorage.removeItem('user_profile'); } catch {}
        return { ok: true, ...json };
      }

      if (res.status === 400 || res.status === 401) {
        const errors = await res.json().catch(() => ({ message: 'Logout failed' }));
        try { console.debug('[authService] logout error:', errors); } catch {}
        return { ok: false, errors };
      }

      const text = await res.text().catch(() => 'Unknown error');
      return { ok: false, errors: { non_field_errors: [text] } };
    } catch (err) {
      return { ok: false, errors: { non_field_errors: [err.message || 'Network error'] } };
    }
  },

  /**
   * Attempt to refresh access token using refresh token stored in localStorage.
   * Returns { ok: true, access_token } or { ok: false, errors }
   */
  attemptRefreshFromStorage: async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) return { ok: false, errors: { error: 'no_refresh_token' } };
      return await authService.refreshToken(refresh);
    } catch (err) {
      return { ok: false, errors: { non_field_errors: [err.message || 'Storage error'] } };
    }
  }
};
