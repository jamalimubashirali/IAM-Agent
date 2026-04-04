import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT on every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// On 401 (expired / invalid token) clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Keep admin flows on the admin login screen.
      const path = window.location.pathname;
      const isAdminPath = path.startsWith("/admin");
      const isLoginPath = path === "/login" || path === "/admin/login";
      if (!isLoginPath) {
        window.location.href = isAdminPath ? "/admin/login" : "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
