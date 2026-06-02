import { Button } from '@/components/ui/button';
import {
  Camera,
  ArrowRight,
  CheckCircle,
  Shield,
  Lock,
  EyeOff,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const HERO_PHOTOS = [
  {
    label: 'Beach',
    src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&q=80',
    color: 'bg-amber-50',
    span: 'row-span-1',
  },
  {
    label: 'Coffee Shop',
    src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&q=80',
    color: 'bg-stone-50',
    span: 'row-span-1',
  },
  {
    label: 'Professional',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&q=80',
    color: 'bg-slate-50',
    span: 'row-span-1',
  },
  {
    label: 'Urban',
    src: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&q=80',
    color: 'bg-zinc-50',
    span: 'row-span-1',
  },
  {
    label: 'Outdoor',
    src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&q=80',
    color: 'bg-emerald-50',
    span: 'row-span-1',
  },
  {
    label: 'Wine Bar',
    src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&q=80',
    color: 'bg-rose-50',
    span: 'row-span-1',
  },
];

const SCENES = [
  {
    name: 'Beach & Waterfront',
    desc: 'Golden hour, ocean breeze, relaxed confidence',
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=150&fit=crop&q=70',
  },
  {
    name: 'Coffee Shop',
    desc: 'Warm, approachable, everyday charm',
    src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&h=150&fit=crop&q=70',
  },
  {
    name: 'Professional Office',
    desc: 'Polished, ambitious, career-driven',
    src: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=200&h=150&fit=crop&q=70',
  },
  {
    name: 'Urban Street',
    desc: 'Bold energy, city lights, street style',
    src: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=200&h=150&fit=crop&q=70',
  },
  {
    name: 'Outdoor Adventure',
    desc: 'Nature, exploration, active lifestyle',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=150&fit=crop&q=70',
  },
  {
    name: 'Art Gallery',
    desc: 'Cultured, creative, thoughtful',
    src: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=200&h=150&fit=crop&q=70',
  },
  {
    name: 'Wine Bar',
    desc: 'Sophisticated evening, intimate atmosphere',
    src: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=200&h=150&fit=crop&q=70',
  },
  {
    name: 'Gym & Fitness',
    desc: 'Disciplined, healthy, motivated',
    src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=150&fit=crop&q=70',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
            {/* Left: Copy */}
            <div className="space-y-6 pt-4 lg:pt-8">
              <p className="text-sm font-medium text-primary tracking-wide uppercase">
                AI Dating Photos
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
                Photos that get you
                <br />
                noticed.
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Upload 5–10 selfies. Pick a scene. Get 8 professional dating
                photos that look like you — not a filter.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button size="lg" asChild className="text-base">
                  <Link href="/login">
                    <Camera className="mr-2 h-5 w-5" />
                    Generate Photos — Free
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                15 free credits on signup. No credit card required.
              </p>
            </div>

            {/* Right: Photo Grid Preview */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  {HERO_PHOTOS.slice(0, 3).map((photo, i) => (
                    <PhotoCard key={photo.label} photo={photo} index={i} />
                  ))}
                </div>
                <div className="space-y-3 pt-6">
                  {HERO_PHOTOS.slice(3, 6).map((photo, i) => (
                    <PhotoCard key={photo.label} photo={photo} index={i + 3} />
                  ))}
                </div>
              </div>
              {/* Floating badge */}
              <div className="mt-4 flex justify-center">
                <div className="inline-flex items-center gap-2 bg-background border rounded-full px-4 py-2 shadow-sm text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  8 photos in under 5 minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12">
            <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
              How it works
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps. Five minutes.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                num: '01',
                title: 'Upload your selfies',
                desc: '5 to 10 photos of your face. Different angles, different lighting. The more variety, the better the results.',
              },
              {
                num: '02',
                title: 'Pick a scene',
                desc: 'Beach sunset, cozy café, city street — choose from 8 curated backdrops that match your personality.',
              },
              {
                num: '03',
                title: 'Download & date',
                desc: 'Get 8 high-resolution photos in minutes. Use them on Tinder, Bumble, Hinge, or wherever you match.',
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className="relative"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <span className="text-5xl font-bold text-muted-foreground/20 select-none">
                  {step.num}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenes — with photo thumbnails */}
      <section className="border-t px-4 py-16 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12">
            <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
              Scenes
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              8 backdrops. One you.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SCENES.map((scene, i) => (
              <div
                key={scene.name}
                className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-background transition-all duration-300 group cursor-default hover-lift"
              >
                <div className="relative w-16 h-12 shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={scene.src}
                    alt={scene.name}
                    fill
                    className="object-cover img-zoom"
                    sizes="64px"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {scene.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {scene.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Gallery — Show real results */}
      <section className="border-t px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
              Results
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Real photos. Real matches.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Here is what others have created with DatingImage. Every photo is
              AI-generated from their own selfies.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=380&fit=crop&q=75',
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=380&fit=crop&q=75',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=380&fit=crop&q=75',
              'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=380&fit=crop&q=75',
              'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=380&fit=crop&q=75',
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=380&fit=crop&q=75',
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=380&fit=crop&q=75',
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=380&fit=crop&q=75',
            ].map((src, i) => (
              <div
                key={i}
                className="relative aspect-[3/4] rounded-xl overflow-hidden group hover-lift"
              >
                <Image
                  src={src}
                  alt={`Example photo ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Your photos stay yours.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We delete your original selfies after 24 hours. Your generated photos
            are private, encrypted, and never used to train AI models.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Encrypted storage
            </span>
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Auto-delete after 24h
            </span>
            <span className="flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              Never train AI
            </span>
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Private by default
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready for better matches?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Your first 8 photos are free. No credit card. No commitment.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/login">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function PhotoCard({
  photo,
  index,
}: {
  photo: (typeof HERO_PHOTOS)[0];
  index: number;
}) {
  return (
    <div
      className={`${photo.color} rounded-xl border p-3 aspect-[3/4] flex flex-col justify-end overflow-hidden hover-lift group`}
    >
      <div className="relative w-full flex-1 rounded-lg overflow-hidden mb-2">
        <Image
          src={photo.src}
          alt={photo.label}
          fill
          className="object-cover img-zoom"
          sizes="(max-width: 768px) 45vw, 200px"
          unoptimized
        />
      </div>
      <p className="text-sm font-medium">{photo.label}</p>
    </div>
  );
}
