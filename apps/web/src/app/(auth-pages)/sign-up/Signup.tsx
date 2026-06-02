'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

import { RenderProviders } from '@/components/Auth/RenderProviders';
import { signInWithProviderAction } from '@/data/auth/auth';
import type { AuthProvider } from '@/types';

interface SignUpProps {
  next?: string;
}

export function SignUp({ next }: SignUpProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const toastRef = useRef<string | number | undefined>(undefined);

  const { execute: executeProvider, status: providerStatus } = useAction(
    signInWithProviderAction,
    {
      onExecute: () => {
        toastRef.current = toast.loading('Requesting login...');
      },
      onSuccess: ({ data }) => {
        toast.success('Redirecting...', { id: toastRef.current });
        toastRef.current = undefined;
        if (data?.url) {
          window.location.href = data.url;
        }
      },
      onError: ({ error }) => {
        const errorMessage = error.serverError ?? 'Failed to login';
        toast.error(errorMessage, { id: toastRef.current });
        toastRef.current = undefined;
      },
    }
  );

  return (
    <div className="w-full max-w-sm mx-auto">
      {successMessage ? (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Check Your Email</h2>
          <p className="text-muted-foreground">{successMessage}</p>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Join DatingImage
            </h1>
            <p className="text-muted-foreground">
              Sign up with your Google account to start generating AI dating photos
            </p>
          </div>
          <RenderProviders
            providers={['google']}
            isLoading={providerStatus === 'executing'}
            onProviderLoginRequested={(
              provider: Extract<AuthProvider, 'google'>
            ) => executeProvider({ provider, next })}
          />
          <p className="text-center text-xs text-muted-foreground">
            By signing up, you agree to our{' '}
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
