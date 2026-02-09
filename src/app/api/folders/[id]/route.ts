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
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const folderId = params.id;

    // 1. 削除対象の情報を取得（移動先を特定するため）
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, userId: true, parentId: true, name: true },
    });

    if (!folder || folder.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // 2. トランザクションで「移動」と「削除」を完結させる
    await prisma.$transaction(async (tx) => {
      const parentId = folder.parentId;

      // (a) 子フォルダを親へ移動
      await tx.folder.updateMany({
        where: { parentId: folderId },
        data: { parentId: parentId },
      });

      // (b) ページを親へ移動
      if (parentId) {
        // 親がいる場合：PageOnFolder の folderId を書き換え
        // すでに親に同じページがある場合は重複エラーになるので、
        // 一旦取得して、重複しないものだけ update するか、
        // 以下の「既存を消して新規作成」が確実です。
        const pages = await tx.pageOnFolder.findMany({ where: { folderId } });

        if (pages.length > 0) {
          await tx.pageOnFolder.createMany({
            data: pages.map((p) => ({ pageId: p.pageId, folderId: parentId })),
            skipDuplicates: true,
          });
        }
      }

      // (c) 元のフォルダを削除
      // Cascade設定により、古い PageOnFolder の紐付けは自動で消えます
      await tx.folder.delete({
        where: { id: folderId },
      });
    });

    // フロントエンドのトースト表示用に、元の情報を返してあげる
    return NextResponse.json({
      message: 'フォルダを削除しました。中身を移動しました。',
      deletedFolder: folder,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
}
