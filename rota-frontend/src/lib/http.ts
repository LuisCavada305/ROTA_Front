// src/lib/http.ts
import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  // permite marcar chamadas que NÃO devem abrir o modal
  export interface InternalAxiosRequestConfig {
    suppressAuthModal?: boolean;
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const status = err.response?.status ?? 0;
    const cfg = err.config as InternalAxiosRequestConfig | undefined;

    const isUnauthorizedLike = status === 409 || status === 401 || status === 403;

    if (isUnauthorizedLike && !cfg?.suppressAuthModal) {
      window.dispatchEvent(
        new CustomEvent("auth:unauthorized", {
          detail: { status, path: cfg?.url ?? "" },
        })
      );
    }
    // sempre propaga o erro para quem chamou poder tratar se quiser
    return Promise.reject(err);
  }
);
