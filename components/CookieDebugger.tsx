'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAuthToken, isAuthenticated } from '@/lib/auth-token';
import { getUserProfile, logout } from '@/lib/api-client';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export function CookieDebugger() {
  const [token, setToken] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = () => {
    // For httpOnly cookies, we can't read the token directly
    const currentAuth = isAuthenticated();
    
    setToken(null); // Can't read httpOnly cookies
    setIsAuth(currentAuth);
    setError(null);
  };

  const testUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test direct fetch with credentials: "include"
      const response = await fetch('http://localhost:5000/api/v1/authorization/verify', {
        method: 'GET',
        credentials: 'include', // 👈 include cookies here
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setUserProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testLogout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await logout();
      setUserProfile(null);
      console.log('✅ Logout test successful');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Cookie Authentication Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Status */}
        <div className="space-y-2">
          <h3 className="font-semibold">Authentication Status</h3>
          <div className="flex items-center gap-2">
            <Badge variant={isAuth ? "success" : "destructive"}>
              {isAuth ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Authenticated
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Authenticated
                </>
              )}
            </Badge>
            <Button variant="outline" size="sm" onClick={refreshData}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Token Display */}
        <div className="space-y-2">
          <h3 className="font-semibold">JWT Token (httpOnly)</h3>
          <div className="p-3 bg-gray-100 rounded-md">
            <span className="text-gray-500">
              httpOnly cookies cannot be read by JavaScript for security reasons.
              <br />
              The token is automatically sent with requests when using credentials: 'include'
            </span>
          </div>
        </div>

        {/* Test API Call */}
        <div className="space-y-2">
          <h3 className="font-semibold">Test API Endpoints</h3>
          <div className="flex gap-2">
            <Button 
              onClick={testUserProfile} 
              disabled={loading || !isAuth}
              className="flex-1"
            >
              {loading ? 'Testing...' : 'Test /verify'}
            </Button>
            <Button 
              onClick={testLogout} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? 'Testing...' : 'Test /logout'}
            </Button>
          </div>
        </div>

        {/* Results */}
        {(userProfile || error) && (
          <div className="space-y-2">
            <h3 className="font-semibold">API Response</h3>
            <div className="p-3 bg-gray-100 rounded-md">
              {error ? (
                <div className="text-red-600">
                  <strong>Error:</strong> {error}
                </div>
              ) : userProfile ? (
                <div>
                  <div className="text-green-600 mb-2">
                    <strong>✅ Success!</strong>
                  </div>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(userProfile, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-2">
          <h3 className="font-semibold">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Make sure your backend sets an httpOnly authentication cookie</li>
            <li>Login to your external system to set the httpOnly cookie</li>
            <li>Click "Test /verify endpoint" to verify the API call works</li>
            <li>Check browser DevTools → Application → Cookies to see httpOnly cookies (they won't show values)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
