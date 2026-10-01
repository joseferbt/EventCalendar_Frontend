import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: `${baseURL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor: adjunta el JWT de acceso ───────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      //aca esta el JWT
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor: maneja 401 y hace logout automático ───────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? "";

      // El login debe manejar su propio 401 para mostrar
      // "Credenciales inválidas..." en la interfaz.
      const isLoginRequest = requestUrl.includes("/auth/login/");

      // El refresh también debe manejar su propio error.
      const isRefreshRequest = requestUrl.includes("/auth/token/refresh/");

      if (
        typeof window !== "undefined" &&
        !isLoginRequest &&
        !isRefreshRequest
      ) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
