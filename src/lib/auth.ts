import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import prisma from './prisma';
import { PrismaAdapter } from '@next-auth/prisma-adapter';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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
    async signIn({ account }) {
      // Googleログインであれば無条件で許可
      if (account?.provider === 'google') {
        return true;
      }
      return false; // それ以外（もし残っていれば）は拒否
    },
    async jwt({ token, user, trigger, session }) {
      // 初回: ログイン時（Google / Credentials 共通）
      // user にはDBから取得した User オブジェクトが入る
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }

      // update() が呼ばれたとき → token を上書きする
      // trigger === 'update' の時、session には更新したい値（name, emailなど）が入る
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
      }

      return token;
    },

    async session({ session, token }) {
      // JWT から session.user へ反映
      session.user.id = token.id as string;
      session.user.name = token.name as string;

      return session;
    },
  },
};
