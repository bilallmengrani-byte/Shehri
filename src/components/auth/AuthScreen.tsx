import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { ShehriLogo } from '../common/ShehriLogo';

interface AuthScreenProps {
  onSuccess?: () => void;
  redirectReason?: string;
  initialMode?: 'login' | 'signup';
  onExploreAsGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  redirectReason = 'Sign in to accept missions, report uncollected waste, and earn CleanPoints.',
  initialMode = 'login',
  onExploreAsGuest,
}) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAsDemoUser } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('Farid Town, Sector 3');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const neighborhoods = [
    'Farid Town, Sector 3',
    'Farid Town Sector 2',
    'Civil Lines',
    'High Street & Goal Chowk',
    'Canal View Colony',
    'College Road Area',
    'Montgomery Railway Colony',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name, neighborhood);
      } else {
        await signInWithEmail(email, password);
      }
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Auth error:', err);
      // Human-friendly error translation
      const authError = err as { code?: string; message?: string };
      const code = authError?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in.');
      } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please verify credentials.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completion.');
      } else {
        setError(authError?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      const authError = err as { code?: string; message?: string };
      if (authError?.code !== 'auth/popup-closed-by-user') {
        setError(authError?.message || 'Failed to sign in with Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-120px)] bg-stone-50 animate-fade-in">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Brand Header */}
        <div className="text-center space-y-1.5 flex flex-col items-center">
          <ShehriLogo
            layout="stacked"
            size="lg"
            theme="dark"
            showCityBadge={true}
          />

          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed pt-1">
            {redirectReason}
          </p>
        </div>

        {/* Auth Card */}
        <Card variant="elevated" className="border-stone-200/90 shadow-md">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-stone-100 rounded-xl mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                mode === 'login'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                mode === 'signup'
                  ? 'bg-white text-[#0F5132] shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-snug">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Hamza Khan"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 rounded-xl text-xs text-stone-800 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Sahiwal Neighborhood */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Sahiwal Neighborhood / Mohalla
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#0F5132] absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 rounded-xl text-xs text-stone-800 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132] focus:bg-white transition"
                    >
                      {neighborhoods.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 rounded-xl text-xs text-stone-800 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 rounded-xl text-xs text-stone-800 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Confirm Password (on signup) */}
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 rounded-xl text-xs text-stone-800 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132] focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            {/* Primary Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              className="mt-1"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              {mode === 'login' ? 'Log In to Shehri' : 'Create Citizen Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white px-2 text-stone-400">or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-[0.99] transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          {/* Quick 1-Tap Login Options */}
          <div className="mt-3.5 p-2.5 bg-stone-50 border border-stone-200/90 rounded-xl">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>1-Tap Demo Citizen Access</span>
              </span>
              <span className="text-[9px] text-[#0F5132] font-semibold bg-emerald-100 px-1.5 py-0.5 rounded-md">Instant</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  setGoogleLoading(true);
                  try {
                    await signInAsDemoUser('Bilal Mengrani', 'bilalmengrani6@gmail.com', 'Canal View Colony');
                    onSuccess?.();
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
                className="p-1.5 rounded-lg bg-white border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-start transition cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#0F5132] font-bold text-[9px] flex items-center justify-center shrink-0">
                    BM
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-stone-800 group-hover:text-[#0F5132] block truncate">
                      Bilal Mengrani
                    </span>
                    <span className="text-[9px] text-stone-400 block truncate">
                      Canal View
                    </span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setGoogleLoading(true);
                  try {
                    await signInAsDemoUser('Hamza Khan', 'hamza.khan@shehri.sahiwal.pk', 'Farid Town, Sector 3');
                    onSuccess?.();
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
                className="p-1.5 rounded-lg bg-white border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-start transition cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[9px] flex items-center justify-center shrink-0">
                    HK
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-stone-800 group-hover:text-[#0F5132] block truncate">
                      Hamza Khan
                    </span>
                    <span className="text-[9px] text-stone-400 block truncate">
                      Farid Town
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Toggle between Login / Signup */}
          <div className="mt-4 text-center text-xs text-stone-500">
            {mode === 'login' ? (
              <p>
                Don't have a civic account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-bold text-[#0F5132] hover:underline cursor-pointer"
                >
                  Create account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-bold text-[#0F5132] hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </p>
            )}
          </div>
        </Card>

        {/* Civic Benefits Pill */}
        <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-stone-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0F5132] shrink-0" />
            <span>Official Sahiwal Citizen Verification & Rewards</span>
          </div>
          <span className="font-bold text-[#0F5132]">Free</span>
        </div>

        {onExploreAsGuest && (
          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={onExploreAsGuest}
              className="text-xs text-stone-500 hover:text-stone-800 underline font-medium cursor-pointer"
            >
              Skip for now — Explore Sahiwal Map as Guest →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
