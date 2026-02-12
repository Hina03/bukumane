// src/proxy.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function proxy() {
    // 認証OK時はそのまま通す
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/pages/:path*',
    '/addPage/:path*',
    '/mypage/:path*',
    '/api/pages/:path*',
    '/api/tags/:path*',
    '/api/folders/:path*',
    '/api/profile/:path*',
    '/api/addPage/:path*',
  ],
};
