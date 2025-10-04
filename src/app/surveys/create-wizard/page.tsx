'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  SurveyCreationWizard,
  SurveyCreationData,
} from '@/components/survey/SurveyCreationWizard';
import { toast } from 'sonner';

export default function CreateSurveyWizardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleSurveyCreation = async (surveyData: SurveyCreationData) => {
    setIsCreating(true);

    try {
      // Step 1: Create the survey
      const surveyResponse = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: surveyData.title,
          description: surveyData.description,
          type: surveyData.type,
          questions: surveyData.questions,
          demographics: surveyData.demographics,
          settings: {
            anonymous: surveyData.anonymous,
            allow_partial_responses: surveyData.allow_partial_responses,
            randomize_questions: false,
            show_progress: true,
            auto_save: true,
            time_limit_minutes: surveyData.estimated_duration,
            notification_settings: {
              send_invitations: true,
              send_reminders: true,
              reminder_frequency_days: 3,
            },
            invitation_settings: {
              custom_message: surveyData.custom_message,
              include_credentials: surveyData.include_credentials,
              send_immediately: surveyData.send_immediately,
              custom_subject: surveyData.custom_subject,
              branding_enabled: true,
            },
          },
          start_date: surveyData.start_date,
          end_date: surveyData.end_date,
          department_ids: surveyData.department_ids,
          status: 'active', // Create as active if sending immediately
        }),
      });

      if (!surveyResponse.ok) {
        const errorData = await surveyResponse.json();
        throw new Error(errorData.error || 'Failed to create survey');
      }

      const { data: survey } = await surveyResponse.json();

      // Step 2: Get users from selected departments
      const usersResponse = await fetch(
        '/api/users?' +
          new URLSearchParams({
            department_ids: surveyData.department_ids.join(','),
            include_demographics: 'true',
          })
      );

      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users for invitations');
      }

      const { data: users } = await usersResponse.json();

      // Step 3: Send invitations with credentials (handled by API)
      // The API will generate credentials server-side if needed
      if (surveyData.send_immediately && users.length > 0) {
        const invitationResponse = await fetch(
          `/api/surveys/${survey._id}/invitations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_ids: users.map((u: any) => u._id),
              send_immediately: true,
              custom_message: surveyData.custom_message,
              include_credentials: surveyData.include_credentials,
              // API will generate user_credentials server-side
            }),
          }
        );

        if (!invitationResponse.ok) {
          const errorData = await invitationResponse.json();
          console.error('Failed to send invitations:', errorData);
          toast.warning('Survey created but failed to send some invitations');
        } else {
          const invitationData = await invitationResponse.json();
          toast.success(
            `Survey created and ${invitationData.data?.sent_count || 0} invitations sent!`
          );
        }
      } else {
        toast.success('Survey created successfully!');
      }

      // Step 5: Redirect to survey details
      router.push(`/surveys/${survey._id}`);
    } catch (error) {
      console.error('Error creating survey:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create survey'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    router.push('/surveys');
  };

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Please log in to create surveys.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SurveyCreationWizard
        onComplete={handleSurveyCreation}
        onCancel={handleCancel}
      />
    </DashboardLayout>
  );
}
