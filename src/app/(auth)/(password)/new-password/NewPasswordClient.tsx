'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z
  .object({
    password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

type FormInputs = z.infer<typeof schema>;

export default function NewPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
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
    if (!token) {
      setError('トークンが見つかりません。もう一度最初からやり直してください。');
      return;
    }

    setError('');
    try {
      const res = await fetch('/api/auth/new-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: data.password }),
      });
      if (!res.ok)
        throw new Error('更新に失敗しました。リンクの期限が切れている可能性があります。');

      setSuccess('パスワードを更新しました。新しいパスワードでログインしてください。');
      setTimeout(() => router.push('/login'), 3000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className='mx-auto mt-10 max-w-md rounded-lg border p-6 shadow-sm'>
      <h1 className='mb-6 text-center text-2xl font-bold'>新しいパスワードの設定</h1>

      {success ? (
        <div className='rounded-md border border-green-100 bg-green-50 p-4 text-center text-green-700'>
          {success}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {error && <div className='text-center text-sm text-red-500'>{error}</div>}
          <div>
            <label className='mb-1 block text-sm font-medium'>新しいパスワード</label>
            <input
              {...register('password')}
              type='password'
              className='w-full rounded border p-2'
            />
            {errors.password && <p className='text-sm text-red-500'>{errors.password.message}</p>}
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium'>パスワード（確認）</label>
            <input
              {...register('confirmPassword')}
              type='password'
              className='w-full rounded border p-2'
            />
            {errors.confirmPassword && (
              <p className='text-sm text-red-500'>{errors.confirmPassword.message}</p>
            )}
          </div>
          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50'
          >
            {isSubmitting ? '更新中...' : 'パスワードを更新する'}
          </button>
        </form>
      )}
    </div>
  );
}
