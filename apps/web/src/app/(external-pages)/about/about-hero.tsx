import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import Link from 'next/link';

export function AboutHero() {
  return (
    <div className="text-center space-y-6">
      <Badge variant="outline" className="mb-2">
        About DatingImage
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        Better photos.
        <br />
        Better matches.
      </h1>
      <p className="mx-auto max-w-[600px] text-lg text-muted-foreground leading-relaxed">
        DatingImage uses AI to generate professional dating photos from your
        selfies. Same face, stunning settings — no photographer, no studio,
        no awkward poses.
      </p>
      <div className="flex flex-wrap justify-center gap-4 pt-2">
        <Button size="lg" asChild>
          <Link href="/login">
            <Camera className="mr-2 h-5 w-5" />
            Try It Free
          </Link>
        </Button>
      </div>
    </div>
  );
}
