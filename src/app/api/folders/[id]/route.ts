import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const updatedFolder = await prisma.folder.update({
      where: {
        id: params.id,
        userId: session.user.id, // 自分のフォルダのみ
      },
      data: { name },
    });

    return NextResponse.json(updatedFolder);
  } catch {
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const folderId = params.id;

    // 他人のフォルダを消せないように userId をチェック
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.userId !== session.user.id) {
      return NextResponse.json({ error: '削除権限がありません' }, { status: 403 });
    }

    // 削除実行
    // Prismaのスキーマで Cascade が設定されているため、
    // PageOnFolder（中間テーブル）の紐付けも自動で消えます。
    await prisma.folder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ message: '削除しました' });
  } catch (error) {
    console.error('Folder DELETE Error:', error);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
}
