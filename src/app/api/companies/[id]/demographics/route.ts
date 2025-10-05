import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Company from '@/models/Company';

/**
 * GET /api/companies/[id]/demographics
 *
 * Fetches demographic data for a company's employees.
 * Used for audience filtering in survey targeting.
 *
 * Returns:
 * - locations: Unique employee locations
 * - roles: Unique positions/roles
 * - seniority: Unique seniority levels
 * - departments: Department names (for reference)
 *
 * Access Control:
 * - Super Admin: Can access all companies
 * - Company Admin: Can only access their own company
 *
 * Best Practices:
 * - Uses aggregation pipeline for performance
 * - Returns unique values only (no duplicates)
 * - Filters out null/undefined values
 * - Sorted alphabetically
 * - Cached with proper headers
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    const companyId = params.id;

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Access control - only super admin or company admin can access
    if (
      session.user.role !== 'super_admin' &&
      session.user.companyId?.toString() !== companyId
    ) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Aggregate demographics from User model
    // This assumes User model has demographics fields (location, role, seniority, etc.)
    const [locationsAgg, rolesAgg, seniorityAgg, departmentsAgg] =
      await Promise.all([
        // Get unique locations
        User.aggregate([
          { $match: { company_id: company._id, is_active: true } },
          { $group: { _id: '$demographics.location' } },
          { $match: { _id: { $ne: null, $exists: true } } },
          { $sort: { _id: 1 } },
        ]),

        // Get unique roles/positions
        User.aggregate([
          { $match: { company_id: company._id, is_active: true } },
          { $group: { _id: '$demographics.role' } },
          { $match: { _id: { $ne: null, $exists: true } } },
          { $sort: { _id: 1 } },
        ]),

        // Get unique seniority levels
        User.aggregate([
          { $match: { company_id: company._id, is_active: true } },
          { $group: { _id: '$demographics.seniority' } },
          { $match: { _id: { $ne: null, $exists: true } } },
          { $sort: { _id: 1 } },
        ]),

        // Get unique departments (from direct field)
        User.aggregate([
          { $match: { company_id: company._id, is_active: true } },
          { $group: { _id: '$department_id' } },
          { $match: { _id: { $ne: null, $exists: true } } },
          {
            $lookup: {
              from: 'departments',
              localField: '_id',
              foreignField: '_id',
              as: 'dept',
            },
          },
          { $unwind: '$dept' },
          { $project: { name: '$dept.name' } },
          { $sort: { name: 1 } },
        ]),
      ]);

    // Extract values
    const locations = locationsAgg.map((doc) => doc._id).filter(Boolean);
    const roles = rolesAgg.map((doc) => doc._id).filter(Boolean);
    const seniority = seniorityAgg.map((doc) => doc._id).filter(Boolean);
    const departments = departmentsAgg.map((doc) => doc.name).filter(Boolean);

    // Get additional stats
    const totalEmployees = await User.countDocuments({
      company_id: company._id,
      is_active: true,
    });

    return NextResponse.json(
      {
        success: true,
        demographics: {
          locations,
          roles,
          seniority,
          departments,
        },
        stats: {
          totalEmployees,
          uniqueLocations: locations.length,
          uniqueRoles: roles.length,
          uniqueSeniority: seniority.length,
          uniqueDepartments: departments.length,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching demographics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function: Get demographics with filters
 * (Optional - for more advanced filtering)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const companyId = params.id;
    const body = await req.json();
    const { filterBy } = body; // e.g., { departments: ['Engineering'] }

    // Build filter query
    const filter: any = {
      company_id: companyId,
      is_active: true,
    };

    if (filterBy?.departments?.length > 0) {
      filter.department_id = { $in: filterBy.departments };
    }

    if (filterBy?.locations?.length > 0) {
      filter['demographics.location'] = { $in: filterBy.locations };
    }

    // Get filtered demographics
    const [locations, roles, seniority] = await Promise.all([
      User.distinct('demographics.location', filter),
      User.distinct('demographics.role', filter),
      User.distinct('demographics.seniority', filter),
    ]);

    return NextResponse.json({
      success: true,
      demographics: {
        locations: locations.filter(Boolean).sort(),
        roles: roles.filter(Boolean).sort(),
        seniority: seniority.filter(Boolean).sort(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching filtered demographics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
