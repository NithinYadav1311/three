// API utility with automatic session management
import axios from 'axios';
import { getSessionId } from './session';

// IMPORTANT: Set REACT_APP_BACKEND_URL in your Cloudflare Pages environment variables.
// Example: https://your-app-name.onrender.com/api
//
// Without it, API calls will fail in production because Cloudflare Pages
// cannot proxy requests to your Render backend.
//
// Replace the fallback below with your actual Render URL if you prefer to hardcode it:
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://three-m0vz.onrender.com/api';

if (!process.env.REACT_APP_BACKEND_URL) {
  console.warn(
    '[API] REACT_APP_BACKEND_URL is not set. ' +
    'API calls will go to: ' + API_BASE + '\n' +
    'Set this variable in your Cloudflare Pages build settings and redeploy.'
  );
}

/**
 * Create an axios instance with session ID automatically included
 */
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add session ID to every request
apiClient.interceptors.request.use((config) => {
  config.headers['X-Session-ID'] = getSessionId();
  return config;
});

export default apiClient;
