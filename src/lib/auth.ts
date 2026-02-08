import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // 1. 入力が無い場合のエラー
        if (!credentials?.email || !credentials?.password) {
          throw new Error('認証情報を入力してください');
        }

        // 2. ユーザーをDBから探す
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // 3 & 4. ユーザーが存在しない、またはパスワードが間違っている場合
        if (
          !user ||
          !user.password ||
          !(await bcrypt.compare(credentials.password, user.password))
        ) {
          throw new Error('メールアドレスまたはパスワードが正しくありません');
        }

        return user;
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  secret: process.env.SECRET,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 初回: ログイン時（Google / Credentials 共通）
      // user にはDBから取得した User オブジェクトが入る
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }

      // update() が呼ばれたとき → token を上書きする
      // trigger === 'update' の時、session には更新したい値（name, emailなど）が入る
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
        if (session.image) token.image = session.image;
      }

      return token;
    },

    async session({ session, token }) {
      // JWT から session.user へ反映
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.user.image = token.image as string;

      return session;
    },
  },
};
