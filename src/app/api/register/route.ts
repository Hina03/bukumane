import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateVerificationToken } from '@/lib/token';
import { sendVerificationEmail } from '@/lib/mail';

// バリデーションスキーマ
const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = registerSchema.parse(body);

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // ユーザー作成
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // トークン生成とメール送信
    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(email, verificationToken.token);

    return NextResponse.json({ success: '確認メールを送信しました' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力内容が不正です' }, { status: 400 });
    }
    return NextResponse.json({ error: 'アカウント作成中にエラーが発生しました' }, { status: 500 });
  }
}
