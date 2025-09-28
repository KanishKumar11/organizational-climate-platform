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
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  Info,
  UserPlus,
  Building2,
} from 'lucide-react';
import { ConsentManager } from '@/components/privacy/ConsentManager';
import { PrivacyPolicyModal } from '@/components/legal/PrivacyPolicyModal';
import { signIn } from 'next-auth/react';

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
    job_title: '',
  });
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Format role for display
  const formatRole = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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

    if (!privacyConsent) {
      setError('Please accept the Privacy Policy and Terms of Service');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          invitation_token: token,
          privacy_consent: privacyConsent,
          marketing_consent: marketingConsent,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Account created successfully! Signing you in...');

        // Automatically sign in the user
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          router.push('/dashboard');
        } else {
          setError(
            'Account created but sign-in failed. Please sign in manually.'
          );
          setSuccess('');
        }
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while validating invitation
  if (isValidatingInvitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="relative overflow-hidden max-w-4xl w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 rounded-3xl" />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative p-8 lg:p-12">
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl shadow-lg w-fit mx-auto mb-6">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600 text-lg">
                  Validating invitation...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show error if invitation is invalid
  if (invitationData && !invitationData.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="relative overflow-hidden max-w-4xl w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-red-50 rounded-3xl" />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative p-8 lg:p-12">
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
              <CardHeader className="text-center">
                <div className="p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-lg w-fit mx-auto mb-6">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-red-600">
                  Invalid Invitation
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {invitationData.error}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                >
                  Go to Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section - Simplified */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-sm mb-6">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {invitationData?.invitation ? 'Join Your Team' : 'Create Account'}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {invitationData?.invitation ? (
                <>
                  Complete your registration to join{' '}
                  <span className="font-semibold text-blue-600">
                    {invitationData.invitation.company_name}
                  </span>{' '}
                  as a{' '}
                  <span className="font-semibold text-indigo-600">
                    {formatRole(invitationData.invitation.role)}
                  </span>
                </>
              ) : (
                'Get started with organizational climate insights and surveys.'
              )}
            </p>
            {invitationData?.invitation && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  {invitationData.invitation.company_name}
                </div>
                <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200">
                  {formatRole(invitationData.invitation.role)}
                </div>
              </div>
            )}
          </div>

          {/* Main Registration Card */}
          <Card className="border border-slate-200/60 bg-white/95 backdrop-blur shadow-sm">
            <CardContent className="p-8">
              {invitationData?.invitation && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-800 mb-1">
                        Invitation Details
                      </p>
                      <div className="space-y-1 text-blue-700">
                        <p>From: {invitationData.invitation.inviter_name}</p>
                        <p>
                          Role: {formatRole(invitationData.invitation.role)}
                        </p>
                        <p>Company: {invitationData.invitation.company_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50/80">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 border-green-200 bg-green-50/80">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      disabled={isSubmitting}
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email Address *
                    </Label>
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
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="job_title"
                      className="text-sm font-medium text-gray-700"
                    >
                      Job Title
                    </Label>
                    <Input
                      id="job_title"
                      type="text"
                      value={formData.job_title}
                      onChange={(e) =>
                        setFormData({ ...formData, job_title: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your job title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password *
                    </Label>
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
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Create a strong password"
                    />
                    <p className="text-xs text-gray-500">
                      Must be at least 8 characters long
                    </p>
                  </div>
                </div>

                {/* Privacy Consent Section */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Privacy & Consent
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
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
                          className="text-sm font-medium cursor-pointer text-gray-900"
                        >
                          I agree to the Privacy Policy and Terms of Service
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Required to create an account and use the platform.{' '}
                          <button
                            type="button"
                            onClick={() => setShowPrivacyPolicy(true)}
                            className="text-blue-600 hover:text-blue-700 underline font-medium"
                          >
                            Read Privacy Policy
                          </button>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
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
                          className="text-sm font-medium cursor-pointer text-gray-900"
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

                  <Alert className="bg-blue-50/50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 text-sm">
                      Your privacy is important to us. We collect only the data
                      necessary to provide our services and never share personal
                      information with third parties without your consent.
                    </AlertDescription>
                  </Alert>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-sm hover:shadow-md transition-all"
                  disabled={isSubmitting || !privacyConsent}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="font-semibold text-blue-600 hover:text-blue-700 underline transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
          <div className="relative overflow-hidden max-w-4xl w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 rounded-3xl" />
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="relative p-8 lg:p-12">
              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
                <CardContent className="p-8 text-center">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl shadow-lg w-fit mx-auto mb-6">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600 text-lg">
                    Loading registration form...
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
