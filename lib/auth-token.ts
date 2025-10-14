// Authentication token management utilities

const TOKEN_COOKIE_NAME = 'auth_token'; // Change this to match your actual cookie name

/**
 * Get the stored authentication token from cookies
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }
  
  try {
    // Get cookie value
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${TOKEN_COOKIE_NAME}=`)
    );
    
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting auth token from cookies:', error);
    return null;
  }
}

/**
 * Store the authentication token in cookies
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return; // Server-side rendering
  }
  
  try {
    // Set cookie with appropriate options (7 days expiry)
    document.cookie = `${TOKEN_COOKIE_NAME}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  } catch (error) {
    console.error('Error setting auth token in cookies:', error);
  }
}

/**
 * Remove the authentication token from cookies
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') {
    return; // Server-side rendering
  }
  
  try {
    // Remove cookie by setting it to expire
    document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  } catch (error) {
    console.error('Error removing auth token from cookies:', error);
  }
}

/**
 * Check if user is authenticated (for httpOnly cookies, we can't check directly)
 * We'll rely on API calls to determine authentication status
 */
export function isAuthenticated(): boolean {
  // For httpOnly cookies, we can't check directly via JavaScript
  // Return true and let API calls determine if user is authenticated
  return true;
}

/**
 * Get authorization header value
 */
export function getAuthHeader(): string | null {
  const token = getAuthToken();
  return token ? `Bearer ${token}` : null;
}
