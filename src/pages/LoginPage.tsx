import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import { AuthForm } from '../components/features/auth/AuthForm';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // The onAuthStateChange listener in AuthContext will handle the redirect automatically.
      // We can still navigate here as a fallback.
      navigate('/');

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true); // Share loading state or create a separate one if needed.
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      // Redirect is handled by Supabase/Provider
    } catch (err: any) {
      setError(err.message || 'Error connecting to Google.');
      setIsLoading(false);
    }
  };

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

      {/* Main content - without white background */}
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white">Log in to your account</h1>
          </div>
          
          {error && (
            <div data-testid="error-message" className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
              {error}
            </div>
          )}
          
          <AuthForm 
            onSubmit={handleLogin} 
            buttonText="Log in" 
            isLoading={isLoading} 
            onGoogleLogin={handleGoogleLogin}
          />
          
          {/* Option to register at the end */}
          <div className="text-base text-center mt-8">
            <span className="text-gray-600 dark:text-gray-300 mr-2">Don't have an account?</span>
            <Link to="/register" data-testid="signup-link" className="text-indigo-600 dark:text-indigo-400 font-semibold">
              Sign up →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
