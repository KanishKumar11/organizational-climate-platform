import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkService } from '@/lib/benchmark-service';
import { validatePermissions } from '@/lib/permissions';
import Benchmark from '@/models/Benchmark';
import { connectDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await validatePermissions(
      session.user.id,
      'benchmark:read',
      session.user.companyId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const categories = await Benchmark.distinct('category', { is_active: true });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching benchmark categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmark categories' },
      { status: 500 }
    );
  }
}
