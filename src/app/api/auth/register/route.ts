import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '../../../../models/User';
import Company from '../../../../models/Company';
import AuditLog from '../../../../models/AuditLog';
import { connectDB } from '../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    await connectDB();

    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Extract domain from email
    const domain = email.split('@')[1].toLowerCase();

    // Find company by domain or create one
    let company = await (Company as any).findOne({
      domain: domain,
      is_active: true,
    });

    // Create company if it doesn't exist (auto-registration)
    if (!company) {
      try {
        company = await Company.create({
          name: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Organization`,
          domain: domain,
          industry: 'General',
          size: 'medium',
          country: 'Unknown',
          subscription_tier: 'basic',
          is_active: true,
        });
      } catch (companyError) {
        console.error(
          'Error creating company during registration:',
          companyError
        );
        return NextResponse.json(
          { error: 'Failed to create organization. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await (User as any).findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: 'employee', // Default role
      company_id: company._id.toString(),
      department_id: 'unassigned', // Will be assigned by admin
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Log user creation
    await AuditLog.create({
      user_id: newUser._id.toString(),
      company_id: company._id.toString(),
      action: 'create',
      resource: 'user',
      resource_id: newUser._id.toString(),
      details: {
        method: 'registration',
        email: email.toLowerCase(),
        name: name.trim(),
      },
      success: true,
      timestamp: new Date(),
    });

    // Return success (don't include sensitive data)
    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


