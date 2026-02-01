import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const { token, password } = await req.json();

  const existingToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!existingToken || new Date(existingToken.expires) < new Date()) {
    return NextResponse.json({ error: 'トークンが無効または期限切れです' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: existingToken.email } });
  if (!user) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 400 });

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({ where: { id: existingToken.id } });

  return NextResponse.json({ success: 'パスワードを更新しました' });
}
