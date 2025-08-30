'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Suspense } from 'react';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { AlertTriangle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorDetails = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          description:
            'There is a problem with the authentication configuration. Please contact support.',
          suggestion:
            'This is likely a temporary issue. Please try again later or contact your administrator.',
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description:
            'Your email domain is not authorized to access this platform.',
          suggestion:
            'Only users from authorized organizations can sign in. Contact your administrator to request access.',
        };
      case 'Verification':
        return {
          title: 'Verification Failed',
          description:
            'The verification link has expired or has already been used.',
          suggestion:
            'Please try signing in again to receive a new verification link.',
        };
      case 'Default':
      default:
        return {
          title: 'Authentication Error',
          description:
            'An unexpected error occurred during the authentication process.',
          suggestion:
            'Please try signing in again. If the problem persists, contact support.',
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-md w-full space-y-8"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.3,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
            className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6"
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-3xl font-bold text-gray-900"
          >
            Authentication Failed
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-2 text-gray-600"
          >
            We encountered an issue while trying to sign you in
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-red-600 flex items-center justify-center space-x-2">
                <HelpCircle className="w-5 h-5" />
                <span>{errorDetails.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-2">{errorDetails.description}</p>
                  <p>{errorDetails.suggestion}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="space-y-3"
              >
                <Link href="/auth/signin">
                  <Button
                    className="w-full h-12 bg-red-600 hover:bg-red-700 transition-all duration-200 hover:shadow-lg"
                    size="lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </Link>

                <Link href="/">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                    size="lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </motion.div>

              {error === 'AccessDenied' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        Need Access?
                      </h4>
                      <p className="text-sm text-blue-700">
                        If you believe you should have access to this platform,
                        please contact your organization&apos;s administrator or
                        IT support team. They can add your email domain to the
                        authorized list.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="text-center text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-200"
              >
                <p className="font-mono">Error Code: {error || 'UNKNOWN'}</p>
                <p>
                  If you continue to experience issues, please provide this
                  error code to support.
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Loading component for Suspense fallback
function AuthErrorLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Loading...
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AlertTriangle className="w-8 h-8 animate-pulse text-red-600" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<AuthErrorLoading />}>
      <AuthErrorContent />
    </Suspense>
  );
}
