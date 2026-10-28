import axios from "axios";

// Uses the Vite proxy in development. For production set VITE_API_URL, e.g. https://my-api.onrender.com/api
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

// Attach the JWT (if any) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (err) => err?.response?.data?.message || err.message || "Something went wrong";

export default api;
