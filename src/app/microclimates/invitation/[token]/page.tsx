'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Eye, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { Loading } from '@/components/ui/Loading';

interface MicroclimateData {
  _id: string;
  title: string;
  description?: string;
  scheduling: {
    start_time: string;
    duration_minutes: number;
    timezone: string;
  };
  real_time_settings: {
    anonymous_responses: boolean;
    show_live_results: boolean;
    allow_comments: boolean;
  };
  status: string;
  target_participant_count: number;
  response_count: number;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    required: boolean;
  }>;
}

interface InvitationData {
  _id: string;
  status: string;
  expires_at: string;
  microclimate: MicroclimateData;
}

export default function MicroclimateInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const token = params.token as string;

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      // Redirect to login with callback URL
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    validateInvitation();
  }, [session, status, token]);

  const validateInvitation = async () => {
    try {
      setValidating(true);
      const response = await fetch(`/api/microclimates/invitations/validate/${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid invitation');
      }

      const data = await response.json();
      setInvitation(data.invitation);

      // Mark invitation as opened
      await fetch(`/api/microclimates/invitations/${data.invitation._id}/opened`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }),
      });

    } catch (err) {
      console.error('Error validating invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to validate invitation');
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleJoinMicroclimate = () => {
    if (!invitation) return;

    // Mark invitation as started
    fetch(`/api/microclimates/invitations/${invitation._id}/started`, {
      method: 'POST',
    }).catch(console.error);

    // Redirect to microclimate participation page
    router.push(`/microclimates/${invitation.microclimate._id}/respond?token=${token}`);
  };

  const handleViewLiveResults = () => {
    if (!invitation) return;
    router.push(`/microclimates/${invitation.microclimate._id}/live`);
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 space-y-2">
              <Button 
                onClick={() => router.push('/dashboard')} 
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/microclimates')} 
                className="w-full"
              >
                View All Microclimates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  const microclimate = invitation.microclimate;
  const isExpired = new Date() > new Date(invitation.expires_at);
  const isActive = microclimate.status === 'active';
  const hasParticipated = invitation.status === 'participated';
  const startTime = new Date(microclimate.scheduling.start_time);
  const isStarted = new Date() >= startTime;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Microclimate Invitation
          </h1>
          <p className="text-gray-600">
            You've been invited to participate in a quick feedback session
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <CardTitle className="text-xl">{microclimate.title}</CardTitle>
            {microclimate.description && (
              <CardDescription className="text-green-100 mt-2">
                {microclimate.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="p-6">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {microclimate.status.charAt(0).toUpperCase() + microclimate.status.slice(1)}
              </Badge>
              {hasParticipated && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Participated
                </Badge>
              )}
              {isExpired && (
                <Badge variant="destructive">
                  Expired
                </Badge>
              )}
            </div>

            {/* Session Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Duration:</strong> {microclimate.scheduling.duration_minutes} minutes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Participants:</strong> {microclimate.response_count}/{microclimate.target_participant_count}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Privacy:</strong> {microclimate.real_time_settings.anonymous_responses ? 'Anonymous' : 'Confidential'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Questions:</strong> {microclimate.questions.length}
                </span>
              </div>
            </div>

            {/* Start Time */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Session Time</h3>
              <p className="text-sm text-gray-600">
                <strong>Starts:</strong> {startTime.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Expires:</strong> {new Date(invitation.expires_at).toLocaleString()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {hasParticipated ? (
                <div className="text-center">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Thank you for participating! You have already completed this microclimate session.
                    </AlertDescription>
                  </Alert>
                  {microclimate.real_time_settings.show_live_results && (
                    <Button 
                      onClick={handleViewLiveResults}
                      variant="outline"
                      className="mt-4"
                    >
                      View Live Results
                    </Button>
                  )}
                </div>
              ) : isExpired ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This invitation has expired. Please contact your administrator if you still need to participate.
                  </AlertDescription>
                </Alert>
              ) : !isActive ? (
                <Alert>
                  <AlertDescription>
                    This microclimate session is not currently active. Please check back later.
                  </AlertDescription>
                </Alert>
              ) : !isStarted ? (
                <Alert>
                  <AlertDescription>
                    This session hasn't started yet. Please return at the scheduled time: {startTime.toLocaleString()}
                  </AlertDescription>
                </Alert>
              ) : (
                <Button 
                  onClick={handleJoinMicroclimate}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  disabled={validating}
                >
                  {validating ? 'Validating...' : 'Join Session'}
                </Button>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/microclimates')}
                  className="flex-1"
                >
                  All Microclimates
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Your participation helps create a better workplace for everyone.</p>
          <p className="mt-1">Questions? Contact your HR department.</p>
        </div>
      </div>
    </div>
  );
}
