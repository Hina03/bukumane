export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    // --- URLパラメータの解析 ---
    const { searchParams } = new URL(req.url);

    // フォルダID (NEW)
    const folderId = searchParams.get('folder');

    // キーワード検索 (NEW: タイトル・メモ・URLの部分一致)
    const query = searchParams.get('q');

    // 既存のタグパラメータ
    const legacyTag = searchParams.get('tag');
    const mode = searchParams.get('mode') === 'OR' ? 'OR' : 'AND';
    const includeParam = searchParams.get('inc');
    const excludeParam = searchParams.get('exc');

    // タグリストの配列化
    const includeTags = includeParam ? includeParam.split(',').filter(Boolean) : [];
    const excludeTags = excludeParam ? excludeParam.split(',').filter(Boolean) : [];

    if (legacyTag && !includeTags.includes(legacyTag)) {
      includeTags.push(legacyTag);
    }

    // --- クエリ条件の構築 ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereCondition: any = {
      userId: userId,
      AND: [],
    };

    // 1. フォルダによる絞り込み (NEW)
    // 指定されたフォルダIDを持つ中間テーブル(PageOnFolder)が存在するか確認
    if (folderId) {
      whereCondition.AND.push({
        folders: {
          some: {
            folderId: folderId,
          },
        },
      });
    }

    // 2. キーワード検索 (NEW)
    if (query) {
      whereCondition.AND.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } }, // 大文字小文字区別なし
          { memo: { contains: query, mode: 'insensitive' } },
          { url: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    // 3. 除外タグ (NOT検索)
    if (excludeTags.length > 0) {
      whereCondition.AND.push({
        tags: {
          none: {
            tag: {
              name: { in: excludeTags },
            },
          },
        },
      });
    }

    // 4. 検索タグ (AND/OR検索)
    if (includeTags.length > 0) {
      if (mode === 'OR') {
        whereCondition.AND.push({
          tags: {
            some: {
              tag: {
                name: { in: includeTags },
              },
            },
          },
        });
      } else {
        // AND検索
        includeTags.forEach((tagName) => {
          whereCondition.AND.push({
            tags: {
              some: {
                tag: {
                  name: tagName,
                },
              },
            },
          });
        });
      }
    }

    if (whereCondition.AND.length === 0) {
      delete whereCondition.AND;
    }

    // --- DB検索実行 ---
    const pages = await prisma.page.findMany({
      where: whereCondition,
      include: {
        // タグ情報の取得
        tags: {
          include: {
            tag: true,
          },
        },
        // ★ フォルダ情報の取得を追加 (NEW)
        folders: {
          include: {
            folder: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // --- レスポンス整形 ---
    const formattedPages = pages.map((page) => ({
      id: page.id,
      title: page.title,
      url: page.url,
      memo: page.memo,
      createdAt: page.createdAt,

      // タグをフラットに整形
      tags: page.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
      })),

      // ★ フォルダをフラットに整形 (NEW)
      // 中間テーブル(PageOnFolder)から実際のFolder情報を抜き出す
      folders: page.folders.map((pf) => ({
        id: pf.folder.id,
        name: pf.folder.name,
      })),
    }));

    return NextResponse.json(formattedPages);
  } catch (error) {
    console.error('Failed to fetch pages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
