import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Department from '@/models/Department';
import User from '@/models/User';
import { hasFeaturePermission } from '@/lib/permissions';

/**
 * GET /api/departments/for-targeting - Get departments for microclimate targeting
 * 
 * This endpoint provides broader department access for users who can launch microclimates.
 * Leaders can see all departments in their company for effective targeting, while maintaining
 * security boundaries.
 */
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

    // Check if user can launch microclimates
    if (!hasFeaturePermission(user.role, 'LAUNCH_MICROCLIMATES')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to access department targeting' },
        { status: 403 }
      );
    }

    // Build query based on user permissions for microclimate targeting
    let query: any = { is_active: true };

    if (user.role === 'super_admin') {
      // Super admin can see all departments across all companies
      // No additional filters needed
    } else if (user.role === 'company_admin') {
      // Company admin can see all departments in their company
      query.company_id = user.company_id;
    } else if (user.role === 'leader') {
      // Leaders can see all departments in their company for microclimate targeting
      // This is broader access than the regular departments endpoint
      query.company_id = user.company_id;
    } else {
      // Other roles (supervisor, employee) with microclimate permissions
      // can only target their own department and its children
      query.$or = [
        { _id: user.department_id },
        { 'hierarchy.parent_department_id': user.department_id },
      ];
      query.company_id = user.company_id;
    }

    const departments = await Department.find(query)
      .sort({ 'hierarchy.level': 1, name: 1 })
      .lean();

    // Add additional metadata useful for targeting
    const departmentsWithMetadata = departments.map(dept => ({
      ...dept,
      targeting_metadata: {
        can_target: true,
        access_level: user.role === 'super_admin' ? 'global' : 
                     user.role === 'company_admin' ? 'company' :
                     user.role === 'leader' ? 'company' : 'limited',
        is_own_department: dept._id.toString() === user.department_id,
        is_child_department: dept.hierarchy.parent_department_id === user.department_id,
      }
    }));

    return NextResponse.json({ 
      departments: departmentsWithMetadata,
      user_context: {
        role: user.role,
        company_id: user.company_id,
        department_id: user.department_id,
        can_target_all_company_departments: ['super_admin', 'company_admin', 'leader'].includes(user.role)
      }
    });
  } catch (error) {
    console.error('Error fetching departments for targeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments for targeting' },
      { status: 500 }
    );
  }
}
