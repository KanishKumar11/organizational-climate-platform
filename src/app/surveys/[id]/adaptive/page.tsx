'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AdaptiveQuestionnaireInterface from '@/components/survey/AdaptiveQuestionnaireInterface';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/Loading';
import {
  Brain,
  Target,
  Lightbulb,
  CheckCircle,
  ArrowLeft,
  Settings,
} from 'lucide-react';

interface Survey {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  adaptive_enabled: boolean;
}

export default function AdaptiveSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [completed, setCompleted] = useState(false);

  const surveyId = params.id as string;

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSurvey();
    }
  }, [status, surveyId]);

  const fetchSurvey = async () => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}`);
      if (response.ok) {
        const data = await response.json();
        setSurvey(data.survey);
      } else {
        router.push('/surveys');
      }
    } catch (error) {
      console.error('Error fetching survey:', error);
      router.push('/surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSurvey = () => {
    setShowIntro(false);
  };

  const handleSurveyComplete = async (responses: any[]) => {
    try {
      // Save responses
      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          adaptive: true,
        }),
      });

      if (response.ok) {
        setCompleted(true);
      }
    } catch (error) {
      console.error('Error saving responses:', error);
    }
  };

  const handleSaveProgress = async (responses: any[]) => {
    try {
      // Auto-save progress
      await fetch(`/api/surveys/${surveyId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          adaptive: true,
        }),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Survey Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The survey you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <Button onClick={() => router.push('/surveys')}>
            Back to Surveys
          </Button>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Survey Completed!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing the adaptive survey. Your personalized
            responses will help us better understand your experience and improve
            our organization.
          </p>
          <div className="space-y-2">
            <Button onClick={() => router.push('/surveys')} className="w-full">
              Back to Surveys
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              View Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/surveys')}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Surveys
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{survey.title}</h1>
            {survey.description && (
              <p className="text-gray-600 mt-2">{survey.description}</p>
            )}
          </div>

          {/* Adaptive Survey Introduction */}
          <Card className="p-8 mb-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                AI-Powered Adaptive Survey
              </h2>
              <p className="text-gray-600">
                This survey uses artificial intelligence to personalize
                questions based on your responses, making it more relevant and
                efficient for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Personalized
                </h3>
                <p className="text-sm text-gray-600">
                  Questions adapt to your role, department, and previous
                  responses
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Lightbulb className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Intelligent
                </h3>
                <p className="text-sm text-gray-600">
                  AI analyzes patterns to ask the most relevant follow-up
                  questions
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Settings className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Efficient</h3>
                <p className="text-sm text-gray-600">
                  Shorter, more focused surveys that gather better insights
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">
                How it works:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Questions are initially selected based on your role and
                  department
                </li>
                <li>
                  • As you respond, the AI analyzes your answers for patterns
                </li>
                <li>
                  • Subsequent questions are adapted to explore relevant areas
                  more deeply
                </li>
                <li>
                  • You'll see explanations when questions are personalized for
                  you
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">
                Your Context:
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Department:</span>
                  <span className="ml-2 font-medium">
                    {session.user.departmentId || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Role:</span>
                  <span className="ml-2 font-medium">
                    {session.user.role || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={handleStartSurvey}
                className="bg-purple-600 hover:bg-purple-700 px-8 py-3 text-lg"
              >
                Start Adaptive Survey
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Estimated time: 5-10 minutes
              </p>
            </div>
          </Card>

          {/* Privacy Notice */}
          <Card className="p-4">
            <h4 className="font-semibold text-gray-900 mb-2">
              Privacy & Data Usage
            </h4>
            <p className="text-sm text-gray-600">
              Your responses are confidential and will be used only for
              organizational improvement. The AI adaptation process analyzes
              response patterns to improve question relevance but does not store
              or share individual response details.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <AdaptiveQuestionnaireInterface
          surveyId={surveyId}
          userId={session.user.id}
          userContext={{
            department: session.user.departmentId,
            role: session.user.role,
            // demographics: session.user.demographics, // Property doesn't exist on IUser
          }}
          onComplete={handleSurveyComplete}
          onSave={handleSaveProgress}
        />
      </div>
    </div>
  );
}
