import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// ユーザー（DB）の型
declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // token.idからsession.user.idへ反映
    } & DefaultSession['user'];
  }

  interface User {
    id: string; // userオブジェクトにもidを追加
  }
}

// JWTの型
declare module 'next-auth/jwt' {
  interface JWT {
    id: string | number; // token.id
  }
}
