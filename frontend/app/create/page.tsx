'use client';

import { useState } from 'react';
import AppShell from '../components/AppShell';
import NDACreatorInner from '../components/NDACreatorInner';
import { SavedDocument } from '../lib/api';

export default function CreatePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewDoc, setViewDoc] = useState<SavedDocument | null>(null);

  function handleSaved() {
    setRefreshTrigger(n => n + 1);
  }

  function handleOpenDocument(doc: SavedDocument) {
    setViewDoc(doc);
  }

  function handleNew() {
    setViewDoc(null);
  }

  return (
    <AppShell onOpenDocument={handleOpenDocument} refreshTrigger={refreshTrigger}>
      {viewDoc ? (
        <div className="flex flex-col flex-1 min-h-0">
          {/* View-only header */}
          <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
            <button
              onClick={handleNew}
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
            >
              ← Back to editor
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-700 truncate">{viewDoc.title}</span>
          </div>
          <NDACreatorInner initialDoc={viewDoc} onSaved={handleSaved} />
        </div>
      ) : (
        <NDACreatorInner onSaved={handleSaved} />
      )}
    </AppShell>
  );
}
