const API = import.meta.env.VITE_BACKEND_URL;

export async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token_data"); // saved by storeToken(...)
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) {
    // not logged in / token invalid → bounce to login
    localStorage.removeItem("token_data");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  return res;
}

export async function getMeReal() {
  const res = await api("/api/me");
  const data = await res.json(); // { user: {...} }
  return data.user;
}