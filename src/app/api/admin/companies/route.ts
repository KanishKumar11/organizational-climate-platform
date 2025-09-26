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
        { industry: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active') {
      query.is_active = true;
    } else if (status === 'inactive') {
      query.is_active = false;
    }

    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      (Company as any)
        .find(query)
        .select(
          'name domain industry size country is_active subscription_tier created_at updated_at'
        )
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      (Company as any).countDocuments(query),
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
          hasPrev: page > 1,
        },
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
    console.log('Received company creation request:', body);

    const { name, domain, industry, size, country, subscription_tier } = body;

    // Validate required fields
    if (!name || !domain || !industry || !size || !country) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!domain) missingFields.push('domain');
      if (!industry) missingFields.push('industry');
      if (!size) missingFields.push('size');
      if (!country) missingFields.push('country');

      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          `Missing required fields: ${missingFields.join(', ')}`
        ),
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      console.error('Invalid domain format:', domain);
      return NextResponse.json(
        createApiResponse(false, null, `Invalid domain format: ${domain}`),
        { status: 400 }
      );
    }

    // Validate company size
    const validSizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
    if (!validSizes.includes(size)) {
      console.error('Invalid company size:', size);
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          `Invalid company size: ${size}. Must be one of: ${validSizes.join(', ')}`
        ),
        { status: 400 }
      );
    }

    // Validate subscription tier
    const validTiers = ['basic', 'professional', 'enterprise'];
    if (subscription_tier && !validTiers.includes(subscription_tier)) {
      console.error('Invalid subscription tier:', subscription_tier);
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          `Invalid subscription tier: ${subscription_tier}. Must be one of: ${validTiers.join(', ')}`
        ),
        { status: 400 }
      );
    }

    console.log('Checking for existing domain:', domain.toLowerCase());

    // Check if domain already exists
    const existingCompany = await (Company as any).findOne({
      domain: domain.toLowerCase(),
    });
    if (existingCompany) {
      console.error('Domain already exists:', domain);
      return NextResponse.json(
        createApiResponse(false, null, `Domain already exists: ${domain}`),
        { status: 409 }
      );
    }

    console.log('Creating company with data:', {
      name: name.trim(),
      domain: domain.toLowerCase().trim(),
      industry: industry.trim(),
      size,
      country: country.trim(),
      subscription_tier: subscription_tier || 'basic',
      is_active: true,
    });

    // Create company
    const company = await Company.create({
      name: name.trim(),
      domain: domain.toLowerCase().trim(),
      industry: industry.trim(),
      size,
      country: country.trim(),
      subscription_tier: subscription_tier || 'basic',
      is_active: true,
    });

    console.log('Company created successfully:', company._id);

    // Log the action
    try {
      await AuditLog.create({
        user_id: user.id,
        company_id: 'global',
        action: 'create',
        resource: 'company',
        resource_id: company._id.toString(),
        details: {
          company_name: company.name,
          domain: company.domain,
          industry: company.industry,
        },
      });
      console.log('Audit log created successfully');
    } catch (auditError) {
      console.error('Failed to create audit log (non-critical):', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json(
      createApiResponse(true, company, 'Company created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating company - Full error:', error);
    console.error(
      'Error name:',
      error instanceof Error ? error.name : 'Unknown'
    );
    console.error(
      'Error message:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );

    // Check for specific MongoDB errors
    if (error instanceof Error) {
      if (
        error.message.includes('E11000') ||
        error.message.includes('duplicate key')
      ) {
        return NextResponse.json(
          createApiResponse(false, null, 'Domain already exists'),
          { status: 409 }
        );
      }

      if (error.message.includes('validation failed')) {
        return NextResponse.json(
          createApiResponse(false, null, `Validation error: ${error.message}`),
          { status: 400 }
        );
      }

      if (
        error.message.includes('connection') ||
        error.message.includes('timeout')
      ) {
        return NextResponse.json(
          createApiResponse(false, null, 'Database connection error'),
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      createApiResponse(
        false,
        null,
        `Failed to create company: ${error instanceof Error ? error.message : 'Unknown error'}`
      ),
      { status: 500 }
    );
  }
});
