'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import {
  Check,
  Clock,
  Sparkles,
  ImageIcon,
  SlidersHorizontal,
  Zap,
  AlertCircle,
  Hourglass,
} from 'lucide-react';

interface Step {
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    label: 'Analyzing Photos',
    description: 'Evaluating poses, expressions, and composition',
    icon: <ImageIcon className="h-4 w-4" />,
  },
  {
    label: 'Generating Scenes',
    description: 'Building new environments and contexts',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    label: 'Applying Style',
    description: 'Matching lighting, color, and aesthetic',
    icon: <SlidersHorizontal className="h-4 w-4" />,
  },
  {
    label: 'Finalizing',
    description: 'Upscaling and preparing your images',
    icon: <Zap className="h-4 w-4" />,
  },
];

const TIPS = [
  {
    title: 'What happens next',
    body: 'Once complete, you\'ll be taken to a gallery where you can view, compare, and download all generated images.',
    icon: <ImageIcon className="h-4 w-4 text-amber-500" />,
  },
  {
    title: 'Estimated time remaining',
    body: 'Generation typically takes 2–5 minutes depending on complexity. Leaving this page will not cancel the process.',
    icon: <Hourglass className="h-4 w-4 text-amber-500" />,
  },
  {
    title: 'Need to step away',
    body: 'You can safely close this tab. Your results will be available in your dashboard when you return.',
    icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
  },
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
      setStatusIndex((prev) => (prev + 1) % STEPS.length);
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

  const clampedProgress = Math.min(progress, 100);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-12">
      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 56 56"
            fill="none"
          >
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted/20"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={150.8}
              strokeDashoffset={150.8 - (150.8 * clampedProgress) / 100}
              className="text-amber-500 transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col gap-1 pt-0.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Generating your photos
          </h1>
          <p className="text-sm text-muted-foreground">
            {STEPS[statusIndex].description}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>{STEPS[statusIndex].label}</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
        <Progress
          value={clampedProgress}
          className="h-3 bg-muted/60 [&>div]:bg-amber-500 [&>div]:transition-all [&>div]:duration-700 [&>div]:ease-out"
        />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Elapsed {formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex flex-col gap-0">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < statusIndex;
          const isActive = idx === statusIndex;
          const isPending = idx > statusIndex;

          return (
            <div key={step.label} className="flex gap-3">
              {/* Line + indicator column */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors duration-500 ${
                    isCompleted
                      ? 'border-amber-500 bg-amber-500 text-primary-foreground'
                      : isActive
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-muted bg-background text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    <span className="text-[11px] font-semibold">{idx + 1}</span>
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`my-1 w-px flex-1 transition-colors duration-500 ${
                      isCompleted ? 'bg-amber-500/50' : 'bg-border'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-6 pt-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium transition-colors duration-500 ${
                      isActive
                        ? 'text-foreground'
                        : isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-500">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          While you wait
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIPS.map((tip) => (
            <div
              key={tip.title}
              className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 p-4"
            >
              <div className="flex items-center gap-2">
                {tip.icon}
                <span className="text-xs font-semibold text-foreground">
                  {tip.title}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {tip.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
