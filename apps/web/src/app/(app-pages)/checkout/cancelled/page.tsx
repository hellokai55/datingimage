'use client';

import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutCancelledPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-bold">Payment Cancelled</h1>
        <p className="mt-2 text-muted-foreground">
          Your payment was cancelled and no credits were charged. You can try again whenever
          you are ready.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button asChild>
            <Link href="/pricing">Back to Pricing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}