import { Button } from '@/components/ui/button';
import { Check, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function PricingPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
            Pricing
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Pay only for what you use.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl grid gap-6 md:grid-cols-2">
          {/* Free Tier */}
          <div className="rounded-2xl border bg-background p-8 hover-lift transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Free</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Get started with AI-generated dating photos.
            </p>
            <div className="mt-6">
              <span className="text-4xl font-bold">$0</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                '15 credits on signup',
                '1 photo set (8 photos)',
                'All 8 scenes',
                'Standard resolution',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-full" variant="outline" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>

          {/* Pay Per Use — Popular */}
          <div className="rounded-2xl border-2 border-primary bg-background p-8 relative hover-lift transition-all duration-300">
            {/* Background photo */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-[0.04]">
              <Image
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&q=60"
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="relative">
              <div className="flex justify-center -mt-11 mb-4">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Most Popular
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Pay Per Use</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Buy credits as you need them.
              </p>
              <div className="mt-6">
                <span className="text-4xl font-bold">$4.99</span>
                <span className="text-muted-foreground"> / 20 credits</span>
              </div>
              <ul className="mt-6 space-y-3">
                {[
                  '20 credits per pack',
                  '2 full photo sets (8 photos each)',
                  'All 8 scenes + future scenes',
                  'High resolution downloads',
                  'Priority generation queue',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" asChild>
                <Link href="/login">Buy Credits</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Photo strip */}
        <div className="mx-auto max-w-4xl mt-12">
          <div className="grid grid-cols-5 gap-2 rounded-2xl overflow-hidden opacity-70">
            {[
              'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=250&fit=crop&q=60',
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=250&fit=crop&q=60',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=250&fit=crop&q=60',
              'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=250&fit=crop&q=60',
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=250&fit=crop&q=60',
            ].map((src, i) => (
              <div key={i} className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="20vw"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-4xl mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Each photo set costs 8 credits. Single photo regeneration costs 1 credit.
            Credits never expire.
          </p>
        </div>
      </section>
    </div>
  );
}
