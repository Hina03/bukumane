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
  const callbackUrl = searchParams.get('callbackUrl') || '/pages';
  const [error, setError] = useState('');
  const urlError = searchParams.get('error');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [emailForResend, setEmailForResend] = useState(''); // 再送用にメアドを保持

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setError('');
    setResendMessage('');
    setEmailForResend(data.email); // 入力されたメアドを保存

    const res = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
      callbackUrl,
    });

    if (res?.error) {
      // エラーメッセージの分岐
      if (res.error === 'email_not_verified') {
        setError('メール認証が完了していません。届いたメールを確認してください。');
      } else {
        setError('メールアドレスまたはパスワードが間違っています');
      }
    } else {
      router.push(callbackUrl);
      router.refresh(); // セッション情報を最新にする
    }
  };

  // 再送処理の関数
  const onResend = async () => {
    setIsResending(true);
    setResendMessage('');
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        body: JSON.stringify({ email: emailForResend }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendMessage('新しい確認メールを送信しました。ボックスを確認してください。');
      } else {
        setError(data.error || '再送に失敗しました');
      }
    } catch {
      setError('エラーが発生しました');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className='mx-auto mt-10 max-w-md rounded-lg border p-6 shadow-sm'>
      <h1 className='mb-6 text-center text-2xl font-bold'>ログイン</h1>

      {/* URLに直接エラーがある場合、または state にエラーがある場合に表示 */}
      {(error || urlError === 'email_not_verified') && (
        <div className='mb-4 rounded border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-500'>
          {error || 'メール認証が完了していません。届いたメールを確認してください。'}

          {/* 未認証エラーの時だけ再送ボタンを出す */}
          {error.includes('メール認証') && (
            <button
              onClick={onResend}
              disabled={isResending}
              className='mt-2 block w-full text-xs font-bold underline hover:text-red-700'
            >
              {isResending ? '送信中...' : '確認メールを再送する'}
            </button>
          )}
        </div>
      )}

      {/* 再送成功メッセージ */}
      {resendMessage && (
        <div className='mb-4 rounded border border-green-200 bg-green-50 p-3 text-center text-sm font-medium text-green-600'>
          {resendMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='mb-6 space-y-4'>
        <div>
          <label className='mb-1 block text-sm font-medium'>メールアドレス</label>
          <input {...register('email')} type='email' className='w-full rounded border p-2' />
          {errors.email && <p className='text-sm text-red-500'>{errors.email.message}</p>}
        </div>

        <div>
          <div className='mb-1 flex items-center justify-between'>
            <label className='text-sm font-medium'>パスワード</label>
            <Link href='/forgot-password' className='text-xs text-blue-600 hover:underline'>
              パスワードを忘れた方はこちら
            </Link>
          </div>
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
