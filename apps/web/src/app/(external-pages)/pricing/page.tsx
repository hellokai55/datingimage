'use client';

import { Button } from '@/components/ui/button';
import { Check, Star, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CREDIT_PACKS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    credits: 20,
    price: 4.99,
    features: [
      '20 credits',
      '2 full photo sets (8 photos each)',
      'All 8 scenes',
      'Standard resolution',
    ],
  },
  {
    id: 'popular' as const,
    name: 'Popular',
    credits: 50,
    price: 9.99,
    popular: true,
    features: [
      '50 credits',
      '6 full photo sets (8 photos each)',
      'All 8 scenes + future scenes',
      'High resolution downloads',
      'Priority generation queue',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    credits: 120,
    price: 19.99,
    features: [
      '120 credits',
      '15 full photo sets (8 photos each)',
      'All 8 scenes + future scenes',
      'High resolution downloads',
      'Priority generation queue',
      'Best value',
    ],
  },
];

function BuyButton({ packId }: { packId: 'starter' | 'popular' | 'pro' }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'Authentication required') {
          router.push('/login');
          return;
        }
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Creem checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button className="w-full" onClick={handleBuy} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Buy Credits'
      )}
    </Button>
  );
}

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
        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
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

          {/* Credit Packs */}
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`rounded-2xl p-8 relative hover-lift transition-all duration-300 ${
                pack.popular
                  ? 'border-2 border-primary bg-background'
                  : 'border bg-background'
              }`}
            >
              {pack.popular && (
                <div className="flex justify-center -mt-11 mb-4">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    pack.popular ? 'bg-primary/10' : 'bg-muted'
                  }`}
                >
                  <Zap
                    className={`h-4 w-4 ${
                      pack.popular ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <h3 className="text-lg font-semibold">{pack.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {pack.credits} credits to generate photos.
              </p>
              <div className="mt-6">
                <span className="text-4xl font-bold">${pack.price}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {pack.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <BuyButton packId={pack.id} />
              </div>
            </div>
          ))}
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