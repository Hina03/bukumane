import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateVerificationToken } from '@/lib/token';
import { sendVerificationEmail } from '@/lib/mail';
import { z } from 'zod';

const resendSchema = z.object({
  email: z.email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = resendSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // セキュリティのため、ユーザーがいない場合でも「送信しました」と同じ反応を返すのが一般的
    if (!user || !user.email) {
      return NextResponse.json({ success: '確認メールを再送しました' });
    }

    // すでに認証済みの場合は、その旨を伝えるか、成功を返す
    if (user.emailVerified) {
      return NextResponse.json({ error: 'このメールアドレスは既に認証済みです' }, { status: 400 });
    }

    // 新しいトークンを生成して送信
    const verificationToken = await generateVerificationToken(user.email);
    await sendVerificationEmail(verificationToken.email, verificationToken.token);

    return NextResponse.json({ success: '確認メールを再送しました' });
  } catch {
    return NextResponse.json({ error: '再送処理中にエラーが発生しました' }, { status: 500 });
  }
}
