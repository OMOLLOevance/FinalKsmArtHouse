'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Page</h1>
        <p className="text-gray-600">If you can see this, the basic Next.js setup is working.</p>
        <div className="mt-4">
          <p className="text-sm text-gray-500">Environment check:</p>
          <ul className="text-xs text-gray-400 mt-2">
            <li>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</li>
            <li>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}