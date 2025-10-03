import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Department from '@/models/Department';

/**
 * CLIMA-001 & CLIMA-003: Company Departments API
 *
 * GET /api/companies/[id]/departments
 * Returns all departments for a company (for targeting preload)
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

    // Authorization: Check if user has access to this company
    if (
      session.user.role !== 'super_admin' &&
      session.user.companyId !== companyId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch departments
    const departments = await Department.find({
      company_id: companyId,
      is_active: true,
    })
      .select('name description employee_count manager_id parent_id')
      .sort({ name: 1 })
      .lean();

    // Get employee counts
    const User = (await import('@/models/User')).default;
    const departmentCounts = await User.aggregate([
      {
        $match: {
          company_id: companyId,
          is_active: true,
        },
      },
      {
        $group: {
          _id: '$department_id',
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map(
      departmentCounts.map((d) => [d._id?.toString(), d.count])
    );

    // Enrich departments with current employee counts
    const enrichedDepartments = departments.map((dept) => ({
      ...dept,
      employee_count: countMap.get(dept._id.toString()) || 0,
    }));

    return NextResponse.json({
      departments: enrichedDepartments,
      total: enrichedDepartments.length,
    });
  } catch (error) {
    console.error('Error fetching company departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
