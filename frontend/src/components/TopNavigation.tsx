import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, LogOut } from 'lucide-react';

function getInitials(name?: string, email?: string) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() || 'SC';
}

export default function TopNavigation() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const initials = getInitials(user?.name, user?.email);

  return (
    <header className="h-16 shrink-0 bg-background dark:bg-background-darkSecondary border-b border-border dark:border-border-dark flex items-center justify-between gap-4 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-sm font-semibold text-accent-primary ring-1 ring-accent-primary/25">
          {initials}
        </div>
        <div className="min-w-0">
          <span className="truncate text-sm font-semibold text-text dark:text-text-darkPrimary">
            {user?.name || 'User'}
          </span>
          <div className="truncate text-xs text-text-darkTertiary dark:text-text-darkSecondary">
            {user?.email}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-text-darkTertiary transition-colors hover:bg-surface hover:text-text dark:text-text-darkSecondary dark:hover:bg-surface-dark dark:hover:text-text-darkPrimary"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="mx-1 h-6 w-px bg-border dark:bg-border-dark" />

        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-text-darkTertiary transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-text-darkSecondary dark:hover:text-red-400"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
