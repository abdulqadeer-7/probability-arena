'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { post } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Please check the link in your email.');
      return;
    }

    const verify = async () => {
      try {
        await post('/auth/verify-email', { token });
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } catch (err: unknown) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setMessage(errorMessage);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center">
          <div className="mb-6">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-gradient">AeroArcade</h1>
            </Link>
          </div>

          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
          </CardHeader>

          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 animate-spin text-aero-400" aria-hidden="true" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-12 w-12 text-green-400" aria-hidden="true" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-400" aria-hidden="true" />
            )}

            <CardDescription className={status === 'error' ? 'text-red-400' : undefined}>
              {message}
            </CardDescription>
          </motion.div>

          {status === 'success' && (
            <Link href="/login">
              <Button className="mt-4">Go to login</Button>
            </Link>
          )}

          {status === 'error' && !token && (
            <p className="mt-4 text-sm text-gray-400">
              Need a new verification link?{' '}
              <Link href="/login" className="text-aero-400 hover:text-aero-300">
                Log in
              </Link>{' '}
              to resend.
            </p>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
