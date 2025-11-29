'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button'; // shadcn/uiのButtonを使用

export const Header = () => {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  return (
    <header className='border-b bg-white'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        <div className='text-xl font-bold'>
          <Link href='/' className='transition-opacity hover:opacity-80'>
            bukumane
          </Link>
        </div>

        {/* 右側：ナビゲーション */}
        {/* ロード中は何も表示しないことでチラつきを防ぐ */}
        {!loading && (
          <nav className='flex items-center gap-4'>
            {session ? (
              // ログイン時の表示
              <>
                <Button variant='ghost' asChild>
                  <Link href='/pages'>Pages</Link>
                </Button>

                <Button variant='ghost' asChild>
                  <Link href='/mypage'>Mypage</Link>
                </Button>

                <Button variant='outline' onClick={() => signOut({ callbackUrl: '/login' })}>
                  ログアウト
                </Button>
              </>
            ) : (
              // 未ログイン時の表示
              <Button asChild>
                <Link href='/login'>ログイン</Link>
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
