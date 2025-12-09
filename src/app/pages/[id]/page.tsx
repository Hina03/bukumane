'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  Calendar,
  Pencil,
  Save,
  Trash2,
  PlusCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// バリデーションスキーマ
const pageSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  url: z.url('有効なURLを入力してください'),
  memo: z.string().optional(),
});

type PageData = {
  id: string;
  title: string;
  url: string;
  memo: string | null;
  tags: string[]; // タグ名の配列
  createdAt: string;
  updatedAt: string;
};

export default function PageDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // タグ編集用ステート
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(pageSchema),
  });

  // 1. データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ページ詳細取得
        const pageRes = await fetch(`/api/pages/${id}`);
        if (!pageRes.ok) throw new Error('Not Found');
        const pageData: PageData = await pageRes.json();
        setPage(pageData);
        setSelectedTags(pageData.tags);

        // フォーム初期値
        setValue('title', pageData.title);
        setValue('url', pageData.url);
        setValue('memo', pageData.memo || '');

        // 全タグ取得 (編集用)
        const tagsRes = await fetch('/api/tags');
        if (tagsRes.ok) {
          const tagsData: { name: string }[] = await tagsRes.json();
          setAvailableTags(tagsData.map((t) => t.name));
        }
      } catch (error) {
        console.error(error);
        router.push('/pages'); // エラーなら一覧へ戻す
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, router, setValue]);

  // ファビコン取得
  const getFaviconUrl = (url: string) => {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
    } catch {
      return '';
    }
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // --- タグ操作 ---
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTag = () => {
    const val = newTagInput.trim();
    if (val && !selectedTags.includes(val)) {
      setSelectedTags((prev) => [...prev, val]);
      if (!availableTags.includes(val)) setAvailableTags((prev) => [...prev, val]);
      setNewTagInput('');
    }
  };

  // --- 保存処理 ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    try {
      const res = await fetch(`/api/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tags: selectedTags }),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updatedPage = await res.json();
      setPage({
        ...page!, // 既存データをベースに
        ...updatedPage, // 更新データで上書き (updatedAtなども更新される)
        tags: selectedTags, // タグはレスポンスに含まれない場合があるので手動反映
      });

      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert('更新に失敗しました');
    }
  };

  // --- 削除処理 ---
  const handleDelete = async () => {
    if (!confirm('本当に削除しますか？')) return;
    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/pages');
    } catch (e) {
      console.error(e);
      alert('削除に失敗しました');
    }
  };

  if (isLoading)
    return (
      <div className='mt-20 flex justify-center'>
        <Loader2 className='animate-spin' />
      </div>
    );
  if (!page) return null;

  // 日付表示ロジック: 更新日時と作成日時が(ほぼ)同じなら「保存日」、違えば「更新日」
  // ※DBの仕様によりミリ秒単位でずれることがあるので、getTimeの差分で判断するなどありますが、
  //  今回はシンプルに文字列比較または updateAt を優先表示します。
  const isUpdated = new Date(page.updatedAt).getTime() > new Date(page.createdAt).getTime() + 1000;
  const displayDateLabel = isUpdated ? '最終更新日' : '保存日';
  const displayDateValue = isUpdated ? page.updatedAt : page.createdAt;

  return (
    <div className='container mx-auto max-w-3xl px-4 py-10'>
      <Button variant='ghost' onClick={() => router.back()} className='mb-4 gap-2 pl-0'>
        <ArrowLeft className='h-4 w-4' /> 戻る
      </Button>

      <Card>
        <CardHeader className='flex flex-row items-start justify-between'>
          <div className='flex items-center gap-4'>
            <Avatar className='h-14 w-14 border bg-gray-50'>
              <AvatarImage src={getFaviconUrl(page.url)} />
              <AvatarFallback>{page.title[0]}</AvatarFallback>
            </Avatar>
            <div>
              {isEditing ? (
                <span className='text-sm font-bold text-primary'>編集中...</span>
              ) : (
                <CardTitle className='text-xl md:text-2xl'>{page.title}</CardTitle>
              )}
            </div>
          </div>

          {/* 操作ボタン (閲覧時のみ表示) */}
          {!isEditing && (
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' onClick={() => setIsEditing(true)}>
                <Pencil className='mr-2 h-4 w-4' /> 編集
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='text-red-500 hover:bg-red-50 hover:text-red-700'
                onClick={handleDelete}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          )}
        </CardHeader>

        <Separator />

        <CardContent className='pt-6'>
          {isEditing ? (
            /* ================= 編集モード ================= */
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>タイトル</label>
                <Input {...register('title')} />
                {errors.title && (
                  <p className='text-xs text-red-500'>{errors.title.message as string}</p>
                )}
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>URL</label>
                <Input {...register('url')} />
                {errors.url && (
                  <p className='text-xs text-red-500'>{errors.url.message as string}</p>
                )}
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>タグ</label>
                <div className='mb-2 flex gap-2'>
                  <Input
                    placeholder='新しいタグ'
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewTag())}
                  />
                  <Button type='button' onClick={handleAddNewTag} variant='secondary'>
                    <PlusCircle className='h-4 w-4' />
                  </Button>
                </div>
                {/* 既存タグ選択エリア */}
                <div className='flex min-h-[40px] flex-wrap gap-2 rounded border bg-gray-50 p-2'>
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className='cursor-pointer'
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className='text-xs text-muted-foreground'>
                  選択中のタグ: {selectedTags.join(', ')}
                </p>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>メモ</label>
                <Textarea {...register('memo')} rows={5} />
              </div>

              <div className='flex justify-end gap-2 pt-4'>
                <Button type='button' variant='ghost' onClick={() => setIsEditing(false)}>
                  キャンセル
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  <Save className='mr-2 h-4 w-4' /> 保存
                </Button>
              </div>
            </form>
          ) : (
            /* ================= 閲覧モード ================= */
            <div className='space-y-6'>
              {/* URL */}
              <div>
                <h3 className='mb-1 text-sm font-medium text-muted-foreground'>URL</h3>
                <a
                  href={page.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-1 break-all text-blue-600 hover:underline'
                >
                  {page.url}
                  <ExternalLink className='h-3 w-3' />
                </a>
              </div>

              {/* タグ */}
              <div>
                <h3 className='mb-2 text-sm font-medium text-muted-foreground'>タグ</h3>
                <div className='flex flex-wrap gap-2'>
                  {page.tags.length > 0 ? (
                    page.tags.map((tag) => (
                      <Badge key={tag} variant='secondary' className='text-sm'>
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className='text-sm text-gray-400'>タグなし</span>
                  )}
                </div>
              </div>

              {/* メモ */}
              <div>
                <h3 className='mb-1 text-sm font-medium text-muted-foreground'>メモ</h3>
                <div className='min-h-[80px] whitespace-pre-wrap rounded-md border bg-gray-50 p-4 text-sm'>
                  {page.memo || <span className='text-gray-400'>メモはありません</span>}
                </div>
              </div>

              {/* 日付 */}
              <div className='flex items-center gap-2 border-t pt-4 text-sm text-gray-500'>
                <Calendar className='h-4 w-4' />
                <span>
                  {displayDateLabel}: {formatDate(displayDateValue)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
