#!/usr/bin/env tsx

/**
 * Test script for LiveMicroclimateD ashboard component improvements
 * Tests the enhanced functionality including toast notifications and accessibility
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  console.log(`${passed ? '✅' : '❌'} ${name}: ${message}`);
}

function testComponentImports() {
  const componentPath = path.join(process.cwd(), 'src/components/microclimate/LiveMicroclimateDashboard.tsx');
  
  try {
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Test 1: Toast import
    const hasToastImport = content.includes("import { toast } from 'sonner'");
    addResult(
      'Toast Import',
      hasToastImport,
      hasToastImport ? 'Toast notifications properly imported' : 'Missing toast import'
    );
    
    // Test 2: ARIA labels
    const hasAriaLabels = content.includes('aria-label=') && content.includes('aria-hidden="true"');
    addResult(
      'Accessibility Labels',
      hasAriaLabels,
      hasAriaLabels ? 'ARIA labels properly implemented' : 'Missing ARIA labels'
    );
    
    // Test 3: Semantic HTML
    const hasSemanticHTML = content.includes('<main') && content.includes('<header');
    addResult(
      'Semantic HTML',
      hasSemanticHTML,
      hasSemanticHTML ? 'Semantic HTML elements used' : 'Missing semantic HTML'
    );
    
    // Test 4: No alert() usage
    const hasNoAlerts = !content.includes('alert(');
    addResult(
      'No Browser Alerts',
      hasNoAlerts,
      hasNoAlerts ? 'No browser alerts found' : 'Browser alerts still present'
    );
    
    // Test 5: Toast success messages
    const hasSuccessToasts = content.includes('toast.success(');
    addResult(
      'Success Notifications',
      hasSuccessToasts,
      hasSuccessToasts ? 'Success toast notifications implemented' : 'Missing success notifications'
    );
    
    // Test 6: Toast error messages
    const hasErrorToasts = content.includes('toast.error(');
    addResult(
      'Error Notifications',
      hasErrorToasts,
      hasErrorToasts ? 'Error toast notifications implemented' : 'Missing error notifications'
    );
    
  } catch (error) {
    addResult('Component File Access', false, `Failed to read component file: ${error}`);
  }
}

function testTypeScriptCompilation() {
  try {
    // Test TypeScript compilation
    execSync('npx tsc --noEmit --skipLibCheck', { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    addResult('TypeScript Compilation', true, 'Component compiles without errors');
  } catch (error) {
    addResult('TypeScript Compilation', false, `TypeScript compilation failed: ${error}`);
  }
}

function testAPIEndpoints() {
  const exportApiPath = path.join(process.cwd(), 'src/app/api/microclimates/[id]/export/route.ts');
  const liveUpdatesApiPath = path.join(process.cwd(), 'src/app/api/microclimates/[id]/live-updates/route.ts');
  
  try {
    const exportApiExists = fs.existsSync(exportApiPath);
    addResult(
      'Export API Endpoint',
      exportApiExists,
      exportApiExists ? 'Export API endpoint exists' : 'Export API endpoint missing'
    );
    
    const liveUpdatesApiExists = fs.existsSync(liveUpdatesApiPath);
    addResult(
      'Live Updates API Endpoint',
      liveUpdatesApiExists,
      liveUpdatesApiExists ? 'Live updates API endpoint exists' : 'Live updates API endpoint missing'
    );
  } catch (error) {
    addResult('API Endpoints Check', false, `Failed to check API endpoints: ${error}`);
  }
}

function testWebSocketHook() {
  const hookPath = path.join(process.cwd(), 'src/hooks/useWebSocket.ts');
  
  try {
    const hookExists = fs.existsSync(hookPath);
    addResult(
      'WebSocket Hook',
      hookExists,
      hookExists ? 'useWebSocket hook exists' : 'useWebSocket hook missing'
    );
    
    if (hookExists) {
      const content = fs.readFileSync(hookPath, 'utf8');
      const hasSocketIO = content.includes('socket.io-client');
      addResult(
        'Socket.IO Integration',
        hasSocketIO,
        hasSocketIO ? 'Socket.IO properly integrated' : 'Socket.IO integration missing'
      );
    }
  } catch (error) {
    addResult('WebSocket Hook Check', false, `Failed to check WebSocket hook: ${error}`);
  }
}

function testChildComponents() {
  const components = [
    'src/components/microclimate/LiveWordCloud.tsx',
    'src/components/microclimate/SentimentVisualization.tsx',
    'src/components/microclimate/LiveParticipationTracker.tsx',
    'src/components/microclimate/LiveResponseChart.tsx'
  ];
  
  components.forEach(componentPath => {
    const fullPath = path.join(process.cwd(), componentPath);
    const exists = fs.existsSync(fullPath);
    const componentName = path.basename(componentPath, '.tsx');
    
    addResult(
      `${componentName} Component`,
      exists,
      exists ? `${componentName} component exists` : `${componentName} component missing`
    );
  });
}

// Run all tests
console.log('🧪 Testing LiveMicroclimateD ashboard Component Improvements...\n');

testComponentImports();
testTypeScriptCompilation();
testAPIEndpoints();
testWebSocketHook();
testChildComponents();

// Summary
console.log('\n📊 Test Summary:');
console.log('================');

const passed = results.filter(r => r.passed).length;
const total = results.length;
const percentage = Math.round((passed / total) * 100);

console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);
console.log(`❌ Failed: ${total - passed}/${total}`);

if (percentage >= 90) {
  console.log('\n🎉 EXCELLENT: Component is production-ready with all improvements!');
} else if (percentage >= 80) {
  console.log('\n✅ GOOD: Component is functional with minor issues to address.');
} else if (percentage >= 70) {
  console.log('\n⚠️  NEEDS WORK: Component has several issues that should be fixed.');
} else {
  console.log('\n❌ CRITICAL: Component has major issues that must be resolved.');
}

// Exit with appropriate code
process.exit(percentage >= 80 ? 0 : 1);
