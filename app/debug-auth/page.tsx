import { CookieDebugger } from '@/components/CookieDebugger';

export default function DebugAuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Authentication Debug Page
          </h1>
          <p className="text-gray-600">
            Test and debug your cookie-based authentication system
          </p>
        </div>
        <CookieDebugger />
      </div>
    </div>
  );
}
