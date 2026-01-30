import { Suspense } from 'react';
import NewVerificationClient from './NewVerificationClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div className='mt-10 text-center'>Loading...</div>}>
      <NewVerificationClient />
    </Suspense>
  );
}
