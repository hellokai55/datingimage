'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      return;
    }

    // Poll for order status (webhook may still be processing)
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/payments/order-status?order_id=${orderId}`);
        const data = await res.json();
        if (data.status === 'completed') {
          setStatus('success');
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setStatus('error');
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          // Still pending, but show success anyway (webhook will process in background)
          setStatus('success');
          clearInterval(interval);
        }
      } catch {
        if (attempts >= maxAttempts) {
          setStatus('success');
          clearInterval(interval);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-6 text-2xl font-bold">Processing your payment...</h1>
            <p className="mt-2 text-muted-foreground">
              Please wait while we confirm your purchase.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-6 text-2xl font-bold">Payment Successful!</h1>
            <p className="mt-2 text-muted-foreground">
              Your credits have been added to your account. You can now generate more photos.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/project/new">Create New Project</Link>
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <span className="text-xl text-destructive">!</span>
            </div>
            <h1 className="mt-6 text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-muted-foreground">
              We could not verify your payment. If you were charged, your credits will be added
              shortly. Contact support if the issue persists.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pricing">Back to Pricing</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}