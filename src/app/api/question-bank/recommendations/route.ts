import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuestionPoolService } from '@/lib/question-pool-service';
import { hasStringPermission } from '@/lib/permissions';

// GET /api/question-bank/recommendations - Get optimization recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view recommendations
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const companyId =
      session.user.role === 'company_admin'
        ? session.user.companyId
        : undefined;

    const recommendations =
      await QuestionPoolService.generateOptimizationRecommendations(companyId);

    return NextResponse.json({
      success: true,
      recommendations,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
