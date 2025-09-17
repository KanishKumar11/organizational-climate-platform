import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Department from '@/models/Department';
import User from '@/models/User';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schema for updating departments
const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
});

// GET /api/admin/departments/[id] - Get specific department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the department with user count
    const department = await Department.aggregate([
      { $match: { _id: id } },
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
      }
    ]);

    if (!department || department.length === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const dept = department[0];

    // Check if current user can access this department
    if (currentUser.role !== 'super_admin' && dept.company_id !== currentUser.company_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ department: dept });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/departments/[id] - Update department
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the target department
    const targetDepartment = await Department.findById(id);
    if (!targetDepartment) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if current user can modify this department
    if (currentUser.role !== 'super_admin' && targetDepartment.company_id !== currentUser.company_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateDepartmentSchema.parse(body);

    // If name is being changed, check for conflicts
    if (validatedData.name && validatedData.name !== targetDepartment.name) {
      const existingDepartment = await Department.findOne({
        name: validatedData.name,
        company_id: targetDepartment.company_id,
        'hierarchy.parent_department_id': targetDepartment.hierarchy.parent_department_id,
        _id: { $ne: id },
      });

      if (existingDepartment) {
        return NextResponse.json(
          { error: 'Department with this name already exists at this level' },
          { status: 400 }
        );
      }
    }

    // Update department
    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      {
        ...validatedData,
        updated_at: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedDepartment) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      department: updatedDepartment,
      message: 'Department updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating department:', error);
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/departments/[id] - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the target department
    const targetDepartment = await Department.findById(id);
    if (!targetDepartment) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if current user can delete this department
    if (currentUser.role !== 'super_admin' && targetDepartment.company_id !== currentUser.company_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if department has active users
    const activeUsers = await User.countDocuments({
      department_id: id,
      is_active: true,
    });

    if (activeUsers > 0) {
      return NextResponse.json(
        { error: `Cannot delete department with ${activeUsers} active users. Please reassign users first.` },
        { status: 400 }
      );
    }

    // Check if department has child departments
    const childDepartments = await Department.countDocuments({
      'hierarchy.parent_department_id': id,
      is_active: true,
    });

    if (childDepartments > 0) {
      return NextResponse.json(
        { error: `Cannot delete department with ${childDepartments} child departments. Please reorganize hierarchy first.` },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    await Department.findByIdAndUpdate(id, {
      is_active: false,
      name: `deleted_${Date.now()}_${targetDepartment.name}`, // Prevent name conflicts
      updated_at: new Date(),
    });

    return NextResponse.json({ 
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    );
  }
}
