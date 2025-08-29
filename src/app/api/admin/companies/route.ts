import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/api-middleware';
import Company from '../../../../models/Company';
import AuditLog from '../../../../models/AuditLog';
import { createApiResponse } from '../../../../lib/api-middleware';

// GET /api/admin/companies - List all companies
export const GET = withAuth(async (req) => {
  const user = req.user!;

  // Only super admins can manage companies
  if (user.role !== 'super_admin') {
    return NextResponse.json(
      createApiResponse(false, null, 'Access denied: Super admin required'),
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'inactive', or null for all

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'active') {
      query.is_active = true;
    } else if (status === 'inactive') {
      query.is_active = false;
    }

    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      Company.find(query)
        .select('name domain industry size country is_active subscription_tier created_at updated_at')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      Company.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      createApiResponse(true, {
        companies,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      })
    );
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to fetch companies'),
      { status: 500 }
    );
  }
});

// POST /api/admin/companies - Create new company
export const POST = withAuth(async (req) => {
  const user = req.user!;

  // Only super admins can manage companies
  if (user.role !== 'super_admin') {
    return NextResponse.json(
      createApiResponse(false, null, 'Access denied: Super admin required'),
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, domain, industry, size, country, subscription_tier } = body;

    // Validate required fields
    if (!name || !domain || !industry || !size || !country) {
      return NextResponse.json(
        createApiResponse(false, null, 'Missing required fields'),
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Invalid domain format'),
        { status: 400 }
      );
    }

    // Check if domain already exists
    const existingCompany = await Company.findOne({ domain: domain.toLowerCase() });
    if (existingCompany) {
      return NextResponse.json(
        createApiResponse(false, null, 'Domain already exists'),
        { status: 409 }
      );
    }

    // Create company
    const company = await Company.create({
      name: name.trim(),
      domain: domain.toLowerCase().trim(),
      industry: industry.trim(),
      size,
      country: country.trim(),
      subscription_tier: subscription_tier || 'basic',
      is_active: true
    });

    // Log the action
    await AuditLog.create({
      user_id: user.id,
      company_id: 'global',
      action: 'create',
      resource: 'company',
      resource_id: company._id.toString(),
      details: {
        company_name: company.name,
        domain: company.domain,
        industry: company.industry
      }
    });

    return NextResponse.json(
      createApiResponse(true, company, 'Company created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to create company'),
      { status: 500 }
    );
  }
});