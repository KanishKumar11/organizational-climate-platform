import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { z } from 'zod';

// Validation schema
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

// PUT /api/profile/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = updatePreferencesSchema.parse(body);

    // Transform validated data to match database schema
    const dbPreferences = {
      theme: validatedData.theme,
      language: validatedData.language,
      timezone: validatedData.timezone,
      notification_settings: {
        email_surveys: validatedData.emailNotifications,
        email_microclimates: validatedData.emailNotifications,
        email_action_plans: validatedData.reportUpdates,
        email_reminders: validatedData.surveyReminders,
        push_notifications: validatedData.pushNotifications,
        digest_frequency: 'weekly', // Default value
      },
    };

    await connectToDatabase();

    // Update user preferences
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          preferences: dbPreferences,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).select('preferences');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);

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

// GET /api/profile/preferences - Get user preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id)
      .select('preferences')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return preferences with defaults
    const preferences = {
      theme: user.preferences?.theme || 'system',
      language: user.preferences?.language || 'en',
      timezone: user.preferences?.timezone || 'UTC',
      emailNotifications:
        user.preferences?.notification_settings?.email_surveys ?? true,
      pushNotifications:
        user.preferences?.notification_settings?.push_notifications ?? false,
      surveyReminders:
        user.preferences?.notification_settings?.email_reminders ?? true,
      reportUpdates:
        user.preferences?.notification_settings?.email_action_plans ?? true,
      privacyMode: false, // Not in schema yet, default to false
    };

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
