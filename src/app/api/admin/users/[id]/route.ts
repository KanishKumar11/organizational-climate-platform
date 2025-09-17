import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Department from '@/models/Department';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schema for updating users
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['employee', 'supervisor', 'leader', 'department_admin', 'company_admin']).optional(),
  department_id: z.string().optional(),
  is_active: z.boolean().optional(),
});

// GET /api/admin/users/[id] - Get specific user
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

    // Find the target user
    const targetUser = await User.findById(id).populate('department_id', 'name');
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user can access this user
    if (currentUser.role !== 'super_admin' && targetUser.company_id !== currentUser.company_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Return user without sensitive data
    const userResponse = {
      ...targetUser.toObject(),
      password_hash: undefined,
    };

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update user
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

    // Find the target user
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user can modify this user
    if (currentUser.role !== 'super_admin' && targetUser.company_id !== currentUser.company_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // If department is being changed, verify it exists and is accessible
    if (validatedData.department_id) {
      const department = await Department.findById(validatedData.department_id);
      if (!department) {
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 400 }
        );
      }

      // Check if user can assign to this department
      if (currentUser.role !== 'super_admin' && department.company_id !== currentUser.company_id) {
        return NextResponse.json(
          { error: 'Cannot assign user to department in different company' },
          { status: 403 }
        );
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        ...validatedData,
        updated_at: new Date(),
      },
      { new: true, runValidators: true }
    ).populate('department_id', 'name');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return updated user without sensitive data
    const userResponse = {
      ...updatedUser.toObject(),
      password_hash: undefined,
    };

    return NextResponse.json({ 
      user: userResponse,
      message: 'User updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
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

    // Find the target user
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user can delete this user
    if (currentUser.role !== 'super_admin' && targetUser.company_id !== currentUser.company_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (targetUser._id.toString() === currentUser._id.toString()) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Instead of hard delete, we'll soft delete by setting is_active to false
    // This preserves data integrity for surveys and responses
    await User.findByIdAndUpdate(id, {
      is_active: false,
      email: `deleted_${Date.now()}_${targetUser.email}`, // Prevent email conflicts
      updated_at: new Date(),
    });

    return NextResponse.json({ 
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
