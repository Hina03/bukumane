import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ids, action, folderId, tagId } = await req.json();

    if (!ids || !Array.isArray(ids))
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });

    if (action === 'move' && folderId) {
      // 一括フォルダ追加 (多対多なので既存の紐付けは維持しつつ新規追加)
      const data = ids.map((id) => ({ pageId: id, folderId }));
      await prisma.pageOnFolder.createMany({
        data,
        skipDuplicates: true, // 既に所属している場合はスキップ
      });
    } else if (action === 'tag' && tagId) {
      // ★ 一括タグ追加
      const data = ids.map((id) => ({
        pageId: id,
        tagId: tagId,
      }));
      await prisma.pageOnTag.createMany({
        data,
        skipDuplicates: true, // すでに同じタグが付いている場合はスキップ
      });
    } else if (action === 'delete') {
      // 一括削除
      await prisma.page.deleteMany({
        where: {
          id: { in: ids },
          userId: session.user.id, // セキュリティのため自分のものだけ
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Bulk action failed' }, { status: 500 });
  }
}
