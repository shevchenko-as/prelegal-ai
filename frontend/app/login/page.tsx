'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn, login } from '../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isLoggedIn()) router.replace('/create');
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    login(email);
    router.push('/create');
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white tracking-tight">Prelegal AI</h1>
          <p className="text-[#8888aa] text-sm mt-1">Legal documents, simplified.</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a2e] rounded-2xl p-8 shadow-2xl border border-white/5">
          <h2 className="text-white text-lg font-semibold mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8888aa] uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white/8 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8888aa] uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white/8 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg text-sm transition-colors mt-2"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-[#555577] text-xs mt-6">
          Common Paper templates · CC BY 4.0
        </p>
      </div>
    </div>
  );
}
