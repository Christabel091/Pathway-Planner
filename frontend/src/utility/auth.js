// src/auth.js
export const TOKEN_KEY = "token";

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Lightweight JWT expiry check (no libs)
export function isTokenValid() {
  const token = getToken();
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    // exp is in seconds since epoch
    if (payload?.exp && Date.now() / 1000 >= payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}
