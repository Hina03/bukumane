// ページ登録処理
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// バリデーションスキーマ
const bookmarkCreateSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  url: z.url('有効なURLを入力してください'),
  memo: z.string().optional(),
  tags: z.array(z.string()), // タグ名の配列
});

export async function POST(req: Request) {
  try {
    // 1. セッションチェック
    const session = await getServerSession(authOptions);

    // next-authの型定義によっては id が無い場合があるのでチェック
    // (auth.tsで id を入れている前提ですが、安全のため)
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーIDを取得 (型アサーションで string として扱う)
    const userId = (session.user as { id: string }).id;

    // 2. リクエストボディのパース
    const body = await req.json();
    const { title, url, memo, tags } = bookmarkCreateSchema.parse(body);

    // 3. トランザクション処理 (データの整合性を保つため)
    // 複数のDB操作（タグの準備 -> ページの作成 -> 中間テーブル作成）を一括で行います
    const result = await prisma.$transaction(async (tx) => {
      // A. タグIDのリストを準備する
      const tagIds: string[] = [];

      for (const tagName of tags) {
        // ユーザー自身のタグを探す
        let tag = await tx.tag.findUnique({
          where: {
            name_userId: {
              // @@unique([name, userId]) の制約を利用
              name: tagName,
              userId: userId,
            },
          },
        });

        // なければ新規作成
        if (!tag) {
          tag = await tx.tag.create({
            data: {
              name: tagName,
              userId: userId,
            },
          });
        }
        tagIds.push(tag.id);
      }

      // B. ページ（ブックマーク）を作成し、中間テーブルでタグと紐付ける
      // Page モデルには @@unique([url, userId]) があるため、重複登録もチェック可能
      const page = await tx.page.create({
        data: {
          title,
          url,
          memo,
          userId,
          // 中間テーブル (PageOnTag) を作成
          tags: {
            create: tagIds.map((tagId) => ({
              tag: {
                connect: { id: tagId },
              },
            })),
          },
        },
        include: {
          tags: {
            include: {
              tag: true, // レスポンスにタグ名を含める
            },
          },
        },
      });

      return page;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Add Page Error:', error);

    // Prismaのユニーク制約違反エラー (URL重複など)
    // エラーコード P2002 は Unique constraint failed
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このURLは既に登録されています' },
        { status: 409 } // Conflict
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力内容が不正です', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
