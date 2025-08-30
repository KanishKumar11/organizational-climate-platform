import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Department from '@/models/Department';
import User from '@/models/User';

// GET /api/departments - List departments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query based on user permissions
    let query: any = { is_active: true };

    if (user.role === 'super_admin') {
      // Super admin can see all departments
    } else if (user.role === 'company_admin') {
      // Company admin can see all departments in their company
      query.company_id = user.company_id;
    } else {
      // Other roles can only see their own department and its children
      query.$or = [
        { _id: user.department_id },
        { 'hierarchy.parent_department_id': user.department_id },
      ];
      query.company_id = user.company_id;
    }

    const departments = await Department.find(query)
      .sort({ 'hierarchy.level': 1, name: 1 })
      .lean();

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}


