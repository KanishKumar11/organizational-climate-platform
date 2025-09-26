import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import AuditService from '@/lib/audit-service';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdParty: boolean;
  demographics: boolean;
}

// Get user consent preferences
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only access their own consent preferences
    if (session.user.id !== id && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const user = await User.findById(id).select(
      'consent_preferences consent_updated_at'
    );
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Default consent preferences if none exist
    const defaultPreferences: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
      thirdParty: false,
      demographics: false,
    };

    return NextResponse.json({
      success: true,
      preferences: user.consent_preferences || defaultPreferences,
      lastUpdated: user.consent_updated_at,
    });
  } catch (error) {
    console.error('Error fetching consent preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user consent preferences
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only update their own consent preferences
    if (session.user.id !== id && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { preferences } = body;

    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    // Ensure essential consent is always true
    const validatedPreferences: ConsentPreferences = {
      essential: true, // Always required
      analytics: Boolean(preferences.analytics),
      marketing: Boolean(preferences.marketing),
      personalization: Boolean(preferences.personalization),
      thirdParty: Boolean(preferences.thirdParty),
      demographics: Boolean(preferences.demographics),
    };

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Store previous preferences for audit
    const previousPreferences = user.consent_preferences;

    // Update user consent preferences
    user.consent_preferences = validatedPreferences;
    user.consent_updated_at = new Date();
    await user.save();

    // Log the consent change for audit purposes
    const auditService = new AuditService();
    await auditService.logEvent({
      action: 'update',
      resource: 'user',
      resource_id: id,
      details: {
        previous_preferences: previousPreferences,
        new_preferences: validatedPreferences,
        updated_by: session.user.id,
      },
      context: {
        user_id: id,
        company_id: user.company_id,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Consent preferences updated successfully',
      preferences: validatedPreferences,
      lastUpdated: user.consent_updated_at,
    });
  } catch (error) {
    console.error('Error updating consent preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete user consent preferences (reset to defaults)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only reset their own consent preferences
    if (session.user.id !== id && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Store previous preferences for audit
    const previousPreferences = user.consent_preferences;

    // Reset to default preferences
    const defaultPreferences: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
      thirdParty: false,
      demographics: false,
    };

    user.consent_preferences = defaultPreferences;
    user.consent_updated_at = new Date();
    await user.save();

    // Log the consent reset for audit purposes
    const auditService2 = new AuditService();
    await auditService2.logEvent({
      action: 'delete',
      resource: 'user',
      resource_id: id,
      details: {
        previous_preferences: previousPreferences,
        reset_to_defaults: defaultPreferences,
        reset_by: session.user.id,
      },
      context: {
        user_id: id,
        company_id: user.company_id,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Consent preferences reset to defaults',
      preferences: defaultPreferences,
      lastUpdated: user.consent_updated_at,
    });
  } catch (error) {
    console.error('Error resetting consent preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
