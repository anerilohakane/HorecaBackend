'use client';

import { useRouter } from 'next/navigation';
import axios from 'axios';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 🔴 Logout function
  const handleLogout = async () => {
    setLoading(true);
    try {
      await axios.post('/api/auth/logout');
      alert('Logged out successfully!');
      router.push('/login'); // redirect to login page
    } catch (error) {
      alert('Logout failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Supply Chain Dashboard</h1>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            disabled={loading}
          >
            <LogOut className="w-4 h-4" />
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>

      {/* You can keep your charts, stats, etc. below this */}
    </div>
  );
}
