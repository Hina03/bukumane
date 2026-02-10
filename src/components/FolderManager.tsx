'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, Save, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type FolderType = {
  id: string;
  name: string;
  _count?: { pages: number };
  parentId?: string | null;
};

// APIレスポンスの型定義
type FoldersResponse = {
  folders: FolderType[];
  uncategorizedCount: number;
};

export default function FolderManager() {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');

  // 編集用ステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 取得処理の修正
  useEffect(() => {
    fetch('/api/folders')
      .then((res) => res.json())
      .then((data: FoldersResponse) => {
        // data が { folders: [...], uncategorizedCount: ... } なので data.folders を使う
        const fetchedFolders = data.folders || [];
        // 管理画面では実体のあるフォルダのみを表示（仮想フォルダ 'uncategorized' は除外）
        setFolders(fetchedFolders.filter((f) => f.id !== 'uncategorized'));
      })
      .catch((e) => {
        console.error(e);
        toast.error('フォルダの取得に失敗しました');
      })
      .finally(() => setIsLoading(false));
  }, []);

  // 追加 (POSTの戻り値は単体のFolderオブジェクトなのでそのままでOK)
  const handleAdd = async () => {
    if (!newFolderName.trim()) return;
    const res = await fetch('/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name: newFolderName }),
    });
    if (res.ok) {
      const newFolder = await res.json();
      setFolders((prev) => [...prev, newFolder]);
      setNewFolderName('');
      toast.success('フォルダを作成しました');
    }
  };

  // 編集保存
  const saveEdit = async () => {
    if (!editingName.trim()) return;
    const res = await fetch(`/api/folders/${editingId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: editingName }),
    });
    if (res.ok) {
      setFolders((prev) => prev.map((f) => (f.id === editingId ? { ...f, name: editingName } : f)));
      setEditingId(null);
      toast.success('フォルダ名を更新しました');
    }
  };

  // 削除
  const handleDelete = async (folder: FolderType) => {
    if (
      !confirm(
        `フォルダ「${folder.name}」を削除しますか？\n中のブックマークは上の階層へ移動します。`
      )
    )
      return;
    const res = await fetch(`/api/folders/${folder.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      toast.success('フォルダを削除しました');
    }
  };

  const getFolderPath = (folder: FolderType, allFolders: FolderType[]): string => {
    if (!folder.parentId) return folder.name;
    const parent = allFolders.find((f) => f.id === folder.parentId);
    if (!parent) return folder.name;
    return `${getFolderPath(parent, allFolders)} / ${folder.name}`;
  };

  const sortedFolders = [...folders]
    .map((f) => ({ ...f, fullPath: getFolderPath(f, folders) }))
    .sort((a, b) => a.fullPath.localeCompare(b.fullPath, 'ja'));

  if (isLoading)
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    );

  return (
    <div className='space-y-4'>
      {/* 追加フォーム */}
      <div className='flex gap-2'>
        <Input
          placeholder='新しいフォルダ'
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} size='sm'>
          <Plus className='mr-1 h-4 w-4' />
          追加
        </Button>
      </div>

      {/* 一覧 */}
      <div className='space-y-2'>
        {sortedFolders.map((folder) => {
          const pathParts = folder.fullPath.split(' / ');

          return (
            <div
              key={folder.id}
              className='flex items-center justify-between rounded border bg-white p-2'
            >
              {editingId === folder.id ? (
                <div className='flex w-full gap-2'>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  />
                  <Button size='icon' onClick={saveEdit}>
                    <Save className='h-4 w-4' />
                  </Button>
                  <Button size='icon' variant='ghost' onClick={() => setEditingId(null)}>
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              ) : (
                <>
                  <div className='flex items-center gap-2'>
                    <Folder className='h-4 w-4 fill-blue-500/10 text-blue-500' />
                    <span className='truncate text-sm font-medium'>
                      {pathParts.map((part, i) => (
                        <span key={i}>
                          <span
                            className={
                              i === pathParts.length - 1
                                ? 'font-bold text-slate-700'
                                : 'font-normal text-slate-400'
                            }
                          >
                            {part}
                          </span>
                          {i < pathParts.length - 1 && (
                            <span className='mx-1 text-slate-300'>/</span>
                          )}
                        </span>
                      ))}
                    </span>
                    <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500'>
                      {folder._count?.pages || 0}
                    </span>
                  </div>
                  <div className='flex gap-1'>
                    <Button
                      size='icon'
                      variant='ghost'
                      onClick={() => {
                        setEditingId(folder.id);
                        setEditingName(folder.name);
                      }}
                    >
                      <Pencil className='h-4 w-4 text-muted-foreground' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='text-red-400 hover:bg-red-50 hover:text-red-600'
                      onClick={() => handleDelete(folder)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {folders.length === 0 && (
          <p className='py-4 text-center text-sm text-muted-foreground'>フォルダがありません</p>
        )}
      </div>
    </div>
  );
}
