import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function MetricCard({ title, value, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn('bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-accent-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-accent-primary" />
        </div>
        {trend && (
          <div
            className={cn(
              'text-xs font-medium flex items-center gap-1',
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-semibold text-text dark:text-text-darkPrimary mb-1">{value}</div>
      <div className="text-sm text-text-darkSecondary dark:text-text-darkSecondary">{title}</div>
    </div>
  );
}
