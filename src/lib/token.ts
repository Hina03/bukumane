import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  // 有効期限を1時間に設定
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  // 既存のトークンがあれば削除（再送対応）
  const existingToken = await prisma.verificationToken.findFirst({
    where: { email },
  });

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: { id: existingToken.id },
    });
  }

  // 新しいトークンを保存
  const verificationToken = await prisma.verificationToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return verificationToken;
};

export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1時間有効

  const existingToken = await prisma.passwordResetToken.findFirst({
    where: { email },
  });

  if (existingToken) {
    await prisma.passwordResetToken.delete({ where: { id: existingToken.id } });
  }

  return await prisma.passwordResetToken.create({
    data: { email, token, expires },
  });
};
