import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-middleware';
import IntegrationTestService from '@/lib/integration-tests';
import { hasFeaturePermission } from '@/lib/permissions';

export const POST = withAuth(async (req) => {
  const user = req.user!;

  // Only super admins can run integration tests
  if (!hasFeaturePermission(user.role, 'GLOBAL_SETTINGS')) {
    return NextResponse.json(
      createApiResponse(false, null, 'Insufficient permissions'),
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { test_suites } = body;

    const integrationTestService = IntegrationTestService.getInstance();

    console.log('Starting integration test run...');
    const testReport = await integrationTestService.runAllTests();

    // Filter test suites if specific ones were requested
    let filteredReport = testReport;
    if (test_suites && Array.isArray(test_suites)) {
      filteredReport = {
        ...testReport,
        test_suites: testReport.test_suites.filter((suite) =>
          test_suites.includes(suite.suite_name)
        ),
      };

      // Recalculate summary for filtered results
      filteredReport.summary = {
        total_suites: filteredReport.test_suites.length,
        passed_suites: filteredReport.test_suites.filter((s) => s.passed)
          .length,
        failed_suites: filteredReport.test_suites.filter((s) => !s.passed)
          .length,
        total_tests: filteredReport.test_suites.reduce(
          (sum, s) => sum + s.total_tests,
          0
        ),
        passed_tests: filteredReport.test_suites.reduce(
          (sum, s) => sum + s.passed_tests,
          0
        ),
        failed_tests: filteredReport.test_suites.reduce(
          (sum, s) => sum + s.failed_tests,
          0
        ),
        total_duration_ms: filteredReport.test_suites.reduce(
          (sum, s) => sum + s.total_duration_ms,
          0
        ),
      };

      filteredReport.overall_passed = filteredReport.summary.failed_tests === 0;
    }

    const responseMessage = filteredReport.overall_passed
      ? 'All integration tests passed successfully'
      : `Integration tests completed with ${filteredReport.summary.failed_tests} failures`;

    return NextResponse.json(
      createApiResponse(true, filteredReport, responseMessage),
      { status: filteredReport.overall_passed ? 200 : 207 } // 207 Multi-Status for partial success
    );
  } catch (error) {
    console.error('Error running integration tests:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to run integration tests'),
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (req) => {
  const user = req.user!;

  // Only super admins can view test information
  if (!hasFeaturePermission(user.role, 'GLOBAL_SETTINGS')) {
    return NextResponse.json(
      createApiResponse(false, null, 'Insufficient permissions'),
      { status: 403 }
    );
  }

  try {
    // Return available test suites and their descriptions
    const availableTestSuites = [
      {
        name: 'Module Health Tests',
        description: 'Tests the health and connectivity of all system modules',
        estimated_duration_ms: 5000,
        test_count: 8,
      },
      {
        name: 'Workflow Validation Tests',
        description:
          'Validates workflow definitions and user access for different roles',
        estimated_duration_ms: 3000,
        test_count: 12,
      },
      {
        name: 'Data Scoping Tests',
        description: 'Tests role-based data access and scoping enforcement',
        estimated_duration_ms: 4000,
        test_count: 25,
      },
      {
        name: 'Cross-Module Integration Tests',
        description: 'Tests communication and event handling between modules',
        estimated_duration_ms: 2000,
        test_count: 3,
      },
      {
        name: 'User Permission Tests',
        description: 'Validates role-based permissions and access controls',
        estimated_duration_ms: 2000,
        test_count: 4,
      },
      {
        name: 'End-to-End Workflow Tests',
        description: 'Tests complete user workflows from start to finish',
        estimated_duration_ms: 6000,
        test_count: 2,
      },
    ];

    const testInfo = {
      available_test_suites: availableTestSuites,
      total_estimated_duration_ms: availableTestSuites.reduce(
        (sum, suite) => sum + suite.estimated_duration_ms,
        0
      ),
      total_test_count: availableTestSuites.reduce(
        (sum, suite) => sum + suite.test_count,
        0
      ),
      system_info: {
        node_version: process.version,
        platform: process.platform,
        memory_usage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };

    return NextResponse.json(
      createApiResponse(
        true,
        testInfo,
        'Integration test information retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Error retrieving test information:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to retrieve test information'),
      { status: 500 }
    );
  }
});
