import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { getCachedLoggedInVerifiedSupabaseUser } from '@/rsc-data/supabase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOutAction } from '@/data/auth/sign-out';
import { Suspense } from 'react';

async function NavbarAuthContent() {
  try {
    const { user } = await getCachedLoggedInVerifiedSupabaseUser();
    const userName =
      (user?.user_metadata?.name as string) ||
      user?.email?.split('@')[0] ||
      'User';
    const userInitials = userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className="flex items-center gap-3">
        <ModeToggle />
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Dashboard
        </Link>
        <form action={signOutAction}>
          <Button variant="ghost" size="sm" type="submit">
            Sign out
          </Button>
        </form>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
        </Avatar>
      </div>
    );
  } catch {
    // User is not logged in
    return (
      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/sign-up">Get Started</Link>
        </Button>
      </div>
    );
  }
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4">
        <div className="flex items-center gap-6 flex-1">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-primary">DatingImage</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/about"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/pricing"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/faq"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </Link>
          </nav>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center gap-2">
              <ModeToggle />
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </div>
          }
        >
          <NavbarAuthContent />
        </Suspense>
      </div>
    </header>
  );
}
