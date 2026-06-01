'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { RenderProviders } from '@/components/Auth/RenderProviders';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
    <div className="container flex items-center justify-center text-left max-w-lg mx-auto overflow-auto min-h-[470px]">
      {successMessage ? (
        <div className="text-center space-y-4">
          <div className="text-4xl">📧</div>
          <h2 className="text-xl font-semibold">Check Your Email</h2>
          <p className="text-muted-foreground">{successMessage}</p>
        </div>
      ) : (
        <div className="space-y-8 bg-background p-6 rounded-lg shadow-sm dark:border w-full">
          <Card className="border-none shadow-none">
            <CardHeader className="py-6 px-0 text-center">
              <CardTitle>Join DatingImage</CardTitle>
              <CardDescription>
                Sign up with your Google account to start generating AI dating photos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-0">
              <RenderProviders
                providers={['google']}
                isLoading={providerStatus === 'executing'}
                onProviderLoginRequested={(
                  provider: Extract<AuthProvider, 'google'>
                ) => executeProvider({ provider, next })}
              />
              <p className="text-center text-xs text-muted-foreground pt-4">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
