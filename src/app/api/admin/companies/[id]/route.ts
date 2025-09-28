import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../lib/api-middleware';
import Company from '../../../../../models/Company';
import User from '../../../../../models/User';
import AuditLog from '../../../../../models/AuditLog';
import UserInvitation from '../../../../../models/UserInvitation';
import SurveyInvitation from '../../../../../models/SurveyInvitation';
import MicroclimateInvitation from '../../../../../models/MicroclimateInvitation';
import Department from '../../../../../models/Department';
import Survey from '../../../../../models/Survey';
import SurveyTemplate from '../../../../../models/SurveyTemplate';
import Microclimate from '../../../../../models/Microclimate';
import MicroclimateTemplate from '../../../../../models/MicroclimateTemplate';
import { ActionPlan } from '../../../../../models/ActionPlan';
import { ActionPlanTemplate } from '../../../../../models/ActionPlanTemplate';
import Analytics from '../../../../../models/Analytics';
import Benchmark from '../../../../../models/Benchmark';
import DemographicSnapshot from '../../../../../models/DemographicSnapshot';
import Notification from '../../../../../models/Notification';
import NotificationTemplate from '../../../../../models/NotificationTemplate';
import QuestionBank from '../../../../../models/QuestionBank';
import Report from '../../../../../models/Report';
import Response from '../../../../../models/Response';
import { createApiResponse } from '../../../../../lib/api-middleware';
import mongoose from 'mongoose';

interface CleanupOperation {
  model: mongoose.Model<any>;
  description: string;
  filter?: Record<string, any>;
}

// GET /api/admin/companies/[id] - Get company details
export const GET = withAuth(async (req, { params }) => {
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

    // Get user count for this company
    const userCount = await User.countDocuments({
      company_id: id,
      is_active: true,
    });

    const companyWithStats = {
      ...company.toObject(),
      userCount,
    };

    return NextResponse.json(createApiResponse(true, companyWithStats));
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to fetch company'),
      { status: 500 }
    );
  }
});

// PUT /api/admin/companies/[id] - Update company
export const PUT = withAuth(async (req, { params }) => {
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
    const body = await req.json();

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

    const {
      name,
      domain,
      industry,
      size,
      country,
      subscription_tier,
      is_active,
    } = body;

    // If domain is being changed, validate it
    if (domain && domain !== company.domain) {
      const domainRegex =
        /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        return NextResponse.json(
          createApiResponse(false, null, 'Invalid domain format'),
          { status: 400 }
        );
      }

      // Check if new domain already exists
      const existingCompany = await (Company as any).findOne({
        domain: domain.toLowerCase(),
        _id: { $ne: id },
      });
      if (existingCompany) {
        return NextResponse.json(
          createApiResponse(false, null, 'Domain already exists'),
          { status: 409 }
        );
      }
    }

    // Store original values for audit log
    const originalValues = {
      name: company.name,
      domain: company.domain,
      industry: company.industry,
      size: company.size,
      country: company.country,
      subscription_tier: company.subscription_tier,
      is_active: company.is_active,
    };

    // Update company
    const updatedCompany = await (Company as any).findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(domain && { domain: domain.toLowerCase().trim() }),
        ...(industry && { industry: industry.trim() }),
        ...(size && { size }),
        ...(country && { country: country.trim() }),
        ...(subscription_tier && { subscription_tier }),
        ...(typeof is_active === 'boolean' && { is_active }),
      },
      { new: true, runValidators: true }
    );

    // Log the action
    const changes: any = {};
    if (name && name !== originalValues.name)
      changes.name = { from: originalValues.name, to: name };
    if (domain && domain !== originalValues.domain)
      changes.domain = { from: originalValues.domain, to: domain };
    if (industry && industry !== originalValues.industry)
      changes.industry = { from: originalValues.industry, to: industry };
    if (size && size !== originalValues.size)
      changes.size = { from: originalValues.size, to: size };
    if (country && country !== originalValues.country)
      changes.country = { from: originalValues.country, to: country };
    if (
      subscription_tier &&
      subscription_tier !== originalValues.subscription_tier
    ) {
      changes.subscription_tier = {
        from: originalValues.subscription_tier,
        to: subscription_tier,
      };
    }
    if (
      typeof is_active === 'boolean' &&
      is_active !== originalValues.is_active
    ) {
      changes.is_active = { from: originalValues.is_active, to: is_active };
    }

    await AuditLog.create({
      user_id: user.id,
      company_id: 'global',
      action: 'update',
      resource: 'company',
      resource_id: id,
      success: true,
      details: {
        company_name: updatedCompany?.name,
        changes,
      },
    });

    return NextResponse.json(
      createApiResponse(true, updatedCompany, 'Company updated successfully')
    );
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to update company'),
      { status: 500 }
    );
  }
});

// DELETE /api/admin/companies/[id] - Delete company
export const DELETE = withAuth(async (req, { params }) => {
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

    // Check if company has active users
    const activeUserCount = await User.countDocuments({
      company_id: id,
      is_active: true,
    });

    if (activeUserCount > 0) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          `Cannot delete company with ${activeUserCount} active users. Deactivate users first or use deactivation instead.`
        ),
        { status: 400 }
      );
    }

    // Clean up all related data before deleting the company
    console.log(`Starting cleanup for company ${company.name} (${id})`);

    // Delete in order of dependencies (most dependent first)
    const cleanupOperations = [
      // Invitations
      { model: UserInvitation as any, description: 'user invitations' },
      { model: SurveyInvitation as any, description: 'survey invitations' },
      {
        model: MicroclimateInvitation as any,
        description: 'microclimate invitations',
      },

      // Responses (before surveys)
      { model: Response as any, description: 'survey responses' },

      // Surveys and related
      { model: Survey as any, description: 'surveys' },
      { model: SurveyTemplate as any, description: 'survey templates' },

      // Microclimates
      { model: Microclimate as any, description: 'microclimates' },
      {
        model: MicroclimateTemplate as any,
        description: 'microclimate templates',
      },

      // Action plans
      { model: ActionPlan as any, description: 'action plans' },
      {
        model: ActionPlanTemplate as any,
        description: 'action plan templates',
      },

      // Analytics and insights
      {
        model: Analytics.AnalyticsInsight as any,
        description: 'analytics insights',
      },
      { model: Analytics.AIInsight as any, description: 'AI insights' },

      // Benchmarks and demographics
      { model: Benchmark as any, description: 'benchmarks' },
      {
        model: DemographicSnapshot as any,
        description: 'demographic snapshots',
      },

      // Notifications
      { model: Notification as any, description: 'notifications' },
      {
        model: NotificationTemplate as any,
        description: 'notification templates',
      },

      // Question banks
      { model: QuestionBank as any, description: 'question banks' },

      // Reports
      { model: Report as any, description: 'reports' },

      // Departments (before users)
      { model: Department as any, description: 'departments' },

      // Users (should be deactivated, not deleted, but clean up any inactive ones)
      {
        model: User as any,
        description: 'inactive users',
        filter: { is_active: false },
      },

      // Audit logs for this company
      { model: AuditLog as any, description: 'audit logs' },
    ];

    for (const operation of cleanupOperations) {
      try {
        const filter = operation.filter
          ? { company_id: id, ...operation.filter }
          : { company_id: id };
        const count = await operation.model.countDocuments(filter);

        if (count > 0) {
          await operation.model.deleteMany(filter);
          console.log(
            `Deleted ${count} ${operation.description} for company ${company.name}`
          );
        }
      } catch (error) {
        console.error(`Error deleting ${operation.description}:`, error);
        // Continue with other cleanup operations even if one fails
      }
    }

    // Hard delete the company
    await (Company as any).findByIdAndDelete(id);
    console.log(`Company ${company.name} deleted successfully`);

    // Log the action
    await AuditLog.create({
      user_id: user.id,
      company_id: 'global',
      action: 'delete',
      resource: 'company',
      resource_id: id,
      success: true,
      details: {
        company_name: company.name,
        domain: company.domain,
        hard_delete: true,
      },
    });

    return NextResponse.json(
      createApiResponse(true, null, 'Company permanently deleted successfully')
    );
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to delete company'),
      { status: 500 }
    );
  }
});
