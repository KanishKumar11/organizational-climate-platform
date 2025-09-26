import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { createApiResponse } from '@/lib/api-middleware';
import { userInvitationService } from '@/lib/user-invitation-service';
import User from '@/models/User';

// POST /api/admin/invitations/company-admin - Send company admin invitation
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

    // Check if user is super admin
    const user = await User.findById(session.user.id);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        createApiResponse(false, null, 'Super admin access required'),
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, company_id, custom_message, expires_in_days } = body;

    // Validate required fields
    if (!email || !company_id) {
      return NextResponse.json(
        createApiResponse(false, null, 'Email and company_id are required'),
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Invalid email format'),
        { status: 400 }
      );
    }

    console.log('Sending company admin invitation:', {
      email,
      company_id,
      invited_by: session.user.id,
      custom_message: custom_message ? 'Yes' : 'No',
    });

    // Send invitation
    const invitation = await userInvitationService.inviteCompanyAdmin({
      email,
      company_id,
      invited_by: session.user.id,
      custom_message,
      expires_in_days: expires_in_days || 7,
    });

    return NextResponse.json(
      createApiResponse(
        true,
        {
          invitation_id: invitation._id,
          email: invitation.email,
          expires_at: invitation.expires_at,
          registration_link: invitation.generateRegistrationLink(),
        },
        'Company admin invitation sent successfully'
      )
    );
  } catch (error) {
    console.error('Error sending company admin invitation:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          createApiResponse(false, null, error.message),
          { status: 409 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          createApiResponse(false, null, error.message),
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      createApiResponse(false, null, 'Failed to send company admin invitation'),
      { status: 500 }
    );
  }
}

// GET /api/admin/invitations/company-admin - Get company admin invitations
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

    // Check if user is super admin
    const user = await User.findById(session.user.id);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        createApiResponse(false, null, 'Super admin access required'),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const company_id = searchParams.get('company_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = {
      invitation_type: 'company_admin_setup',
    };

    if (company_id) {
      query.company_id = company_id;
    }

    if (status) {
      query.status = status;
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
        'Company admin invitations retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Error retrieving company admin invitations:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to retrieve invitations'),
      { status: 500 }
    );
  }
}
