import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import ScopeTestingService from '../../../../lib/scope-testing';
import { createScopeContext } from '../../../../lib/data-scoping';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (token.user as any).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions - Super Admin required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { test_type = 'comprehensive', contexts } = body;

    const testingService = new ScopeTestingService();

    if (test_type === 'comprehensive') {
      // Use provided contexts or generate default test contexts
      const testContexts = contexts || [
        {
          user_id: 'super_admin_test',
          role: 'super_admin',
          company_id: 'company_1',
          department_id: 'dept_1',
          permissions: ['read_all', 'write_all', 'delete_all'],
        },
        {
          user_id: 'company_admin_test',
          role: 'company_admin',
          company_id: 'company_1',
          department_id: 'dept_1',
          permissions: ['read_company', 'write_company'],
        },
        {
          user_id: 'dept_admin_test',
          role: 'department_admin',
          company_id: 'company_1',
          department_id: 'dept_1',
          permissions: ['read_department', 'write_department'],
        },
        {
          user_id: 'user_test',
          role: 'evaluated_user',
          company_id: 'company_1',
          department_id: 'dept_1',
          permissions: ['read_own'],
        },
      ];

      const testSuite = await testingService.runComprehensiveTest(testContexts);
      const report = testingService.generateScopeTestReport(testSuite);

      return NextResponse.json({
        test_suite: testSuite,
        report,
        timestamp: new Date().toISOString(),
      });
    } else if (test_type === 'database_validation') {
      const validation = await testingService.validateDatabaseScoping();

      return NextResponse.json({
        validation,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          error:
            'Invalid test type. Use "comprehensive" or "database_validation"',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Scope testing error:', error);
    return NextResponse.json(
      { error: 'Internal server error during scope testing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (token.user as any).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions - Super Admin required' },
        { status: 403 }
      );
    }

    const testingService = new ScopeTestingService();
    const validation = await testingService.validateDatabaseScoping();

    return NextResponse.json({
      scope_status: {
        database_validation: validation,
        available_tests: ['comprehensive', 'database_validation'],
        test_endpoints: {
          run_test: 'POST /api/admin/scope-test',
          get_status: 'GET /api/admin/scope-test',
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scope status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
