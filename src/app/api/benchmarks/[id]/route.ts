import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkService } from '@/lib/benchmark-service';
import { validatePermissions } from '@/lib/permissions';
import Benchmark from '@/models/Benchmark';
import { connectDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate permissions
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

    const benchmark = await Benchmark.findById(id);

    if (!benchmark) {
      return NextResponse.json(
        { error: 'Benchmark not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ benchmark });
  } catch (error) {
    console.error('Error fetching benchmark:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmark' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await validatePermissions(
      session.user.id,
      'benchmark:update',
      session.user.companyId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const benchmark = await Benchmark.findByIdAndUpdate(
      id,
      { ...body, updated_at: new Date() },
      { new: true }
    );

    if (!benchmark) {
      return NextResponse.json(
        { error: 'Benchmark not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ benchmark });
  } catch (error) {
    console.error('Error updating benchmark:', error);
    return NextResponse.json(
      { error: 'Failed to update benchmark' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await validatePermissions(
      session.user.id,
      'benchmark:delete',
      session.user.companyId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Soft delete by setting is_active to false
    const benchmark = await Benchmark.findByIdAndUpdate(
      id,
      { is_active: false, updated_at: new Date() },
      { new: true }
    );

    if (!benchmark) {
      return NextResponse.json(
        { error: 'Benchmark not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Benchmark deleted successfully' });
  } catch (error) {
    console.error('Error deleting benchmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete benchmark' },
      { status: 500 }
    );
  }
}
