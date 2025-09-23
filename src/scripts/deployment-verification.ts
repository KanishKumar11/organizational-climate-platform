/**
 * Deployment Verification Script
 * Comprehensive checks for production readiness
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface VerificationResult {
  check_name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

class DeploymentVerifier {
  private results: VerificationResult[] = [];

  async runAllChecks(): Promise<{
    overall_status: 'READY' | 'NOT_READY' | 'WARNINGS';
    checks: VerificationResult[];
    summary: {
      total_checks: number;
      passed: number;
      failed: number;
      warnings: number;
    };
  }> {
    console.log('🔍 Running Deployment Verification Checks...\n');

    await this.checkTypeScriptCompilation();
    await this.checkBuildProcess();
    await this.checkEnvironmentVariables();
    await this.checkDatabaseModels();
    await this.checkAPIRoutes();
    await this.checkPageRoutes();
    await this.checkDependencies();
    await this.checkSecurityConfiguration();
    await this.checkPerformanceOptimizations();

    return this.generateSummary();
  }

  private async checkTypeScriptCompilation(): Promise<void> {
    try {
      console.log('📝 Checking TypeScript compilation...');
      const { stdout, stderr } = await execAsync('npx tsc --noEmit');
      
      this.results.push({
        check_name: 'TypeScript Compilation',
        status: 'PASS',
        message: 'TypeScript compilation successful',
        details: { stdout: stdout.trim() }
      });
    } catch (error: any) {
      this.results.push({
        check_name: 'TypeScript Compilation',
        status: 'FAIL',
        message: 'TypeScript compilation failed',
        details: { error: error.message }
      });
    }
  }

  private async checkBuildProcess(): Promise<void> {
    try {
      console.log('🏗️ Checking build process...');
      const { stdout } = await execAsync('npm run build');
      
      this.results.push({
        check_name: 'Build Process',
        status: 'PASS',
        message: 'Build process completed successfully',
        details: { build_output: 'Build completed' }
      });
    } catch (error: any) {
      this.results.push({
        check_name: 'Build Process',
        status: 'FAIL',
        message: 'Build process failed',
        details: { error: error.message }
      });
    }
  }

  private async checkEnvironmentVariables(): Promise<void> {
    console.log('🔧 Checking environment variables...');
    
    const requiredEnvVars = [
      'MONGODB_URI',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    const optionalEnvVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS'
    ];

    const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
    const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);

    if (missingRequired.length === 0) {
      this.results.push({
        check_name: 'Required Environment Variables',
        status: 'PASS',
        message: 'All required environment variables are set',
        details: { required: requiredEnvVars }
      });
    } else {
      this.results.push({
        check_name: 'Required Environment Variables',
        status: 'FAIL',
        message: `Missing required environment variables: ${missingRequired.join(', ')}`,
        details: { missing: missingRequired }
      });
    }

    if (missingOptional.length > 0) {
      this.results.push({
        check_name: 'Optional Environment Variables',
        status: 'WARNING',
        message: `Missing optional environment variables: ${missingOptional.join(', ')}`,
        details: { missing: missingOptional }
      });
    }
  }

  private async checkDatabaseModels(): Promise<void> {
    console.log('🗄️ Checking database models...');
    
    try {
      const modelsDir = path.join(process.cwd(), 'src/models');
      const modelFiles = await fs.readdir(modelsDir);
      
      const expectedModels = [
        'User.ts',
        'Survey.ts',
        'Response.ts',
        'Benchmark.ts',
        'Report.ts',
        'AuditLog.ts',
        'Company.ts',
        'Department.ts'
      ];

      const missingModels = expectedModels.filter(model => !modelFiles.includes(model));

      if (missingModels.length === 0) {
        this.results.push({
          check_name: 'Database Models',
          status: 'PASS',
          message: 'All required database models are present',
          details: { models: expectedModels.length, files: modelFiles.length }
        });
      } else {
        this.results.push({
          check_name: 'Database Models',
          status: 'FAIL',
          message: `Missing database models: ${missingModels.join(', ')}`,
          details: { missing: missingModels }
        });
      }
    } catch (error: any) {
      this.results.push({
        check_name: 'Database Models',
        status: 'FAIL',
        message: 'Failed to check database models',
        details: { error: error.message }
      });
    }
  }

  private async checkAPIRoutes(): Promise<void> {
    console.log('🔌 Checking API routes...');
    
    const requiredRoutes = [
      'src/app/api/surveys/my/route.ts',
      'src/app/api/benchmarks/route.ts',
      'src/app/api/reports/route.ts',
      'src/app/api/audit/logs/route.ts',
      'src/app/api/audit/report/route.ts',
      'src/app/api/audit/export/route.ts'
    ];

    let missingRoutes = [];
    
    for (const route of requiredRoutes) {
      try {
        await fs.access(route);
      } catch {
        missingRoutes.push(route);
      }
    }

    if (missingRoutes.length === 0) {
      this.results.push({
        check_name: 'API Routes',
        status: 'PASS',
        message: 'All required API routes are present',
        details: { routes: requiredRoutes.length }
      });
    } else {
      this.results.push({
        check_name: 'API Routes',
        status: 'FAIL',
        message: `Missing API routes: ${missingRoutes.join(', ')}`,
        details: { missing: missingRoutes }
      });
    }
  }

  private async checkPageRoutes(): Promise<void> {
    console.log('📄 Checking page routes...');
    
    const requiredPages = [
      'src/app/benchmarks/page.tsx',
      'src/app/reports/page.tsx',
      'src/app/logs/page.tsx',
      'src/app/surveys/my/page.tsx'
    ];

    let missingPages = [];
    
    for (const page of requiredPages) {
      try {
        await fs.access(page);
      } catch {
        missingPages.push(page);
      }
    }

    if (missingPages.length === 0) {
      this.results.push({
        check_name: 'Page Routes',
        status: 'PASS',
        message: 'All required page routes are present',
        details: { pages: requiredPages.length }
      });
    } else {
      this.results.push({
        check_name: 'Page Routes',
        status: 'FAIL',
        message: `Missing page routes: ${missingPages.join(', ')}`,
        details: { missing: missingPages }
      });
    }
  }

  private async checkDependencies(): Promise<void> {
    console.log('📦 Checking dependencies...');
    
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      const dependencies = Object.keys(packageJson.dependencies || {});
      const devDependencies = Object.keys(packageJson.devDependencies || {});

      const criticalDependencies = [
        'next',
        'react',
        'mongoose',
        'next-auth',
        '@radix-ui/react-dialog',
        'tailwindcss',
        'typescript'
      ];

      const missingCritical = criticalDependencies.filter(dep => 
        !dependencies.includes(dep) && !devDependencies.includes(dep)
      );

      if (missingCritical.length === 0) {
        this.results.push({
          check_name: 'Dependencies',
          status: 'PASS',
          message: 'All critical dependencies are present',
          details: { 
            total_deps: dependencies.length,
            total_dev_deps: devDependencies.length
          }
        });
      } else {
        this.results.push({
          check_name: 'Dependencies',
          status: 'FAIL',
          message: `Missing critical dependencies: ${missingCritical.join(', ')}`,
          details: { missing: missingCritical }
        });
      }
    } catch (error: any) {
      this.results.push({
        check_name: 'Dependencies',
        status: 'FAIL',
        message: 'Failed to check dependencies',
        details: { error: error.message }
      });
    }
  }

  private async checkSecurityConfiguration(): Promise<void> {
    console.log('🔒 Checking security configuration...');
    
    const securityChecks = [
      {
        name: 'NEXTAUTH_SECRET',
        check: () => !!process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32,
        message: 'NEXTAUTH_SECRET should be at least 32 characters'
      },
      {
        name: 'NEXTAUTH_URL',
        check: () => !!process.env.NEXTAUTH_URL,
        message: 'NEXTAUTH_URL should be set for production'
      },
      {
        name: 'MongoDB URI Security',
        check: () => {
          const uri = process.env.MONGODB_URI;
          return uri && (uri.includes('mongodb+srv://') || uri.includes('ssl=true'));
        },
        message: 'MongoDB URI should use SSL/TLS for production'
      }
    ];

    let securityIssues = [];
    
    for (const check of securityChecks) {
      if (!check.check()) {
        securityIssues.push(check.name);
      }
    }

    if (securityIssues.length === 0) {
      this.results.push({
        check_name: 'Security Configuration',
        status: 'PASS',
        message: 'Security configuration looks good',
        details: { checks_passed: securityChecks.length }
      });
    } else {
      this.results.push({
        check_name: 'Security Configuration',
        status: 'WARNING',
        message: `Security issues found: ${securityIssues.join(', ')}`,
        details: { issues: securityIssues }
      });
    }
  }

  private async checkPerformanceOptimizations(): Promise<void> {
    console.log('⚡ Checking performance optimizations...');
    
    try {
      // Check if Next.js config exists
      let nextConfigExists = false;
      try {
        await fs.access('next.config.js');
        nextConfigExists = true;
      } catch {
        try {
          await fs.access('next.config.mjs');
          nextConfigExists = true;
        } catch {
          // No Next.js config found
        }
      }

      // Check for performance-related files
      const performanceFiles = [
        'tailwind.config.ts',
        'tsconfig.json'
      ];

      let missingFiles = [];
      for (const file of performanceFiles) {
        try {
          await fs.access(file);
        } catch {
          missingFiles.push(file);
        }
      }

      if (nextConfigExists && missingFiles.length === 0) {
        this.results.push({
          check_name: 'Performance Configuration',
          status: 'PASS',
          message: 'Performance configuration files are present',
          details: { next_config: nextConfigExists, files: performanceFiles }
        });
      } else {
        this.results.push({
          check_name: 'Performance Configuration',
          status: 'WARNING',
          message: 'Some performance configuration files may be missing',
          details: { 
            next_config: nextConfigExists,
            missing_files: missingFiles
          }
        });
      }
    } catch (error: any) {
      this.results.push({
        check_name: 'Performance Configuration',
        status: 'WARNING',
        message: 'Could not verify performance configuration',
        details: { error: error.message }
      });
    }
  }

  private generateSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;

    let overallStatus: 'READY' | 'NOT_READY' | 'WARNINGS';
    if (failed > 0) {
      overallStatus = 'NOT_READY';
    } else if (warnings > 0) {
      overallStatus = 'WARNINGS';
    } else {
      overallStatus = 'READY';
    }

    return {
      overall_status: overallStatus,
      checks: this.results,
      summary: {
        total_checks: this.results.length,
        passed,
        failed,
        warnings
      }
    };
  }
}

// Export for use in npm scripts
export async function runDeploymentVerification() {
  const verifier = new DeploymentVerifier();
  const results = await verifier.runAllChecks();
  
  console.log('\n🚀 Deployment Verification Results:');
  console.log('====================================');
  console.log(`Overall Status: ${results.overall_status}`);
  console.log(`Total Checks: ${results.summary.total_checks}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Warnings: ${results.summary.warnings}`);
  
  // Print detailed results
  results.checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${check.check_name}: ${check.message}`);
  });
  
  if (results.overall_status === 'NOT_READY') {
    console.log('\n❌ Application is NOT READY for deployment. Please fix the failed checks.');
  } else if (results.overall_status === 'WARNINGS') {
    console.log('\n⚠️ Application is ready for deployment but has warnings. Consider addressing them.');
  } else {
    console.log('\n✅ Application is READY for deployment!');
  }
  
  return results;
}

// CLI execution
if (require.main === module) {
  runDeploymentVerification()
    .then(results => {
      process.exit(results.overall_status === 'NOT_READY' ? 1 : 0);
    })
    .catch(error => {
      console.error('Deployment verification failed:', error);
      process.exit(1);
    });
}
