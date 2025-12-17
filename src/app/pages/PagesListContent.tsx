'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ExternalLink, Plus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import SearchPanel from '@/components/SearchPanel';

// 型定義
type Tag = {
  id: string;
  name: string;
};

type Bookmark = {
  id: string;
  title: string;
  url: string;
  tags: Tag[];
  createdAt: string;
};

export default function PagesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get('tag'); // URLから選択中のタグを取得

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // データ取得
  useEffect(() => {
    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        // タグが選択されていればクエリパラメータを付与
        const query = searchParams.toString();
        const res = await fetch(`/api/pages?${query}`);

        if (res.ok) {
          const data = await res.json();
          setBookmarks(data);
        }
      } catch (error) {
        console.error('ブックマークの取得に失敗しました', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, [searchParams]); // searchParamsが変わるたびに再取得

  // タグクリック時の処理
  const handleTagClick = (e: React.MouseEvent, tagName: string) => {
    e.stopPropagation();
    router.push(`/pages?inc=${encodeURIComponent(tagName)}`);
  };

  // フィルタ解除
  const clearFilter = () => {
    router.push('/pages');
  };

  // Favicon取得用URL生成ヘルパー
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* ヘッダーエリア */}
      <div className='mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <h1 className='text-3xl font-bold'>ページ一覧</h1>
      </div>

      <SearchPanel />

      {/* ローディング表示 */}
      {isLoading ? (
        <div className='mt-20 flex justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className='mt-20 text-center text-gray-500'>
          <p>ブックマークが見つかりません。</p>
          {selectedTag && (
            <Button variant='link' onClick={clearFilter}>
              絞り込みを解除する
            </Button>
          )}
        </div>
      ) : (
        /* カードグリッド */
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {bookmarks.map((bookmark) => (
            <Card
              key={bookmark.id}
              className='group relative cursor-pointer transition-shadow duration-200 hover:shadow-lg'
              onClick={() => router.push(`/pages/${bookmark.id}`)} // 詳細ページへ遷移
            >
              <CardHeader className='flex flex-row items-center gap-4 pb-2'>
                {/* アイコン (Google Favicon API使用) */}
                <Avatar className='h-10 w-10 border bg-gray-50'>
                  <AvatarImage src={getFaviconUrl(bookmark.url)} alt={bookmark.title} />
                  <AvatarFallback>{bookmark.title.substring(0, 1)}</AvatarFallback>
                </Avatar>

                <div className='flex-1 overflow-hidden'>
                  <CardTitle className='truncate text-base' title={bookmark.title}>
                    {bookmark.title}
                  </CardTitle>
                  <p className='truncate text-xs text-muted-foreground'>{bookmark.url}</p>
                </div>
              </CardHeader>

              <CardContent>
                {/* タグリスト */}
                <div className='mt-2 flex flex-wrap gap-2'>
                  {bookmark.tags.length > 0 ? (
                    bookmark.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant='secondary'
                        className='cursor-pointer transition-colors hover:bg-primary hover:text-white'
                        onClick={(e) => handleTagClick(e, tag.name)}
                      >
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <span className='text-xs text-gray-400'>タグなし</span>
                  )}
                </div>

                {/* 右上の外部リンクアイコン (おまけ: 直接サイトへ飛ぶ用) */}
                <div className='absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100'>
                  <a
                    href={bookmark.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={(e) => e.stopPropagation()} // 詳細遷移を止める
                    className='block rounded-full border bg-white p-2 shadow-sm hover:bg-gray-100'
                  >
                    <ExternalLink className='h-4 w-4 text-gray-500' />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Button
        onClick={() => router.push('/addPage')} // 登録画面のパスを指定
        className='fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full shadow-xl transition-transform hover:scale-105'
        size='icon'
        aria-label='新しいブックマークを登録'
      >
        <Plus className='h-6 w-6' />
      </Button>
    </div>
  );
}
