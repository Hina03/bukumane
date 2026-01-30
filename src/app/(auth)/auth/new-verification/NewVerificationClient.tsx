'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function NewVerificationClient() {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const onSubmit = useCallback(async () => {
    if (success || error) return;
    if (!token) {
      setError('トークンが見つかりません');
      return;
    }

    try {
      // 検証用APIを叩く（後で作ります）
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setSuccess('メールアドレスが確認されました！ログインページへ移動します...');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch {
      setError('エラーが発生しました');
    }
  }, [token, success, error, router]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center'>
      <div className='w-full max-w-md rounded-lg border bg-white p-8 text-center shadow'>
        <h1 className='mb-4 text-2xl font-bold'>認証中...</h1>

        {!success && !error && <Loader2 className='mx-auto h-8 w-8 animate-spin text-blue-500' />}

        {success && <div className='mb-4 rounded bg-green-100 p-3 text-green-700'>{success}</div>}

        {error && <div className='mb-4 rounded bg-red-100 p-3 text-red-700'>{error}</div>}
      </div>
    </div>
  );
}
