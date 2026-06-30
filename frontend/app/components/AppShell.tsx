'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout, isLoggedIn } from '../lib/auth';
import { api, SavedDocument } from '../lib/api';
import { getDocTypeInfo } from '../lib/documents';

interface Props {
  children: React.ReactNode;
  onOpenDocument?: (doc: SavedDocument) => void;
  refreshTrigger?: number;
}

function docIcon(type: string): string {
  const icons: Record<string, string> = {
    'mutual-nda': '🤝',
    'pilot-agreement': '🚀',
    'csa': '☁️',
    'software-license': '💿',
    'partnership': '🤜',
    'design-partner': '🎨',
    'psa': '🛠️',
    'baa': '🏥',
    'dpa': '🔒',
    'sla': '📊',
    'ai-addendum': '🤖',
  };
  return icons[type] ?? '📄';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AppShell({ children, onOpenDocument, refreshTrigger }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [docs, setDocs] = useState<SavedDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return; }
    setUser(getUser());
  }, [router]);

  const fetchDocs = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const list = await api.documents.list();
      setDocs(list);
    } catch { /* silently fail */ }
    finally { setLoadingDocs(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs, refreshTrigger]);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-[#0f0f1a] flex flex-col border-r border-white/5">

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-white/5">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">P</div>
          <span className="text-white font-semibold text-sm tracking-tight">Prelegal AI</span>
        </div>

        {/* New document button */}
        <div className="px-3 pt-4 pb-2">
          <a
            href="/create"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <span className="text-base leading-none">+</span>
            New Document
          </a>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4a4a6a] px-2 mb-2 mt-2">
            Recent
          </p>

          {loadingDocs && (
            <div className="text-[#4a4a6a] text-xs px-2 py-3">Loading…</div>
          )}

          {!loadingDocs && docs.length === 0 && (
            <div className="text-[#3a3a5a] text-xs px-2 py-3">No documents yet</div>
          )}

          {docs.map(doc => {
            const info = getDocTypeInfo(doc.template_type);
            return (
              <button
                key={doc.id}
                onClick={() => onOpenDocument?.(doc)}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group mb-0.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{docIcon(doc.template_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-xs font-medium truncate group-hover:text-white transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-[#4a4a6a] text-[10px]">
                      {info?.name ?? doc.template_type} · {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <p className="text-[#6b6b8a] text-xs truncate mb-2">{user}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-[#4a4a6a] hover:text-[#8888aa] transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
