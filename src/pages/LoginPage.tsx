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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-indigo-900 dark:to-blue-900">
      {/* Header con logo y enlace sign up más espaciados */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center mb-8 px-4 sm:px-10 lg:px-20">
          <div className="font-bold text-indigo-600 dark:text-indigo-400 text-2xl sm:text-3xl">TaskLite</div>
          <div className="text-base">
            <span className="text-gray-600 dark:text-gray-300 mr-2">Don't have an account?</span>
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold">
              Sign up →
            </Link>
          </div>
        </div>
      </div>

      {/* Main content - sin fondo blanco */}
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white">Log in to your account</h1>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
              {error}
            </div>
          )}
          
          <AuthForm onSubmit={handleLogin} buttonText="Log in" isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
