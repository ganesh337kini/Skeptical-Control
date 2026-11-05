import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, LogOut } from 'lucide-react';

export default function TopNavigation() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="h-16 bg-background-darkSecondary border-b border-border-dark flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="text-sm text-text-darkSecondary">
          Welcome, {user?.name}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-surface-dark text-text-darkSecondary hover:text-text-darkPrimary transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-surface-dark text-text-darkSecondary hover:text-text-darkPrimary transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
