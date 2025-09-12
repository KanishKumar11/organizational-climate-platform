import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import MicroclimateBuilder from '@/components/microclimate/MicroclimateBuilder';
import { Loading } from '@/components/ui/Loading';

export default async function CreateMicroclimatePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    notFound();
  }

  // Check if user has permission to create microclimates
  const canCreateMicroclimates = [
    'super_admin',
    'company_admin',
    'leader',
  ].includes(session.user.role);

  if (!canCreateMicroclimates) {
    notFound();
  }

  return (
    <Suspense fallback={<Loading size="lg" />}>
      <MicroclimateBuilder />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: 'Create Microclimate | Organizational Climate Platform',
    description: 'Create a new real-time feedback microclimate for your team.',
  };
}
