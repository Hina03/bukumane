'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const schema = z.object({
  email: z.email('有効なメールアドレスを入力してください'),
});

type FormInputs = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormInputs) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('送信に失敗しました');
      setSuccess('パスワード再設定メールを送信しました。メールボックスを確認してください。');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className='mx-auto mt-10 max-w-md rounded-lg border p-6 shadow-sm'>
      <h1 className='mb-6 text-center text-2xl font-bold'>パスワードの再設定</h1>

      {success ? (
        <div className='rounded-md border border-green-100 bg-green-50 p-4 text-center text-green-700'>
          {success}
          <div className='mt-4'>
            <Link href='/login' className='text-sm text-blue-600 hover:underline'>
              ログイン画面に戻る
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <p className='mb-4 text-sm text-gray-600'>
            登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
          </p>
          {error && <div className='text-center text-sm text-red-500'>{error}</div>}
          <div>
            <label className='mb-1 block text-sm font-medium'>メールアドレス</label>
            <input
              {...register('email')}
              type='email'
              className='w-full rounded border p-2'
              placeholder='example@example.com'
            />
            {errors.email && <p className='text-sm text-red-500'>{errors.email.message}</p>}
          </div>
          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50'
          >
            {isSubmitting ? '送信中...' : '再設定メールを送る'}
          </button>
          <div className='mt-4 text-center'>
            <Link href='/login' className='text-sm text-gray-500 hover:underline'>
              キャンセル
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
