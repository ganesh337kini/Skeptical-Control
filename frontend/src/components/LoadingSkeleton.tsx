import { cn } from '../lib/utils';

export default function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-surface dark:bg-surface-dark rounded', className)} />
  );
}
