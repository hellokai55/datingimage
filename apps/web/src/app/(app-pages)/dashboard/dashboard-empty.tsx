'use client';

import { Button } from '@/components/ui/button';
import { Camera, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function DashboardEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-8 md:p-12 text-center">
      {/* Before / After Demo */}
      <div className="mb-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="relative">
          <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/30">
            <Image
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=400&fit=crop&q=70"
              alt="Selfie example"
              fill
              className="object-cover opacity-70 grayscale"
              unoptimized
            />
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full border">
            Your selfie
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block rotate-0 sm:rotate-0" />
          <div className="h-5 w-5 text-muted-foreground sm:hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rotate-90">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Magic</span>
        </div>

        <div className="relative">
          <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5">
            <Image
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop&q=70"
              alt="AI generated result"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
            AI Result
          </span>
        </div>
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Camera className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mt-5 text-xl font-semibold">Your photos are waiting</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
        Upload your selfies, pick a scene, and let AI create 8 stunning dating
        photos for you. Your first project takes about 5 minutes.
      </p>
      <Button className="mt-6" size="lg" asChild>
        <Link href="/project/new">Create Your First Project</Link>
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        15 free credits included — no credit card required
      </p>
    </div>
  );
}
