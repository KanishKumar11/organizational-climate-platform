import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';
import { hasPermission } from '@/lib/permissions';
import AuditLog from '@/models/AuditLog';

// Get system settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can access system settings
    if (!hasPermission(session.user.role, 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const settings = await SystemSettings.getSettings();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update system settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can modify system settings
    if (!hasPermission(session.user.role, 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      login_enabled,
      maintenance_mode,
      maintenance_message,
      max_login_attempts,
      session_timeout,
      password_policy,
      email_settings,
    } = body;

    // Get current settings for comparison
    const currentSettings = await SystemSettings.getSettings();

    // Prepare updates object
    const updates: any = {};
    if (typeof login_enabled === 'boolean') updates.login_enabled = login_enabled;
    if (typeof maintenance_mode === 'boolean') updates.maintenance_mode = maintenance_mode;
    if (maintenance_message !== undefined) updates.maintenance_message = maintenance_message;
    if (typeof max_login_attempts === 'number') updates.max_login_attempts = max_login_attempts;
    if (typeof session_timeout === 'number') updates.session_timeout = session_timeout;
    if (password_policy) updates.password_policy = { ...currentSettings.password_policy, ...password_policy };
    if (email_settings) updates.email_settings = { ...currentSettings.email_settings, ...email_settings };

    // Update settings
    const updatedSettings = await SystemSettings.updateSettings(updates);

    // Log the change
    await AuditLog.create({
      user_id: session.user.id,
      company_id: session.user.companyId || 'system',
      action: 'update',
      resource: 'system_settings',
      resource_id: updatedSettings._id.toString(),
      details: {
        changes: updates,
        previous_values: {
          login_enabled: currentSettings.login_enabled,
          maintenance_mode: currentSettings.maintenance_mode,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}