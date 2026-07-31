'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-aero-950 to-gray-950 p-4">
      <Card className="max-w-md p-8 text-center">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            {error.message || 'Failed to load your dashboard. Please try again.'}
          </CardDescription>
        </CardHeader>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset} variant="primary">
            Try again
          </Button>
        </div>
      </Card>
    </div>
  );
}
