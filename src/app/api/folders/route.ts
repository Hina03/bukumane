import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma'; // Prismaクライアントのパスに合わせて変更してください
import { authOptions } from '@/lib/auth'; // NextAuthの設定ファイルのパスに合わせて変更してください

// ----------------------------------------------------------------
// GET: フォルダ一覧の取得
// ----------------------------------------------------------------
export async function GET() {
  try {
    // 1. セッションの取得（ログイン確認）
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 2. ユーザーのフォルダを全件取得
    // ※ フロントエンドでツリー構造を作るため、親ID(parentId)も含めてフラットに取得します
    const folders = await prisma.folder.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc', // 作成順（または name: 'asc' で名前順）
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        createdAt: true,
        _count: {
          select: { pages: true }, // Folderモデルのpagesリレーションの数をカウント
        },
      },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Folders GET Error:', error);
    return NextResponse.json({ error: 'フォルダの取得に失敗しました' }, { status: 500 });
  }
}

// ----------------------------------------------------------------
// POST: 新規フォルダの作成
// ----------------------------------------------------------------
export async function POST(req: Request) {
  try {
    // 1. セッションの取得
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 2. リクエストボディの取得
    const body = await req.json();
    const { name, parentId } = body;

    // バリデーション
    if (!name) {
      return NextResponse.json({ error: 'フォルダ名は必須です' }, { status: 400 });
    }

    // 3. フォルダの作成
    const newFolder = await prisma.folder.create({
      data: {
        name,
        // parentId が空文字やundefinedの場合は null にしてルートフォルダとする
        parentId: parentId || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(newFolder);
  } catch (error) {
    console.error('Folders POST Error:', error);
    return NextResponse.json({ error: 'フォルダの作成に失敗しました' }, { status: 500 });
  }
}
