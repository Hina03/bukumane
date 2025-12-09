export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    // URLパラメータからタグを取得 (?tag=React)
    const { searchParams } = new URL(req.url);
    const tagFilter = searchParams.get('tag');

    // クエリ条件の構築
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereCondition: any = {
      userId: userId,
    };

    // タグで絞り込む場合
    if (tagFilter) {
      whereCondition.tags = {
        some: {
          tag: {
            name: tagFilter,
          },
        },
      };
    }

    const pages = await prisma.page.findMany({
      where: whereCondition,
      include: {
        // 中間テーブルを経由してタグ情報を取得
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // 新しい順
      },
    });

    // フロントエンドで使いやすい形に整形
    const formattedPages = pages.map((page) => ({
      id: page.id,
      title: page.title,
      url: page.url,
      memo: page.memo,
      createdAt: page.createdAt,
      // 中間テーブルの構造をフラットなタグ配列に変換
      tags: page.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
      })),
    }));

    return NextResponse.json(formattedPages);
  } catch (error) {
    console.error('Failed to fetch pages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
