// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Auth API Configuration (for user management)
export const AUTH_API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_BASE_URL || 'http://localhost:4000/api/auth';

// Helper function to build API URLs
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
}

// Helper function to build Auth API URLs (for user management)
export function getAuthApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${AUTH_API_BASE_URL}/${cleanEndpoint}`;
}

// Helper function to make API calls
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = getApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}
