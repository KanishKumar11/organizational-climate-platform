import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { hasFeaturePermission } from '@/lib/permissions';

// POST /api/users/by-emails - Get users by email addresses
export async function POST(request: NextRequest) {
  console.log('🔍 [DEBUG] /api/users/by-emails called');

  try {
    const session = await getServerSession(authOptions);
    console.log('🔍 [DEBUG] Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userEmail: session?.user?.email,
      companyId: session?.user?.companyId,
    });

    if (!session?.user) {
      console.log('❌ [DEBUG] No session or user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only users who can create surveys can look up users by email
    const hasPermission = hasFeaturePermission(
      session.user.role,
      'CREATE_SURVEYS'
    );
    console.log('🔍 [DEBUG] Permission check:', {
      userRole: session.user.role,
      hasCreateSurveysPermission: hasPermission,
    });

    if (!hasPermission) {
      console.log('❌ [DEBUG] Permission denied for role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { emails } = body;

    console.log('🔍 [DEBUG] Request body:', {
      emails,
      emailsType: typeof emails,
      emailsLength: emails?.length,
    });

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      console.log('❌ [DEBUG] Invalid emails array:', {
        emails,
        isArray: Array.isArray(emails),
      });
      return NextResponse.json(
        { error: 'Email addresses are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emails.filter(
      (email) => typeof email === 'string' && emailRegex.test(email.trim())
    );

    console.log('🔍 [DEBUG] Email validation:', {
      inputEmails: emails,
      validEmails: validEmails,
      validCount: validEmails.length,
    });

    if (validEmails.length === 0) {
      console.log('❌ [DEBUG] No valid emails after validation');
      return NextResponse.json(
        { error: 'No valid email addresses provided' },
        { status: 400 }
      );
    }

    // Build query based on user permissions
    let query: any = {
      email: { $in: validEmails.map((email) => email.toLowerCase().trim()) },
      is_active: true,
    };

    // Super admin can find users across all companies
    if (session.user.role !== 'super_admin') {
      // Company admin and below can only find users in their company
      query.company_id = session.user.companyId;
    }

    console.log('🔍 [DEBUG] Database query:', {
      query: JSON.stringify(query, null, 2),
      userRole: session.user.role,
      isSuperAdmin: session.user.role === 'super_admin',
      companyId: session.user.companyId,
    });

    // Find users
    const users = await User.find(query)
      .select('_id name email role department_id company_id')
      .lean();

    console.log('🔍 [DEBUG] Database results:', {
      usersFound: users.length,
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
      })),
    });

    // Return found users and missing emails
    const foundEmails = users.map((user) => user.email);
    const missingEmails = validEmails.filter(
      (email) => !foundEmails.includes(email.toLowerCase().trim())
    );

    console.log('🔍 [DEBUG] Final results:', {
      foundEmails,
      missingEmails,
      foundCount: users.length,
      totalRequested: validEmails.length,
    });

    const response = {
      users,
      found_count: users.length,
      missing_emails: missingEmails,
      total_requested: validEmails.length,
    };

    console.log('✅ [DEBUG] Returning successful response');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error finding users by emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
