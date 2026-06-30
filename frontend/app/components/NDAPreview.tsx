'use client';

import ReactMarkdown from 'react-markdown';
import { NDAFormData } from '../lib/types';
import { buildCoverMarkdown } from '../lib/nda';

interface Props {
  data: NDAFormData;
}

export default function NDAPreview({ data }: Props) {
  const markdown = buildCoverMarkdown(data);

  const handleDownload = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const el = document.getElementById('nda-document');
    if (!el) return;
    const p1 = data.party1.company || 'Party1';
    const p2 = data.party2.company || 'Party2';
    const filename = `Mutual-NDA_${p1}_${p2}.pdf`.replace(/\s+/g, '-');
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
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400 flex-1">Preview</span>
        <button
          onClick={handleDownload}
          className="px-4 py-2 text-sm font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          ⬇ Download PDF
        </button>
      </div>

      {/* Scrollable preview */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
        <div
          id="nda-document"
          className="bg-white max-w-2xl mx-auto px-16 py-14 shadow-sm"
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
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
