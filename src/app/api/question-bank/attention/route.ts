import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuestionPoolService } from '@/lib/question-pool-service';
import { hasStringPermission } from '@/lib/permissions';

// GET /api/question-bank/attention - Get questions needing attention
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view attention items
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

    const attentionItems =
      await QuestionPoolService.getQuestionsNeedingAttention(companyId);

    return NextResponse.json(attentionItems);
  } catch (error) {
    console.error('Error getting questions needing attention:', error);
    return NextResponse.json(
      { error: 'Failed to get questions needing attention' },
      { status: 500 }
    );
  }
}
