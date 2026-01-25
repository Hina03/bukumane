'use client';

import { useState } from 'react';
import { Folder as FolderIcon, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Folder = {
  id: string;
  name: string;
  parentId: string | null;
};

interface FolderGridProps {
  folders: Folder[];
  currentFolderId: string | null;
  onFolderClick: (id: string) => void;
  onFolderCreated: () => void;
}

export default function FolderGrid({
  folders,
  currentFolderId,
  onFolderClick,
  onFolderCreated,
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
        {displayedFolders.map((folder) => (
          <Card
            key={folder.id}
            className='group flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-slate-50'
            onClick={() => onFolderClick(folder.id)}
          >
            <FolderIcon className='h-5 w-5 fill-blue-500 text-blue-500' />
            <span className='truncate text-sm font-medium'>{folder.name}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
