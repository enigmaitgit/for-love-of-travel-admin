// Authentication utility functions

import { setAuthToken, removeAuthToken, isAuthenticated } from './auth-token';

/**
 * Handle successful login - store the JWT token
 */
export function handleLoginSuccess(token: string): void {
  setAuthToken(token);
  console.log('✅ Login successful, token stored');
}

/**
 * Handle logout - remove the JWT token
 */
export function handleLogout(): void {
  removeAuthToken();
  console.log('✅ Logout successful, token removed');
}

/**
 * Check if user is currently authenticated
 */
export function checkAuthStatus(): boolean {
  const authenticated = isAuthenticated();
  console.log('🔍 Auth status:', authenticated ? 'Authenticated' : 'Not authenticated');
  return authenticated;
}

/**
 * Get the current authentication token (for debugging)
 */
export function getCurrentToken(): string | null {
  const token = localStorage.getItem('auth_token');
  console.log('🔑 Current token:', token ? `${token.substring(0, 20)}...` : 'None');
  return token;
}
