'use client';

import { FolderInput, Trash2, X, CheckCircle2 } from 'lucide-react';
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
  onMove: (folderId: string) => void;
  onDelete: () => void;
  onCancel: () => void;
};

export default function BulkActionBar({
  selectedCount,
  allFolders,
  onMove,
  onDelete,
  onCancel,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className='fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 animate-in slide-in-from-bottom-10'>
      <div className='flex items-center gap-6 rounded-full bg-slate-900 px-6 py-3 text-white shadow-2xl'>
        <div className='flex items-center gap-2 border-r border-slate-700 pr-4'>
          <CheckCircle2 className='h-5 w-5 text-blue-400' />
          <span className='text-sm font-bold'>{selectedCount} 件選択中</span>
        </div>

        <div className='flex gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='gap-2 hover:bg-slate-800 hover:text-white'
              >
                <FolderInput className='h-4 w-4' /> フォルダへ移動
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              {allFolders.map((folder) => (
                <DropdownMenuItem key={folder.id} onClick={() => onMove(folder.id)}>
                  {folder.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant='ghost'
            size='sm'
            onClick={onDelete}
            className='gap-2 text-red-400 hover:bg-red-950 hover:text-red-400'
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
