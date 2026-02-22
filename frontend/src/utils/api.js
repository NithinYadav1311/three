// API utility with automatic session management
import axios from 'axios';
import { getSessionId } from './session';

// Backend domain only — full URLs are constructed in the interceptor below
// This avoids axios baseURL path-stripping behavior with leading-slash URLs
const BACKEND = (process.env.REACT_APP_BACKEND_URL || 'https://three-m0vz.onrender.com')
  .replace(/\/api\/?$/, '')  // strip trailing /api if someone set it with /api
  .replace(/\/$/, '');       // strip trailing slash

const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json'
  }
  // NO baseURL here — we build the full URL in the interceptor
});

apiClient.interceptors.request.use((config) => {
  const path = config.url || '';

  // If it's already an absolute URL, don't touch it
  if (!path.startsWith('http')) {
    // Ensure the path has /api prefix
    const withApi = path.startsWith('/api') ? path : '/api/' + path.replace(/^\//, '');
    // Build the complete absolute URL
    config.url = BACKEND + withApi;
  }

  config.headers['X-Session-ID'] = getSessionId();
  return config;
});

export default apiClient;
