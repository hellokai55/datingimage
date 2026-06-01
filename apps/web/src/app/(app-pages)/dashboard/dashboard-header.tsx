'use client';

import { Button } from '@/components/ui/button';
import { Plus, Zap } from 'lucide-react';
import Link from 'next/link';

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
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{credits} credits</span>
        </div>
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
