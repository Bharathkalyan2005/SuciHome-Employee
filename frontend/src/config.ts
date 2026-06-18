// When deploying, the backend URL can be configured via environment variables
// Or fallback to relative Vercel path in production, and standard localhost locally
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? `${window.location.origin}/_/backend/api` 
    : 'http://localhost:5000/api');

console.log('[API URL Configured]:', API_BASE_URL);
