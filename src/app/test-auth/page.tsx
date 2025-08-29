'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
          <CardDescription>
            Test Google OAuth login with detailed logging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800">Signed In Successfully!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>Name:</strong> {session.user?.name}</p>
                  <p><strong>Email:</strong> {session.user?.email}</p>
                  <p><strong>Provider:</strong> Google</p>
                </div>
              </div>
              <Button 
                onClick={() => signOut()} 
                variant="outline" 
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Click the button below to test Google OAuth login. 
                  Check the terminal/console for detailed authentication logs.
                </p>
              </div>
              <Button 
                onClick={() => signIn('google')} 
                className="w-full"
              >
                Sign in with Google
              </Button>
              <Button 
                onClick={() => signIn('credentials')} 
                variant="outline" 
                className="w-full"
              >
                Sign in with Credentials
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}