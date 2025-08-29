/**
 * Dashboard preferences API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();

    // Get user's dashboard preferences
    const preferences = await db.collection('dashboard_preferences').findOne({
      user_id: session.user.id,
    });

    // Default preferences if none exist
    const defaultPreferences = {
      theme: 'default',
      layout_type: 'grid',
      columns: 3,
      auto_refresh: true,
      refresh_interval: 300, // 5 minutes
      show_animations: true,
      compact_mode: false,
      default_date_range: '30d',
      widget_preferences: {},
      notification_preferences: {
        show_alerts: true,
        show_insights: true,
        show_deadlines: true,
      },
      export_preferences: {
        default_format: 'pdf',
        include_charts: true,
        include_data: true,
      },
    };

    return NextResponse.json({
      success: true,
      preferences: preferences
        ? {
            ...defaultPreferences,
            ...preferences,
            id: preferences._id.toString(),
          }
        : defaultPreferences,
    });
  } catch (error) {
    console.error('Dashboard preferences API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      theme,
      layout_type,
      columns,
      auto_refresh,
      refresh_interval,
      show_animations,
      compact_mode,
      default_date_range,
      widget_preferences,
      notification_preferences,
      export_preferences,
    } = body;

    const { db } = await connectToDatabase();

    const preferencesData = {
      user_id: session.user.id,
      theme: theme || 'default',
      layout_type: layout_type || 'grid',
      columns: columns || 3,
      auto_refresh: auto_refresh !== undefined ? auto_refresh : true,
      refresh_interval: refresh_interval || 300,
      show_animations: show_animations !== undefined ? show_animations : true,
      compact_mode: compact_mode !== undefined ? compact_mode : false,
      default_date_range: default_date_range || '30d',
      widget_preferences: widget_preferences || {},
      notification_preferences: notification_preferences || {
        show_alerts: true,
        show_insights: true,
        show_deadlines: true,
      },
      export_preferences: export_preferences || {
        default_format: 'pdf',
        include_charts: true,
        include_data: true,
      },
      updated_at: new Date(),
    };

    // Upsert preferences
    const result = await db
      .collection('dashboard_preferences')
      .findOneAndUpdate(
        { user_id: session.user.id },
        {
          $set: preferencesData,
          $setOnInsert: { created_at: new Date() },
        },
        {
          upsert: true,
          returnDocument: 'after',
        }
      );

    return NextResponse.json({
      success: true,
      preferences: {
        ...result.value,
        id: result.value._id.toString(),
      },
    });
  } catch (error) {
    console.error('Dashboard preferences API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save dashboard preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updateData = {
      ...body,
      updated_at: new Date(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { db } = await connectToDatabase();

    const result = await db
      .collection('dashboard_preferences')
      .findOneAndUpdate(
        { user_id: session.user.id },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    if (!result.value) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: {
        ...result.value,
        id: result.value._id.toString(),
      },
    });
  } catch (error) {
    console.error('Dashboard preferences API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update dashboard preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
