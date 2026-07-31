'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export function useAuth(options?: { redirectTo?: string; redirectIfFound?: boolean }) {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (options?.redirectTo && !isLoading) {
      if (options.redirectIfFound && isAuthenticated) {
        router.push(options.redirectTo);
      } else if (!options.redirectIfFound && !isAuthenticated) {
        router.push(options.redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, options?.redirectTo, options?.redirectIfFound, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  };
}
