'use client';
import { RenderProviders } from '@/components/Auth/RenderProviders';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <div className="container flex items-center justify-center text-left max-w-lg mx-auto overflow-auto min-h-[470px]">
      {redirectInProgress ? (
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <h2 className="text-xl font-semibold">Redirecting...</h2>
          <p className="text-muted-foreground">
            Please wait while we redirect you to your dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-8 bg-background p-6 rounded-lg shadow-sm dark:border w-full">
          <Card className="border-none shadow-none">
            <CardHeader className="py-6 px-0 text-center">
              <CardTitle>Welcome to DatingImage</CardTitle>
              <CardDescription>
                Sign in with your Google account to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-0">
              <RenderProviders
                providers={['google']}
                isLoading={providerStatus === 'executing'}
                onProviderLoginRequested={(provider: 'google') =>
                  executeProvider({ provider, next })
                }
              />
              <p className="text-center text-xs text-muted-foreground pt-4">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
