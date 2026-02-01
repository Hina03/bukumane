import { Suspense } from 'react';
import NewPasswordClient from './NewPasswordClient';

export const dynamic = 'force-dynamic';
export default function Page() {
  return (
    <Suspense fallback={<div className='mt-10 text-center'>Loading...</div>}>
      <NewPasswordClient />
    </Suspense>
  );
}
