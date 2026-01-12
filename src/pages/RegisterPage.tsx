import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import { AuthForm } from '../components/features/auth/AuthForm';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { RegistrationSuccessModal } from '../components/features/auth/RegistrationSuccessModal';
import loginIllustrationLight from '../assets/images/login-illustration-light.webp';
import loginIllustrationDark from '../assets/images/login-illustration-dark.webp';

const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  React.useEffect(() => {
    document.title = `${t('auth.register')} | ${t('app.title')}`;
  }, [t]);

  const handleRegister = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    // Strict email validation
    // Prevent consecutive dots, start/end with dot, etc.
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,6}$/;
    
    if (!emailRegex.test(email) || email.includes('..')) {
      setError(t('auth.invalid_email'));
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Registration successful, show modal
      setRegisteredEmail(email);
      setShowSuccessModal(true);

    } catch (err: any) {
      if (err.message === 'Email not confirmed') {
        setError(t('auth.email_not_confirmed'));
      } else if (err.message === 'Unable to validate email address: invalid format') {
        setError(t('auth.invalid_email'));
      } else {
        setError(err.message || t('common.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || t('auth.google_error'));
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || t('auth.github_error'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-indigo-900 dark:to-blue-900 overflow-hidden relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>
      
      <RegistrationSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => navigate('/login')} 
        email={registeredEmail}
      />

      {/* Left side - Decorative Image (Desktop only) - 50% width */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-600 dark:bg-indigo-900 overflow-hidden">
        {/* Logo context in the image side - Top Left over image */}
        <div className="absolute top-10 left-12 z-20">
          <div data-testid="app-logo-desktop" className="font-bold text-indigo-600 dark:text-indigo-400 text-3xl mobile-logo-animation light dark:dark">
            {'Kolium'.split('').map((letter, index) => (
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
              {'Kolium'.split('').map((letter, index) => (
                <span key={index}>{letter}</span>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.create_account_title')}</h1>
          </div>

          {error && (
            <div data-testid="error-message" className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <AuthForm
            onSubmit={handleRegister}
            buttonText={t('auth.register')}
            isLoading={isLoading}
            isSignUp={true}
            onGoogleLogin={handleGoogleLogin}
            onGithubLogin={handleGithubLogin}
          />

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.have_account')}{' '}
            <Link to="/login" data-testid="signin-link" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};


export default RegisterPage;
