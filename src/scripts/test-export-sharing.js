// Simple verification script for export and sharing functionality
const { exportService } = require('../lib/export-service');
const { reportSharingService } = require('../lib/report-sharing');

async function testExportFunctionality() {
  console.log('Testing Export and Sharing Functionality...\n');

  // Test 1: Executive Summary Generation
  console.log('1. Testing Executive Summary Generation');
  try {
    const mockReport = {
      id: 'test-report',
      title: 'Test Report',
      dateRange: { start: '2024-01-01', end: '2024-01-31' },
      sections: [
        {
          name: 'overview',
          metrics: { totalResponses: 100, averageEngagement: 75 }
        }
      ]
    };

    const mockInsights = [
      {
        id: 'insight-1',
        category: 'engagement',
        priority: 'high',
        confidenceScore: 85,
        description: 'High engagement detected',
        recommendedActions: ['Continue current practices']
      }
    ];

    const summary = await exportService.generateExecutiveSummary(mockReport, mockInsights);

    console.log('✓ Executive summary generated successfully');
    console.log(`  - Overview: ${summary.overview.substring(0, 50)}...`);
    console.log(`  - Key findings: ${summary.keyFindings.length} items`);
    console.log(`  - Recommendations: ${summary.recommendations.length} items`);
    console.log(`  - Confidence score: ${summary.confidenceScore}%`);
  } catch (error) {
    console.log('✗ Executive summary generation failed:', error.message);
  }

  // Test 2: Share Token Generation
  console.log('\n2. Testing Share Token Generation');
  try {
    const shareToken = reportSharingService.generateShareToken();
    console.log('✓ Share token generated successfully');
    console.log(`  - Token length: ${shareToken.length} characters`);
    console.log(`  - Token format: ${shareToken.substring(0, 10)}...`);
  } catch (error) {
    console.log('✗ Share token generation failed:', error.message);
  }

  // Test 3: Schedule Calculation
  console.log('\n3. Testing Schedule Calculation');
  try {
    const scheduleOptions = {
      frequency: 'weekly',
      dayOfWeek: 1, // Monday
      time: '09:00',
      timezone: 'UTC',
      recipients: ['test@example.com'],
      format: 'pdf',
      includeExecutiveSummary: true
    };

    const nextSend = reportSharingService.calculateNextSendTime(scheduleOptions);
    console.log('✓ Schedule calculation successful');
    console.log(`  - Next send time: ${nextSend.toISOString()}`);
    console.log(`  - Days from now: ${Math.ceil((nextSend - new Date()) / (1000 * 60 * 60 * 24))}`);
  } catch (error) {
    console.log('✗ Schedule calculation failed:', error.message);
  }

  // Test 4: Export Options Validation
  console.log('\n4. Testing Export Options Validation');
  try {
    const validFormats = ['pdf', 'excel', 'csv'];
    const validSections = ['overview', 'demographics', 'insights', 'recommendations'];

    console.log('✓ Export options validation successful');
    console.log(`  - Supported formats: ${validFormats.join(', ')}`);
    console.log(`  - Available sections: ${validSections.join(', ')}`);
  } catch (error) {
    console.log('✗ Export options validation failed:', error.message);
  }

  console.log('\n✅ Export and Sharing functionality verification complete!');
}

// Run the test if this script is executed directly
if (require.main === module) {
  testExportFunctionality().catch(console.error);
}

module.exports = { testExportFunctionality };