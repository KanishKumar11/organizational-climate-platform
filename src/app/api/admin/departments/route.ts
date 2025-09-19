import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Department from '@/models/Department';
import User from '@/models/User';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schema for creating departments
const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parent_department_id: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Validation schema for updating departments
const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
});

// GET /api/admin/departments - List all departments with admin permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'company_admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query based on user permissions
    let query: any = {};

    if (user.role === 'super_admin') {
      // Super admin can see all departments
    } else if (user.role === 'company_admin') {
      // Company admin can see all departments in their company
      query.company_id = user.company_id;
    } else {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch departments with user count
    const departments = await Department.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          let: { deptId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$department_id', '$$deptId'] },
                    { $eq: ['$is_active', true] },
                  ],
                },
              },
            },
            { $count: 'count' },
          ],
          as: 'userCount',
        },
      },
      {
        $addFields: {
          user_count: {
            $ifNull: [{ $arrayElemAt: ['$userCount.count', 0] }, 0],
          },
        },
      },
      {
        $project: {
          userCount: 0,
        },
      },
      { $sort: { 'hierarchy.level': 1, name: 1 } },
    ]);

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/departments - Create a new department
export async function POST(request: NextRequest) {
  console.log('🔍 [DEBUG] Department creation API called');

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ [DEBUG] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'company_admin')) {
      console.log(
        '❌ [DEBUG] Insufficient permissions for role:',
        session.user.role
      );
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      console.log('❌ [DEBUG] User not found:', session.user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('🔍 [DEBUG] Request body:', body);

    const validatedData = createDepartmentSchema.parse(body);
    console.log('🔍 [DEBUG] Validated data:', validatedData);

    let parentDepartment = null;
    let level = 0;
    let departmentPath = validatedData.name.toLowerCase().replace(/\s+/g, '-');

    // If parent department is specified, verify it exists and calculate level
    if (validatedData.parent_department_id) {
      console.log(
        '🔍 [DEBUG] Looking for parent department:',
        validatedData.parent_department_id
      );

      parentDepartment = await Department.findById(
        validatedData.parent_department_id
      );
      if (!parentDepartment) {
        console.log('❌ [DEBUG] Parent department not found');
        return NextResponse.json(
          { error: 'Parent department not found' },
          { status: 400 }
        );
      }

      console.log('🔍 [DEBUG] Parent department found:', {
        name: parentDepartment.name,
        path: parentDepartment.hierarchy.path,
        level: parentDepartment.hierarchy.level,
      });

      // Check if user can access parent department
      if (
        currentUser.role !== 'super_admin' &&
        parentDepartment.company_id !== currentUser.company_id
      ) {
        console.log(
          '❌ [DEBUG] Cannot create department under parent in different company'
        );
        return NextResponse.json(
          {
            error: 'Cannot create department under parent in different company',
          },
          { status: 403 }
        );
      }

      level = parentDepartment.hierarchy.level + 1;
      departmentPath = `${parentDepartment.hierarchy.path}/${departmentPath}`;
    }

    console.log('🔍 [DEBUG] Department hierarchy calculated:', {
      level,
      path: departmentPath,
      parentId: validatedData.parent_department_id,
    });

    // Check if department name already exists in the same company and level
    const existingDepartment = await Department.findOne({
      name: validatedData.name,
      company_id: currentUser.company_id,
      'hierarchy.parent_department_id':
        validatedData.parent_department_id || null,
    });

    if (existingDepartment) {
      console.log('❌ [DEBUG] Department with this name already exists');
      return NextResponse.json(
        { error: 'Department with this name already exists at this level' },
        { status: 400 }
      );
    }

    // Create department
    const departmentData = {
      name: validatedData.name,
      description: validatedData.description,
      company_id: currentUser.company_id,
      is_active: validatedData.is_active,
      hierarchy: {
        level,
        parent_department_id: validatedData.parent_department_id || null,
        path: departmentPath,
      },
    };

    console.log('🔍 [DEBUG] Creating department with data:', departmentData);

    const newDepartment = new Department(departmentData);

    console.log('🔍 [DEBUG] Attempting to save department...');
    await newDepartment.save();
    console.log('✅ [DEBUG] Department saved successfully:', newDepartment._id);

    console.log('✅ [DEBUG] Returning success response');
    return NextResponse.json(
      {
        department: newDepartment,
        message: 'Department created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ [DEBUG] Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('❌ [DEBUG] Error creating department:', error);
    console.error(
      '❌ [DEBUG] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Failed to create department',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
