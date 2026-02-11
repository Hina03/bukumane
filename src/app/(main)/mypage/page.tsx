'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Pencil, Loader2, X } from 'lucide-react';
import TagManager from '@/components/TagManager';
import FolderManager from '@/components/FolderManager';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';

// バリデーションスキーマ
const profileSchema = z.object({
  name: z.string().min(1, 'ユーザー名を入力してください'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MyPage() {
  const { data: session, update } = useSession(); // updateでセッション情報を更新可能
  const [isEditing, setIsEditing] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      });
      router.refresh();
      setIsEditing(false); // 編集モード終了
    } catch (error) {
      console.error(error);
      alert('プロフィールの更新に失敗しました');
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
            {/* --- 総ブックマーク数 --- */}
            <div className='text-center'>
              <p className='text-sm text-muted-foreground'>総ブックマーク数</p>
              <p className='text-2xl font-bold'>{bookmarkCount ?? '-'}</p>
            </div>

            {/* --- フォームセクション --- */}
            <form onSubmit={handleSubmit(onSubmit)} className='w-full max-w-md space-y-4'>
              {/* ユーザー名 */}
              <div className='space-y-2'>
                <label className='text-sm font-semibold text-gray-600'>ユーザー名</label>
                {isEditing ? (
                  <div className='flex flex-col gap-2'>
                    <div className='flex gap-2'>
                      <Input
                        {...register('name')}
                        autoFocus
                        className={errors.name ? 'border-red-500' : 'bg-white'}
                      />
                      <Button type='submit' size='icon' disabled={isSubmitting} title='保存'>
                        <Save className='h-4 w-4' />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          clearErrors();
                          setIsEditing(false);
                        }}
                        title='キャンセル'
                      >
                        <X className='h-4 w-4 text-gray-400' />
                      </Button>
                    </div>
                    {errors.name && <p className='text-xs text-red-500'>{errors.name.message}</p>}
                  </div>
                ) : (
                  <div className='group flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50'>
                    <span className='font-medium text-gray-700'>
                      {session?.user?.name || '未設定'}
                    </span>
                    <button
                      type='button'
                      onClick={() => setIsEditing(true)}
                      className='text-gray-400 transition-colors hover:text-primary'
                      title='名前を編集'
                    >
                      <Pencil className='h-4 w-4' />
                    </button>
                  </div>
                )}
              </div>
            </form>
            <div className='mt-4 w-full max-w-md border-t pt-2'>
              <Accordion type='multiple' className='w-full'>
                {/* フォルダ管理 */}
                <AccordionItem value='folders' className='border-b-0'>
                  <AccordionTrigger className='py-4 text-lg font-bold hover:no-underline'>
                    フォルダ管理
                  </AccordionTrigger>
                  <AccordionContent className='pt-2'>
                    <FolderManager />
                  </AccordionContent>
                </AccordionItem>

                {/* タグ管理 */}
                <AccordionItem value='tags' className='border-b-0'>
                  <AccordionTrigger className='py-4 text-lg font-bold hover:no-underline'>
                    タグ管理
                  </AccordionTrigger>
                  <AccordionContent className='pt-2'>
                    <TagManager />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
