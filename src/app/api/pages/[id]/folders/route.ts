import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { folderId } = await req.json();
    const pageId = params.id;

    // 中間テーブルにレコードを作成（既にある場合は何もしない）
    await prisma.pageOnFolder.upsert({
      where: {
        pageId_folderId: { pageId, folderId },
      },
      update: {},
      create: { pageId, folderId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to add to folder' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');
    const pageId = params.id;

    if (!folderId) return NextResponse.json({ error: 'folderId required' }, { status: 400 });

    await prisma.pageOnFolder.delete({
      where: {
        pageId_folderId: { pageId, folderId },
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove from folder' }, { status: 500 });
  }
}
