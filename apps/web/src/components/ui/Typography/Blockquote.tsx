import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

export function Blockquote({
  className,
  ...rest
}: ComponentProps<'blockquote'>) {
  const classNames = cn(
    'border-l-2 border-muted pl-6 italic text-muted-foreground',
    className
  );
  return <blockquote className={classNames} {...rest}></blockquote>;
}
