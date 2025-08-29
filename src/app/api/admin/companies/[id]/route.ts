import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../lib/api-middleware';
import Company from '../../../../../models/Company';
import User from '../../../../../models/User';
import AuditLog from '../../../../../models/AuditLog';
import { createApiResponse } from '../../../../../lib/api-middleware';
import mongoose from 'mongoose';

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
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Invalid company ID'),
        { status: 400 }
      );
    }

    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json(
        createApiResponse(false, null, 'Company not found'),
        { status: 404 }
      );
    }

    // Get user count for this company
    const userCount = await User.countDocuments({ company_id: id, is_active: true });

    const companyWithStats = {
      ...company.toObject(),
      userCount
    };

    return NextResponse.json(
      createApiResponse(true, companyWithStats)
    );
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
    const { id } = params;
    const body = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Invalid company ID'),
        { status: 400 }
      );
    }

    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json(
        createApiResponse(false, null, 'Company not found'),
        { status: 404 }
      );
    }

    const { name, domain, industry, size, country, subscription_tier, is_active } = body;

    // If domain is being changed, validate it
    if (domain && domain !== company.domain) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        return NextResponse.json(
          createApiResponse(false, null, 'Invalid domain format'),
          { status: 400 }
        );
      }

      // Check if new domain already exists
      const existingCompany = await Company.findOne({ 
        domain: domain.toLowerCase(),
        _id: { $ne: id }
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
      is_active: company.is_active
    };

    // Update company
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(domain && { domain: domain.toLowerCase().trim() }),
        ...(industry && { industry: industry.trim() }),
        ...(size && { size }),
        ...(country && { country: country.trim() }),
        ...(subscription_tier && { subscription_tier }),
        ...(typeof is_active === 'boolean' && { is_active })
      },
      { new: true, runValidators: true }
    );

    // Log the action
    const changes: any = {};
    if (name && name !== originalValues.name) changes.name = { from: originalValues.name, to: name };
    if (domain && domain !== originalValues.domain) changes.domain = { from: originalValues.domain, to: domain };
    if (industry && industry !== originalValues.industry) changes.industry = { from: originalValues.industry, to: industry };
    if (size && size !== originalValues.size) changes.size = { from: originalValues.size, to: size };
    if (country && country !== originalValues.country) changes.country = { from: originalValues.country, to: country };
    if (subscription_tier && subscription_tier !== originalValues.subscription_tier) {
      changes.subscription_tier = { from: originalValues.subscription_tier, to: subscription_tier };
    }
    if (typeof is_active === 'boolean' && is_active !== originalValues.is_active) {
      changes.is_active = { from: originalValues.is_active, to: is_active };
    }

    await AuditLog.create({
      user_id: user.id,
      company_id: 'global',
      action: 'update',
      resource: 'company',
      resource_id: id,
      details: {
        company_name: updatedCompany?.name,
        changes
      }
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
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Invalid company ID'),
        { status: 400 }
      );
    }

    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json(
        createApiResponse(false, null, 'Company not found'),
        { status: 404 }
      );
    }

    // Check if company has active users
    const activeUserCount = await User.countDocuments({ 
      company_id: id, 
      is_active: true 
    });

    if (activeUserCount > 0) {
      return NextResponse.json(
        createApiResponse(
          false, 
          null, 
          `Cannot delete company with ${activeUserCount} active users. Deactivate users first.`
        ),
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const deletedCompany = await Company.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );

    // Log the action
    await AuditLog.create({
      user_id: user.id,
      company_id: 'global',
      action: 'delete',
      resource: 'company',
      resource_id: id,
      details: {
        company_name: company.name,
        domain: company.domain,
        soft_delete: true
      }
    });

    return NextResponse.json(
      createApiResponse(true, deletedCompany, 'Company deactivated successfully')
    );
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to delete company'),
      { status: 500 }
    );
  }
});