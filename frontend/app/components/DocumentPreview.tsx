'use client';

import ReactMarkdown from 'react-markdown';
import { getDocTypeInfo } from '../lib/documents';

interface Props {
  docType: string | null;
  fields: Record<string, unknown>;
  onSave?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved';
}

export default function DocumentPreview({ docType, fields, onSave, saveStatus = 'idle' }: Props) {
  const docInfo = docType ? getDocTypeInfo(docType) : null;
  const markdown = docInfo ? docInfo.buildPreview(fields) : null;

  const hasContent = docType && Object.keys(fields).length > 0;

  const handleDownload = async () => {
    if (!markdown || !docInfo) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const el = document.getElementById('legal-document');
    if (!el) return;
    const p1 = (fields.provider_company as string) || 'Party1';
    const p2 = (fields.customer_company as string) || 'Party2';
    const filename = `${docInfo.name}_${p1}_${p2}.pdf`.replace(/\s+/g, '-');
    html2pdf().set({
      margin: [15, 15, 15, 15],
      filename,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(el).save();
  };

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400 flex-1">
          {docInfo ? docInfo.name : 'Preview'}
        </span>

        {hasContent && onSave && (
          <button
            onClick={onSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              saveStatus === 'saved'
                ? 'bg-green-100 text-green-700 cursor-default'
                : saveStatus === 'saving'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving…' : '↑ Save'}
          </button>
        )}

        {docInfo && (
          <button
            onClick={handleDownload}
            disabled={!hasContent}
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⬇ Download PDF
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {!docType ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">📄</div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Your document will appear here</p>
              <p className="text-xs text-gray-400 mt-1">Tell the AI what document you need</p>
            </div>
          </div>
        ) : (
          <>
            {/* Disclaimer */}
            <div className="max-w-2xl mx-auto mb-4 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>
                <strong>Draft only.</strong> This document is AI-generated and should be considered a starting point.
                It does not constitute legal advice. Please consult a qualified attorney before executing any agreement.
              </span>
            </div>

            <div
              id="legal-document"
              className="bg-white max-w-2xl mx-auto px-14 py-12 shadow-sm rounded-sm"
              style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: '1.75', color: '#111' }}
            >
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 style={{ fontSize: '1.2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif', marginBottom: '24px' }}>{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 style={{ fontSize: '1rem', fontFamily: 'system-ui, sans-serif', marginTop: '28px', marginBottom: '8px', borderTop: '2px solid #e5e7eb', paddingTop: '24px' }}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'system-ui, sans-serif', marginTop: '16px', marginBottom: '4px' }}>{children}</h3>
                  ),
                  p: ({ children }) => <p style={{ marginBottom: '10px' }}>{children}</p>,
                  hr: () => <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '28px 0' }} />,
                  table: ({ children }) => (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '16px', marginBottom: '16px' }}>{children}</table>
                  ),
                  th: ({ children }) => (
                    <th style={{ border: '1px solid #d1d5db', padding: '8px 12px', background: '#f9fafb', fontWeight: 700, textAlign: 'left' }}>{children}</th>
                  ),
                  td: ({ children }) => (
                    <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', verticalAlign: 'top' }}>{children}</td>
                  ),
                  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                  em: ({ children }) => <em style={{ fontStyle: 'italic', color: '#6b7280' }}>{children}</em>,
                  ol: ({ children }) => <ol style={{ paddingLeft: '20px', marginBottom: '10px' }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: '6px' }}>{children}</li>,
                }}
              >
                {markdown!}
              </ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
