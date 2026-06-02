'use client';
import { RenderProviders } from '@/components/Auth/RenderProviders';
import { signInWithProviderAction } from '@/data/auth/auth';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export function Login({
  next,
  nextActionType: _nextActionType,
}: {
  next?: string;
  nextActionType?: string;
}) {
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const toastRef = useRef<string | number | undefined>(undefined);

  const router = useRouter();

  function redirectToDashboard() {
    if (next) {
      router.push(`/auth/callback?next=${next}`);
    } else {
      router.push('/dashboard');
    }
  }

  const { execute: executeProvider, status: providerStatus } = useAction(
    signInWithProviderAction,
    {
      onExecute: () => {
        toastRef.current = toast.loading('Requesting login...');
      },
      onSuccess: (payload) => {
        toast.success('Redirecting...', {
          id: toastRef.current,
        });
        toastRef.current = undefined;
        window.location.href = payload.data?.url || '/';
      },
      onError: () => {
        toast.error('Failed to login', {
          id: toastRef.current,
        });
        toastRef.current = undefined;
      },
    }
  );

  return (
    <div className="w-full max-w-sm mx-auto">
      {redirectInProgress ? (
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <h2 className="text-xl font-semibold">Redirecting...</h2>
          <p className="text-muted-foreground">
            Please wait while we redirect you to your dashboard.
          </p>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in to DatingImage
            </h1>
            <p className="text-muted-foreground">
              Sign in with your Google account to get started
            </p>
          </div>
          <RenderProviders
            providers={['google']}
            isLoading={providerStatus === 'executing'}
            onProviderLoginRequested={(provider: 'google') =>
              executeProvider({ provider, next })
            }
          />
          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <a href="/terms" className="underline underline-offset-2 hover:text-foreground">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
