'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout } from '../lib/auth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getUser()) router.replace('/login');
  }, [router]);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const user = typeof window !== 'undefined' ? getUser() : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center gap-3 px-7 py-3.5 bg-[#1a1a2e] text-white flex-shrink-0">
        <h1 className="text-base font-semibold tracking-wide">Prelegal AI</h1>
        <span className="text-xs text-[#8888aa] ml-auto">{user}</span>
        <button
          onClick={handleLogout}
          className="text-xs text-[#8888aa] hover:text-white transition-colors ml-4 border border-white/10 px-3 py-1 rounded-md"
        >
          Sign out
        </button>
      </header>
      {children}
    </div>
  );
}
