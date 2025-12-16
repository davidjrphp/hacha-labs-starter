import axios from 'axios';

const FALLBACK_PORT = 8000;
let baseURL = import.meta.env.VITE_API_URL || `http://localhost:${FALLBACK_PORT}/api`;

if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  if (host && host !== 'localhost') {
    try {
      const url = new URL(baseURL);
      if (['localhost', '127.0.0.1'].includes(url.hostname)) {
        url.hostname = host;
        baseURL = url.toString();
      }
    } catch {
      // ignore malformed URLs and keep default
    }
  }
}

const http = axios.create({
  baseURL,
  withCredentials: true,
});

export default http;
