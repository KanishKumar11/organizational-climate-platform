import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schema for theme configuration
const themeConfigSchema = z.object({
  name: z.string().min(1, 'Theme name is required'),
  description: z.string().optional(),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    accent: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    background: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    surface: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    text_primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    text_secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    success: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    warning: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    error: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    info: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  }),
  typography: z.object({
    font_family_primary: z.string().default('Inter'),
    font_family_secondary: z.string().default('Roboto'),
    font_size_base: z.number().min(12).max(20).default(14),
    font_weight_normal: z.number().default(400),
    font_weight_medium: z.number().default(500),
    font_weight_bold: z.number().default(700),
    line_height_base: z.number().min(1).max(2).default(1.5),
  }),
  spacing: z.object({
    base_unit: z.number().min(2).max(16).default(4),
    border_radius: z.number().min(0).max(20).default(6),
    shadow_elevation: z
      .enum(['none', 'low', 'medium', 'high'])
      .default('medium'),
  }),
  module_colors: z.object({
    surveys: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
      .default('#2563EB'),
    microclimates: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
      .default('#059669'),
    ai_insights: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
      .default('#7C3AED'),
    action_plans: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
      .default('#EA580C'),
  }),
  is_default: z.boolean().default(false),
  is_public: z.boolean().default(false),
});

// GET /api/dashboard/themes - Get available dashboard themes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const theme_id = searchParams.get('theme_id');
    const include_public = searchParams.get('include_public') === 'true';

    const { db } = await connectToDatabase();

    if (theme_id) {
      // Get specific theme
      const theme = await db.collection('dashboard_themes').findOne({
        _id: theme_id,
        $or: [
          { created_by: session.user.id },
          { company_id: session.user.companyId },
          { is_public: true },
        ],
      });

      if (!theme) {
        return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        theme: {
          ...theme,
          id: theme._id.toString(),
        },
      });
    }

    // Get all available themes
    let query: any = {
      $or: [
        { created_by: session.user.id },
        { company_id: session.user.companyId },
      ],
    };

    if (include_public) {
      query.$or.push({ is_public: true });
    }

    const themes = await db
      .collection('dashboard_themes')
      .find(query)
      .sort({ is_default: -1, name: 1 })
      .toArray();

    // Include built-in themes
    const builtInThemes = getBuiltInThemes();

    return NextResponse.json({
      success: true,
      themes: [
        ...builtInThemes,
        ...themes.map((theme) => ({
          ...theme,
          id: theme._id.toString(),
        })),
      ],
    });
  } catch (error) {
    console.error('Error fetching dashboard themes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard themes' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/themes - Create custom dashboard theme
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create custom themes
    if (!['super_admin', 'company_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const themeData = themeConfigSchema.parse(body);

    const { db } = await connectToDatabase();

    // Check if theme name already exists for this company
    const existingTheme = await db.collection('dashboard_themes').findOne({
      name: themeData.name,
      $or: [
        { created_by: session.user.id },
        { company_id: session.user.companyId },
      ],
    });

    if (existingTheme) {
      return NextResponse.json(
        { error: 'Theme name already exists' },
        { status: 409 }
      );
    }

    // If setting as default, unset other defaults
    if (themeData.is_default) {
      await db.collection('dashboard_themes').updateMany(
        {
          company_id: session.user.companyId,
          is_default: true,
        },
        { $set: { is_default: false } }
      );
    }

    const theme = {
      ...themeData,
      created_by: session.user.id,
      company_id: session.user.companyId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection('dashboard_themes').insertOne(theme);

    return NextResponse.json(
      {
        success: true,
        theme: {
          ...theme,
          id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating dashboard theme:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create dashboard theme' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/themes - Update dashboard theme
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { theme_id, ...updateData } = body;

    if (!theme_id) {
      return NextResponse.json(
        { error: 'Theme ID is required' },
        { status: 400 }
      );
    }

    const validatedData = themeConfigSchema.partial().parse(updateData);

    const { db } = await connectToDatabase();

    // Verify ownership
    const existingTheme = await db.collection('dashboard_themes').findOne({
      _id: theme_id,
      $or: [
        { created_by: session.user.id },
        { company_id: session.user.companyId },
      ],
    });

    if (!existingTheme) {
      return NextResponse.json(
        { error: 'Theme not found or access denied' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (validatedData.is_default) {
      await db.collection('dashboard_themes').updateMany(
        {
          company_id: session.user.companyId,
          is_default: true,
          _id: { $ne: theme_id },
        },
        { $set: { is_default: false } }
      );
    }

    const result = await db.collection('dashboard_themes').findOneAndUpdate(
      { _id: theme_id },
      {
        $set: {
          ...validatedData,
          updated_at: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      theme: {
        ...result.value,
        id: result.value._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating dashboard theme:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update dashboard theme' },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/themes - Delete dashboard theme
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const theme_id = searchParams.get('theme_id');

    if (!theme_id) {
      return NextResponse.json(
        { error: 'Theme ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Verify ownership and that it's not default
    const existingTheme = await db.collection('dashboard_themes').findOne({
      _id: theme_id,
      created_by: session.user.id,
    });

    if (!existingTheme) {
      return NextResponse.json(
        { error: 'Theme not found or access denied' },
        { status: 404 }
      );
    }

    if (existingTheme.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default theme' },
        { status: 400 }
      );
    }

    await db.collection('dashboard_themes').deleteOne({ _id: theme_id });

    return NextResponse.json({
      success: true,
      message: 'Theme deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting dashboard theme:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard theme' },
      { status: 500 }
    );
  }
}

function getBuiltInThemes() {
  return [
    {
      id: 'default',
      name: 'Default',
      description: 'Clean and professional default theme',
      colors: {
        primary: '#2563EB',
        secondary: '#64748B',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        text_primary: '#1E293B',
        text_secondary: '#64748B',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      typography: {
        font_family_primary: 'Inter',
        font_family_secondary: 'Roboto',
        font_size_base: 14,
        font_weight_normal: 400,
        font_weight_medium: 500,
        font_weight_bold: 700,
        line_height_base: 1.5,
      },
      spacing: {
        base_unit: 4,
        border_radius: 6,
        shadow_elevation: 'medium',
      },
      module_colors: {
        surveys: '#2563EB',
        microclimates: '#059669',
        ai_insights: '#7C3AED',
        action_plans: '#EA580C',
      },
      is_default: true,
      is_public: true,
      is_built_in: true,
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      description: 'Dark theme for reduced eye strain',
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#FBBF24',
        background: '#111827',
        surface: '#1F2937',
        text_primary: '#F9FAFB',
        text_secondary: '#D1D5DB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      typography: {
        font_family_primary: 'Inter',
        font_family_secondary: 'Roboto',
        font_size_base: 14,
        font_weight_normal: 400,
        font_weight_medium: 500,
        font_weight_bold: 700,
        line_height_base: 1.5,
      },
      spacing: {
        base_unit: 4,
        border_radius: 6,
        shadow_elevation: 'low',
      },
      module_colors: {
        surveys: '#3B82F6',
        microclimates: '#10B981',
        ai_insights: '#8B5CF6',
        action_plans: '#F97316',
      },
      is_default: false,
      is_public: true,
      is_built_in: true,
    },
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'Professional corporate theme',
      colors: {
        primary: '#1E40AF',
        secondary: '#475569',
        accent: '#DC2626',
        background: '#FFFFFF',
        surface: '#F1F5F9',
        text_primary: '#0F172A',
        text_secondary: '#475569',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        info: '#0284C7',
      },
      typography: {
        font_family_primary: 'Inter',
        font_family_secondary: 'Roboto',
        font_size_base: 14,
        font_weight_normal: 400,
        font_weight_medium: 500,
        font_weight_bold: 700,
        line_height_base: 1.5,
      },
      spacing: {
        base_unit: 4,
        border_radius: 4,
        shadow_elevation: 'medium',
      },
      module_colors: {
        surveys: '#1E40AF',
        microclimates: '#059669',
        ai_insights: '#7C2D12',
        action_plans: '#DC2626',
      },
      is_default: false,
      is_public: true,
      is_built_in: true,
    },
  ];
}
