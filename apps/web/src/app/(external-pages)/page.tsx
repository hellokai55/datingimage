import { Button } from '@/components/ui/button';
import { ArrowRight, Camera, CheckCircle, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            AI-Powered Dating Photos
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            8 Curated Photos.
            <br />
            <span className="text-primary">Zero Compromise.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Upload your selfies. Choose a scene. Get 8 stunning, AI-generated
            dating photos that actually look like you — ready for Tinder,
            Bumble, and Hinge.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="text-lg">
              <Link href="/login">
                <Camera className="mr-2 h-5 w-5" />
                Free — Generate Your Photos
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              15 free credits on signup. No credit card required.
            </p>
          </div>

          {/* Before/After Preview */}
          <div className="mt-16 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-muted/50 p-6">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Before</p>
              <div className="aspect-square rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Bathroom selfie, bad lighting</p>
            </div>
            <div className="rounded-xl border bg-primary/5 p-6">
              <p className="mb-3 text-sm font-medium text-primary">After — Beach Scene</p>
              <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-200 to-amber-100 flex items-center justify-center">
                <Heart className="h-12 w-12 text-primary/60" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Golden hour, professional quality</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold">How It Works</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Upload Selfies',
                desc: 'Upload 5-10 of your best selfies. Our AI learns your face.',
                icon: Camera,
              },
              {
                step: '2',
                title: 'Pick a Scene',
                desc: 'Choose from 8 curated scenes: beach, coffee shop, gym, and more.',
                icon: Sparkles,
              },
              {
                step: '3',
                title: 'Get Your Photos',
                desc: 'Receive 8 stunning photos in minutes. Download and start matching.',
                icon: Heart,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenes */}
      <section className="border-t px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold">8 Scenes, Infinite Vibes</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { emoji: '🏖️', name: 'Beach', desc: 'Golden hour, ocean breeze' },
              { emoji: '☕', name: 'Coffee Shop', desc: 'Cozy, approachable' },
              { emoji: '💼', name: 'Professional', desc: 'Polished & confident' },
              { emoji: '🌆', name: 'Urban Street', desc: 'Bold city energy' },
              { emoji: '🏔️', name: 'Outdoor', desc: 'Adventure-ready' },
              { emoji: '🎨', name: 'Art Gallery', desc: 'Cultured & creative' },
              { emoji: '🍷', name: 'Wine Bar', desc: 'Sophisticated nightlife' },
              { emoji: '🏋️', name: 'Gym', desc: 'Active lifestyle' },
            ].map((scene) => (
              <div
                key={scene.name}
                className="rounded-lg border p-4 text-center transition-colors hover:border-primary/50"
              >
                <div className="text-3xl">{scene.emoji}</div>
                <h3 className="mt-2 font-medium">{scene.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{scene.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold">Your Privacy, Protected</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {[
              'Photos are private — only you see them',
              'Original selfies deleted after 24 hours',
              'Never used to train AI models',
              'Secure, encrypted storage',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Ready to Upgrade Your Profile?</h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands who've transformed their dating game with AI-generated photos.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/login">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            15 free credits on signup · No credit card required
          </p>
        </div>
      </section>
    </div>
  );
}
