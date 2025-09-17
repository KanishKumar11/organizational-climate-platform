import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Company from '@/models/Company';
import User from '@/models/User';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schema for updating company settings
const updateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  industry: z.string().max(50).optional(),
  size: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.object({
    street: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),
  }).optional(),
  branding: z.object({
    logo_url: z.string().url().optional().or(z.literal('')),
    primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    font_family: z.string().max(50).optional(),
  }).optional(),
  settings: z.object({
    timezone: z.string().max(50).optional(),
    date_format: z.string().max(20).optional(),
    language: z.string().max(10).optional(),
    currency: z.string().max(10).optional(),
    email_notifications: z.boolean().optional(),
    survey_reminders: z.boolean().optional(),
    data_retention_days: z.number().min(30).max(2555).optional(),
  }).optional(),
});

// GET /api/admin/company-settings - Get company settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'company_admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the company
    let company;
    if (user.role === 'super_admin') {
      // Super admin might need to specify which company to manage
      const companyId = request.nextUrl.searchParams.get('company_id');
      if (companyId) {
        company = await Company.findById(companyId);
      } else {
        // Return error asking for company_id
        return NextResponse.json(
          { error: 'Super admin must specify company_id parameter' },
          { status: 400 }
        );
      }
    } else {
      // Regular company admin can only access their own company
      company = await Company.findById(user.company_id);
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/company-settings - Update company settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'company_admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateCompanySchema.parse(body);

    // Find the company to update
    let companyId;
    if (user.role === 'super_admin') {
      // Super admin might need to specify which company to manage
      companyId = request.nextUrl.searchParams.get('company_id') || body.company_id;
      if (!companyId) {
        return NextResponse.json(
          { error: 'Super admin must specify company_id' },
          { status: 400 }
        );
      }
    } else {
      // Regular company admin can only update their own company
      companyId = user.company_id;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Build update object with nested field handling
    const updateData: any = {
      updated_at: new Date(),
    };

    // Handle top-level fields
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.industry !== undefined) updateData.industry = validatedData.industry;
    if (validatedData.size !== undefined) updateData.size = validatedData.size;
    if (validatedData.website !== undefined) updateData.website = validatedData.website;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;

    // Handle nested address fields
    if (validatedData.address) {
      Object.keys(validatedData.address).forEach(key => {
        if (validatedData.address![key as keyof typeof validatedData.address] !== undefined) {
          updateData[`address.${key}`] = validatedData.address![key as keyof typeof validatedData.address];
        }
      });
    }

    // Handle nested branding fields
    if (validatedData.branding) {
      Object.keys(validatedData.branding).forEach(key => {
        if (validatedData.branding![key as keyof typeof validatedData.branding] !== undefined) {
          updateData[`branding.${key}`] = validatedData.branding![key as keyof typeof validatedData.branding];
        }
      });
    }

    // Handle nested settings fields
    if (validatedData.settings) {
      Object.keys(validatedData.settings).forEach(key => {
        if (validatedData.settings![key as keyof typeof validatedData.settings] !== undefined) {
          updateData[`settings.${key}`] = validatedData.settings![key as keyof typeof validatedData.settings];
        }
      });
    }

    // Update the company
    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      company: updatedCompany,
      message: 'Company settings updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating company settings:', error);
    return NextResponse.json(
      { error: 'Failed to update company settings' },
      { status: 500 }
    );
  }
}
