// When deploying, the backend URL can be configured via environment variables
// Or fallback to standard localhost for local development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('[API URL Configured]:', API_BASE_URL);
