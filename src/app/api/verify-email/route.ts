import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const { token } = body;

  const existingToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!existingToken) {
    return NextResponse.json({ error: 'トークンが無効です' }, { status: 400 });
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return NextResponse.json({ error: 'トークンの有効期限が切れています' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.email },
  });

  if (!existingUser) {
    return NextResponse.json({ error: 'ユーザーが存在しません' }, { status: 400 });
  }

  // ユーザーを認証済みに更新
  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.email, // 念のため更新
    },
  });

  // トークンを削除
  await prisma.verificationToken.delete({
    where: { id: existingToken.id },
  });

  return NextResponse.json({ success: 'メール確認完了' });
}
