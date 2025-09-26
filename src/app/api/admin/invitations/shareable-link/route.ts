import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { createApiResponse } from '@/lib/api-middleware';
import { userInvitationService } from '@/lib/user-invitation-service';
import User from '@/models/User';
import { UserRole } from '@/types/user';

// POST /api/admin/invitations/shareable-link - Create shareable registration link
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

    // Check if user has permission to create shareable links
    const user = await User.findById(session.user.id);
    if (!user || !['super_admin', 'company_admin'].includes(user.role)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Admin access required'),
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      company_id,
      department_id,
      role,
      expires_in_days,
      max_uses,
    } = body;

    // Validate required fields
    if (!company_id || !role) {
      return NextResponse.json(
        createApiResponse(false, null, 'Company ID and role are required'),
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

    // For company admins, ensure they can only create links for their own company
    if (user.role === 'company_admin' && user.company_id !== company_id) {
      return NextResponse.json(
        createApiResponse(false, null, 'Can only create links for your own company'),
        { status: 403 }
      );
    }

    console.log('Creating shareable registration link:', {
      company_id,
      department_id,
      role,
      created_by: session.user.id,
      expires_in_days: expires_in_days || 30,
      max_uses,
    });

    // Create shareable link
    const invitation = await userInvitationService.createShareableRegistrationLink({
      company_id,
      department_id,
      role,
      created_by: session.user.id,
      expires_in_days: expires_in_days || 30,
      max_uses,
    });

    const registrationLink = invitation.generateRegistrationLink();

    return NextResponse.json(
      createApiResponse(
        true,
        {
          invitation_id: invitation._id,
          registration_link: registrationLink,
          expires_at: invitation.expires_at,
          role,
          company_id,
          department_id,
          max_uses,
        },
        'Shareable registration link created successfully'
      )
    );
  } catch (error) {
    console.error('Error creating shareable registration link:', error);

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
      createApiResponse(false, null, 'Failed to create shareable registration link'),
      { status: 500 }
    );
  }
}

// GET /api/admin/invitations/shareable-link - Get shareable registration links
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

    // Check if user has permission to view shareable links
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
      invitation_type: 'employee_self_signup',
    };

    // For company admins, only show links for their company
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

    // Get shareable links with pagination
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

    // Add registration links to the response
    const linksWithUrls = invitations.map((invitation) => ({
      ...invitation.toObject(),
      registration_link: invitation.generateRegistrationLink(),
    }));

    return NextResponse.json(
      createApiResponse(
        true,
        {
          shareable_links: linksWithUrls,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Shareable registration links retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Error retrieving shareable registration links:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to retrieve shareable links'),
      { status: 500 }
    );
  }
}

// DELETE /api/admin/invitations/shareable-link - Delete/cancel shareable registration link
export async function DELETE(req: NextRequest) {
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

    // Check if user has permission to delete shareable links
    const user = await User.findById(session.user.id);
    if (!user || !['super_admin', 'company_admin'].includes(user.role)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Admin access required'),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const invitation_id = searchParams.get('invitation_id');

    if (!invitation_id) {
      return NextResponse.json(
        createApiResponse(false, null, 'Invitation ID is required'),
        { status: 400 }
      );
    }

    const UserInvitation = (await import('@/models/UserInvitation')).default;
    const invitation = await UserInvitation.findById(invitation_id);

    if (!invitation) {
      return NextResponse.json(
        createApiResponse(false, null, 'Invitation not found'),
        { status: 404 }
      );
    }

    // For company admins, ensure they can only delete links for their own company
    if (user.role === 'company_admin' && user.company_id !== invitation.company_id) {
      return NextResponse.json(
        createApiResponse(false, null, 'Can only delete links for your own company'),
        { status: 403 }
      );
    }

    // Cancel the invitation
    invitation.status = 'cancelled';
    await invitation.save();

    return NextResponse.json(
      createApiResponse(
        true,
        { invitation_id: invitation._id },
        'Shareable registration link cancelled successfully'
      )
    );
  } catch (error) {
    console.error('Error cancelling shareable registration link:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to cancel shareable link'),
      { status: 500 }
    );
  }
}
