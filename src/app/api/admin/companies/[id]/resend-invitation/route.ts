import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../../lib/api-middleware';
import Company from '../../../../../../models/Company';
import User from '../../../../../../models/User';
import UserInvitation from '../../../../../../models/UserInvitation';
import AuditLog from '../../../../../../models/AuditLog';
import { createApiResponse } from '../../../../../../lib/api-middleware';
import { userInvitationService } from '../../../../../../lib/user-invitation-service';
import mongoose from 'mongoose';

// POST /api/admin/companies/[id]/resend-invitation - Resend invitation to company admin
export const POST = withAuth(async (req, { params }) => {
  const user = req.user!;

  // Only super admins can manage companies
  if (user.role !== 'super_admin') {
    return NextResponse.json(
      createApiResponse(false, null, 'Access denied: Super admin required'),
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Invalid company ID'),
        { status: 400 }
      );
    }

    const company = await (Company as any).findById(id);
    if (!company) {
      return NextResponse.json(
        createApiResponse(false, null, 'Company not found'),
        { status: 404 }
      );
    }

    // Find the company admin user
    const companyAdmin = await User.findOne({
      company_id: id,
      role: 'company_admin',
      is_active: true,
    });

    // If company admin exists and has completed setup, don't resend
    if (companyAdmin) {
      // Check if the admin has completed setup
      // Consider setup complete if they have a password_hash and some demographics
      const hasCompletedSetup = !!(
        companyAdmin.password_hash &&
        companyAdmin.demographics &&
        (companyAdmin.demographics.job_title ||
          companyAdmin.demographics.hierarchy_level)
      );

      if (hasCompletedSetup) {
        return NextResponse.json(
          createApiResponse(
            false,
            null,
            'Company admin has already completed setup'
          ),
          { status: 400 }
        );
      }
    }

    // Find existing pending invitation
    const existingInvitation = await UserInvitation.findOne({
      company_id: id,
      status: { $in: ['pending', 'sent'] },
      invitation_type: 'company_admin_setup',
    });

    if (!existingInvitation) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          'No pending invitation found for this company'
        ),
        { status: 404 }
      );
    }

    let invitation;

    // Resend existing invitation
    invitation = await userInvitationService.resendInvitation(
      existingInvitation._id.toString()
    );
    await invitation.save();

    // Log the action
    await AuditLog.create({
      user_id: user.id,
      company_id: 'global',
      action: 'create',
      resource: 'company',
      resource_id: company._id.toString(),
      success: true,
      details: {
        company_name: company.name,
        admin_email: invitation.email,
        invitation_type: 'resend_company_admin_setup',
        reminder_count: invitation.reminder_count,
      },
    });

    return NextResponse.json(
      createApiResponse(
        true,
        {
          invitation_id: invitation._id,
          email: invitation.email,
          expires_at: invitation.expires_at,
          reminder_count: invitation.reminder_count,
        },
        'Invitation resent successfully'
      )
    );
  } catch (error) {
    console.error('Error resending company invitation:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to resend invitation'),
      { status: 500 }
    );
  }
});
