import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="p-4 bg-surface-dark rounded-full mb-4">
        <Icon className="w-8 h-8 text-text-darkTertiary" />
      </div>
      <h3 className="text-lg font-semibold text-text-darkPrimary mb-2">{title}</h3>
      <p className="text-text-darkSecondary text-center max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-accent-primary hover:bg-accent-primaryHover text-white rounded-lg font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
