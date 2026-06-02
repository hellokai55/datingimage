'use client';
import React, { Suspense, useEffect, useState } from 'react';

import { Toaster as SonnerToaster } from 'sonner';
import { ThemeProvider, useTheme } from 'next-themes';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

function CustomerToaster() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';
  return <SonnerToaster richColors theme={currentTheme} />;
}

/**
 * This is a wrapper for the app that provides the supabase client, the router event wrapper
 * the react-query client, supabase listener, and the navigation progress bar.
 *
 * The listener is used to listen for changes to the user's session and update the UI accordingly.
 */
export function DynamicLayoutProviders({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" enableSystem themes={['light', 'dark']} defaultTheme="light">
      {children}
      <Suspense>
        <ProgressBar
          height="4px"
          color="hsl(var(--primary))"
          options={{ showSpinner: false }}
          shallowRouting
        />
        <CustomerToaster />
      </Suspense>
    </ThemeProvider>
  );
}
