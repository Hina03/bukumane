import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updatedFolder = await prisma.folder.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: { name },
    });

    return NextResponse.json(updatedFolder);
  } catch {
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: folderId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, userId: true, parentId: true, name: true },
    });

    if (!folder || folder.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      const parentId = folder.parentId;

      await tx.folder.updateMany({
        where: { parentId: folderId },
        data: { parentId },
      });

      if (parentId) {
        const pages = await tx.pageOnFolder.findMany({
          where: { folderId },
        });

        if (pages.length > 0) {
          await tx.pageOnFolder.createMany({
            data: pages.map((p) => ({
              pageId: p.pageId,
              folderId: parentId,
            })),
            skipDuplicates: true,
          });
        }
      }

      await tx.folder.delete({
        where: { id: folderId },
      });
    });

    return NextResponse.json({
      message: 'フォルダを削除しました。中身を移動しました。',
      deletedFolder: folder,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
}
