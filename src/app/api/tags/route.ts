import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// バリデーションスキーマ
const tagSchema = z.object({
  name: z.string().min(1, 'タグ名を入力してください').max(50),
});
const tagUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
});
const tagDeleteSchema = z.object({
  id: z.string(),
});

// ヘルパー: ユーザーID取得
async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !('id' in session.user)) return null;
  return (session.user as { id: string }).id;
}

// GET: 一覧取得 (変更: idとnameを返す)
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json([], { status: 401 });

  try {
    const tags = await prisma.tag.findMany({
      where: { userId },
      select: { id: true, name: true }, // IDも取得する
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(tags);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

// POST: 作成
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name } = tagSchema.parse(body);

    const tag = await prisma.tag.create({
      data: { name, userId },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}

// PUT: 編集
export async function PUT(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name } = tagUpdateSchema.parse(body);

    const tag = await prisma.tag.update({
      where: { id, userId }, // 自分のタグのみ更新
      data: { name },
    });
    return NextResponse.json(tag);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

// DELETE: 削除
export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { id } = tagDeleteSchema.parse(body);

    await prisma.tag.delete({
      where: { id, userId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
