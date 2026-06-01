import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Github, Rocket } from 'lucide-react';
import Link from 'next/link';

export function AboutCTA() {
  return (
    <Empty className="border-2 border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Rocket />
        </EmptyMedia>
        <EmptyTitle>Ready for Better Dating Photos?</EmptyTitle>
        <EmptyDescription>
          Join thousands of users who transformed their dating profiles with AI-generated photos.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/sign-up">Start Building</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link
              href="https://github.com/hellokai55/datingimage"
              target="_blank"
            >
              <Github className="mr-2 h-5 w-5" />
              Star on GitHub
            </Link>
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
