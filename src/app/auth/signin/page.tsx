'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Loader2, Eye, EyeOff, Mail, Lock, Brain } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [providers, setProviders] = useState<Record<string, Provider> | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  const handleSignIn = async (providerId: string) => {
    setLoading(true);
    try {
      await signIn(providerId, { callbackUrl });
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'signup') {
        // Handle signup
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });

        if (response.ok) {
          // After successful signup, sign in the user
          const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            callbackUrl,
            redirect: false,
          });

          if (result?.url) {
            window.location.href = result.url;
          }
        } else {
          const errorData = await response.json();
          console.error('Signup error:', errorData.error);
          alert(`Signup failed: ${errorData.error}`);
        }
      } else {
        // Handle signin
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          callbackUrl,
          redirect: false,
        });

        if (result?.error) {
          console.error('Credentials sign in error:', result.error);
          alert(`Sign in failed: ${getErrorMessage(result.error)}`);
        } else if (result?.url) {
          window.location.href = result.url;
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support.';
      case 'AccessDenied':
        return 'Access denied. Please check your credentials or contact your administrator.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'CredentialsSignin':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'OAuthSignin':
        return 'Error occurred during OAuth sign in. Please try again.';
      case 'OAuthCallback':
        return 'Error occurred during OAuth callback. Please try again.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account. Please contact support.';
      case 'EmailCreateAccount':
        return 'Could not create account with that email. Please try a different email.';
      case 'Callback':
        return 'Error occurred during callback. Please try again.';
      case 'OAuthAccountNotLinked':
        return 'Email already exists with different provider. Please sign in with your original method.';
      case 'EmailSignin':
        return 'Check your email for the sign in link.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      default:
        return 'An error occurred during sign in. Please try again or contact support.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>
      <div className="w-full max-w-6xl flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full lg:w-1/2 max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-center text-gray-900">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <p className="text-center text-gray-600 mt-2">
                {authMode === 'signin'
                  ? 'Sign in to your account to continue'
                  : 'Create a new account to get started'}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-red-700 text-sm font-medium">
                    {getErrorMessage(error)}
                  </p>
                </motion.div>
              )}

              {providers && (
                <div className="space-y-3">
                  {Object.values(providers)
                    .filter((provider) => provider.id !== 'credentials')
                    .map((provider) => (
                      <Button
                        key={provider.id}
                        onClick={() => handleSignIn(provider.id)}
                        disabled={loading}
                        className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <Mail className="w-5 h-5 mr-2" />
                        )}
                        Continue with {provider.name}
                      </Button>
                    ))}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                {authMode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                    />
                  </motion.div>
                )}

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                    />
                    <Mail className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your password"
                    />
                    <Lock className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none w-5 h-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      {authMode === 'signin' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    authMode === 'signin' ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {authMode === 'signin'
                    ? "Don't have an account?"
                    : 'Already have an account?'}
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    className="ml-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    {authMode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function SignInLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Loading...
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInContent />
    </Suspense>
  );
}
