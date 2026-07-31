'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Display name must be at least 2 characters')
      .max(30, 'Display name must be at most 30 characters')
      .regex(/^[a-zA-Z0-9\s]+$/, 'Display name can only contain letters, numbers, and spaces'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false as unknown as true,
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    try {
      await registerUser({
        username: data.email.split('@')[0],
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });
      toast.success('Account created successfully!');
      router.push('/verify-email');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
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
              <CardTitle>Create your account</CardTitle>
              <CardDescription>Join the arena and start playing</CardDescription>
            </CardHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500"
                role="alert"
              >
                {serverError}
              </motion.div>
            )}

            <Input
              id="displayName"
              label="Display Name"
              type="text"
              autoComplete="name"
              placeholder="Your display name"
              aria-label="Display name"
              error={errors.displayName?.message}
              {...register('displayName')}
            />

            <Input
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-label="Email address"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-1">
              <Input
                id="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                aria-label="Password"
                error={errors.password?.message}
                {...register('password')}
              />
              <p className="text-xs text-gray-400">
                Min 8 characters, must include uppercase, lowercase, and a number
              </p>
            </div>

            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              aria-label="Confirm password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="flex items-start gap-3">
              <input
                id="acceptTerms"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-aero-500 focus:ring-aero-500"
                aria-label="Accept terms and conditions"
                {...register('acceptTerms')}
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-400">
                I accept the{' '}
                <Link href="/terms" className="text-aero-400 hover:text-aero-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-aero-400 hover:text-aero-300">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-xs text-red-500 -mt-3" role="alert">
                {errors.acceptTerms.message}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-aero-400 hover:text-aero-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
