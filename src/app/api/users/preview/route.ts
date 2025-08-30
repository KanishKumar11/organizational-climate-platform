import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

// GET /api/users/preview - Preview users for targeting
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const departmentIds = searchParams.getAll('department_ids');
    const roleFilters = searchParams.getAll('role_filters');
    const includeManagers = searchParams.get('include_managers') === 'true';
    const maxParticipants = searchParams.get('max_participants');

    if (departmentIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query
    const query: any = {
      company_id: currentUser.company_id,
      is_active: true,
      department_id: { $in: departmentIds },
    };

    // Apply role filters if specified
    if (roleFilters.length > 0) {
      query.role = { $in: roleFilters };
    }

    // Exclude managers if specified
    if (!includeManagers) {
      query.role = { $nin: ['company_admin', 'leader', 'supervisor'] };
    }

    let users = await User.find(query)
      .select('_id name email role department_id')
      .lean();

    // Apply max participants limit if specified
    if (maxParticipants && users.length > parseInt(maxParticipants)) {
      // Randomly select participants
      users = users
        .sort(() => 0.5 - Math.random())
        .slice(0, parseInt(maxParticipants));
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching preview users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview users' },
      { status: 500 }
    );
  }
}


