'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testWithToken = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/v1/authorization/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(`HTTP ${response.status}: ${data.msg || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Direct Backend API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              JWT Token (optional):
            </label>
            <Input
              type="text"
              placeholder="Enter JWT token if you have one"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={testWithToken} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Backend API Directly'}
          </Button>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="font-semibold text-red-800">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-semibold text-green-800">Result:</h3>
              <pre className="text-green-700 text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="font-semibold text-yellow-800">Expected Behavior:</h3>
            <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1">
              <li>Without token: Should return {`{"msg": "No token provided"}`}</li>
              <li>With valid token: Should return user profile data</li>
              <li>With invalid token: Should return authentication error</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
