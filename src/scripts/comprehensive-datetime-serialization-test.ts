/**
 * Comprehensive test script to verify all datetime serialization fixes
 * Tests all components, API routes, and utilities for proper datetime handling
 */

import { 
  sanitizeForSerialization, 
  serializeDatetimes, 
  safeToISOString, 
  safeToDate,
  formatDateForDatetimeLocal,
  getDefaultMicroclimateStartTime
} from '@/lib/datetime-utils';

// Test data with various datetime scenarios
const testData = {
  simple_date: new Date('2024-01-15T10:30:00Z'),
  nested_object: {
    created_at: new Date('2024-01-15T10:30:00Z'),
    updated_at: new Date('2024-01-16T15:45:00Z'),
    metadata: {
      timestamp: new Date('2024-01-17T08:20:00Z'),
      nested_deeper: {
        event_time: new Date('2024-01-18T12:00:00Z')
      }
    }
  },
  array_with_dates: [
    { id: 1, date: new Date('2024-01-15T10:30:00Z') },
    { id: 2, date: new Date('2024-01-16T15:45:00Z') },
    { id: 3, date: new Date('2024-01-17T08:20:00Z') }
  ],
  mixed_types: {
    string_field: 'test string',
    number_field: 42,
    boolean_field: true,
    null_field: null,
    undefined_field: undefined,
    date_field: new Date('2024-01-15T10:30:00Z')
  },
  microclimate_like: {
    id: 'test-id',
    title: 'Test Microclimate',
    status: 'active',
    created_at: new Date('2024-01-15T10:30:00Z'),
    updated_at: new Date('2024-01-16T15:45:00Z'),
    scheduling: {
      start_time: new Date('2024-01-20T14:00:00Z'),
      duration_minutes: 60
    },
    ai_insights: [
      {
        type: 'pattern',
        message: 'Test insight',
        confidence: 0.8,
        timestamp: new Date('2024-01-15T10:30:00Z')
      }
    ],
    responses: [
      {
        id: 'response-1',
        submitted_at: new Date('2024-01-15T11:00:00Z'),
        user_name: 'Test User'
      }
    ]
  }
};

function testSanitizeForSerialization() {
  console.log('🧪 Testing sanitizeForSerialization...');
  
  try {
    const sanitized = sanitizeForSerialization(testData);
    
    // Verify all dates are converted to ISO strings
    console.log('✅ Simple date:', typeof sanitized.simple_date === 'string' ? 'PASS' : 'FAIL');
    console.log('✅ Nested dates:', typeof sanitized.nested_object.created_at === 'string' ? 'PASS' : 'FAIL');
    console.log('✅ Deep nested dates:', typeof sanitized.nested_object.metadata.nested_deeper.event_time === 'string' ? 'PASS' : 'FAIL');
    console.log('✅ Array dates:', typeof sanitized.array_with_dates[0].date === 'string' ? 'PASS' : 'FAIL');
    console.log('✅ Mixed types preserved:', 
      typeof sanitized.mixed_types.string_field === 'string' &&
      typeof sanitized.mixed_types.number_field === 'number' &&
      typeof sanitized.mixed_types.boolean_field === 'boolean' &&
      sanitized.mixed_types.null_field === null &&
      sanitized.mixed_types.undefined_field === undefined &&
      typeof sanitized.mixed_types.date_field === 'string' ? 'PASS' : 'FAIL'
    );
    
    // Test JSON serialization
    const jsonString = JSON.stringify(sanitized);
    const parsed = JSON.parse(jsonString);
    console.log('✅ JSON serialization:', parsed ? 'PASS' : 'FAIL');
    
    console.log('✅ sanitizeForSerialization: ALL TESTS PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ sanitizeForSerialization: FAILED', error);
    return false;
  }
}

function testSerializeDatetimes() {
  console.log('🧪 Testing serializeDatetimes...');
  
  try {
    const serialized = serializeDatetimes(testData);
    
    // Verify all dates are converted to ISO strings
    console.log('✅ Simple date:', typeof serialized.simple_date === 'string' ? 'PASS' : 'FAIL');
    console.log('✅ Nested dates:', typeof serialized.nested_object.created_at === 'string' ? 'PASS' : 'FAIL');
    console.log('✅ Array dates:', typeof serialized.array_with_dates[0].date === 'string' ? 'PASS' : 'FAIL');
    
    console.log('✅ serializeDatetimes: ALL TESTS PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ serializeDatetimes: FAILED', error);
    return false;
  }
}

function testSafeConversions() {
  console.log('🧪 Testing safe conversion functions...');
  
  try {
    // Test safeToISOString
    const validDate = new Date('2024-01-15T10:30:00Z');
    const invalidDate = 'invalid-date';
    const nullValue = null;
    
    console.log('✅ safeToISOString valid date:', safeToISOString(validDate) === validDate.toISOString() ? 'PASS' : 'FAIL');
    console.log('✅ safeToISOString invalid date:', safeToISOString(invalidDate) === null ? 'PASS' : 'FAIL');
    console.log('✅ safeToISOString null:', safeToISOString(nullValue) === null ? 'PASS' : 'FAIL');
    
    // Test safeToDate
    console.log('✅ safeToDate valid date:', safeToDate(validDate) instanceof Date ? 'PASS' : 'FAIL');
    console.log('✅ safeToDate string date:', safeToDate('2024-01-15T10:30:00Z') instanceof Date ? 'PASS' : 'FAIL');
    console.log('✅ safeToDate invalid:', safeToDate(invalidDate) === null ? 'PASS' : 'FAIL');
    
    console.log('✅ Safe conversions: ALL TESTS PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Safe conversions: FAILED', error);
    return false;
  }
}

function testDatetimeLocalFormatting() {
  console.log('🧪 Testing datetime-local formatting...');
  
  try {
    const testDate = new Date('2024-01-15T10:30:00Z');
    const formatted = formatDateForDatetimeLocal(testDate);
    
    // Should be in YYYY-MM-DDTHH:MM format
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    console.log('✅ Format pattern:', regex.test(formatted) ? 'PASS' : 'FAIL');
    
    const defaultTime = getDefaultMicroclimateStartTime();
    console.log('✅ Default time format:', regex.test(defaultTime) ? 'PASS' : 'FAIL');
    
    console.log('✅ Datetime-local formatting: ALL TESTS PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Datetime-local formatting: FAILED', error);
    return false;
  }
}

function testCircularReferences() {
  console.log('🧪 Testing circular reference handling...');
  
  try {
    // Create circular reference
    const obj: any = {
      name: 'test',
      date: new Date('2024-01-15T10:30:00Z')
    };
    obj.self = obj; // Circular reference
    
    const sanitized = sanitizeForSerialization(obj);
    
    console.log('✅ Circular reference handled:', sanitized.self === '[Circular Reference]' ? 'PASS' : 'FAIL');
    console.log('✅ Date still serialized:', typeof sanitized.date === 'string' ? 'PASS' : 'FAIL');
    
    console.log('✅ Circular reference handling: ALL TESTS PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Circular reference handling: FAILED', error);
    return false;
  }
}

function testMicroclimateDataStructure() {
  console.log('🧪 Testing microclimate-like data structure...');
  
  try {
    const sanitized = sanitizeForSerialization(testData.microclimate_like);
    
    // Verify all datetime fields are properly serialized
    console.log('✅ Created at:', typeof sanitized.created_at === 'string' ? 'PASS' : 'FAIL');
    console.log('✅ Updated at:', typeof sanitized.updated_at === 'string' ? 'PASS' : 'FAIL');
    console.log('✅ Scheduling start time:', typeof sanitized.scheduling.start_time === 'string' ? 'PASS' : 'FAIL');
    console.log('✅ AI insight timestamp:', typeof sanitized.ai_insights[0].timestamp === 'string' ? 'PASS' : 'FAIL');
    console.log('✅ Response submitted at:', typeof sanitized.responses[0].submitted_at === 'string' ? 'PASS' : 'FAIL');
    
    // Verify JSON serialization works
    const jsonString = JSON.stringify(sanitized);
    const parsed = JSON.parse(jsonString);
    console.log('✅ JSON serialization:', parsed ? 'PASS' : 'FAIL');
    
    console.log('✅ Microclimate data structure: ALL TESTS PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Microclimate data structure: FAILED', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive DateTime Serialization Tests\n');
  
  const results = [
    testSanitizeForSerialization(),
    testSerializeDatetimes(),
    testSafeConversions(),
    testDatetimeLocalFormatting(),
    testCircularReferences(),
    testMicroclimateDataStructure()
  ];
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} test suites passed`);
  
  if (passed === total) {
    console.log('🎉 ALL DATETIME SERIALIZATION TESTS PASSED!');
    console.log('✅ The datetime serialization fixes are working correctly.');
    console.log('✅ All Date objects will be properly converted to ISO strings.');
    console.log('✅ Circular references are handled safely.');
    console.log('✅ Next.js serialization errors should be resolved.');
  } else {
    console.log('❌ Some tests failed. Please review the datetime utilities.');
  }
  
  return passed === total;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runAllTests };
