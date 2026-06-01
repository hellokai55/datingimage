'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock } from 'lucide-react';

const STATUS_MESSAGES = [
  'Analyzing your photos...',
  'Generating scenes...',
  'Applying lighting & style...',
  'Almost there...',
];

export default function GeneratingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [progress, setProgress] = useState(10);
  const [statusIndex, setStatusIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 8;
      });
    }, 3000);

    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 8000);

    const elapsedInterval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    // Poll for completion
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${id}/status`);
        const data = await res.json();
        if (data.status === 'completed') {
          router.push(`/project/${id}`);
        } else if (data.status === 'failed') {
          router.push(`/dashboard`);
        }
      } catch {
        // Silently retry
      }
    }, 5000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
      clearInterval(elapsedInterval);
      clearInterval(pollInterval);
    };
  }, [id, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Generating Your Photos</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {STATUS_MESSAGES[statusIndex]}
          </p>
          <div className="mt-6">
            <Progress value={Math.min(progress, 100)} className="h-2" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Elapsed: {formatTime(elapsed)}</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            This usually takes 2-5 minutes. Please don&apos;t close this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
