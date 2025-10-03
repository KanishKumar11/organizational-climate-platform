import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

/**
 * CLIMA-001 & CLIMA-003: Company Users API
 *
 * GET /api/companies/[id]/users
 * Returns users for a company (for targeting preload)
 *
 * Query params:
 * - limit: Max users to return (default: 1000)
 * - department_id: Filter by department
 * - search: Search by name or email
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id: companyId } = await params;
    const { searchParams } = new URL(request.url);

    // Authorization
    if (
      session.user.role !== 'super_admin' &&
      session.user.companyId !== companyId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build query
    const query: any = {
      company_id: companyId,
      is_active: true,
    };

    const departmentId = searchParams.get('department_id');
    if (departmentId) {
      query.department_id = departmentId;
    }

    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const limit = parseInt(searchParams.get('limit') || '1000', 10);

    // Fetch users
    const users = await User.find(query)
      .select('name email department_id role demographics')
      .limit(limit)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      users,
      total: users.length,
      limit,
    });
  } catch (error) {
    console.error('Error fetching company users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
