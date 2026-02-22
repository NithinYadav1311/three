// API utility with automatic session management
import axios from 'axios';
import { getSessionId } from './session';

// IMPORTANT: Set REACT_APP_BACKEND_URL in your Cloudflare Pages environment variables.
// Without it, API calls fall back to the Render backend URL below.
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://three-m0vz.onrender.com/api/';

if (!process.env.REACT_APP_BACKEND_URL) {
  console.warn(
    '[API] REACT_APP_BACKEND_URL is not set. ' +
    'API calls will go to: ' + API_BASE
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
