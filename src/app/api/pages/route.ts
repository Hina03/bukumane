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

    // 既存の ?tag=... (単一タグフィルタ)
    const legacyTag = searchParams.get('tag');

    // 新しいパラメータ (AND/OR/NOT検索用)
    // mode: 'OR' | 'AND' (default)
    // inc: カンマ区切りの含めるタグ
    // exc: カンマ区切りの除外するタグ
    const mode = searchParams.get('mode') === 'OR' ? 'OR' : 'AND';
    const includeParam = searchParams.get('inc');
    const excludeParam = searchParams.get('exc');

    // タグリストの配列化
    // incパラメータがある場合はそれを分解、なければ空配列
    const includeTags = includeParam ? includeParam.split(',').filter(Boolean) : [];
    const excludeTags = excludeParam ? excludeParam.split(',').filter(Boolean) : [];

    // 後方互換性: ?tag=... が指定されていて、incに含まれていない場合は追加する
    if (legacyTag && !includeTags.includes(legacyTag)) {
      includeTags.push(legacyTag);
    }

    // --- クエリ条件の構築 ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereCondition: any = {
      userId: userId,
      AND: [], // 複数の条件をANDで結合するための配列
    };

    // 1. 除外タグ (NOT検索) - 最優先
    // 指定された除外タグの「いずれか」を持つレコードは除外する
    // tags: { none: { tag: { name: { in: excludeTags } } } }
    if (excludeTags.length > 0) {
      whereCondition.AND.push({
        tags: {
          none: {
            tag: {
              name: {
                in: excludeTags,
              },
            },
          },
        },
      });
    }

    // 2. 検索タグ (AND/OR検索)
    if (includeTags.length > 0) {
      if (mode === 'OR') {
        // OR検索: 指定タグの「いずれか」を持つ
        // tags: { some: { tag: { name: { in: includeTags } } } }
        whereCondition.AND.push({
          tags: {
            some: {
              tag: {
                name: {
                  in: includeTags,
                },
              },
            },
          },
        });
      } else {
        // AND検索: 指定タグの「すべて」を持つ
        // Prismaで多対多のAND検索をする場合、各タグごとに「そのタグを持っているか」の条件を追加する
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

    // AND配列が空の場合はクエリから削除（不要なプロパティを残さないため）
    if (whereCondition.AND.length === 0) {
      delete whereCondition.AND;
    }

    // --- DB検索実行 ---
    const pages = await prisma.page.findMany({
      where: whereCondition,
      include: {
        // 中間テーブルを経由してタグ情報を取得
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // 新しい順
      },
    });

    // --- レスポンス整形 ---
    const formattedPages = pages.map((page) => ({
      id: page.id,
      title: page.title,
      url: page.url,
      memo: page.memo,
      createdAt: page.createdAt,
      // 中間テーブルの構造をフラットなタグ配列に変換
      tags: page.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
      })),
    }));

    return NextResponse.json(formattedPages);
  } catch (error) {
    console.error('Failed to fetch pages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
