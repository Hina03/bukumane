'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// useSearchParams を使うロジックを別コンポーネントに切り出します
function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/profile';

  return <button onClick={() => signIn('google', { callbackUrl })}>Login With Google</button>;
}

// メインのページコンポーネントで Suspense を使って囲みます
export default function Login() {
  return (
    // fallback は読み込み中の一瞬表示されるUIです（必要に応じて変更可）
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
