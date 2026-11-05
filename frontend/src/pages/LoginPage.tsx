import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-8 h-8 text-accent-primary" />
            <h1 className="text-2xl font-bold text-text dark:text-text-darkPrimary">Skeptical Control</h1>
          </div>
          <p className="text-text-darkSecondary dark:text-text-darkSecondary">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-text-darkSecondary dark:text-text-darkSecondary mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-lg text-text dark:text-text-darkPrimary placeholder-text-darkTertiary focus:outline-none focus:border-accent-primary"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-text-darkSecondary dark:text-text-darkSecondary mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-lg text-text dark:text-text-darkPrimary placeholder-text-darkTertiary focus:outline-none focus:border-accent-primary"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-primary hover:bg-accent-primaryHover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="mt-6 text-center text-sm text-text-darkSecondary dark:text-text-darkSecondary">
            Don't have an account?{' '}
            <Link to="/signup" className="text-accent-primary hover:text-accent-primaryHover">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
