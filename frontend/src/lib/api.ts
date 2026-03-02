import axios from 'axios';

// Universal API base URL — reads from VITE_API_BASE_URL env variable
// In development: defaults to '/api' (proxied by Vite to localhost:5000)
// In production: set VITE_API_BASE_URL to your deployed backend (e.g., https://api.yourapp.com/api)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('carenet_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('carenet_token');
      localStorage.removeItem('carenet_user');
      window.location.href = '/login';
    }
    // Redirect incomplete-profile users to role selection
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'PROFILE_INCOMPLETE'
    ) {
      window.location.href = '/select-role';
    }
    return Promise.reject(error);
  }
);

export default api;
