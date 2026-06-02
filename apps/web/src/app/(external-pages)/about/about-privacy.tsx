import { Lock, Timer, EyeOff, Shield } from 'lucide-react';

const PRIVACY_POINTS = [
  {
    icon: Timer,
    title: 'Auto-delete originals',
    desc: 'Your uploaded selfies are permanently deleted from our servers after 24 hours.',
  },
  {
    icon: EyeOff,
    title: 'No AI training',
    desc: 'We never use your photos to train or improve our AI models.',
  },
  {
    icon: Lock,
    title: 'Encrypted storage',
    desc: 'Generated photos are stored with encryption. Only you can access them.',
  },
  {
    icon: Shield,
    title: 'Full control',
    desc: 'Delete any project — and its photos — at any time from your dashboard.',
  },
];

export function AboutPrivacy() {
  return (
    <div>
      <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
        Privacy
      </p>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
        Your face. Your data. Your control.
      </h2>
      <p className="text-muted-foreground leading-relaxed max-w-2xl mb-10">
        We built DatingImage with privacy as a core principle. We know these
        photos are personal, and we treat them that way.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {PRIVACY_POINTS.map((point) => (
          <div key={point.title} className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <point.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{point.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {point.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
