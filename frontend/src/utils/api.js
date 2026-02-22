// API utility with automatic session management
import axios from 'axios';
import { getSessionId } from './session';

// Base URL is just the Render domain — /api prefix is added in the interceptor below.
// reason: axios drops any path in baseURL (like /api) when request URLs start with "/"
// Setting REACT_APP_BACKEND_URL should be just the domain: https://your-app.onrender.com
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://three-m0vz.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept every request to:
// 1. Add /api prefix (page components call /jobs, /screenings etc — we add /api here)
// 2. Add session ID header
apiClient.interceptors.request.use((config) => {
  // Add /api prefix if not already present
  if (config.url && !config.url.startsWith('/api')) {
    config.url = '/api' + (config.url.startsWith('/') ? '' : '/') + config.url.replace(/^\//, '');
  }
  config.headers['X-Session-ID'] = getSessionId();
  return config;
});

export default apiClient;
