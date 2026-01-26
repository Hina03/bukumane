'use client';

import { Suspense } from 'react';
import PagesListContent from './PagesListContent';
import { Loader2 } from 'lucide-react';

// ローディングUI
const LoadingFallback = () => (
  <div className='mt-20 flex justify-center'>
    <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
    <p className='ml-2 text-gray-500'>ページを読み込み中...</p>
  </div>
);

export default function PagesListWrapper() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PagesListContent />
    </Suspense>
  );
}
