'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.email('メールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/profile';
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setError('');
    const res = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
      callbackUrl,
    });

    if (res?.error) {
      setError('メールアドレスまたはパスワードが間違っています');
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div className='mx-auto mt-10 max-w-md rounded-lg border p-6 shadow-sm'>
      <h1 className='mb-6 text-center text-2xl font-bold'>ログイン</h1>

      {error && <div className='mb-4 text-center text-red-500'>{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className='mb-6 space-y-4'>
        <div>
          <label className='mb-1 block text-sm font-medium'>メールアドレス</label>
          <input {...register('email')} type='email' className='w-full rounded border p-2' />
          {errors.email && <p className='text-sm text-red-500'>{errors.email.message}</p>}
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>パスワード</label>
          <input {...register('password')} type='password' className='w-full rounded border p-2' />
          {errors.password && <p className='text-sm text-red-500'>{errors.password.message}</p>}
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className='w-full rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50'
        >
          {isSubmitting ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      <div className='relative mb-6'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t'></div>
        </div>
        <div className='relative flex justify-center text-sm'>
          <span className='bg-white px-2 text-gray-500'>または</span>
        </div>
      </div>

      <button
        onClick={() => signIn('google', { callbackUrl })}
        className='flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white py-2 text-gray-700 hover:bg-gray-50'
      >
        {/* Google Icon SVG could go here */}
        Googleでログイン
      </button>

      <div className='mt-4 text-center'>
        <p className='text-sm'>
          アカウントをお持ちでないですか？{' '}
          <Link href='/register' className='text-blue-600 hover:underline'>
            新規登録はこちら
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
