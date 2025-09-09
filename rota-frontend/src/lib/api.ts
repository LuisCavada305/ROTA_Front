export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000/";

async function api(path: string, init?: RequestInit & { json?: unknown }) {
  const { json, headers, ...rest } = init || {};
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json ? JSON.stringify(json) : init?.body,
    ...rest,
  });
  if (!res.ok) throw new Error(await res.text());
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const AuthAPI = {
  me: () => api("/me"),
  login: (email: string, password: string) =>
    api("/auth/login", { method: "POST", json: { email, password } }),
  register: (payload: any) =>
    api("/auth/register", { method: "POST", json: payload }),
  logout: () => api("/auth/logout", { method: "POST" }),
};

export type Video = { id: number; youtube_id: string; title: string; is_public: boolean };

export const VideosAPI = {
  list: (page = 1, pageSize = 12) =>
    api(`/videos?page=${page}&page_size=${pageSize}`),
  get: (id: number) => api(`/videos/${id}`),
};
