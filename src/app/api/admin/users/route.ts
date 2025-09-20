import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Department from '@/models/Department';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Validation schema for creating users
const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum([
    'employee',
    'supervisor',
    'leader',
    'department_admin',
    'company_admin',
  ]),
  department_id: z.string(),
  password: z.string().min(8).optional(),
  is_active: z.boolean().default(true),
});

// Validation schema for updating users
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z
    .enum([
      'employee',
      'supervisor',
      'leader',
      'department_admin',
      'company_admin',
    ])
    .optional(),
  department_id: z.string().optional(),
  is_active: z.boolean().optional(),
});

// GET /api/admin/users - List all users with admin permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only company admins and above can manage users
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
      // Super admin can see all users
    } else if (user.role === 'company_admin') {
      // Company admin can see all users in their company, but not super admins
      query.company_id = user.company_id;
      query.role = { $ne: 'super_admin' };
    } else {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch users with department information
    const users = await User.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'departments',
          localField: 'department_id',
          foreignField: '_id',
          as: 'department',
        },
      },
      {
        $addFields: {
          department_name: { $arrayElemAt: ['$department.name', 0] },
        },
      },
      {
        $project: {
          password_hash: 0,
          department: 0,
        },
      },
      { $sort: { created_at: -1 } },
    ]);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
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
    const validatedData = createUserSchema.parse(body);

    // Verify department exists and user can access it
    const department = await Department.findById(validatedData.department_id);
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 400 }
      );
    }

    // Check if user can assign to this department
    if (
      currentUser.role !== 'super_admin' &&
      department.company_id !== currentUser.company_id
    ) {
      return NextResponse.json(
        { error: 'Cannot assign user to department in different company' },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate password if not provided
    const password =
      validatedData.password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = new User({
      name: validatedData.name,
      email: validatedData.email,
      password_hash: hashedPassword,
      role: validatedData.role,
      department_id: validatedData.department_id,
      company_id: department.company_id,
      is_active: validatedData.is_active,
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        email_notifications: true,
        dashboard_layout: 'default',
      },
    });

    await newUser.save();

    // Return user without password
    const userResponse = {
      ...newUser.toObject(),
      password_hash: undefined,
      temporary_password: validatedData.password ? undefined : password,
    };

    return NextResponse.json(
      {
        user: userResponse,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
