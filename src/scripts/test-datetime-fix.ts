/**
 * Test script to verify the datetime fix for microclimate creation forms
 */

import { 
  formatDateForDatetimeLocal, 
  getDefaultMicroclimateStartTime, 
  getUserTimezone,
  parseDatetimeLocal,
  formatDateForDisplay
} from '@/lib/datetime-utils';

function testDatetimeFix() {
  console.log('🧪 Testing datetime fix for microclimate creation forms...\n');
  
  // Test current time and timezone
  const now = new Date();
  console.log('📅 Current Date/Time Information:');
  console.log(`Current time: ${now.toLocaleString()}`);
  console.log(`Current timezone: ${getUserTimezone()}`);
  console.log(`Current UTC time: ${now.toISOString()}`);
  console.log();
  
  // Test the old way (problematic)
  console.log('❌ Old Way (Problematic):');
  const oldWay = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
  console.log(`Old format result: ${oldWay}`);
  console.log(`When parsed by browser: ${new Date(oldWay).toLocaleString()}`);
  console.log();
  
  // Test the new way (fixed)
  console.log('✅ New Way (Fixed):');
  const newWay = getDefaultMicroclimateStartTime();
  console.log(`New format result: ${newWay}`);
  console.log(`When parsed by browser: ${new Date(newWay).toLocaleString()}`);
  console.log();
  
  // Test manual formatting
  console.log('🔧 Manual Format Testing:');
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  const formatted = formatDateForDatetimeLocal(oneHourFromNow);
  console.log(`One hour from now: ${oneHourFromNow.toLocaleString()}`);
  console.log(`Formatted for datetime-local: ${formatted}`);
  console.log(`Parsed back: ${parseDatetimeLocal(formatted).toLocaleString()}`);
  console.log();
  
  // Test edge cases
  console.log('🌍 Edge Case Testing:');
  
  // Test midnight
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  console.log(`Midnight: ${midnight.toLocaleString()}`);
  console.log(`Midnight formatted: ${formatDateForDatetimeLocal(midnight)}`);
  
  // Test noon
  const noon = new Date();
  noon.setHours(12, 0, 0, 0);
  console.log(`Noon: ${noon.toLocaleString()}`);
  console.log(`Noon formatted: ${formatDateForDatetimeLocal(noon)}`);
  
  // Test end of month
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0); // Last day of current month
  endOfMonth.setHours(23, 59, 0, 0);
  console.log(`End of month: ${endOfMonth.toLocaleString()}`);
  console.log(`End of month formatted: ${formatDateForDatetimeLocal(endOfMonth)}`);
  console.log();
  
  // Verify the fix addresses the original issue
  console.log('🎯 Issue Verification:');
  console.log('The original issue was that dates appeared one day behind.');
  console.log('This happened because UTC time was being used directly in datetime-local inputs.');
  console.log();
  
  const testDate = new Date('2025-01-15T14:30:00Z'); // 2:30 PM UTC
  console.log(`Test UTC date: ${testDate.toISOString()}`);
  console.log(`Local time: ${testDate.toLocaleString()}`);
  console.log(`Old format (UTC): ${testDate.toISOString().slice(0, 16)}`);
  console.log(`New format (Local): ${formatDateForDatetimeLocal(testDate)}`);
  console.log();
  
  console.log('✅ Datetime fix verification completed!');
  console.log('The new implementation should show the correct local date and time.');
}

// Run the test
testDatetimeFix();
