'use client';

import { Suspense } from 'react';
import LoginContent from './LoginContent';
import { Loader2 } from 'lucide-react';

// ローディングUI
const LoadingFallback = () => (
  <div className='mt-20 flex justify-center'>
    <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
    <p className='ml-2 text-gray-500'>ページを読み込み中...</p>
  </div>
);

export default function LoginWrapper() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}
