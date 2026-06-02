'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Sun,
  Coffee,
  Briefcase,
  Building2,
  Mountain,
  Palette,
  Wine,
  Dumbbell,
  Sparkles,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createProjectAction } from '@/data/user/projects';
import { useTransition } from 'react';
import Image from 'next/image';

const SCENES = [
  {
    id: 'beach',
    name: 'Beach & Waterfront',
    desc: 'Golden hour, ocean breeze',
    icon: Sun,
    accent: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    ring: 'ring-amber-400',
    hoverBorder: 'hover:border-amber-300',
    selectedBg: 'bg-amber-100',
    photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&h=160&fit=crop&q=70',
  },
  {
    id: 'coffee',
    name: 'Coffee Shop',
    desc: 'Cozy, approachable vibe',
    icon: Coffee,
    accent: 'text-amber-800',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    ring: 'ring-orange-400',
    hoverBorder: 'hover:border-orange-300',
    selectedBg: 'bg-orange-100',
    photo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=120&h=160&fit=crop&q=70',
  },
  {
    id: 'office',
    name: 'Professional Office',
    desc: 'Polished & confident',
    icon: Briefcase,
    accent: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    ring: 'ring-slate-400',
    hoverBorder: 'hover:border-slate-300',
    selectedBg: 'bg-slate-100',
    photo: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=120&h=160&fit=crop&q=70',
  },
  {
    id: 'street',
    name: 'Urban Street',
    desc: 'Bold city energy',
    icon: Building2,
    accent: 'text-zinc-700',
    bg: 'bg-zinc-50',
    border: 'border-zinc-200',
    ring: 'ring-zinc-400',
    hoverBorder: 'hover:border-zinc-300',
    selectedBg: 'bg-zinc-100',
    photo: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=120&h=160&fit=crop&q=70',
  },
  {
    id: 'outdoor',
    name: 'Outdoor Adventure',
    desc: 'Adventure-ready',
    icon: Mountain,
    accent: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    ring: 'ring-emerald-400',
    hoverBorder: 'hover:border-emerald-300',
    selectedBg: 'bg-emerald-100',
    photo: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=120&h=160&fit=crop&q=70',
  },
  {
    id: 'art',
    name: 'Art Gallery',
    desc: 'Cultured & creative',
    icon: Palette,
    accent: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    ring: 'ring-rose-400',
    hoverBorder: 'hover:border-rose-300',
    selectedBg: 'bg-rose-100',
    photo: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=120&h=160&fit=crop&q=70',
  },
  {
    id: 'wine',
    name: 'Wine Bar',
    desc: 'Sophisticated nightlife',
    icon: Wine,
    accent: 'text-red-800',
    bg: 'bg-red-50',
    border: 'border-red-200',
    ring: 'ring-red-400',
    hoverBorder: 'hover:border-red-300',
    selectedBg: 'bg-red-100',
    photo: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=120&h=160&fit=crop&q=70',
  },
  {
    id: 'gym',
    name: 'Gym & Fitness',
    desc: 'Active lifestyle',
    icon: Dumbbell,
    accent: 'text-stone-600',
    bg: 'bg-stone-50',
    border: 'border-border',
    ring: 'ring-stone-400',
    hoverBorder: 'hover:border-stone-300',
    selectedBg: 'bg-border/50',
    photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&h=160&fit=crop&q=70',
  },
];

const STEPS = ['Upload', 'Scene', 'Generate'];

export default function SceneSelectionPage() {
  const [selected, setSelected] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGenerate = () => {
    if (!selected) {
      setError('Please select a scene');
      return;
    }

    const pathsRaw = sessionStorage.getItem('uploadPaths');
    if (!pathsRaw) {
      setError('No uploaded photos found. Please go back and upload.');
      return;
    }

    let uploadPaths: string[];
    try {
      uploadPaths = JSON.parse(pathsRaw);
      if (!Array.isArray(uploadPaths) || uploadPaths.length === 0) {
        throw new Error('Invalid upload data');
      }
    } catch {
      setError('Invalid upload data. Please go back and upload again.');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        const result = await createProjectAction({ scene: selected, uploadPaths });
        if (result?.data?.project) {
          router.push(`/project/${result.data.project.id}/generating`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create project');
      }
    });
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      {/* Step Indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => {
            const isActive = i === 1;
            const isCompleted = i < 1;
            return (
              <div key={step} className="flex flex-1 items-center last:flex-initial">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? 'text-foreground'
                        : isCompleted
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/60'
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={`mx-4 h-px flex-1 ${
                      isCompleted ? 'bg-border' : 'bg-border/50'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
          Choose Your Scene
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select the backdrop that best matches the vibe you want for your photos.
        </p>
      </div>

      {/* Scene Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SCENES.map((scene) => {
          const Icon = scene.icon;
          const isSelected = selected === scene.id;
          return (
            <button
              key={scene.id}
              onClick={() => {
                setSelected(scene.id);
                setError('');
              }}
              className={`group relative flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                isSelected
                  ? `${scene.selectedBg} ${scene.border} ${scene.ring} ring-2`
                  : `bg-white ${scene.border} ${scene.hoverBorder} hover:-translate-y-0.5 hover:shadow-sm`
              }`}
            >
              {/* Scene thumbnail */}
              <div className="relative h-20 w-14 shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={scene.photo}
                  alt={scene.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  unoptimized
                />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${scene.bg} ${scene.accent}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-semibold text-foreground">{scene.name}</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{scene.desc}</p>
              </div>

              {isSelected && (
                <div
                  className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full ${scene.accent.replace('text-', 'bg-')} text-primary-foreground`}
                >
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="h-10 gap-2 rounded-lg border-border px-4 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!selected || isPending}
          className="h-10 gap-2 rounded-lg bg-primary px-6 text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {isPending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              Creating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Photos (8 credits)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
