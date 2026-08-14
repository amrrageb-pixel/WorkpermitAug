export function getApiUrl(): string {
  // Read API URL from Vite environment variables if provided
  const env = import.meta.env || {};
  if (env.VITE_API_URL) {
    return env.VITE_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    // If we are in standard browser development or production,
    // relative paths will work if they serve from the same origin.
    // If we're on port 5173, the Vite dev server proxy handles it.
    if (window.location.protocol.startsWith('http') && (window.location.port === '5173' || !window.location.port)) {
      return '';
    }
    // For native app wrappers (Capacitor/Electron) where protocol is capacitor:// or file://,
    // fallback to default local backend server port.
    return 'http://localhost:3000';
  }
  
  return '';
}
