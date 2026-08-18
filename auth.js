// js/auth.js
//
// MOCK AUTH. Real authentication should use Supabase Auth (email/password or
// magic link) - see README "Connecting Supabase". This module only stores a
// flag + fake user profile in localStorage so protected pages can be gated
// and the topbar/sidebar can show "who's logged in" during the demo.

const SESSION_KEY = "marketingos_session_v1";

const DEMO_USER = {
  id: "u_admin",
  name: "Nikhil Verma",
  role: "Admin",
  email: "nikhil@agency.example.com",
};

export function login(email) {
  const user = { ...DEMO_USER, email: email || DEMO_USER.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Call at the top of every protected page.
export function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    const inPages = window.location.pathname.includes("/pages/");
    const here = window.location.pathname.split("/").pop();
    const loginPath = inPages ? "../login.html" : "login.html";
    const nextValue = inPages ? `pages/${here}` : here;
    window.location.href = `${loginPath}?next=${encodeURIComponent(nextValue)}`;
    return null;
  }
  return user;
}
