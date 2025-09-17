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
                    { $eq: ['$is_active', true] }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'userCount'
        }
      },
      {
        $addFields: {
          user_count: { $ifNull: [{ $arrayElemAt: ['$userCount.count', 0] }, 0] }
        }
      },
      {
        $project: {
          userCount: 0
        }
      },
      { $sort: { 'hierarchy.level': 1, name: 1 } }
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

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createDepartmentSchema.parse(body);

    let parentDepartment = null;
    let level = 0;

    // If parent department is specified, verify it exists and calculate level
    if (validatedData.parent_department_id) {
      parentDepartment = await Department.findById(validatedData.parent_department_id);
      if (!parentDepartment) {
        return NextResponse.json(
          { error: 'Parent department not found' },
          { status: 400 }
        );
      }

      // Check if user can access parent department
      if (currentUser.role !== 'super_admin' && parentDepartment.company_id !== currentUser.company_id) {
        return NextResponse.json(
          { error: 'Cannot create department under parent in different company' },
          { status: 403 }
        );
      }

      level = parentDepartment.hierarchy.level + 1;
    }

    // Check if department name already exists in the same company and level
    const existingDepartment = await Department.findOne({
      name: validatedData.name,
      company_id: currentUser.company_id,
      'hierarchy.parent_department_id': validatedData.parent_department_id || null,
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department with this name already exists at this level' },
        { status: 400 }
      );
    }

    // Create department
    const newDepartment = new Department({
      name: validatedData.name,
      description: validatedData.description,
      company_id: currentUser.company_id,
      is_active: validatedData.is_active,
      hierarchy: {
        level,
        parent_department_id: validatedData.parent_department_id || null,
      },
    });

    await newDepartment.save();

    return NextResponse.json({ 
      department: newDepartment,
      message: 'Department created successfully'
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
}
