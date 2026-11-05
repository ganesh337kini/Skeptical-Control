import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Mail, Moon, Sun, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text dark:text-text-darkPrimary mb-2">Settings</h1>
        <p className="text-text-darkSecondary dark:text-text-darkSecondary">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text dark:text-text-darkPrimary mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-darkSecondary dark:text-text-darkSecondary mb-2">Name</label>
              <div className="px-4 py-3 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-lg text-text dark:text-text-darkPrimary">
                {user?.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-darkSecondary dark:text-text-darkSecondary mb-2">Email</label>
              <div className="px-4 py-3 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-lg text-text dark:text-text-darkPrimary flex items-center gap-2">
                <Mail className="w-4 h-4 text-text-darkTertiary" />
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text dark:text-text-darkPrimary mb-4 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-text dark:text-text-darkPrimary">Theme</div>
              <div className="text-sm text-text-darkSecondary dark:text-text-darkSecondary">
                Currently using {theme === 'dark' ? 'dark' : 'light'} mode
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-surface dark:bg-surface-darkSecondary hover:bg-surface dark:hover:bg-surface-dark border border-border dark:border-border-dark rounded-lg font-medium transition-colors"
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text dark:text-text-darkPrimary mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-text dark:text-text-darkPrimary">Password</div>
                <div className="text-sm text-text-darkSecondary dark:text-text-darkSecondary">Last changed recently</div>
              </div>
              <button className="px-4 py-2 bg-surface dark:bg-surface-darkSecondary hover:bg-surface dark:hover:bg-surface-dark border border-border dark:border-border-dark rounded-lg font-medium transition-colors">
                Change Password
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text dark:text-text-darkPrimary mb-4">Platform Configuration</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-text-darkSecondary dark:text-text-darkSecondary">API Endpoint</span>
              <span className="text-text dark:text-text-darkPrimary font-mono">{import.meta.env.VITE_API_URL || 'http://localhost:3001'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-darkSecondary dark:text-text-darkSecondary">Version</span>
              <span className="text-text dark:text-text-darkPrimary">1.0.0 (Phase 1)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
