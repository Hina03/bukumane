import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// 更新用バリデーションスキーマ
const updatePageSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  memo: z.string().optional(),
  tags: z.array(z.string()),
});

// 共通: ユーザーID取得と所有権チェック
async function checkOwnership(pageId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !('id' in session.user)) return null;

  const userId = (session.user as { id: string }).id;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
  });

  if (!page || page.userId !== userId) return null;
  return userId;
}

// GET: 詳細取得
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const userId = await checkOwnership(id);
  if (!userId) {
    return NextResponse.json({ error: 'Not Found or Unauthorized' }, { status: 404 });
  }

  try {
    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        tags: {
          include: { tag: true },
          orderBy: { tag: { name: 'asc' } },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    return NextResponse.json({
      id: page.id,
      title: page.title,
      url: page.url,
      memo: page.memo,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      tags: page.tags.map((pt) => pt.tag.name),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// PUT: 更新
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const userId = await checkOwnership(id);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, url, memo, tags } = updatePageSchema.parse(body);

    const updatedPage = await prisma.$transaction(async (tx) => {
      await tx.pageOnTag.deleteMany({
        where: { pageId: id },
      });

      const tagIds: string[] = [];
      for (const tagName of tags) {
        let tag = await tx.tag.findUnique({
          where: { name_userId: { name: tagName, userId } },
        });
        if (!tag) {
          tag = await tx.tag.create({ data: { name: tagName, userId } });
        }
        tagIds.push(tag.id);
      }

      return tx.page.update({
        where: { id },
        data: {
          title,
          url,
          memo,
          tags: {
            create: tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        },
      });
    });

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
  }
}

// DELETE: 削除
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.page.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
