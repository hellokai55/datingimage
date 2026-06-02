import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

export function H2({ className, ...rest }: ComponentProps<'h2'>) {
  const classNames = cn(
    'scroll-m-20 text-3xl font-semibold tracking-tight transition-colors',
    className
  );
  return <h2 className={classNames} {...rest}></h2>;
}
