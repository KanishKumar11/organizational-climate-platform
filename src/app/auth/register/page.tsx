'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle, AlertCircle, Shield, Info } from 'lucide-react';
import { ConsentManager } from '@/components/privacy/ConsentManager';
import { PrivacyPolicyModal } from '@/components/legal/PrivacyPolicyModal';

interface InvitationData {
  valid: boolean;
  invitation?: {
    email: string;
    company_name: string;
    inviter_name: string;
    role: string;
    invitation_type: string;
    setup_required: boolean;
    expires_at: string;
  };
  error?: string;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitationData, setInvitationData] = useState<InvitationData | null>(
    null
  );
  const [isValidatingInvitation, setIsValidatingInvitation] = useState(!!token);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    job_title: '',
  });
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Validate invitation token on component mount
  useEffect(() => {
    if (token) {
      validateInvitation(token);
    }
  }, [token]);

  const validateInvitation = async (invitationToken: string) => {
    try {
      const response = await fetch(
        `/api/auth/validate-invitation?token=${invitationToken}`
      );
      const data = await response.json();

      if (data.success) {
        setInvitationData({
          valid: true,
          invitation: data.data,
        });

        // Pre-fill email if it's a direct invitation
        if (data.data.invitation_type !== 'employee_self_signup') {
          setFormData((prev) => ({ ...prev, email: data.data.email }));
        }
      } else {
        setInvitationData({
          valid: false,
          error: data.error || 'Invalid invitation',
        });
      }
    } catch (error) {
      console.error('Error validating invitation:', error);
      setInvitationData({
        valid: false,
        error: 'Failed to validate invitation',
      });
    } finally {
      setIsValidatingInvitation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!privacyConsent) {
      setError('You must accept the privacy policy to create an account');
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        job_title: formData.job_title,
        privacy_consent: privacyConsent,
        marketing_consent: marketingConsent,
      };

      if (token) {
        registrationData.invitation_token = token;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          router.push(
            '/auth/signin?message=Registration successful. Please sign in.'
          );
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while validating invitation
  if (isValidatingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if invitation is invalid
  if (token && invitationData && !invitationData.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              {invitationData.error ||
                'This invitation link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/auth/signin')}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {invitationData?.invitation
              ? 'Complete Your Registration'
              : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {invitationData?.invitation ? (
              <>
                You've been invited to join{' '}
                <strong>{invitationData.invitation.company_name}</strong> as a{' '}
                <strong>{invitationData.invitation.role}</strong>
              </>
            ) : (
              'Create your account to get started'
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {invitationData?.invitation && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">
                    Invitation Details
                  </p>
                  <p className="text-blue-700 mt-1">
                    From: {invitationData.invitation.inviter_name}
                  </p>
                  <p className="text-blue-700">
                    Role: {invitationData.invitation.role}
                  </p>
                  <p className="text-blue-700">
                    Company: {invitationData.invitation.company_name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={
                  isSubmitting ||
                  invitationData?.invitation?.invitation_type !==
                    'employee_self_signup'
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                type="text"
                value={formData.job_title}
                onChange={(e) =>
                  setFormData({ ...formData, job_title: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                disabled={isSubmitting}
                minLength={8}
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Privacy Consent Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-900">
                  Privacy & Consent
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy-consent"
                    checked={privacyConsent}
                    onCheckedChange={(checked) =>
                      setPrivacyConsent(checked === true)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="privacy-consent"
                      className="text-sm font-medium cursor-pointer"
                    >
                      I agree to the Privacy Policy and Terms of Service
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Required to create an account and use the platform.{' '}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyPolicy(true)}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Read Privacy Policy
                      </button>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing-consent"
                    checked={marketingConsent}
                    onCheckedChange={(checked) =>
                      setMarketingConsent(checked === true)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="marketing-consent"
                      className="text-sm font-medium cursor-pointer"
                    >
                      I would like to receive updates and insights
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Optional. Receive organizational insights, platform
                      updates, and best practices.
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Your privacy is important to us. We collect only the data
                  necessary to provide our services and never share personal
                  information with third parties without your consent.
                </AlertDescription>
              </Alert>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !privacyConsent}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Privacy Policy Modal */}
          <PrivacyPolicyModal
            open={showPrivacyPolicy}
            onOpenChange={setShowPrivacyPolicy}
            companyName={
              invitationData?.invitation?.company_name || 'Our Organization'
            }
          />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/signin')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading registration form...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
