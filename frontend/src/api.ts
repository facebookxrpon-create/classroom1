import axios from 'axios';

// Same-origin in production (backend serves the frontend). In dev, Vite proxies /api.
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || '',
  withCredentials: true,
});

export default api;
