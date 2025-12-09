'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, PlusCircle, BookmarkPlus, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// バリデーションスキーマ
const bookmarkSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください'),
  url: z.url('有効なURLを入力してください'),
  tags: z.string().optional(), // カンマ区切り文字列として扱う
  memo: z.string().optional(),
});

type BookmarkFormValues = z.infer<typeof bookmarkSchema>;

export default function AddBookmarkPage() {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isTagsLoading, setIsTagsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: { tags: '' },
  });

  const router = useRouter();

  // --- タグ関連の処理 ---
  // DBからタグを取得する
  useEffect(() => {
    const fetchTags = async () => {
      setIsTagsLoading(true);
      try {
        const res = await fetch('/api/tags');
        if (res.ok) {
          const data: { id: string; name: string }[] = await res.json();
          const tagNames = data.map((t) => t.name);
          setAvailableTags(tagNames);
        }
      } catch (error) {
        console.error('タグの取得に失敗しました', error);
      } finally {
        setIsTagsLoading(false);
      }
    };

    fetchTags();
  }, []);

  // タグ選択/解除
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 新しいタグの作成と選択
  const handleAddNewTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !availableTags.includes(trimmedTag)) {
      setAvailableTags((prev) => [...prev, trimmedTag]);
      setSelectedTags((prev) => [...prev, trimmedTag]);
      setNewTagInput('');
    } else if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      // 既存タグに入っているが選択されていない場合
      setSelectedTags((prev) => [...prev, trimmedTag]);
      setNewTagInput('');
    }
  };

  // --- フォーム送信処理 ---

  const onSubmit = async (data: BookmarkFormValues) => {
    // フォームデータと選択されたタグを統合
    const finalData = {
      ...data,
      tags: selectedTags, // タグを配列として送信
    };

    try {
      // APIリクエストのシミュレーション（実際にはDBへの登録）
      const res = await fetch('/api/addPages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });
      if (!res.ok) throw new Error('登録に失敗しました');

      await new Promise((resolve) => setTimeout(resolve, 1000)); // ローディング表示のための待機

      alert(
        'ブックマークを登録しました！\nタイトル: ' +
          finalData.title +
          '\nタグ: ' +
          finalData.tags.join(', ')
      );

      // フォームとステートをリセット
      reset();
      setSelectedTags([]);
      setNewTagInput('');
      router.push('/pages');
    } catch (error) {
      alert('登録処理中にエラーが発生しました。');
      console.error(error);
    }
  };

  return (
    <div className='mx-auto max-w-3xl px-4 py-10'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-3 text-2xl'>
            <BookmarkPlus className='h-6 w-6 text-primary' />
            新しいブックマークを登録
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* 1. タイトル */}
            <div>
              <label className='mb-1 block text-sm font-medium' htmlFor='title'>
                タイトル (必須)
              </label>
              <Input
                id='title'
                {...register('title')}
                placeholder='ブックマークのタイトル'
                className={errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.title && <p className='mt-1 text-xs text-red-500'>{errors.title.message}</p>}
            </div>

            {/* 2. URL */}
            <div>
              <label className='mb-1 block text-sm font-medium' htmlFor='url'>
                URL (必須)
              </label>
              <Input
                id='url'
                {...register('url')}
                placeholder='https://example.com'
                className={errors.url ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.url && <p className='mt-1 text-xs text-red-500'>{errors.url.message}</p>}
            </div>

            {/* 3. タグ選択/作成 */}
            <div className='space-y-3'>
              <label className='block text-sm font-medium'>タグの選択・作成</label>

              {/* 既存タグリスト */}
              <div className='flex min-h-[40px] flex-wrap gap-2 rounded-md border bg-gray-50 p-3'>
                {isTagsLoading ? (
                  <div className='flex items-center gap-2 text-sm text-gray-500'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    タグをロード中...
                  </div>
                ) : availableTags.length === 0 ? (
                  <p className='text-sm text-gray-500'>
                    まだタグがありません。新しく作成してください。
                  </p>
                ) : (
                  availableTags.map((tag) => (
                    <Button
                      key={tag}
                      type='button'
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))
                )}
              </div>

              {/* 新規タグ入力エリア */}
              <div className='flex gap-2'>
                <Input
                  placeholder='新しいタグを作成・選択'
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewTag();
                    }
                  }}
                />
                <Button
                  type='button'
                  onClick={handleAddNewTag}
                  className='flex gap-1'
                  disabled={!newTagInput.trim()}
                >
                  <PlusCircle className='h-4 w-4' />
                  作成
                </Button>
              </div>

              {/* 現在選択中のタグ表示 */}
              <p className='pt-1 text-sm text-muted-foreground'>
                選択中のタグ: {selectedTags.length > 0 ? selectedTags.join(', ') : 'なし'}
              </p>
            </div>

            {/* 4. メモ */}
            <div>
              <label className='mb-1 block text-sm font-medium' htmlFor='memo'>
                メモ (任意)
              </label>
              <Textarea
                id='memo'
                {...register('memo')}
                placeholder='ブックマークに関するメモやコメント'
              />
            </div>

            {/* 登録ボタン */}
            <Button type='submit' className='flex w-full gap-2' disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Save className='h-4 w-4' />
              )}
              ブックマークを登録
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
