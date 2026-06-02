'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRef, useState, type JSX } from 'react';
import { toast } from 'sonner';

import { Email } from '@/components/Auth/Email';
import { EmailConfirmationPendingCard } from '@/components/Auth/EmailConfirmationPendingCard';
import { resetPasswordAction } from '@/data/auth/auth';

export function ForgotPassword(): JSX.Element {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const toastRef = useRef<string | number | undefined>(undefined);

  const { execute, status } = useAction(resetPasswordAction, {
    onExecute: () => {
      toastRef.current = toast.loading('Sending password reset link...');
    },
    onSuccess: () => {
      toast.success('Password reset link sent!', {
        id: toastRef.current,
      });
      toastRef.current = undefined;
      setSuccessMessage('A password reset link has been sent to your email!');
    },
    onError: ({ error }) => {
      const errorMessage =
        error.serverError ?? 'Failed to send password reset link';
      toast.error(errorMessage, {
        id: toastRef.current,
      });
      toastRef.current = undefined;
    },
  });

  return (
    <>
      {successMessage ? (
        <EmailConfirmationPendingCard
          message={successMessage}
          heading="Reset password link sent"
          type="reset-password"
          resetSuccessMessage={setSuccessMessage}
        />
      ) : (
        <div className="w-full max-w-sm mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Forgot Password
            </h1>
            <p className="text-muted-foreground">
              Enter your email to receive a Magic Link to reset your password.
            </p>
          </div>
          <Email
            onSubmit={(email) => {
              execute({ email });
            }}
            isLoading={status === 'executing'}
            view="forgot-password"
          />
        </div>
      )}
    </>
  );
}
