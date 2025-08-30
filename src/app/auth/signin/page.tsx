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
      {/* Subtle geometric background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>
      <div className="w-full max-w-6xl flex items-center justify-center">
        {/* Left side - Minimal branding */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex lg:w-1/2 lg:pr-12 flex-col justify-center"
        >
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Brain className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    ClimateAI
                  </h1>
                  <p className="text-gray-500">
                    Organizational Intelligence Platform
                  </p>
                </div>
              </div>

              <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Transform Your Workplace Culture
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                AI-powered insights and real-time feedback to build thriving
                organizational cultures.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Real-time analytics and AI insights</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Dynamic surveys and microclimates</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Enterprise-grade security</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right side - Sign in form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full lg:w-1/2 max-w-md"
        >
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8 lg:hidden"
          >
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900">ClimateAI</h1>
                <p className="text-sm text-gray-500">
                  Organizational Intelligence
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="text-center pt-8 bg-gradient-to-b from-white to-gray-50/50">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </CardTitle>
                <p className="text-gray-600 text-lg">
                  {authMode === 'signin'
                    ? 'Sign in to your account'
                    : 'Join the platform'}
                </p>
              </CardHeader>

              <CardContent className="space-y-6 p-8 pt-0">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4"
                  >
                    <p className="text-sm text-red-700 font-medium">
                      {getErrorMessage(error)}
                    </p>
                  </motion.div>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleCredentialsSignIn} className="space-y-5">
                  {authMode === 'signup' && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-sm font-medium text-gray-700"
                      >
                        Full Name
                      </Label>
                      <div className="relative">
                        <Brain className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                          required={authMode === 'signup'}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={
                          authMode === 'signup'
                            ? 'Create a password (min 8 characters)'
                            : 'Enter your password'
                        }
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-11 pr-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                        required
                        minLength={authMode === 'signup' ? 8 : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 hover:shadow-lg rounded-xl"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Lock className="w-5 h-5 mr-2" />
                    )}
                    {loading
                      ? authMode === 'signup'
                        ? 'Creating account...'
                        : 'Signing in...'
                      : authMode === 'signup'
                        ? 'Create Account'
                        : 'Sign In'}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* OAuth Providers */}
                {providers &&
                  Object.values(providers)
                    .filter((provider) => provider.id !== 'credentials')
                    .map((provider) => (
                      <Button
                        key={provider.name}
                        onClick={() => handleSignIn(provider.id)}
                        disabled={loading}
                        variant="outline"
                        className="w-full h-12 border-gray-200 hover:bg-gray-50 transition-all duration-200 rounded-xl text-gray-700 font-medium"
                        size="lg"
                      >
                        {provider.name === 'Google' && (
                          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        )}
                        Continue with {provider.name}
                      </Button>
                    ))}

                {/* Mode Toggle */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    {authMode === 'signin'
                      ? "Don't have an account?"
                      : 'Already have an account?'}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode(
                          authMode === 'signin' ? 'signup' : 'signin'
                        );
                        setFormData({ email: '', password: '', name: '' });
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      {authMode === 'signin' ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </div>

                {/* Footer */}
                {/* <div className="text-center text-sm text-gray-500 pt-6 border-t border-gray-100">
                  <p className="font-medium">
                    Only authorized domains can access this platform.
                  </p>
                  <p className="mt-2 text-xs">
                    Contact your administrator for access.
                  </p>
                </div> */}
              </CardContent>
            </Card>
          </motion.div>
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
