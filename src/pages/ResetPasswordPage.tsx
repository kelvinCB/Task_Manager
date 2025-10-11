import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have the necessary parameters for password reset
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setError('Invalid or missing reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setIsPasswordReset(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPasswordReset) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-indigo-900 dark:to-blue-900">
        {/* Header with logo on the left */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex justify-start mb-8 px-4 sm:px-10 lg:px-20">
            <div data-testid="app-logo" className="font-bold text-indigo-600 dark:text-indigo-400 text-2xl sm:text-3xl mobile-logo-animation light dark:dark">
              {'TaskLite'.split('').map((letter, index) => (
                <span key={index}>{letter}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Password updated</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
            </div>

            <div>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continue to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-indigo-900 dark:to-blue-900">
      {/* Header with logo on the left */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-start mb-8 px-4 sm:px-10 lg:px-20">
          <div data-testid="app-logo" className="font-bold text-indigo-600 dark:text-indigo-400 text-2xl sm:text-3xl mobile-logo-animation light dark:dark">
            {'TaskLite'.split('').map((letter, index) => (
              <span key={index}>{letter}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
              Set new password
            </h1>
            <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div data-testid="error-message" className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="password-input"
                  className="appearance-none block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="confirm-password-input"
                  className="appearance-none block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                data-testid="update-password-button"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>

          {/* Back to login */}
          <div className="text-center">
            <Link
              to="/login"
              data-testid="back-to-login"
              className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-300"
            >
              <ArrowLeft size={16} />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;