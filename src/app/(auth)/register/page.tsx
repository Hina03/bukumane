'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

// バリデーションスキーマ
const registerSchema = z.object({
  email: z.email('正しいメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '登録に失敗しました');
      }

      setSuccess('確認メールを送信しました。メールボックスを確認してください。');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className='mx-auto mt-10 max-w-md rounded-lg border p-6 shadow-sm'>
      <h1 className='mb-6 text-center text-2xl font-bold'>新規登録</h1>

      {success ? (
        <div className='text-center'>
          <div className='mb-4 font-medium text-green-600'>{success}</div>
          <p className='text-sm text-gray-500'>
            届かない場合は迷惑メールフォルダもご確認ください。
          </p>
        </div>
      ) : (
        <>
          {error && <div className='mb-4 text-center text-red-500'>{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
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

            <div>
              <label className='mb-1 block text-sm font-medium'>パスワード</label>
              <input
                {...register('password')}
                type='password'
                className='w-full rounded border p-2'
              />
              {errors.password && <p className='text-sm text-red-500'>{errors.password.message}</p>}
            </div>

            <button
              type='submit'
              disabled={isSubmitting}
              className='w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50'
            >
              {isSubmitting ? '登録中...' : '登録する'}
            </button>
          </form>
        </>
      )}

      <div className='mt-4 text-center'>
        <p className='text-sm'>
          すでにアカウントをお持ちですか？{' '}
          <Link href='/login' className='text-blue-600 hover:underline'>
            ログインはこちら
          </Link>
        </p>
      </div>
    </div>
  );
}
