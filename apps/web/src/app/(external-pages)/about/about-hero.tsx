import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { T } from '@/components/ui/Typography';
import { Github } from 'lucide-react';
import Link from 'next/link';

export function AboutHero() {
  return (
    <div className="text-center space-y-4">
      <Badge variant="outline" className="mb-4">
        About DatingImage
      </Badge>
      <T.H1 className="text-4xl sm:text-5xl md:text-6xl">
        AI-Powered{' '}
        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
          Dating Photos
        </span>
      </T.H1>
      <T.P className="mx-auto max-w-[700px] text-lg text-muted-foreground">
        Upload your selfies, choose from 8 stunning scenes, and get professional
        dating profile photos in minutes. No photographer needed.
      </T.P>
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <Button size="lg" asChild>
          <Link href="/sign-up">Get Started Free</Link>
        </Button>
      </div>
    </div>
  );
}
