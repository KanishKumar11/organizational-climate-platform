import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettings } from '@/lib/system-settings';

// Get system status (public endpoint for maintenance page)
export async function GET(request: NextRequest) {
  try {
    const settings = await getSystemSettings();
    
    return NextResponse.json({
      enabled: settings.maintenance_mode,
      message: settings.maintenance_message,
      loginEnabled: settings.login_enabled,
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    return NextResponse.json(
      {
        enabled: false,
        message: 'Unable to check system status',
        loginEnabled: true,
      },
      { status: 200 } // Return 200 even on error for maintenance page
    );
  }
}