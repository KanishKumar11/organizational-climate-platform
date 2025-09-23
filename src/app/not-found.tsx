'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  FileQuestion,
  ArrowLeft,
  Home,
  Search,
  Compass,
  RefreshCw,
} from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
            className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6"
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
              <FileQuestion className="h-10 w-10 text-blue-600" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-6xl font-bold text-gray-900 mb-2"
          >
            404
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-2xl font-semibold text-gray-800 mb-2"
          >
            Page Not Found
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-gray-600"
          >
            The page you're looking for doesn't exist or has been moved
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-blue-600 flex items-center justify-center space-x-2">
                <Compass className="w-5 h-5" />
                <span>Let's get you back on track</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="space-y-3"
              >
                <Link href="/dashboard">
                  <Button
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:shadow-lg"
                    size="lg"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  className="w-full h-12 text-gray-600 hover:text-gray-800 transition-all duration-200"
                  size="lg"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      Still having trouble?
                    </h4>
                    <p className="text-sm text-blue-700">
                      If you believe this page should exist, please check the
                      URL or contact your administrator for assistance.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="text-center text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-200"
              >
                <p>Organizational Climate Platform</p>
                <p>Error Code: 404 - Page Not Found</p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
