import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generatePasswordResetToken } from '@/lib/token';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(req: Request) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });

  // ユーザーが存在しない場合も「送信しました」と出す
  if (user) {
    const passwordResetToken = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(passwordResetToken.email, passwordResetToken.token);
  }

  return NextResponse.json({ success: '再設定メールを送信しました' });
}
