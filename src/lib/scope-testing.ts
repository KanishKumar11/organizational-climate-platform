import { DataScopingService, ScopeContext } from './data-scoping';
import { connectDB } from './db';

export interface ScopeTestResult {
  resource_type: string;
  user_role: string;
  test_passed: boolean;
  accessible_records: number;
  total_records: number;
  violations: Record<string, unknown>[];
  performance_ms: number;
}

export interface ScopeTestSuite {
  test_name: string;
  results: ScopeTestResult[];
  overall_passed: boolean;
  total_tests: number;
  passed_tests: number;
  execution_time_ms: number;
}

export class ScopeTestingService {
  private scopingService: DataScopingService;

  constructor() {
    this.scopingService = DataScopingService.getInstance();
  }

  async runComprehensiveTest(
    contexts: ScopeContext[]
  ): Promise<ScopeTestSuite> {
    const startTime = Date.now();
    const results: ScopeTestResult[] = [];

    const resourceTypes = ['surveys', 'responses', 'action_plans'];

    for (const context of contexts) {
      for (const resourceType of resourceTypes) {
        const testResult = await this.testResourceAccess(context, resourceType);
        results.push(testResult);
      }
    }

    const passedTests = results.filter((r) => r.test_passed).length;
    const executionTime = Date.now() - startTime;

    return {
      test_name: 'Comprehensive Scope Enforcement Test',
      results,
      overall_passed: passedTests === results.length,
      total_tests: results.length,
      passed_tests: passedTests,
      execution_time_ms: executionTime,
    };
  }

  async testResourceAccess(
    context: ScopeContext,
    resourceType: string
  ): Promise<ScopeTestResult> {
    const startTime = Date.now();

    try {
      // Generate test data for the resource type
      const testData = await this.generateTestData(resourceType);

      // Run scope enforcement test
      const result = await this.scopingService.testScopeEnforcement(
        context,
        resourceType,
        testData
      );

      const performanceMs = Date.now() - startTime;

      return {
        resource_type: resourceType,
        user_role: context.role,
        test_passed: result.passed,
        accessible_records: result.accessible_records,
        total_records: result.total_records,
        violations: result.violations,
        performance_ms: performanceMs,
      };
    } catch (error) {
      console.error(`Scope test failed for ${resourceType}:`, error);

      return {
        resource_type: resourceType,
        user_role: context.role,
        test_passed: false,
        accessible_records: 0,
        total_records: 0,
        violations: [{ error: error.message }],
        performance_ms: Date.now() - startTime,
      };
    }
  }

  private async generateTestData(
    resourceType: string
  ): Promise<Record<string, unknown>[]> {
    switch (resourceType) {
      case 'surveys':
        return [
          {
            _id: 'survey_1',
            company_id: 'company_1',
            department_id: 'dept_1',
            title: 'Employee Satisfaction Survey',
            status: 'active',
          },
          {
            _id: 'survey_2',
            company_id: 'company_2',
            department_id: 'dept_2',
            title: 'Team Collaboration Survey',
            status: 'active',
          },
          {
            _id: 'survey_3',
            company_id: 'company_1',
            department_id: 'dept_2',
            title: 'Leadership Assessment',
            status: 'draft',
          },
        ];

      case 'responses':
        return [
          {
            _id: 'response_1',
            survey_id: 'survey_1',
            user_id: 'user_1',
            company_id: 'company_1',
            department_id: 'dept_1',
          },
          {
            _id: 'response_2',
            survey_id: 'survey_2',
            user_id: 'user_2',
            company_id: 'company_2',
            department_id: 'dept_2',
          },
          {
            _id: 'response_3',
            survey_id: 'survey_1',
            user_id: 'user_3',
            company_id: 'company_1',
            department_id: 'dept_1',
          },
        ];

      case 'action_plans':
        return [
          {
            _id: 'action_1',
            company_id: 'company_1',
            department_id: 'dept_1',
            assigned_to: 'user_1',
            title: 'Improve Communication',
          },
          {
            _id: 'action_2',
            company_id: 'company_2',
            department_id: 'dept_2',
            assigned_to: 'user_2',
            title: 'Team Building Initiative',
          },
          {
            _id: 'action_3',
            company_id: 'company_1',
            department_id: 'dept_2',
            assigned_to: 'user_3',
            title: 'Leadership Development',
          },
        ];

      default:
        return [];
    }
  }

  async validateDatabaseScoping(): Promise<{
    passed: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    await connectDB();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check if collections have proper indexes for scoping fields
      const db = (global as any).mongoose.connection.db;

      const collections = ['surveys', 'responses', 'action_plans'];
      const scopingFields = ['company_id', 'department_id', 'user_id'];

      for (const collection of collections) {
        const indexes = await db.collection(collection).indexes();

        for (const field of scopingFields) {
          const hasIndex = indexes.some(
            (index) => index.key && index.key[field]
          );

          if (!hasIndex) {
            issues.push(
              `Missing index on ${field} in ${collection} collection`
            );
            recommendations.push(
              `Create index: db.${collection}.createIndex({${field}: 1})`
            );
          }
        }
      }

      // Check for potential data leakage patterns
      const sampleQueries = [
        { collection: 'surveys', query: {} },
        { collection: 'responses', query: {} },
        { collection: 'action_plans', query: {} },
      ];

      for (const { collection, query } of sampleQueries) {
        const count = await db.collection(collection).countDocuments(query);
        if (count > 1000) {
          recommendations.push(
            `Consider implementing data archiving for ${collection} (${count} records)`
          );
        }
      }
    } catch (error) {
      issues.push(`Database validation error: ${error.message}`);
    }

    return {
      passed: issues.length === 0,
      issues,
      recommendations,
    };
  }

  generateScopeTestReport(testSuite: ScopeTestSuite): string {
    let report = `# Data Scoping Test Report\n\n`;
    report += `**Test Suite:** ${testSuite.test_name}\n`;
    report += `**Execution Time:** ${testSuite.execution_time_ms}ms\n`;
    report += `**Overall Result:** ${testSuite.overall_passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `**Tests:** ${testSuite.passed_tests}/${testSuite.total_tests} passed\n\n`;

    report += `## Test Results\n\n`;

    for (const result of testSuite.results) {
      const status = result.test_passed ? '✅' : '❌';
      report += `### ${status} ${result.resource_type} - ${result.user_role}\n`;
      report += `- **Accessible Records:** ${result.accessible_records}/${result.total_records}\n`;
      report += `- **Performance:** ${result.performance_ms}ms\n`;

      if (result.violations.length > 0) {
        report += `- **Violations:** ${result.violations.length}\n`;
        for (const violation of result.violations.slice(0, 3)) {
          report += `  - ${violation.record_id}: ${violation.reason}\n`;
        }
        if (result.violations.length > 3) {
          report += `  - ... and ${result.violations.length - 3} more\n`;
        }
      }
      report += `\n`;
    }

    return report;
  }
}

export default ScopeTestingService;


