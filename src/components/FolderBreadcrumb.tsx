'use client';

import { Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FolderBreadcrumbProps {
  currentFolderId: string | null;
  folders: { id: string; name: string; parentId: string | null }[];
  onNavigate: (id: string | null) => void;
}

export default function FolderBreadcrumb({
  currentFolderId,
  folders,
  onNavigate,
}: FolderBreadcrumbProps) {
  // 現在のフォルダからルートまでのパスを計算
  const getPath = () => {
    const path = [];
    let current = folders.find((f) => f.id === currentFolderId);
    while (current) {
      path.unshift(current);
      current = folders.find((f) => f.id === current?.parentId);
    }
    return path;
  };

  const path = getPath();

  return (
    <div className='mb-4 flex items-center gap-1 text-sm text-muted-foreground'>
      <Button variant='ghost' size='sm' className='h-8 w-8 p-0' onClick={() => onNavigate(null)}>
        <Home className='h-4 w-4' />
      </Button>

      {path.map((folder) => (
        <div key={folder.id} className='flex items-center gap-1'>
          <ChevronRight className='h-4 w-4' />
          <Button
            variant='ghost'
            size='sm'
            className='h-8 px-2 text-xs'
            onClick={() => onNavigate(folder.id)}
          >
            {folder.name}
          </Button>
        </div>
      ))}
    </div>
  );
}
