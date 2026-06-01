'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createProjectAction } from '@/data/user/projects';
import { useTransition } from 'react';

const SCENES = [
  { id: 'beach', emoji: '🏖️', name: 'Beach & Waterfront', desc: 'Golden hour, ocean breeze' },
  { id: 'coffee', emoji: '☕', name: 'Coffee Shop', desc: 'Cozy, approachable vibe' },
  { id: 'office', emoji: '💼', name: 'Professional Office', desc: 'Polished & confident' },
  { id: 'street', emoji: '🌆', name: 'Urban Street', desc: 'Bold city energy' },
  { id: 'outdoor', emoji: '🏔️', name: 'Outdoor Adventure', desc: 'Adventure-ready' },
  { id: 'art', emoji: '🎨', name: 'Art Gallery', desc: 'Cultured & creative' },
  { id: 'wine', emoji: '🍷', name: 'Wine Bar', desc: 'Sophisticated nightlife' },
  { id: 'gym', emoji: '🏋️', name: 'Gym & Fitness', desc: 'Active lifestyle' },
];

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

    // Get uploaded paths from sessionStorage
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Upload', 'Scene', 'Generate'].map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  i === 1
                    ? 'bg-primary text-primary-foreground'
                    : i === 0
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`ml-2 text-sm ${
                  i === 1 ? 'font-medium' : 'text-muted-foreground'
                }`}
              >
                {step}
              </span>
              {i < 2 && <div className="mx-4 h-px w-12 bg-border" />}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Choose Your Scene
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {SCENES.map((scene) => (
              <button
                key={scene.id}
                onClick={() => {
                  setSelected(scene.id);
                  setError('');
                }}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                  selected === scene.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">{scene.emoji}</span>
                <div>
                  <h3 className="font-medium">{scene.name}</h3>
                  <p className="text-xs text-muted-foreground">{scene.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selected || isPending}
            >
              {isPending ? 'Creating...' : 'Generate Photos (8 credits)'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
