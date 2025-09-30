import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { z } from 'zod';

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
});

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string(),
  timezone: z.string(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  surveyReminders: z.boolean(),
  reportUpdates: z.boolean(),
  privacyMode: z.boolean(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// GET /api/profile - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user statistics
    const stats = await getUserStats(user._id.toString());

    // Format the response
    const profileData = {
      name: user.name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      department_id: user.department_id,
      joinDate: user.created_at,
      lastActive: user.updated_at,
      preferences: {
        theme: user.preferences?.theme || 'light',
        language: user.preferences?.language || 'en',
        timezone: user.preferences?.timezone || 'UTC',
        notification_settings: user.preferences?.notification_settings || {},
      },
      demographics: user.demographics || {},
      is_active: user.is_active,
      stats,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateProfileSchema.parse(body);

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        ...validatedData,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        company_id: updatedUser.company_id,
        department_id: updatedUser.department_id,
        preferences: updatedUser.preferences,
        demographics: updatedUser.demographics,
        is_active: updatedUser.is_active,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get user statistics
async function getUserStats(userId: string) {
  try {
    // Import models dynamically to avoid circular dependencies
    const SurveyResponse = (await import('@/models/Response')).default;
    const Report = (await import('@/models/Report')).default;
    const ActionPlan = (await import('@/models/ActionPlan')).ActionPlan;

    // Get survey responses count
    const surveysCompleted = await SurveyResponse.countDocuments({
      user: userId,
      completedAt: { $exists: true },
    });

    // Get reports viewed count (this would need to be tracked separately)
    // For now, return a mock count
    const reportsViewed = Math.floor(Math.random() * 50) + 10;

    // Get actions taken count
    const actionsTaken = await ActionPlan.countDocuments({
      createdBy: userId,
    });

    // Get last survey date
    const lastSurvey = await SurveyResponse.findOne({
      user: userId,
      completedAt: { $exists: true },
    })
      .sort({ completedAt: -1 })
      .select('completedAt')
      .lean();

    return {
      surveysCompleted,
      reportsViewed,
      actionsTaken,
      lastSurveyDate: lastSurvey?.completion_time?.toISOString().split('T')[0],
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      surveysCompleted: 0,
      reportsViewed: 0,
      actionsTaken: 0,
      lastSurveyDate: null,
    };
  }
}
