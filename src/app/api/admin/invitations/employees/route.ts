import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { createApiResponse } from '@/lib/api-middleware';
import { userInvitationService } from '@/lib/user-invitation-service';
import User from '@/models/User';
import { UserRole } from '@/types/user';

// POST /api/admin/invitations/employees - Send employee invitations
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiResponse(false, null, 'Authentication required'),
        { status: 401 }
      );
    }

    // Check if user has permission to invite employees
    const user = await User.findById(session.user.id);
    if (!user || !['super_admin', 'company_admin'].includes(user.role)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Admin access required'),
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      emails,
      company_id,
      department_id,
      role,
      custom_message,
      expires_in_days,
      send_immediately,
    } = body;

    // Validate required fields
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        createApiResponse(false, null, 'At least one email is required'),
        { status: 400 }
      );
    }

    if (!company_id || !role) {
      return NextResponse.json(
        createApiResponse(false, null, 'Company ID and role are required'),
        { status: 400 }
      );
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter((email: string) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          `Invalid email format: ${invalidEmails.join(', ')}`
        ),
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = ['employee', 'supervisor', 'leader', 'department_admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Invalid role specified'),
        { status: 400 }
      );
    }

    // For company admins, ensure they can only invite to their own company
    if (user.role === 'company_admin' && user.company_id !== company_id) {
      return NextResponse.json(
        createApiResponse(false, null, 'Can only invite employees to your own company'),
        { status: 403 }
      );
    }

    console.log('Sending employee invitations:', {
      emails: emails.length,
      company_id,
      department_id,
      role,
      invited_by: session.user.id,
      send_immediately: send_immediately !== false,
    });

    // Send invitations
    const invitations = await userInvitationService.inviteEmployees({
      emails,
      company_id,
      department_id,
      role,
      invited_by: session.user.id,
      custom_message,
      expires_in_days: expires_in_days || 14,
      send_immediately: send_immediately !== false,
    });

    return NextResponse.json(
      createApiResponse(
        true,
        {
          invitations_sent: invitations.length,
          invitations: invitations.map((inv) => ({
            invitation_id: inv._id,
            email: inv.email,
            expires_at: inv.expires_at,
            registration_link: inv.generateRegistrationLink(),
          })),
        },
        `${invitations.length} employee invitation(s) sent successfully`
      )
    );
  } catch (error) {
    console.error('Error sending employee invitations:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          createApiResponse(false, null, error.message),
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      createApiResponse(false, null, 'Failed to send employee invitations'),
      { status: 500 }
    );
  }
}

// GET /api/admin/invitations/employees - Get employee invitations
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiResponse(false, null, 'Authentication required'),
        { status: 401 }
      );
    }

    // Check if user has permission to view invitations
    const user = await User.findById(session.user.id);
    if (!user || !['super_admin', 'company_admin'].includes(user.role)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Admin access required'),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const company_id = searchParams.get('company_id');
    const department_id = searchParams.get('department_id');
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = {
      invitation_type: { $in: ['employee_direct', 'employee_self_signup'] },
    };

    // For company admins, only show invitations for their company
    if (user.role === 'company_admin') {
      query.company_id = user.company_id;
    } else if (company_id) {
      query.company_id = company_id;
    }

    if (department_id) {
      query.department_id = department_id;
    }

    if (status) {
      query.status = status;
    }

    if (role) {
      query.role = role;
    }

    // Get invitations with pagination
    const UserInvitation = (await import('@/models/UserInvitation')).default;
    const skip = (page - 1) * limit;

    const [invitations, total] = await Promise.all([
      UserInvitation.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('company_id', 'name domain')
        .populate('department_id', 'name')
        .populate('invited_by', 'name email'),
      UserInvitation.countDocuments(query),
    ]);

    return NextResponse.json(
      createApiResponse(
        true,
        {
          invitations,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Employee invitations retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Error retrieving employee invitations:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to retrieve invitations'),
      { status: 500 }
    );
  }
}
