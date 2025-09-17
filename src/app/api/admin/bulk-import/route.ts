import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Department from '@/models/Department';
import { hasPermission } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

interface ImportUser {
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'valid' | 'error' | 'duplicate';
  errors?: string[];
}

const VALID_ROLES = ['employee', 'supervisor', 'leader', 'department_admin', 'company_admin'];

// POST /api/admin/bulk-import - Import users from CSV
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isPreview = formData.get('preview') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be CSV format' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Parse CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must contain at least a header and one data row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'email', 'role', 'department'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingHeaders.join(', ')}` 
      }, { status: 400 });
    }

    // Get existing users and departments for validation
    const existingUsers = await User.find({ 
      company_id: currentUser.company_id 
    }).select('email');
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    const departments = await Department.find({ 
      company_id: currentUser.company_id,
      is_active: true 
    });
    const departmentMap = new Map(departments.map(d => [d.name.toLowerCase(), d._id.toString()]));

    // Parse and validate data
    const importUsers: ImportUser[] = [];
    const dataLines = lines.slice(1);

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const userData: any = {};
      
      headers.forEach((header, index) => {
        userData[header] = values[index] || '';
      });

      const user: ImportUser = {
        name: userData.name,
        email: userData.email.toLowerCase(),
        role: userData.role.toLowerCase(),
        department: userData.department,
        status: 'valid',
        errors: [],
      };

      // Validate user data
      if (!user.name.trim()) {
        user.errors!.push('Name is required');
      }

      if (!user.email.trim()) {
        user.errors!.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        user.errors!.push('Invalid email format');
      } else if (existingEmails.has(user.email)) {
        user.status = 'duplicate';
        user.errors!.push('Email already exists');
      }

      if (!user.role.trim()) {
        user.errors!.push('Role is required');
      } else if (!VALID_ROLES.includes(user.role)) {
        user.errors!.push(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
      }

      if (!user.department.trim()) {
        user.errors!.push('Department is required');
      } else if (!departmentMap.has(user.department.toLowerCase())) {
        user.errors!.push('Department not found');
      }

      if (user.errors!.length > 0) {
        user.status = user.status === 'duplicate' ? 'duplicate' : 'error';
      }

      importUsers.push(user);
    }

    // If this is just a preview, return the validation results
    if (isPreview) {
      return NextResponse.json({ preview: importUsers });
    }

    // Execute the import for valid users
    const validUsers = importUsers.filter(u => u.status === 'valid');
    const errors: string[] = [];
    let imported = 0;
    let duplicates = importUsers.filter(u => u.status === 'duplicate').length;
    let skipped = importUsers.filter(u => u.status === 'error').length;

    for (const userData of validUsers) {
      try {
        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        const departmentId = departmentMap.get(userData.department.toLowerCase());

        const newUser = new User({
          name: userData.name,
          email: userData.email,
          password_hash: hashedPassword,
          role: userData.role,
          department_id: departmentId,
          company_id: currentUser.company_id,
          is_active: true,
          preferences: {
            language: 'en',
            timezone: 'America/New_York',
            email_notifications: true,
            dashboard_layout: 'default',
          },
        });

        await newUser.save();
        imported++;

        // In a real implementation, you would send an email with the temporary password
        console.log(`User ${userData.email} created with temporary password: ${tempPassword}`);
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        errors.push(`Failed to create user ${userData.email}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: imported > 0,
      message: `Import completed. ${imported} users imported, ${duplicates} duplicates, ${skipped} skipped.`,
      imported,
      duplicates,
      skipped,
      errors,
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      { error: 'Failed to process import' },
      { status: 500 }
    );
  }
}
