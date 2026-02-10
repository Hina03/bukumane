'use client';

import { useState } from 'react';
import { Folder as FolderIcon, Plus, Trash2, AlertTriangle, Inbox } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  _count?: { pages: number };
};

interface FolderGridProps {
  folders: Folder[];
  currentFolderId: string | null;
  onFolderClick: (id: string) => void;
  onFolderCreated: () => void;
  onDropBookmark: (bookmarkId: string | string[], folderId: string, folderName: string) => void;
}

export default function FolderGrid({
  folders,
  currentFolderId,
  onFolderClick,
  onFolderCreated,
  onDropBookmark,
}: FolderGridProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 現在の階層にあるフォルダのみをフィルタリング
  const displayedFolders = folders.filter((f) => f.parentId === currentFolderId);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const res = await fetch('/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name: newFolderName, parentId: currentFolderId }),
    });

    if (res.ok) {
      setNewFolderName('');
      setIsDialogOpen(false);
      onFolderCreated(); // 親コンポーネントに再取得を通知
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    try {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onFolderCreated(); // 再読み込み

        // Sonnerで通知を出す
        toast(`フォルダ「${folder.name}」を削除しました`, {
          description: '中身は一つ上の階層へ移動しました。',
        });
      }
    } catch {
      toast.error('削除に失敗しました');
    }
  };

  return (
    <div className='mb-8 space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-sm font-semibold text-muted-foreground'>フォルダ</h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant='ghost' size='sm' className='h-8 gap-1 text-xs'>
              <Plus className='h-3 w-3' />
              新規フォルダ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいフォルダを作成</DialogTitle>
            </DialogHeader>
            <Input
              placeholder='フォルダ名'
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <DialogFooter>
              <Button onClick={handleCreateFolder}>作成</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
        {displayedFolders.map((folder) => {
          const isUncategorized = folder.id === 'uncategorized';
          const count = folder._count?.pages || 0; // 件数取得

          return (
            <Card
              key={folder.id}
              onDragOver={
                isUncategorized
                  ? undefined
                  : (e) => {
                      e.preventDefault(); // これがないとドロップを許可できない
                      e.currentTarget.classList.add('bg-blue-100', 'border-blue-500');
                    }
              }
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-blue-100', 'border-blue-500');
              }}
              onDrop={
                isUncategorized
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('bg-blue-100', 'border-blue-500');

                      // ★ バルクデータの取得を優先
                      const bulkData = e.dataTransfer.getData('bulkBookmarkIds');
                      if (bulkData) {
                        try {
                          const ids = JSON.parse(bulkData);
                          if (Array.isArray(ids)) {
                            onDropBookmark(ids, folder.id, folder.name);
                            return; // バルク処理が終われば終了
                          }
                        } catch (err) {
                          console.error('Failed to parse bulk data:', err);
                        }
                      }

                      const bookmarkId = e.dataTransfer.getData('bookmarkId');
                      if (bookmarkId) {
                        onDropBookmark(bookmarkId, folder.id, folder.name);
                      }
                    }
              }
              className={`group relative flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-slate-50 ${
                isUncategorized ? 'border-dashed bg-slate-50/50' : ''
              }`}
              onClick={() => onFolderClick(folder.id)}
            >
              {/* 未分類ならInboxアイコン、通常ならFolderアイコン */}
              {isUncategorized ? (
                <Inbox className='h-5 w-5 shrink-0 text-slate-400' />
              ) : (
                <FolderIcon className='h-5 w-5 shrink-0 fill-blue-500 text-blue-500' />
              )}

              <span
                className={`truncate pr-6 text-sm font-medium ${isUncategorized ? 'text-slate-600' : ''}`}
              >
                {folder.name}
              </span>

              {/* 件数表示 (右端に配置) */}
              <span
                className={`ml-auto text-xs text-slate-400 ${!isUncategorized ? 'mr-5 group-hover:hidden' : ''}`}
              >
                {count}
              </span>

              {/* 削除ボタン（ホバー時のみ表示） */}
              {!isUncategorized && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className='absolute right-2 p-1 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className='flex items-center gap-2'>
                        <AlertTriangle className='h-5 w-5 text-red-500' />
                        フォルダを削除しますか？
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        「{folder.name}
                        」を削除します。このフォルダ内のサブフォルダは親フォルダに移動します。
                        <br />
                        ※中のブックマーク自体は削除されません。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                        キャンセル
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder);
                        }}
                        className='bg-red-500 hover:bg-red-600'
                      >
                        削除する
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
