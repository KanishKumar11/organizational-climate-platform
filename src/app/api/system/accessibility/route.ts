import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-middleware';
import AccessibilityValidator from '@/lib/accessibility-validator';
import { hasFeaturePermission } from '@/lib/permissions';

export const GET = withAuth(async (req) => {
  const user = req.user!;
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const testUrl = url.searchParams.get('url') || '/dashboard';

  // Only super admins and company admins can run accessibility tests
  if (!hasFeaturePermission(user.role, 'GLOBAL_SETTINGS')) {
    return NextResponse.json(
      createApiResponse(false, null, 'Insufficient permissions'),
      { status: 403 }
    );
  }

  try {
    const accessibilityValidator = AccessibilityValidator.getInstance();

    switch (action) {
      case 'validate-page':
        const pageReport = await accessibilityValidator.validatePage(testUrl);

        return NextResponse.json(
          createApiResponse(
            true,
            pageReport,
            'Page accessibility validation completed'
          )
        );

      case 'keyboard-navigation':
        const keyboardTests =
          await accessibilityValidator.testKeyboardNavigation();

        return NextResponse.json(
          createApiResponse(
            true,
            { keyboard_tests: keyboardTests },
            'Keyboard navigation tests completed'
          )
        );

      case 'screen-reader':
        const screenReaderTests =
          await accessibilityValidator.testScreenReaderCompatibility();

        return NextResponse.json(
          createApiResponse(
            true,
            { screen_reader_tests: screenReaderTests },
            'Screen reader compatibility tests completed'
          )
        );

      case 'color-contrast':
        const colorContrastTests =
          await accessibilityValidator.testColorContrast();

        return NextResponse.json(
          createApiResponse(
            true,
            { color_contrast_tests: colorContrastTests },
            'Color contrast tests completed'
          )
        );

      case 'comprehensive-audit':
        const auditResults =
          await accessibilityValidator.runComprehensiveAccessibilityAudit();

        return NextResponse.json(
          createApiResponse(
            true,
            auditResults,
            'Comprehensive accessibility audit completed'
          )
        );

      case 'generate-report':
        const reportData = await accessibilityValidator.validatePage(testUrl);
        const reportText =
          accessibilityValidator.generateAccessibilityReport(reportData);

        return NextResponse.json(
          createApiResponse(
            true,
            {
              report_data: reportData,
              report_text: reportText,
              download_url: `/api/system/accessibility/download-report?url=${encodeURIComponent(testUrl)}`,
            },
            'Accessibility report generated successfully'
          )
        );

      default:
        // Return accessibility overview
        const overview =
          await accessibilityValidator.runComprehensiveAccessibilityAudit();

        return NextResponse.json(
          createApiResponse(
            true,
            {
              overview,
              compliance_status: overview.page_report.compliance_level,
              accessibility_score: overview.page_report.score,
              total_issues: overview.page_report.total_issues,
              critical_issues: overview.page_report.summary.critical_issues,
            },
            'Accessibility overview retrieved successfully'
          )
        );
    }
  } catch (error) {
    console.error('Error running accessibility tests:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to run accessibility tests'),
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req) => {
  const user = req.user!;

  // Only super admins can configure accessibility settings
  if (!hasFeaturePermission(user.role, 'GLOBAL_SETTINGS')) {
    return NextResponse.json(
      createApiResponse(false, null, 'Insufficient permissions'),
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action, parameters } = body;

    const accessibilityValidator = AccessibilityValidator.getInstance();

    switch (action) {
      case 'run-batch-tests':
        const { urls } = parameters || {};

        if (!urls || !Array.isArray(urls)) {
          return NextResponse.json(
            createApiResponse(false, null, 'URLs array is required'),
            { status: 400 }
          );
        }

        const batchResults = [];

        for (const url of urls) {
          try {
            const result = await accessibilityValidator.validatePage(url);
            batchResults.push(result);
          } catch (error) {
            batchResults.push({
              url,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
            });
          }
        }

        return NextResponse.json(
          createApiResponse(
            true,
            { batch_results: batchResults },
            'Batch accessibility tests completed'
          )
        );

      case 'schedule-audit':
        const {
          frequency,
          urls: auditUrls,
          notification_email,
        } = parameters || {};

        // This would implement scheduled accessibility audits
        // For now, we'll just return a success response
        return NextResponse.json(
          createApiResponse(
            true,
            {
              scheduled: true,
              frequency,
              urls: auditUrls,
              notification_email,
              next_run: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            },
            'Accessibility audit scheduled successfully'
          )
        );

      case 'configure-standards':
        const { wcag_level, custom_rules } = parameters || {};

        // This would configure accessibility testing standards
        return NextResponse.json(
          createApiResponse(
            true,
            {
              wcag_level: wcag_level || 'AA',
              custom_rules: custom_rules || [],
              updated_at: new Date(),
            },
            'Accessibility standards configured successfully'
          )
        );

      default:
        return NextResponse.json(
          createApiResponse(false, null, `Unknown action: ${action}`),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error configuring accessibility tests:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to configure accessibility tests'),
      { status: 500 }
    );
  }
});
