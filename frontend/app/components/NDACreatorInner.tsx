'use client';

import { useState, useCallback } from 'react';
import DocumentChat from './DocumentChat';
import DocumentPreview from './DocumentPreview';
import { api, SavedDocument } from '../lib/api';
import { getDocTypeInfo } from '../lib/documents';

interface Props {
  initialDoc?: SavedDocument | null;
  onSaved?: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

function makeTitle(docType: string, fields: Record<string, unknown>): string {
  const info = getDocTypeInfo(docType);
  const p1 = (fields.provider_company as string) || '';
  const p2 = (fields.customer_company as string) || '';
  const parties = [p1, p2].filter(Boolean).join(' & ');
  return parties ? `${info?.name ?? docType} — ${parties}` : (info?.name ?? docType);
}

function parseDoc(doc: SavedDocument): { docType: string; fields: Record<string, unknown> } {
  try {
    return JSON.parse(doc.content);
  } catch {
    return { docType: doc.template_type, fields: {} };
  }
}

export default function NDACreatorInner({ initialDoc, onSaved }: Props) {
  const initial = initialDoc ? parseDoc(initialDoc) : null;

  const [docType, setDocType] = useState<string | null>(initial?.docType ?? null);
  const [fields, setFields] = useState<Record<string, unknown>>(initial?.fields ?? {});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [viewOnly] = useState(!!initialDoc);

  const handleSave = useCallback(async () => {
    if (!docType) return;
    setSaveStatus('saving');
    try {
      await api.documents.create({
        title: makeTitle(docType, fields),
        template_type: docType,
        content: JSON.stringify({ docType, fields }),
      });
      setSaveStatus('saved');
      onSaved?.();
    } catch {
      setSaveStatus('idle');
    }
  }, [docType, fields, onSaved]);

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left — Chat (hidden in view-only mode) */}
      {!viewOnly && (
        <div className="w-[380px] flex-shrink-0 border-r border-gray-200 flex flex-col min-h-0">
          <DocumentChat
            fields={fields}
            docType={docType}
            onFieldsUpdate={setFields}
            onDocTypeChange={type => { setDocType(type); setSaveStatus('idle'); }}
          />
        </div>
      )}

      {/* Right — Preview */}
      <div className="flex-1 flex flex-col min-h-0">
        <DocumentPreview
          docType={docType}
          fields={fields}
          onSave={viewOnly ? undefined : handleSave}
          saveStatus={viewOnly ? undefined : saveStatus}
        />
      </div>
    </div>
  );
}
