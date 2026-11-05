import { cn } from '../lib/utils';

type Status = 'running' | 'stopped' | 'error' | 'pending' | 'uploaded';

interface StatusIndicatorProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  running: {
    color: 'bg-green-500',
    text: 'text-green-500',
    label: 'Running',
  },
  stopped: {
    color: 'bg-gray-500',
    text: 'text-gray-500',
    label: 'Stopped',
  },
  error: {
    color: 'bg-red-500',
    text: 'text-red-500',
    label: 'Error',
  },
  pending: {
    color: 'bg-yellow-500',
    text: 'text-yellow-500',
    label: 'Pending',
  },
  uploaded: {
    color: 'bg-blue-500',
    text: 'text-blue-500',
    label: 'Uploaded',
  },
};

export default function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-2 h-2 rounded-full', config.color)} />
      <span className={cn('text-sm font-medium', config.text)}>{config.label}</span>
    </div>
  );
}
