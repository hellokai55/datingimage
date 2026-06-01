'use client';

import { Button } from '@/components/ui/button';
import { Plus, Zap, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export function DashboardHeader({ credits }: { credits: number }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Projects</h1>
        <p className="text-muted-foreground mt-1">
          Manage your AI-generated dating photos
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => toast.info('Credit top-up coming soon! 🚀')}
          className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 hover:bg-primary/20 transition-colors cursor-pointer"
        >
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{credits} credits</span>
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info('Stripe payment integration coming soon! 🚀')}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Top Up
        </Button>
        <Button asChild>
          <Link href="/project/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>
    </div>
  );
}
