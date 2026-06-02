'use client';

import Image from 'next/image';

const EXAMPLES = [
  {
    before: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=500&fit=crop&q=70',
    after: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&q=70',
    scene: 'Beach Sunset',
  },
  {
    before: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&q=70',
    after: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&q=70',
    scene: 'Wine Bar',
  },
  {
    before: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&q=70',
    after: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&q=70',
    scene: 'Urban Street',
  },
];

export function AboutGallery() {
  return (
    <section className="border-t px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
            Examples
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            From selfie to stunning.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            See how DatingImage transforms everyday selfies into professional
            dating photos. Same face, new world.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {EXAMPLES.map((example, i) => (
            <div key={i} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {/* Before */}
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
                  <Image
                    src={example.before}
                    alt={`Before - ${example.scene}`}
                    fill
                    className="object-cover grayscale-[40%]"
                    unoptimized
                  />
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    Before
                  </span>
                </div>
                {/* After */}
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5">
                  <Image
                    src={example.after}
                    alt={`After - ${example.scene}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                    After
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-center text-muted-foreground">
                {example.scene}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
