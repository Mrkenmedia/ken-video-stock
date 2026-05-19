'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '@/config/brand';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData();
    form.append('password', password);

    try {
      const res = await fetch('/api/login', { method: 'POST', body: form });
      if (res.ok || res.redirected) {
        // Cookie đã được set, redirect tay vì fetch không follow cookie redirect
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Sai mật khẩu. Vui lòng thử lại.');
      }
    } catch {
      setError('Không kết nối được server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative max-w-md w-full space-y-8 bg-slate-900/60 backdrop-blur-xl p-10 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-slate-800 bg-slate-950 flex items-center justify-center mb-6">
            <img 
              src={BRAND_CONFIG.logo.src} 
              alt={BRAND_CONFIG.logo.alt} 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-white tracking-tight">
            Đăng nhập Admin
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Nhập mật khẩu để truy cập bảng điều khiển {BRAND_CONFIG.name}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Mật khẩu Admin
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Đang xác thực...
              </span>
            ) : 'Đăng nhập ngay'}
          </button>
        </form>
      </div>
    </div>
  );
}
