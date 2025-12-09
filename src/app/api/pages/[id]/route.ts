import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// 更新用バリデーションスキーマ
const updatePageSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  memo: z.string().optional(),
  tags: z.array(z.string()), // タグ名の配列
});

// 共通: ユーザーID取得と所有権チェック
async function checkOwnership(req: Request, pageId: string) {
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
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = await checkOwnership(req, params.id);
  if (!userId) return NextResponse.json({ error: 'Not Found or Unauthorized' }, { status: 404 });

  try {
    const page = await prisma.page.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          include: { tag: true },
          orderBy: { tag: { name: 'asc' } },
        },
      },
    });

    if (!page) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    // 整形して返す
    return NextResponse.json({
      id: page.id,
      title: page.title,
      url: page.url,
      memo: page.memo,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      tags: page.tags.map((pt) => pt.tag.name), // 名前だけの配列にする
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// PUT: 更新
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const userId = await checkOwnership(req, params.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, url, memo, tags } = updatePageSchema.parse(body);

    // トランザクションでタグの更新を一括処理
    const updatedPage = await prisma.$transaction(async (tx) => {
      // 1. 既存のタグ紐付け(PageOnTag)を全て削除
      await tx.pageOnTag.deleteMany({
        where: { pageId: params.id },
      });

      // 2. タグIDリストを準備 (既存なら取得、なければ作成)
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

      // 3. ページ本体の更新と、新しいタグ紐付けの作成
      return await tx.page.update({
        where: { id: params.id },
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
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = await checkOwnership(req, params.id);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.page.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Delete Failed' }, { status: 500 });
  }
}
