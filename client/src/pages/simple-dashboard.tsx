import { useEffect } from 'react';

export default function SimpleDashboard() {
  useEffect(() => {
    // Redirect to serve the static HTML file
    window.location.href = '/simple-dashboard.html';
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg animate-pulse mx-auto mb-4"></div>
        <div className="text-white">Loading ContentScale Dashboard...</div>
      </div>
    </div>
  );
}