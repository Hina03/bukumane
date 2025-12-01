'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Save, Pencil, User as UserIcon, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

// バリデーションスキーマ
const profileSchema = z.object({
  name: z.string().min(1, 'ユーザー名を入力してください'),
  email: z.email('メールアドレスを入力してください'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MyPage() {
  const { data: session, update } = useSession(); // updateでセッション情報を更新可能
  const [isEditing, setIsEditing] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const router = useRouter();

  // 初回データ取得
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setBookmarkCount(data.bookmarkCount);
          // フォームの初期値をセット
          setValue('name', data.name || '');
          setValue('email', data.email || '');
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [session, setValue]);

  // プロフィール更新処理
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Update failed');

      // セッション情報をクライアント側でも更新
      await update({
        name: data.name,
        email: data.email,
      });

      router.refresh();

      setIsEditing(false); // 編集モード終了
    } catch (error) {
      console.error(error);
      alert('プロフィールの更新に失敗しました');
    }
  };

  // アイコン画像選択時の処理（今回はログ出力のみ。実際はSupabase Storage等へアップロード）
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(
        `画像「${file.name}」が選択されました。\n※実際のアップロード処理は別途Storage実装が必要です。`
      );
      // TODO: ここでSupabase Storage等に画像をアップロードし、URLを取得してDBを更新する処理を書く
    }
  };

  if (isLoading) {
    return (
      <div className='mt-10 flex justify-center'>
        <Loader2 className='animate-spin' />
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-2xl px-4 py-10'>
      <Card>
        <CardHeader>
          <CardTitle className='text-center text-2xl'>マイページ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center gap-6'>
            {/* --- アイコンセクション --- */}
            <div className='group relative'>
              <Avatar className='h-24 w-24 border-2 border-gray-100'>
                <AvatarImage src={session?.user?.image || ''} alt='User Icon' />
                <AvatarFallback className='bg-gray-200'>
                  <UserIcon className='h-12 w-12 text-gray-400' />
                </AvatarFallback>
              </Avatar>

              {/* カメラアイコンボタン */}
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='absolute bottom-0 right-0 rounded-full bg-primary p-2 text-white shadow-lg transition-colors hover:bg-primary/90'
                title='アイコンを変更'
              >
                <Camera className='h-4 w-4' />
              </button>

              {/* 非表示のファイル入力 */}
              <input
                type='file'
                ref={fileInputRef}
                className='hidden'
                accept='image/*'
                onChange={handleImageChange}
              />
            </div>

            {/* --- 総ブックマーク数 --- */}
            <div className='text-center'>
              <p className='text-sm text-muted-foreground'>総ブックマーク数</p>
              <p className='text-2xl font-bold'>{bookmarkCount ?? '-'}</p>
            </div>

            {/* --- フォームセクション --- */}
            <form onSubmit={handleSubmit(onSubmit)} className='w-full max-w-md space-y-4'>
              {/* ユーザー名 */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>ユーザー名</label>
                {isEditing ? (
                  <Input
                    {...register('name')}
                    className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                ) : (
                  <div className='rounded border border-transparent bg-gray-50 p-2'>
                    {session?.user?.name || '未設定'}
                  </div>
                )}
                {errors.name && <p className='text-xs text-red-500'>{errors.name.message}</p>}
              </div>

              {/* メールアドレス */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>メールアドレス</label>
                {isEditing ? (
                  <Input
                    {...register('email')}
                    className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                ) : (
                  <div className='rounded border border-transparent bg-gray-50 p-2'>
                    {session?.user?.email}
                  </div>
                )}
                {errors.email && <p className='text-xs text-red-500'>{errors.email.message}</p>}
              </div>

              {/* ボタンエリア */}
              <div className='flex justify-end gap-2 pt-4'>
                {isEditing ? (
                  <>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        clearErrors();
                        setIsEditing(false);
                      }}
                      disabled={isSubmitting}
                    >
                      キャンセル
                    </Button>
                    <Button type='submit' disabled={isSubmitting} className='flex gap-2'>
                      <Save className='h-4 w-4' />
                      保存
                    </Button>
                  </>
                ) : (
                  <Button type='button' onClick={() => setIsEditing(true)} className='flex gap-2'>
                    <Pencil className='h-4 w-4' />
                    編集
                  </Button>
                )}
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
