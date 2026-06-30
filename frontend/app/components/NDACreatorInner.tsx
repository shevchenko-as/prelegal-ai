'use client';

import { useState } from 'react';
import NDAChat from './NDAChat';
import NDAPreview from './NDAPreview';
import { defaultFormData, NDAFormData } from '../lib/types';

export default function NDACreatorInner() {
  const [data, setData] = useState<NDAFormData>(defaultFormData);

  return (
    <div className="flex flex-1 min-h-0">
      <div className="w-[420px] flex-shrink-0 border-r border-gray-200 flex flex-col min-h-0">
        <NDAChat data={data} onFieldsUpdate={setData} />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <NDAPreview data={data} />
      </div>
    </div>
  );
}
