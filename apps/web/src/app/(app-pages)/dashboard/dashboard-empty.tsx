'use client';

import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import Link from 'next/link';

export function DashboardEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <ImagePlus className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Upload your selfies and let AI create stunning dating photos for you.
        Your first project is just a click away.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/project/new">Create Your First Project</Link>
      </Button>
    </div>
  );
}
