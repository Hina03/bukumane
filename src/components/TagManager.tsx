'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, Save, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Tag = { id: string; name: string; _count?: { pages: number } };

export default function TagManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');

  // 編集用ステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 取得
  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => setTags(data))
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, []);

  // 追加
  const handleAdd = async () => {
    if (!newTagName.trim()) return;
    const res = await fetch('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: newTagName }),
    });
    if (res.ok) {
      const newTag = await res.json();
      setTags((prev) => [...prev, newTag]);
      setNewTagName('');
    }
  };

  // 編集開始
  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
  };

  // 編集保存
  const saveEdit = async () => {
    if (!editingName.trim()) return;
    const res = await fetch('/api/tags', {
      method: 'PUT',
      body: JSON.stringify({ id: editingId, name: editingName }),
    });
    if (res.ok) {
      setTags((prev) => prev.map((t) => (t.id === editingId ? { ...t, name: editingName } : t)));
      setEditingId(null);
    }
  };

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    const res = await fetch('/api/tags', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setTags((prev) => prev.filter((t) => t.id !== id));
    }
  };

  if (isLoading) return <Loader2 className='mx-auto animate-spin' />;

  return (
    <div className='space-y-4'>
      {/* 追加フォーム */}
      <div className='flex gap-2'>
        <Input
          placeholder='新しいタグ'
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
        />
        <Button onClick={handleAdd} size='sm'>
          <Plus className='mr-1 h-4 w-4' />
          追加
        </Button>
      </div>

      {/* 一覧 */}
      <div className='space-y-2'>
        {tags.map((tag) => (
          <div
            key={tag.id}
            className='flex items-center justify-between rounded border bg-white p-2'
          >
            {editingId === tag.id ? (
              <div className='flex w-full gap-2'>
                <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
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
                  <Tag className='mr-2 h-4 w-4 fill-blue-500/10 text-blue-500' />
                  <span className='text-sm font-medium'>{tag.name}</span>
                  <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500'>
                    {tag._count?.pages || 0}
                  </span>
                </div>
                <div className='flex gap-1'>
                  <Button size='icon' variant='ghost' onClick={() => startEdit(tag)}>
                    <Pencil className='h-4 w-4 text-muted-foreground' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-red-400 hover:bg-red-50 hover:text-red-600'
                    onClick={() => handleDelete(tag.id)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
