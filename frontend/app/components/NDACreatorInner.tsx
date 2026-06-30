'use client';

import { useState } from 'react';
import DocumentChat from './DocumentChat';
import DocumentPreview from './DocumentPreview';

export default function NDACreatorInner() {
  const [docType, setDocType] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, unknown>>({});

  return (
    <div className="flex flex-1 min-h-0">
      <div className="w-[420px] flex-shrink-0 border-r border-gray-200 flex flex-col min-h-0">
        <DocumentChat
          fields={fields}
          docType={docType}
          onFieldsUpdate={setFields}
          onDocTypeChange={setDocType}
        />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <DocumentPreview docType={docType} fields={fields} />
      </div>
    </div>
  );
}
