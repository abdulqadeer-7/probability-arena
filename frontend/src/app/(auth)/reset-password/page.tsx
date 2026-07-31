'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { post } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<'email' | 'confirm' | 'done'>(token ? 'confirm' : 'email');
  const [serverError, setServerError] = useState<string | null>(null);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onRequestReset = async (data: EmailForm) => {
    setServerError(null);
    try {
      await post('/auth/forgot-password', { email: data.email });
      setStep('done');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setServerError(message);
    }
  };

  const onResetPassword = async (data: ResetForm) => {
    if (!token) return;
    setServerError(null);
    try {
      await post('/auth/reset-password', { token, password: data.password });
      toast.success('Password reset successfully!');
      router.push('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setServerError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-gradient">AeroArcade</h1>
            </Link>
            <CardHeader>
              <AnimatePresence mode="wait">
                {step === 'email' && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CardTitle>Reset your password</CardTitle>
                    <CardDescription>
                      Enter your email and we&apos;ll send you a reset link
                    </CardDescription>
                  </motion.div>
                )}
                {step === 'confirm' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CardTitle>Set new password</CardTitle>
                    <CardDescription>Enter your new password below</CardDescription>
                  </motion.div>
                )}
                {step === 'done' && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CardTitle>Check your email</CardTitle>
                    <CardDescription>
                      If an account exists with that email, we&apos;ve sent a reset link
                    </CardDescription>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardHeader>
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={emailForm.handleSubmit(onRequestReset)}
                className="space-y-5"
                noValidate
              >
                {serverError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500" role="alert">
                    {serverError}
                  </div>
                )}
                <Input
                  id="reset-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-label="Email address"
                  error={emailForm.formState.errors.email?.message}
                  {...emailForm.register('email')}
                />
                <Button type="submit" className="w-full" size="lg" loading={emailForm.formState.isSubmitting}>
                  {emailForm.formState.isSubmitting ? 'Sending...' : 'Send reset link'}
                </Button>
              </motion.form>
            )}

            {step === 'confirm' && (
              <motion.form
                key="reset-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={resetForm.handleSubmit(onResetPassword)}
                className="space-y-5"
                noValidate
              >
                {serverError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500" role="alert">
                    {serverError}
                  </div>
                )}
                <div className="space-y-1">
                  <Input
                    id="new-password"
                    label="New Password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    aria-label="New password"
                    error={resetForm.formState.errors.password?.message}
                    {...resetForm.register('password')}
                  />
                  <p className="text-xs text-gray-400">
                    Min 8 characters, must include uppercase, lowercase, and a number
                  </p>
                </div>
                <Input
                  id="confirm-new-password"
                  label="Confirm Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  aria-label="Confirm new password"
                  error={resetForm.formState.errors.confirmPassword?.message}
                  {...resetForm.register('confirmPassword')}
                />
                <Button type="submit" className="w-full" size="lg" loading={resetForm.formState.isSubmitting}>
                  {resetForm.formState.isSubmitting ? 'Resetting...' : 'Reset password'}
                </Button>
              </motion.form>
            )}

            {step === 'done' && (
              <motion.div
                key="done-msg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="rounded-lg bg-aero-500/10 border border-aero-500/20 px-4 py-6 text-center">
                  <p className="text-sm text-gray-300">
                    We&apos;ve sent a password reset link to your email if the account exists.
                    Please check your inbox and spam folder.
                  </p>
                </div>
                <Link href="/login">
                  <Button variant="secondary" className="w-full">
                    Back to login
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== 'done' && (
            <p className="mt-6 text-center text-sm text-gray-400">
              Remember your password?{' '}
              <Link href="/login" className="text-aero-400 hover:text-aero-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
