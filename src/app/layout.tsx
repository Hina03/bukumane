import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { NextAuthProvider } from './provider';
import { Header } from '@/components/Header';
import { Toaster } from 'sonner';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'bukumane',
  description: 'ブックマーク管理アプリ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextAuthProvider>
          <Header />
          <main className='container mx-auto p-4'>
            {children}
            <Toaster position='top-center' richColors />
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}
