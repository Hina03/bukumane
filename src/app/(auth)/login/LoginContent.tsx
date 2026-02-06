'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/pages';

  return (
    <div className='flex h-[calc(100vh-64px)] w-full flex-col items-center justify-center overflow-hidden bg-white px-4'>
      <div className='flex w-full max-w-[340px] flex-col items-center'>
        <Link href='/' className='mb-6 transition-opacity hover:opacity-80'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-slate-900'>
            <Sparkles className='h-6 w-6 text-white' />
          </div>
        </Link>

        <h1 className='mb-4 text-center text-2xl font-light tracking-tight text-slate-900'>
          Sign in to your account
        </h1>

        <div className='w-full rounded-md border border-slate-200 bg-white p-6 shadow-sm'>
          <div className='space-y-4'>
            <p className='text-sm font-medium text-slate-700'>Authentication with Google</p>

            <Button
              variant='outline'
              className='flex w-full items-center justify-center gap-3 border-slate-300 bg-[#f6f8fa] py-5 font-semibold text-slate-900 hover:bg-[#f3f4f6] active:bg-[#ebedef]'
              onClick={() => signIn('google', { callbackUrl })}
            >
              <FcGoogle className='h-5 w-5' />
              <span>Continue with Google</span>
            </Button>

            <p className='text-center text-[11px] leading-relaxed text-slate-500'>
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              By clicking "Continue", you agree to our <br />
              <Link href='/terms' className='font-medium text-blue-600 hover:underline'>
                Terms
              </Link>
              and
              <Link href='/privacy' className='ml-1 font-medium text-blue-600 hover:underline'>
                Privacy
              </Link>
            </p>
          </div>
        </div>

        <div className='mt-4 w-full rounded-md border border-slate-200 p-4 text-center'>
          <p className='text-sm text-slate-600'>
            Need help?
            <Link href='/contact' className='ml-1 text-blue-600 hover:underline'>
              Contact support
            </Link>
          </p>
        </div>
      </div>

      <footer className='mt-12'>
        <ul className='flex gap-4 text-xs text-slate-400'>
          <li>
            <Link href='/terms' className='hover:text-slate-600'>
              Terms
            </Link>
          </li>
          <li>
            <Link href='/privacy' className='hover:text-slate-600'>
              Privacy
            </Link>
          </li>
          <li>
            <Link href='/docs' className='hover:text-slate-600'>
              Docs
            </Link>
          </li>
        </ul>
      </footer>
    </div>
  );
}
