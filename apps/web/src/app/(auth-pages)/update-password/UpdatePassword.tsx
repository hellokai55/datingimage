'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { toast } from 'sonner';

import { Password } from '@/components/Auth/Password';
import { updatePasswordAction } from '@/data/user/security';

export function UpdatePassword() {
  const router = useRouter();
  const toastRef = useRef<string | number | undefined>(undefined);

  const { execute, status } = useAction(updatePasswordAction, {
    onExecute: () => {
      toastRef.current = toast.loading('Updating password...');
    },
    onSuccess: () => {
      toast.success('Password updated!', {
        id: toastRef.current,
      });
      toastRef.current = undefined;
      router.push('/auth/callback');
    },
    onError: ({ error }) => {
      const errorMessage = error.serverError ?? 'Failed to update password';
      toast.error(errorMessage, {
        id: toastRef.current,
      });
      toastRef.current = undefined;
    },
  });

  return (
    <div className="container h-full grid items-center text-left max-w-lg mx-auto overflow-auto">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset Password
          </h1>
          <p className="text-muted-foreground">
            Create a new password for your account.
          </p>
        </div>
        <Password
          isLoading={status === 'executing'}
          onSubmit={(password: string) => execute({ password })}
          label="Create your new Password"
          buttonLabel="Confirm Password"
        />
      </div>
    </div>
  );
}
