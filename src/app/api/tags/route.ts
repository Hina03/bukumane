import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. セッションチェック
    const session = await getServerSession(authOptions);

    if (!session?.user || !('id' in session.user)) {
      // ログインしていない場合、空のタグリストを返します (または401エラー)
      return NextResponse.json([]);
    }

    const userId = (session.user as { id: string }).id;

    // 2. ユーザーIDに基づいてタグをDBから取得
    // Tag.name のみを必要とするため、selectで絞り込みます
    const tags = await prisma.tag.findMany({
      where: {
        userId: userId,
      },
      select: {
        name: true,
      },
      orderBy: {
        name: 'asc', // タグ名をアルファベット順でソート
      },
    });

    // 3. レスポンス用にタグ名の配列に変換
    const tagNames = tags.map((tag) => tag.name);

    return NextResponse.json(tagNames);
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    // エラー発生時は空の配列を返し、フロントエンドでの処理を継続できるようにします
    return NextResponse.json([], { status: 500 });
  }
}
