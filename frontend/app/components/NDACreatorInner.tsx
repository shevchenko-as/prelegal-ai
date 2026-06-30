'use client';

import { useState } from 'react';
import NDAForm from './NDAForm';
import NDAPreview from './NDAPreview';
import { defaultFormData, NDAFormData } from '../lib/types';

export default function NDACreatorInner() {
  const [data, setData] = useState<NDAFormData>(defaultFormData);

  return (
    <div className="flex flex-1 min-h-0">
      <div className="w-[420px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        <NDAForm data={data} onChange={setData} />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <NDAPreview data={data} />
      </div>
    </div>
  );
}
