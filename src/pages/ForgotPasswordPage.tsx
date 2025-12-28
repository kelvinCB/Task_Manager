import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import { ArrowLeft, Mail } from 'lucide-react';
import loginIllustrationLight from '../assets/images/login-illustration-light.png';
import loginIllustrationDark from '../assets/images/login-illustration-dark.png';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setIsEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-indigo-900 dark:to-blue-900 overflow-hidden">
        {/* Left side - Decorative Image (Desktop only) - 50% width */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-600 dark:bg-indigo-900 overflow-hidden">
          {/* Logo context in the image side - Top Left over image */}
          <div className="absolute top-10 left-12 z-20">
            <div data-testid="app-logo-desktop" className="font-bold text-indigo-600 dark:text-indigo-400 text-3xl mobile-logo-animation light dark:dark">
              {'TaskLite'.split('').map((letter, index) => (
                <span key={index} className="drop-shadow-md">{letter}</span>
              ))}
            </div>
          </div>

          {/* Illustrations - object-cover to fill space, object-left to pin the rocket/content */}
          <img 
            src={loginIllustrationLight} 
            alt="Task Management Illustration" 
            className="dark:hidden w-full h-full object-cover object-left opacity-90 transition-all duration-500"
          />
          <img 
            src={loginIllustrationDark} 
            alt="Task Management Illustration" 
            className="hidden dark:block w-full h-full object-cover object-left opacity-80 transition-all duration-500"
          />
          
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/20 to-transparent pointer-events-none"></div>
        </div>

        {/* Right side - Content - 50% width */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 overflow-y-auto">
          <div className="max-w-md w-full space-y-8">
            {/* Logo for mobile only */}
            <div className="flex justify-center mb-8 lg:hidden">
              <div data-testid="app-logo-mobile" className="font-bold text-indigo-600 dark:text-indigo-400 text-3xl mobile-logo-animation light dark:dark">
                {'TaskLite'.split('').map((letter, index) => (
                  <span key={index}>{letter}</span>
                ))}
              </div>
            </div>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
              <p className="text-gray-600 dark:text-gray-300">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              
              <button
                onClick={() => {
                  setIsEmailSent(false);
                  setEmail('');
                  setError(null);
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try another email
              </button>

              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-indigo-900 dark:to-blue-900 overflow-hidden">
      {/* Left side - Decorative Image (Desktop only) - 50% width */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-600 dark:bg-indigo-900 overflow-hidden">
        {/* Logo context in the image side - Top Left over image */}
        <div className="absolute top-10 left-12 z-20">
          <div data-testid="app-logo-desktop" className="font-bold text-indigo-600 dark:text-indigo-400 text-3xl mobile-logo-animation light dark:dark">
            {'TaskLite'.split('').map((letter, index) => (
              <span key={index} className="drop-shadow-md">{letter}</span>
            ))}
          </div>
        </div>

        {/* Illustrations - object-cover to fill space, object-left to pin the rocket/content */}
        <img 
          src={loginIllustrationLight} 
          alt="Task Management Illustration" 
          className="dark:hidden w-full h-full object-cover object-left opacity-90 transition-all duration-500"
        />
        <img 
          src={loginIllustrationDark} 
          alt="Task Management Illustration" 
          className="hidden dark:block w-full h-full object-cover object-left opacity-80 transition-all duration-500"
        />
        
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/20 to-transparent pointer-events-none"></div>
      </div>

      {/* Right side - Form Content - 50% width */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 overflow-y-auto">
        <div className="max-w-md w-full space-y-8">
          {/* Logo for mobile only */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div data-testid="app-logo-mobile" className="font-bold text-indigo-600 dark:text-indigo-400 text-3xl mobile-logo-animation light dark:dark">
              {'TaskLite'.split('').map((letter, index) => (
                <span key={index}>{letter}</span>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reset your password
            </h1>
            <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
              Enter your email address and we'll send you a link to reset your password.
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
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="email-input"
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                data-testid="reset-password-button"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
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

export default ForgotPasswordPage;