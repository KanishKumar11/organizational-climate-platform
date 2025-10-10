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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  UserPlus,
  Building2,
  Mail,
  User,
} from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center p-4">
        <div className="relative overflow-hidden max-w-2xl w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-3xl" />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative p-8 lg:p-12">
            <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur">
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-lg w-fit mx-auto mb-6">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                <p className="text-gray-600 dark:text-gray-300 text-lg font-montserrat">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/30 dark:from-slate-900 dark:via-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
        <div className="relative overflow-hidden max-w-2xl w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-red-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-red-900/20 rounded-3xl" />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative p-8 lg:p-12">
            <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur">
              <CardHeader className="text-center">
                <div className="p-4 bg-gradient-to-br from-red-500 via-orange-500 to-red-500 rounded-2xl shadow-lg w-fit mx-auto mb-6">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400 font-montserrat">
                  Invalid Invitation
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 font-montserrat">
                  {invitationData.error}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl font-montserrat"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="max-w-lg mx-auto">
          {/* Compact Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-montserrat">
                {invitationData?.invitation
                  ? 'Join Your Team'
                  : 'Create Account'}
              </h1>
            </div>

            {invitationData?.invitation && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium font-montserrat">
                  <Building2 className="h-3 w-3" />
                  {invitationData.invitation.company_name}
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium font-montserrat">
                  <User className="h-3 w-3" />
                  {formatRole(invitationData.invitation.role)}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-300 font-montserrat">
              {invitationData?.invitation ? (
                <>Complete your registration to join your team</>
              ) : (
                'Get started with organizational climate insights'
              )}
            </p>
          </div>

          {/* Main Registration Form */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6">
            {invitationData?.invitation && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-montserrat">
                    <span className="font-semibold">Invited by:</span>{' '}
                    {invitationData.invitation.inviter_name}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50/80 to-pink-50/80 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-montserrat font-medium">
                    {error}
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-montserrat font-medium">
                    {success}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-3">
                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-montserrat"
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
                    className="h-12 px-4 border border-gray-200/50 dark:border-gray-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white/80 dark:bg-slate-800/80 rounded-xl font-montserrat shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-montserrat"
                  >
                    Email Address *
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <Mail />
                    </div>
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
                      className="h-12 pl-12 pr-4 border border-gray-200/50 dark:border-gray-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white/80 dark:bg-slate-800/80 rounded-xl font-montserrat shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="job_title"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-montserrat"
                  >
                    Job Title
                  </Label>
                  <Input
                    id="job_title"
                    type="text"
                    value={formData.job_title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        job_title: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    className="h-12 px-4 border border-gray-200/50 dark:border-gray-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white/80 dark:bg-slate-800/80 rounded-xl font-montserrat shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm"
                    placeholder="Enter your job title"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-montserrat"
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
                    className="h-12 px-4 border border-gray-200/50 dark:border-gray-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white/80 dark:bg-slate-800/80 rounded-xl font-montserrat shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm"
                    placeholder="Create a strong password"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat flex items-center gap-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    Must be at least 8 characters long
                  </p>
                </div>
              </div>

              {/* Privacy Consent Section */}
              <div className="space-y-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-lg">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white font-montserrat">
                    Privacy & Consent
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/80 dark:from-slate-700/50 dark:to-blue-900/20 rounded-xl">
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
                        className="text-sm font-semibold cursor-pointer text-gray-900 dark:text-white font-montserrat"
                      >
                        I agree to the Privacy Policy and Terms of Service
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-montserrat">
                        Required to create an account.{' '}
                        <button
                          type="button"
                          onClick={() => setShowPrivacyPolicy(true)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium transition-colors"
                        >
                          Read Privacy Policy
                        </button>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-gray-50/80 to-indigo-50/80 dark:from-slate-700/50 dark:to-indigo-900/20 rounded-xl">
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
                        className="text-sm font-semibold cursor-pointer text-gray-900 dark:text-white font-montserrat"
                      >
                        I would like to receive updates and insights
                      </Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-montserrat">
                        Optional. Receive organizational insights and updates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-montserrat"
                  disabled={isSubmitting || !privacyConsent}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Create Account
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Privacy Policy Modal */}
            <PrivacyPolicyModal
              open={showPrivacyPolicy}
              onOpenChange={setShowPrivacyPolicy}
              companyName={
                invitationData?.invitation?.company_name || 'Our Organization'
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center p-4">
          <div className="relative overflow-hidden max-w-2xl w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-3xl" />
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="relative p-8 lg:p-12">
              <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur">
                <CardContent className="p-8 text-center">
                  <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-lg w-fit mx-auto mb-6">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-gray-600 dark:text-gray-300 text-lg font-montserrat">
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
