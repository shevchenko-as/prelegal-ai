'use client';

import { useState } from 'react';
import NDAForm from './NDAForm';
import NDAPreview from './NDAPreview';
import { defaultFormData, NDAFormData } from '../lib/types';

export default function NDACreator() {
  const [data, setData] = useState<NDAFormData>(defaultFormData);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center gap-3 px-7 py-3.5 bg-[#1a1a2e] text-white flex-shrink-0">
        <h1 className="text-base font-semibold tracking-wide">Mutual NDA Creator</h1>
        <span className="text-xs text-[#8888aa] ml-auto">Prelegal AI · Common Paper Standard v1.0</span>
      </header>

      {/* Two-column workspace */}
      <div className="flex flex-1 min-h-0">
        {/* Form panel */}
        <div className="w-[420px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <NDAForm data={data} onChange={setData} />
        </div>

        {/* Preview panel */}
        <div className="flex-1 flex flex-col min-h-0">
          <NDAPreview data={data} />
        </div>
      </div>
    </div>
  );
}
