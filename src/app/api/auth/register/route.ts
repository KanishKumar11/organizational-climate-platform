import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '../../../../models/User';
import Company from '../../../../models/Company';
import Department from '../../../../models/Department';
import AuditLog from '../../../../models/AuditLog';
import { connectDB } from '../../../../lib/mongodb';
import { createApiResponse } from '../../../../lib/api-middleware';
import { userInvitationService } from '../../../../lib/user-invitation-service';
import { UserDemographics } from '../../../../types/user';

// Helper function to ensure a default department exists
async function ensureDefaultDepartment(companyId: string) {
  // Check if a default "General" department already exists
  let defaultDepartment = await Department.findOne({
    company_id: companyId,
    name: 'General',
  });

  if (!defaultDepartment) {
    // Create the default department
    defaultDepartment = await Department.create({
      name: 'General',
      description: 'Default department for all employees',
      company_id: companyId,
      hierarchy: {
        level: 0,
        path: 'general',
      },
      is_active: true,
    });
  }

  return defaultDepartment;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      // Basic user information
      name,
      email,
      password,

      // Invitation token (if registering via invitation)
      invitation_token,

      // Demographics and profile information
      demographics,
      department_name,
      job_title,

      // Company admin setup (for company admin invitations)
      company_setup,
    } = body;

    console.log('Registration request:', {
      email,
      has_invitation_token: !!invitation_token,
      has_demographics: !!demographics,
      has_company_setup: !!company_setup,
    });

    // Validate basic required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          'Name, email, and password are required'
        ),
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          'Password must be at least 8 characters long'
        ),
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        createApiResponse(false, null, 'User with this email already exists'),
        { status: 409 }
      );
    }

    let invitation = null;
    let company = null;
    let department = null;
    let userRole = 'employee';

    // Handle invitation-based registration
    if (invitation_token) {
      const validation =
        await userInvitationService.validateInvitation(invitation_token);
      if (!validation.valid || !validation.invitation) {
        return NextResponse.json(
          createApiResponse(
            false,
            null,
            validation.error || 'Invalid invitation'
          ),
          { status: 400 }
        );
      }

      invitation = validation.invitation;

      // For shareable links, update the email
      if (invitation.invitation_type === 'employee_self_signup') {
        invitation.email = email.toLowerCase();
        await invitation.save();
      } else {
        // For direct invitations, verify email matches
        if (invitation.email !== email.toLowerCase()) {
          return NextResponse.json(
            createApiResponse(false, null, 'Email does not match invitation'),
            { status: 400 }
          );
        }
      }

      // Get company and department from invitation
      company = await Company.findById(invitation.company_id);
      if (!company) {
        return NextResponse.json(
          createApiResponse(false, null, 'Company not found'),
          { status: 404 }
        );
      }

      if (invitation.department_id) {
        department = await Department.findById(invitation.department_id);
      }

      userRole = invitation.role;
    } else {
      // Handle registration without invitation (legacy flow)
      const domain = email.split('@')[1].toLowerCase();

      company = await Company.findOne({
        domain: domain,
        is_active: true,
      });

      if (!company) {
        return NextResponse.json(
          createApiResponse(
            false,
            null,
            'No company found for this email domain. Please contact your administrator for an invitation.'
          ),
          { status: 404 }
        );
      }
    }

    // Ensure a default department exists for the company
    if (!department) {
      department = await ensureDefaultDepartment(company._id.toString());
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Prepare user data
    const userData: any = {
      name: name.trim(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: userRole,
      company_id: company._id.toString(),
      department_id: department._id.toString(),
      job_title: job_title || '',
      is_active: true,
    };

    // Add demographics from invitation or request body
    if (
      invitation?.demographics &&
      Object.keys(invitation.demographics).length > 0
    ) {
      // Use demographics from invitation (preferred for pre-assigned users)
      userData.demographics = invitation.demographics;
    } else if (demographics) {
      // Fallback to request body demographics (for manual entry or legacy support)
      userData.demographics = {
        age_range: demographics.age_range,
        gender: demographics.gender,
        tenure_months: demographics.tenure_months,
        site_location: demographics.site_location,
        employment_type: demographics.employment_type,
        work_arrangement: demographics.work_arrangement,
        education_level: demographics.education_level,
        management_level: demographics.management_level,
        previous_experience_years: demographics.previous_experience_years,
        industry_experience_years: demographics.industry_experience_years,
      };
    }

    // Create new user
    const newUser = await User.create(userData);

    // Handle company admin setup
    if (company_setup && userRole === 'company_admin') {
      // Update company settings if provided
      if (company_setup.company_name) {
        company.name = company_setup.company_name;
      }
      if (company_setup.branding) {
        company.branding = { ...company.branding, ...company_setup.branding };
      }
      if (company_setup.settings) {
        company.settings = { ...company.settings, ...company_setup.settings };
      }
      await company.save();

      // Create departments if provided
      if (
        company_setup.departments &&
        Array.isArray(company_setup.departments)
      ) {
        for (const deptData of company_setup.departments) {
          await Department.create({
            name: deptData.name,
            description: deptData.description,
            company_id: company._id.toString(),
            hierarchy: {
              parent_department_id: deptData.parent_id,
              level: deptData.level || 0,
              path: deptData.path || deptData.name.toLowerCase(),
            },
            is_active: true,
          });
        }
      }
    }

    // Accept invitation if it exists
    if (invitation) {
      await userInvitationService.acceptInvitation(invitation_token);
    }

    // Log user creation
    await AuditLog.create({
      user_id: newUser._id.toString(),
      company_id: company._id.toString(),
      action: 'create',
      resource: 'user',
      resource_id: newUser._id.toString(),
      details: {
        method: invitation ? 'invitation' : 'registration',
        invitation_type: invitation?.invitation_type,
        email: email.toLowerCase(),
        name: name.trim(),
        role: userRole,
      },
      success: true,
      timestamp: new Date(),
    });

    console.log('User registered successfully:', {
      user_id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      company: company.name,
      via_invitation: !!invitation,
    });

    return NextResponse.json(
      createApiResponse(
        true,
        {
          user: {
            id: newUser._id.toString(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            company_id: newUser.company_id,
            department_id: newUser.department_id,
          },
          company: {
            id: company._id.toString(),
            name: company.name,
            domain: company.domain,
          },
          setup_required: userRole === 'company_admin' && !company_setup,
        },
        'User registered successfully'
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (
        error.message.includes('duplicate key') ||
        error.message.includes('E11000')
      ) {
        return NextResponse.json(
          createApiResponse(false, null, 'User with this email already exists'),
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      createApiResponse(false, null, 'Registration failed. Please try again.'),
      { status: 500 }
    );
  }
}
