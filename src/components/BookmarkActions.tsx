'use client';

import { MoreVertical, FolderPlus, Check, Folder, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; // ShadcnのDropdownコンポーネントを想定
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Props = {
  bookmarkId: string;
  currentFolderIds: string[];
  allFolders: { id: string; name: string }[];
  onRefresh: () => void;
};

export default function BookmarkActions({
  bookmarkId,
  currentFolderIds,
  allFolders,
  onRefresh,
}: Props) {
  const handleDelete = async () => {
    if (!confirm('このブックマークを削除しますか？')) return;

    try {
      const res = await fetch(`/api/pages/${bookmarkId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('削除しました');
        onRefresh(); // 親コンポーネントを再読み込み
      } else {
        toast.error('削除に失敗しました');
      }
    } catch {
      toast.error('エラーが発生しました');
    }
  };

  const toggleFolder = async (folderId: string, isInFolder: boolean) => {
    const method = isInFolder ? 'DELETE' : 'POST';
    const url = isInFolder
      ? `/api/pages/${bookmarkId}/folders?folderId=${folderId}`
      : `/api/pages/${bookmarkId}/folders`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: isInFolder ? null : JSON.stringify({ folderId }),
    });

    if (res.ok) {
      onRefresh(); // 親コンポーネントのデータを更新
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-8 w-8'>
          <MoreVertical className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>操作</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderPlus className='mr-2 h-4 w-4' />
            <span>フォルダに追加/解除</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className='max-h-60 overflow-y-auto'>
            {allFolders.map((folder) => {
              const isSelected = currentFolderIds.includes(folder.id);
              return (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => toggleFolder(folder.id, isSelected)}
                >
                  <div className='flex w-full items-center justify-between'>
                    <span className='flex items-center gap-2'>
                      <Folder className='h-3 w-3 text-blue-500' />
                      {folder.name}
                    </span>
                    {isSelected && <Check className='h-4 w-4 text-green-500' />}
                  </div>
                </DropdownMenuItem>
              );
            })}
            {allFolders.length === 0 && (
              <div className='p-2 text-xs text-muted-foreground'>フォルダがありません</div>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem
          className='text-red-600 focus:bg-red-50 focus:text-red-600'
          onClick={handleDelete}
        >
          <Trash2 className='mr-2 h-4 w-4' />
          <span>ブックマークを削除</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
