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

    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const company_size = searchParams.get('company_size');

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry parameter is required' },
        { status: 400 }
      );
    }

    const filter: any = { industry, is_active: true };
    if (company_size) {
      filter.company_size = company_size;
    }
    
    const benchmarks = await Benchmark.find(filter).sort({ created_at: -1 });

    return NextResponse.json({ benchmarks });
  } catch (error) {
    console.error('Error fetching industry benchmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch industry benchmarks' },
      { status: 500 }
    );
  }
}


