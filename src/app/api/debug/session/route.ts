import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasFeaturePermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const debugInfo = {
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          companyId: session.user.companyId,
          departmentId: session.user.departmentId,
          isActive: session.user.isActive,
        },
      },
      permissions: {
        CREATE_SURVEYS: hasFeaturePermission(
          session.user.role,
          'CREATE_SURVEYS'
        ),
        EDIT_SURVEYS: hasFeaturePermission(session.user.role, 'EDIT_SURVEYS'),
        DELETE_SURVEYS: hasFeaturePermission(
          session.user.role,
          'DELETE_SURVEYS'
        ),
      },
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
