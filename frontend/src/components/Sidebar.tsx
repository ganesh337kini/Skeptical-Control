import { Link, useLocation } from 'react-router-dom';
import { Layout, FolderOpen, Upload, Settings, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Layout },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Upload Project', href: '/projects/upload', icon: Upload },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 h-screen bg-background-dark dark:bg-background-darkSecondary border-r border-border dark:border-border-dark flex flex-col">
      <div className="p-6 border-b border-border dark:border-border-dark">
        <h1 className="text-xl font-semibold text-text dark:text-text-darkPrimary flex items-center gap-2">
          <Activity className="w-6 h-6 text-accent-primary" />
          Skeptical Control
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-text-darkSecondary dark:text-text-darkSecondary hover:bg-surface dark:hover:bg-surface-dark hover:text-text dark:hover:text-text-darkPrimary'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border dark:border-border-dark">
        <div className="text-xs text-text-darkTertiary">
          Phase 1: Foundation
        </div>
      </div>
    </div>
  );
}
