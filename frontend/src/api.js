const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Set by AuthProvider: the current JWT (or null) and a callback fired on 401s
// (expired/invalid token) so the whole app bounces back to the login screen,
// not just the one request that happened to fail.
let authToken = null;
let onUnauthorized = () => {};
export const setAuthToken = (token) => { authToken = token; };
export const setOnUnauthorized = (cb) => { onUnauthorized = cb; };

// Build a querystring, dropping empty/blank params so filters are optional.
function qs(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// Thin fetch wrapper: surfaces the API's `detail` message on error, handles 204.
async function req(path, options = {}) {
  const headers = { ...options.headers };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) onUnauthorized();
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body && body.detail) detail = body.detail;
    } catch {
      /* non-JSON error body — keep statusText */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

const jsonBody = (payload) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

// ---- Stats ----
export const getStats = () => req(`/api/stats`);

// ---- Auth ----
export const login = (email, password) => req(`/api/auth/login`, jsonBody({ email, password }));
export const register = (email, password) => req(`/api/auth/register`, jsonBody({ email, password }));
export const me = () => req(`/api/auth/me`);

// ---- Vessels ----
export const listVessels = (params = {}) => req(`/api/vessels${qs(params)}`);
export const createVessel = (payload) => req(`/api/vessels`, jsonBody(payload));
export const deleteVessel = (id) => req(`/api/vessels/${id}`, { method: "DELETE" });

// ---- Voyages ----
export const listVoyages = (params = {}) => req(`/api/voyages${qs(params)}`);
export const createVoyage = (payload) => req(`/api/voyages`, jsonBody(payload));
export const deleteVoyage = (id) => req(`/api/voyages/${id}`, { method: "DELETE" });

// ---- Cargo ----
export const listCargo = (params = {}) => req(`/api/cargo${qs(params)}`);
export const createCargo = (payload) => req(`/api/cargo`, jsonBody(payload));
export const deleteCargo = (id) => req(`/api/cargo/${id}`, { method: "DELETE" });
