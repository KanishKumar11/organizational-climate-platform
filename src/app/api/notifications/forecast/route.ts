import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';
import { connectDB } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schema
const forecastQuerySchema = z.object({
  survey_id: z.string().min(1, 'Survey ID is required'),
  company_id: z.string().optional(),
});

// GET /api/notifications/forecast - Get participation forecast
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = forecastQuerySchema.parse(Object.fromEntries(searchParams));

    await connectDB();

    const companyId = query.company_id || session.user.companyId;

    // Generate participation forecast
    const forecast = await notificationService.generateParticipationForecast(
      query.survey_id,
      companyId
    );

    return NextResponse.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    console.error('Error generating participation forecast:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
