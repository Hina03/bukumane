'use client';

import { FolderInput, Trash2, X, CheckCircle2, Tag as TagIcon, FolderMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
  selectedCount: number;
  allFolders: { id: string; name: string }[];
  allTags: { id: string; name: string }[];
  onMove: (folderId: string) => void;
  onTag: (tagId: string) => void;
  onDelete: () => void;
  onRemoveFromFolder?: () => void;
  onCancel: () => void;
  activeFolderId?: string | null;
};

export default function BulkActionBar({
  selectedCount,
  allFolders,
  allTags,
  onMove,
  onTag,
  onDelete,
  onRemoveFromFolder,
  onCancel,
  activeFolderId,
}: Props) {
  const isNormalFolder = activeFolderId && activeFolderId !== 'uncategorized';
  // 0件の時に無効化するためのフラグ
  const isDisabled = selectedCount === 0;

  return (
    <div className='fixed bottom-8 left-1/2 z-[100] -translate-x-1/2'>
      <div
        className={`flex items-center gap-6 rounded-full bg-slate-900 px-6 py-3 text-white shadow-2xl transition-opacity ${isDisabled ? 'opacity-80' : 'opacity-100'}`}
      >
        <div className='flex items-center gap-2 border-r border-slate-700 pr-4'>
          <CheckCircle2 className={`h-5 w-5 ${isDisabled ? 'text-slate-500' : 'text-blue-400'}`} />
          <span className={`text-sm font-bold ${isDisabled ? 'text-slate-400' : 'text-white'}`}>
            {selectedCount} 件選択中
          </span>
        </div>

        <div className='flex gap-2'>
          {/* フォルダへ移動 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                disabled={isDisabled}
                className='gap-2 hover:bg-slate-800 hover:text-white disabled:opacity-50'
              >
                <FolderInput className='h-4 w-4' /> フォルダへ移動
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              {allFolders
                .filter((folder) => folder.id !== 'uncategorized')
                .map((folder) => (
                  <DropdownMenuItem key={folder.id} onClick={() => onMove(folder.id)}>
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              {allFolders.filter((f) => f.id !== 'uncategorized').length === 0 && (
                <div className='p-2 text-xs text-muted-foreground'>フォルダがありません</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* タグを付ける */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                disabled={isDisabled}
                className='gap-2 hover:bg-slate-800 hover:text-white disabled:opacity-50'
              >
                <TagIcon className='h-4 w-4' />
                タグを付ける
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {allTags.map((tag) => (
                <DropdownMenuItem key={tag.id} onClick={() => onTag(tag.id)}>
                  {tag.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* フォルダから削除 */}
          {isNormalFolder && (
            <Button
              variant='ghost'
              size='sm'
              disabled={isDisabled}
              onClick={onRemoveFromFolder}
              className='gap-2 text-orange-400 hover:bg-orange-950 hover:text-orange-400 disabled:opacity-50'
            >
              <FolderMinus className='h-4 w-4' /> フォルダから削除
            </Button>
          )}

          {/* 削除 */}
          <Button
            variant='ghost'
            size='sm'
            disabled={isDisabled}
            onClick={onDelete}
            className='gap-2 text-red-400 hover:bg-red-950 hover:text-red-400 disabled:opacity-50'
          >
            <Trash2 className='h-4 w-4' /> 削除
          </Button>
        </div>

        <button onClick={onCancel} className='ml-2 hover:text-slate-400'>
          <X className='h-5 w-5' />
        </button>
      </div>
    </div>
  );
}
