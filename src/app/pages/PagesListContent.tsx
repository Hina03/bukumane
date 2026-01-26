'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ExternalLink, Plus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

import SearchPanel from '@/components/SearchPanel';
import FolderGrid from '@/components/FolderGrid';
import FolderBreadcrumb from '@/components/FolderBreadcrumb';
import BookmarkActions from '@/components/BookmarkActions';
import BulkActionBar from '@/components/BulkActionBar';

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
  folders: { id: string; name: string }[];
  createdAt: string;
};

type Folder = {
  id: string;
  name: string;
  parentId: string | null;
};

export default function PagesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get('tag'); // URLから選択中のタグを取得
  const currentFolderId = searchParams.get('folder'); // URLから選択中のフォルダを取得

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 選択の切り替え
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // 一括移動の実行
  const handleBulkMove = async (folderId: string) => {
    const res = await fetch('/api/pages/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids: selectedIds, action: 'move', folderId }),
    });
    if (res.ok) {
      setIsSelectMode(false);
      setSelectedIds([]);
      fetchData(); // 再取得
    }
  };

  // 一括削除の実行
  const handleBulkDelete = async () => {
    if (!confirm(`${selectedIds.length}件のブックマークを削除しますか？`)) return;
    const res = await fetch('/api/pages/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids: selectedIds, action: 'delete' }),
    });
    if (res.ok) {
      setIsSelectMode(false);
      setSelectedIds([]);
      fetchData();
    }
  };

  // フォルダとブックマークの両方を取得
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const query = searchParams.toString();
      const [pagesRes, foldersRes] = await Promise.all([
        fetch(`/api/pages?${query}`),
        fetch('/api/folders'), // フォルダは常に全件（フラットに）取得
      ]);

      if (pagesRes.ok) setBookmarks(await pagesRes.json());
      if (foldersRes.ok) {
        const fetchedFolders = await foldersRes.json();

        // ★ ここで「未分類」フォルダを先頭に追加する
        // 仮想的なID 'uncategorized' を付与
        const uncategorizedFolder: Folder = {
          id: 'uncategorized',
          name: '未分類',
          parentId: null, // ルートに表示するためnull
        };

        // 配列の先頭に結合
        setFolders([uncategorizedFolder, ...fetchedFolders]);
      }
    } catch (error) {
      console.error('データの取得に失敗しました', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // フォルダクリック時のURL更新
  const handleFolderClick = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set('folder', id);
    } else {
      params.delete('folder');
    }
    router.push(`/pages?${params.toString()}`);
  };

  // ドラッグ＆ドロップ時の移動処理（Undo機能付き）
  const handleDropBookmark = async (bookmarkId: string, folderId: string, folderName: string) => {
    const res = await fetch(`/api/pages/${bookmarkId}/folders`, {
      method: 'POST',
      body: JSON.stringify({ folderId }),
    });

    if (res.ok) {
      fetchData(); // リスト更新

      toast(`「${folderName}」に追加しました`, {
        action: {
          label: '元に戻す',
          onClick: async () => {
            await fetch(`/api/pages/${bookmarkId}/folders?folderId=${folderId}`, {
              method: 'DELETE',
            });
            fetchData();
            toast.success('元に戻しました');
          },
        },
      });
    }
  };

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

      <FolderBreadcrumb
        currentFolderId={currentFolderId}
        folders={folders}
        onNavigate={handleFolderClick}
      />

      <FolderGrid
        folders={folders}
        currentFolderId={currentFolderId}
        onFolderClick={handleFolderClick}
        onFolderCreated={fetchData}
        onDropBookmark={handleDropBookmark}
      />

      <hr className='my-8 border-slate-100' />
      <div className='mb-8 flex items-center justify-between'>
        {/* モード切替ボタン */}
        <Button
          variant={isSelectMode ? 'secondary' : 'outline'}
          onClick={() => {
            setIsSelectMode(!isSelectMode);
            setSelectedIds([]);
          }}
        >
          {isSelectMode ? 'キャンセル' : '選択'}
        </Button>
      </div>

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
              draggable={!isSelectMode} // 選択モード中はドラッグ不可にする
              onDragStart={(e) => {
                e.dataTransfer.setData('bookmarkId', bookmark.id);
                e.dataTransfer.effectAllowed = 'move';
                // ドラッグ中の見た目を少し薄くする
                e.currentTarget.style.opacity = '0.5';
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              className={`group relative transition-all ${
                selectedIds.includes(bookmark.id) ? 'bg-blue-50/30 ring-2 ring-blue-500' : ''
              }`}
              onClick={() =>
                isSelectMode ? toggleSelect(bookmark.id) : router.push(`/pages/${bookmark.id}`)
              }
            >
              {/* チェックボックス (選択モード時のみ) */}
              {isSelectMode && (
                <div className='absolute left-3 top-3 z-20'>
                  <Checkbox
                    checked={selectedIds.includes(bookmark.id)}
                    onCheckedChange={() => toggleSelect(bookmark.id)}
                  />
                </div>
              )}
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
                <div className='z-10' onClick={(e) => e.stopPropagation()}>
                  <BookmarkActions
                    bookmarkId={bookmark.id}
                    currentFolderIds={bookmark.folders.map((f) => f.id)}
                    allFolders={folders} // 親で保持している全フォルダリスト
                    onRefresh={fetchData}
                  />
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
      {/* 一括操作バー */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        allFolders={folders}
        onMove={handleBulkMove}
        onDelete={handleBulkDelete}
        onCancel={() => {
          setIsSelectMode(false);
          setSelectedIds([]);
        }}
      />
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
