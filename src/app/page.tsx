import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Layout, Grid2X2Check } from 'lucide-react'; // アイコン用

export default async function Home() {
  // 1. サーバーサイドでセッションを取得
  const session = await getServerSession(authOptions);

  // 2. ログイン済みならブックマーク一覧へリダイレクト
  if (session) {
    redirect('/pages');
  }

  // 3. 未ログインならランディングページを表示
  return (
    <div className='flex min-h-screen flex-col'>
      {/* -----------------------------------
        ヒーローセクション（メインビジュアル）
        -----------------------------------
      */}
      <section className='flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4 py-24 text-center'>
        <h1 className='mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl'>
          情報過多の時代に終止符を。
          <br className='hidden sm:inline' />
          あなたのブックマークを資産に変える。
        </h1>
        <p className='mb-10 max-w-2xl text-lg text-slate-600'>
          階層型フォルダと高度なタグ機能で、情報を完全にコントロール。
        </p>
        <div className='flex gap-4'>
          <Button size='lg' asChild>
            <Link href='/register'>新規登録</Link>
          </Button>
          <Button size='lg' variant='outline' asChild>
            <Link href='/login'>ログイン</Link>
          </Button>
        </div>
      </section>

      {/* -----------------------------------
        機能紹介セクション (Features)
        -----------------------------------
      */}
      <section className='bg-white px-4 py-20'>
        <div className='container mx-auto'>
          <h2 className='mb-12 text-center text-3xl font-bold'>bukumaneでできること</h2>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
            <div className='rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600'>
                <Layout className='h-6 w-6' />
              </div>
              <h3 className='mb-2 text-xl font-bold'>フォルダinフォルダ</h3>
              <p className='text-gray-600'>大分類・小分類を自在に作成。</p>
            </div>

            <div className='rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600'>
                <Search className='h-6 w-6' />
              </div>
              <h3 className='mb-2 text-xl font-bold'>究極の検索性</h3>
              <p className='text-gray-600'>タグ、メモ、タイトル全てから瞬時に情報にアクセス。</p>
            </div>

            <div className='rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600'>
                <Grid2X2Check className='h-6 w-6' />
              </div>
              <h3 className='mb-2 text-xl font-bold'>シンプルなUI</h3>
              <p className='text-gray-600'>複雑さを排除した直感的な操作感。</p>
            </div>
          </div>
        </div>
      </section>

      {/* -----------------------------------
        CTAセクション (Call To Action)
        -----------------------------------
      */}
      <section className='bg-slate-900 px-4 py-20 text-center text-white'>
        <h2 className='mb-6 text-3xl font-bold'>あなたの情報整理のストレスを解消します。</h2>
        <Button size='lg' variant='secondary' asChild className='px-8 text-lg'>
          <Link href='/register'>今すぐアカウント作成</Link>
        </Button>
      </section>

      {/* フッター */}
      <footer className='border-t py-6 text-center text-sm text-gray-500'>
        &copy; {new Date().getFullYear()} bukumane. All rights reserved.
      </footer>
    </div>
  );
}
