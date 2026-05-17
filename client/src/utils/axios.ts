import axios from "axios";
import { store } from "../store/store";
import { logout } from "../store/slices/authSlice";

// Create a centralized axios instance with withCredentials enabled
// This automatically sends HTTP-Only cookies (like our new access/refresh tokens) to the backend
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

// Add request interceptor to attach Bearer token as a fallback for browsers blocking 3rd party cookies
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401 Unauthorized globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the backend says we're unauthorized, clear the frontend session
      store.dispatch(logout());
      
      // Optionally redirect to login page if we aren't already there
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register" && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
