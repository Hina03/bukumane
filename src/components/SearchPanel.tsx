'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// ★ RotateCcw (リセット用アイコン) を追加
import { Check, X, ToggleLeft, ToggleRight, Loader2, Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// タグの状態定義
type TagState = 'include' | 'exclude' | 'off';

export default function SearchPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLから初期状態を復元
  const initialMode = searchParams.get('mode') === 'OR' ? 'OR' : 'AND';
  const initialInc = searchParams.get('inc')?.split(',').filter(Boolean) || [];
  const initialExc = searchParams.get('exc')?.split(',').filter(Boolean) || [];

  // ?tag=... パラメータも取得
  const legacyTag = searchParams.get('tag');

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isOrMode, setIsOrMode] = useState(initialMode === 'OR');

  // 各タグの状態を管理するマップ
  const [tagStates, setTagStates] = useState<Record<string, TagState>>({});

  // 1. タグ一覧の取得と初期状態設定
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags');
        if (res.ok) {
          const tags: { name: string }[] = await res.json();
          const tagNames = tags.map((t) => t.name);
          setAvailableTags(tagNames);

          // URLパラメータを元にステートを初期化
          const newStates: Record<string, TagState> = {};
          initialInc.forEach((tag) => (newStates[tag] = 'include'));
          initialExc.forEach((tag) => (newStates[tag] = 'exclude'));

          // tagパラメータがあればincludeに追加
          if (legacyTag && !newStates[legacyTag]) {
            newStates[legacyTag] = 'include';
          }

          setTagStates(newStates);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. 検索実行（URL更新）
  const applySearch = () => {
    const includes: string[] = [];
    const excludes: string[] = [];

    Object.entries(tagStates).forEach(([tag, state]) => {
      if (state === 'include') includes.push(tag);
      if (state === 'exclude') excludes.push(tag);
    });

    const params = new URLSearchParams();
    if (isOrMode) params.set('mode', 'OR');
    if (includes.length > 0) params.set('inc', includes.join(','));
    if (excludes.length > 0) params.set('exc', excludes.join(','));

    router.push(`/pages?${params.toString()}`);
  };

  // ★ 追加: リセット処理
  const resetSearch = () => {
    setTagStates({}); // タグ選択を全クリア
    setIsOrMode(false); // モードをANDに戻す
    router.push('/pages'); // URLパラメータなしで一覧へ遷移（全件表示）
  };

  // 3. タグクリック時の状態サイクル処理
  const cycleTagState = (tag: string) => {
    setTagStates((prev) => {
      const current = prev[tag] || 'off';
      let next: TagState = 'off';

      if (current === 'off') next = 'include';
      else if (current === 'include') next = 'exclude';
      else if (current === 'exclude') next = 'off';

      const newState = { ...prev, [tag]: next };
      if (next === 'off') delete newState[tag];
      return newState;
    });
  };

  if (isLoading)
    return (
      <div className='py-4 text-center text-sm text-muted-foreground'>
        <Loader2 className='mr-2 inline animate-spin' />
        タグ読み込み中...
      </div>
    );

  return (
    <Card className='mb-6 bg-slate-50/50'>
      <CardContent className='pt-6'>
        <div className='flex flex-col gap-4'>
          {/* コントロールエリア */}
          <div className='flex items-start justify-between'>
            {' '}
            {/* items-center から items-start に変更 */}
            {/* 左側: トグルスイッチ */}
            <div className='flex items-center gap-2 pt-1'>
              <span
                className={`text-sm font-bold ${isOrMode ? 'text-muted-foreground' : 'text-primary'}`}
              >
                AND検索
              </span>
              <button
                onClick={() => setIsOrMode(!isOrMode)}
                className='text-2xl text-blue-600 transition-transform hover:scale-105'
                title='AND/OR 切り替え'
              >
                {isOrMode ? (
                  <ToggleRight className='h-10 w-10' />
                ) : (
                  <ToggleLeft className='h-10 w-10 text-slate-400' />
                )}
              </button>
              <span
                className={`text-sm font-bold ${isOrMode ? 'text-orange-600' : 'text-muted-foreground'}`}
              >
                OR検索
              </span>
            </div>
            {/* 右側: アクションボタン群 (横並び) */}
            <div className='flex items-center gap-2'>
              {/* リセットボタンを先に配置（または適用ボタンの後でも可） */}
              <Button
                onClick={resetSearch}
                variant='ghost'
                size='sm'
                className='h-9 text-xs text-muted-foreground hover:bg-red-50 hover:text-red-600'
              >
                <RotateCcw className='mr-1.5 h-3.5 w-3.5' />
                リセット
              </Button>

              <Button onClick={applySearch} size='sm' className='h-9 gap-2 shadow-sm'>
                <Search className='h-4 w-4' />
                検索を適用
              </Button>
            </div>
          </div>

          {/* タグ一覧エリア */}
          <div className='flex flex-wrap gap-2'>
            {availableTags.length === 0 && (
              <p className='text-sm text-muted-foreground'>タグがありません</p>
            )}

            {availableTags.map((tag) => {
              const state = tagStates[tag] || 'off';

              // 状態に応じたスタイル定義
              let variantStyle = 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'; // Off
              let icon = null;

              if (state === 'include') {
                variantStyle = isOrMode
                  ? 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200' // OR Include
                  : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'; // AND Include
                icon = <Check className='mr-1 h-3 w-3' />;
              } else if (state === 'exclude') {
                variantStyle =
                  'bg-red-100 border-red-300 text-red-700 hover:bg-red-200 decoration-red-500'; // Exclude
                icon = <X className='mr-1 h-3 w-3' />;
              }

              return (
                <Badge
                  key={tag}
                  variant='outline'
                  className={`cursor-pointer select-none border px-3 py-1.5 transition-all ${variantStyle}`}
                  onClick={() => cycleTagState(tag)}
                >
                  {icon}
                  {tag}
                </Badge>
              );
            })}
          </div>

          {/* ガイドテキスト */}
          <div className='mt-2 flex gap-4 text-xs text-muted-foreground'>
            <span className='flex items-center'>
              <span className='mr-1 h-2 w-2 rounded-full border border-blue-300 bg-blue-100'></span>
              : 含む(AND)
            </span>
            <span className='flex items-center'>
              <span className='mr-1 h-2 w-2 rounded-full border border-orange-300 bg-orange-100'></span>
              : 含む(OR)
            </span>
            <span className='flex items-center'>
              <span className='mr-1 h-2 w-2 rounded-full border border-red-300 bg-red-100'></span>:
              除外(NOT)
            </span>
            <span className='ml-auto'>クリックで切り替え</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
