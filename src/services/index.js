import axios from 'axios';

// ─── NOC Local API ─────────────────────────────────────────────────────────────
// On-site edge server running inside the facility network.
// Override base URL via VITE_NOC_LOCAL_URL in .env.local

export const nocLocalApi = axios.create({
  baseURL: import.meta.env.VITE_NOC_LOCAL_URL || 'http://172.16.10.1:5000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — runs before every request sent to local server
nocLocalApi.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// Response interceptor — runs on every response from local server
nocLocalApi.interceptors.response.use(
  (response) => {
    // response.data is the actual payload — return as-is
    return response;
  },
  (error) => {
    // Network error or server down (no response at all)
    if (!error.response) {
      console.error('[Local API] Server unreachable:', error.message);
      return Promise.reject(new Error('Local server is unreachable'));
    }

    const { status, data } = error.response;

    if (status === 403) {
      console.warn('[Local API] Forbidden');
    }

    if (status >= 500) {
      console.error('[Local API] Server error:', data);
    }

    return Promise.reject(error);
  },
);

// ─── NOC Cloud API ─────────────────────────────────────────────────────────────
// Stancebema hosted backend — accessible from anywhere.
// Override base URL via VITE_NOC_CLOUD_URL in .env.cloud

export const nocCloudApi = axios.create({
  baseURL: import.meta.env.VITE_NOC_CLOUD_URL || 'http://stancebema.com',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — runs before every request sent to cloud server
nocCloudApi.interceptors.request.use(
  (config) => {
    // Attach auth token if present
    const token = localStorage.getItem('noc_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — runs on every response from cloud server
nocCloudApi.interceptors.response.use(
  (response) => {
    // response.data is the actual payload — return as-is
    return response;
  },
  (error) => {
    // Network error or server down (no response at all)
    if (!error.response) {
      console.error('[Cloud API] Server unreachable:', error.message);
      return Promise.reject(new Error('Cloud server is unreachable'));
    }

    const { status, data } = error.response;

    if (status === 401) {
      console.warn('[Cloud API] Unauthorized — clearing token');
      localStorage.removeItem('noc_token');
    }

    if (status === 403) {
      console.warn('[Cloud API] Forbidden');
    }

    if (status >= 500) {
      console.error('[Cloud API] Server error:', data);
    }

    return Promise.reject(error);
  },
);
