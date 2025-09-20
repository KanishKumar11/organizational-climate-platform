import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import MicroclimateDetailView from '@/components/microclimate/MicroclimateDetailView';
import { Loading } from '@/components/ui/Loading';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  sanitizeForSerialization,
  safeToISOString,
} from '@/lib/datetime-utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMicroclimateData(id: string, session: any) {
  try {
    await connectDB();

    const microclimate = await Microclimate.findById(id);

    if (!microclimate) {
      console.log(`Microclimate not found with ID: ${id}`);
      return null;
    }

    // Check access permissions
    if (
      microclimate.company_id !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      console.log(
        `Access denied for user ${session.user.id} to microclimate ${id}`
      );
      return null;
    }

    // Helper function to determine correct status based on timing
    function determineStatusFromTiming(
      startTime: Date,
      durationMinutes: number
    ): 'scheduled' | 'active' | 'completed' {
      const now = new Date();
      const endTime = new Date(
        startTime.getTime() + durationMinutes * 60 * 1000
      );

      if (now < startTime) {
        return 'scheduled';
      } else if (now >= startTime && now <= endTime) {
        return 'active';
      } else {
        return 'completed';
      }
    }

    // Auto-update status based on timing if needed
    const currentStatus = microclimate.status;
    const correctStatus = determineStatusFromTiming(
      microclimate.scheduling.start_time,
      microclimate.scheduling.duration_minutes
    );

    // Only update if status needs to change and it's not manually set to cancelled/paused
    if (
      correctStatus !== currentStatus &&
      !['cancelled', 'paused'].includes(currentStatus)
    ) {
      console.log(
        `Auto-updating microclimate ${id} status from ${currentStatus} to ${correctStatus}`
      );
      microclimate.status = correctStatus;
      await microclimate.save();
    }

    // Sanitize the data for client-side consumption
    const sanitizedMicroclimate = sanitizeForSerialization({
      _id: microclimate._id.toString(),
      title: microclimate.title,
      description: microclimate.description,
      company_id: microclimate.company_id,
      created_by: microclimate.created_by,
      status: microclimate.status,
      targeting: microclimate.targeting,
      scheduling: {
        ...microclimate.scheduling,
        start_time: safeToISOString(microclimate.scheduling.start_time),
      },
      real_time_settings: microclimate.real_time_settings,
      questions: microclimate.questions,
      response_count: microclimate.response_count,
      target_participant_count: microclimate.target_participant_count,
      participation_rate: microclimate.participation_rate,
      live_results: microclimate.live_results,
      template_id: microclimate.template_id,
      created_at: safeToISOString(microclimate.created_at),
      updated_at: safeToISOString(microclimate.updated_at),
    });

    return sanitizedMicroclimate;
  } catch (error) {
    console.error('Error fetching microclimate:', error);
    return null;
  }
}

export default async function MicroclimatePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { id } = await params;
  const microclimateData = await getMicroclimateData(id, session);

  if (!microclimateData) {
    notFound();
  }

  // Redirect to appropriate view based on status
  const status = microclimateData.status;
  
  if (status === 'active') {
    redirect(`/microclimates/${id}/live`);
  }
  
  if (status === 'completed') {
    redirect(`/microclimates/${id}/results`);
  }

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <MicroclimateDetailView 
            microclimate={microclimateData}
            currentUser={session.user}
          />
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
