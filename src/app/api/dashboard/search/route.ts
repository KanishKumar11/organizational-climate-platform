import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Survey from '@/models/Survey';
import Company from '@/models/Company';
import Department from '@/models/Department';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'all', 'surveys', 'users', 'companies', 'insights', 'action_plans'
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const results = {
      surveys: [],
      users: [],
      companies: [],
      departments: [],
      insights: [],
      action_plans: [],
    };

    const searchRegex = new RegExp(query, 'i');

    // Build search filters based on user role and permissions
    const searchFilters = buildSearchFilters(user, searchRegex);

    // Search surveys
    if (!type || type === 'all' || type === 'surveys') {
      results.surveys = await Survey.find(searchFilters.surveys)
        .populate('company_id', 'name')
        .populate('created_by', 'name')
        .select(
          'title description type status start_date end_date response_count'
        )
        .sort({ created_at: -1 })
        .limit(limit);
    }

    // Search users (if user has permission)
    if ((!type || type === 'all' || type === 'users') && canSearchUsers(user)) {
      results.users = await User.find(searchFilters.users)
        .populate('company_id', 'name')
        .populate('department_id', 'name')
        .select('name email role is_active last_login')
        .sort({ created_at: -1 })
        .limit(limit);
    }

    // Search companies (Super Admin only)
    if (
      (!type || type === 'all' || type === 'companies') &&
      user.role === 'super_admin'
    ) {
      results.companies = await Company.find(searchFilters.companies)
        .select('name domain industry employee_count is_active')
        .sort({ created_at: -1 })
        .limit(limit);
    }

    // Search departments
    if (
      (!type || type === 'all' || type === 'departments') &&
      canSearchDepartments(user)
    ) {
      results.departments = await Department.find(searchFilters.departments)
        .populate('company_id', 'name')
        .select('name description employee_count')
        .sort({ created_at: -1 })
        .limit(limit);
    }

    // TODO: Add search for insights and action plans when those models are implemented

    // Filter out empty result arrays
    const filteredResults = Object.fromEntries(
      Object.entries(results).filter(
        ([_, value]) => Array.isArray(value) && value.length > 0
      )
    );

    return NextResponse.json({
      query,
      results: filteredResults,
      total: Object.values(filteredResults).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
    });
  } catch (error) {
    console.error('Dashboard search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildSearchFilters(user: any, searchRegex: RegExp) {
  const filters: any = {};

  // Survey search filters
  filters.surveys = {
    $or: [{ title: searchRegex }, { description: searchRegex }],
  };

  // Apply role-based filtering for surveys
  if (user.role === 'super_admin') {
    // Super admin can search all surveys
  } else if (user.role === 'company_admin') {
    filters.surveys.company_id = user.company_id;
  } else if (user.role === 'leader' || user.role === 'supervisor') {
    filters.surveys = {
      ...filters.surveys,
      $or: [
        { company_id: user.company_id, created_by: user._id },
        { company_id: user.company_id, target_departments: user.department_id },
      ],
    };
  } else {
    // Employees can only see surveys they're assigned to
    filters.surveys = {
      ...filters.surveys,
      company_id: user.company_id,
      target_departments: user.department_id,
      status: 'active',
    };
  }

  // User search filters
  filters.users = {
    $or: [{ name: searchRegex }, { email: searchRegex }],
    is_active: true,
  };

  // Apply role-based filtering for users
  if (user.role === 'super_admin') {
    // Super admin can search all users
  } else if (user.role === 'company_admin') {
    filters.users.company_id = user.company_id;
  } else if (user.role === 'leader' || user.role === 'supervisor') {
    filters.users = {
      ...filters.users,
      company_id: user.company_id,
      department_id: user.department_id,
    };
  } else {
    // Employees cannot search users
    filters.users = { _id: null }; // No results
  }

  // Company search filters (Super Admin only)
  filters.companies = {
    $or: [
      { name: searchRegex },
      { domain: searchRegex },
      { industry: searchRegex },
    ],
    is_active: true,
  };

  // Department search filters
  filters.departments = {
    $or: [{ name: searchRegex }, { description: searchRegex }],
  };

  // Apply role-based filtering for departments
  if (user.role === 'super_admin') {
    // Super admin can search all departments
  } else if (user.role === 'company_admin') {
    filters.departments.company_id = user.company_id;
  } else {
    filters.departments = {
      ...filters.departments,
      company_id: user.company_id,
      _id: user.department_id,
    };
  }

  return filters;
}

function canSearchUsers(user: any): boolean {
  return ['super_admin', 'company_admin', 'leader', 'supervisor'].includes(
    user.role
  );
}

function canSearchDepartments(user: any): boolean {
  return ['super_admin', 'company_admin', 'leader', 'supervisor'].includes(
    user.role
  );
}
