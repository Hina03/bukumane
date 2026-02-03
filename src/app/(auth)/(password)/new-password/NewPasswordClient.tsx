'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            <div className='relative'>
              <input
                {...register('password')} // react-hook-formを使っている場合
                type={showPassword ? 'text' : 'password'}
                className='w-full rounded border p-2 pr-10' // 右側にアイコン用の余白(pr-10)を作る
                placeholder='パスワードを入力'
              />

              {/* アイコンボタンをinputの上に重ねて配置 */}
              <button
                type='button' // form送信を防ぐために明示的にbuttonタイプを指定
                onClick={togglePasswordVisibility}
                className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600'
              >
                {showPassword ? (
                  <EyeOff className='h-5 w-5' /> // 表示中のときは「非表示アイコン」
                ) : (
                  <Eye className='h-5 w-5' /> // 非表示のときは「表示アイコン」
                )}
              </button>
            </div>
            {errors.password && <p className='text-sm text-red-500'>{errors.password.message}</p>}
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium'>パスワード（確認）</label>
            <div className='relative'>
              <input
                {...register('password')} // react-hook-formを使っている場合
                type={showPassword ? 'text' : 'password'}
                className='w-full rounded border p-2 pr-10' // 右側にアイコン用の余白(pr-10)を作る
                placeholder='パスワードを入力'
              />

              {/* アイコンボタンをinputの上に重ねて配置 */}
              <button
                type='button' // form送信を防ぐために明示的にbuttonタイプを指定
                onClick={togglePasswordVisibility}
                className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600'
              >
                {showPassword ? (
                  <EyeOff className='h-5 w-5' /> // 表示中のときは「非表示アイコン」
                ) : (
                  <Eye className='h-5 w-5' /> // 非表示のときは「表示アイコン」
                )}
              </button>
            </div>
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
