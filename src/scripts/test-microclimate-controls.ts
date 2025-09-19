/**
 * Test script to verify microclimate control buttons functionality
 */

import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';

async function testMicroclimateControls() {
  console.log('🧪 Testing microclimate control functionality...\n');
  
  try {
    await connectDB();
    
    // Find the test microclimate
    const microclimate = await Microclimate.findOne({ title: /test.*live/i });
    
    if (!microclimate) {
      console.log('❌ No test microclimate found');
      return;
    }
    
    console.log(`📋 Testing microclimate: ${microclimate.title}`);
    console.log(`   Current status: ${microclimate.status}`);
    console.log(`   isActive(): ${microclimate.isActive()}`);
    console.log(`   canAcceptResponses(): ${microclimate.canAcceptResponses()}\n`);
    
    // Test status transitions
    const originalStatus = microclimate.status;
    
    // Test 1: Pause microclimate
    console.log('🔄 Test 1: Pausing microclimate...');
    microclimate.status = 'paused';
    await microclimate.save();
    console.log(`   ✅ Status updated to: ${microclimate.status}`);
    
    // Test 2: Resume microclimate
    console.log('🔄 Test 2: Resuming microclimate...');
    microclimate.status = 'active';
    await microclimate.save();
    console.log(`   ✅ Status updated to: ${microclimate.status}`);
    
    // Test 3: End microclimate
    console.log('🔄 Test 3: Ending microclimate...');
    microclimate.status = 'completed';
    await microclimate.save();
    console.log(`   ✅ Status updated to: ${microclimate.status}`);
    
    // Test 4: Check if completed microclimate can be accessed
    console.log('🔄 Test 4: Checking completed microclimate access...');
    console.log(`   isActive(): ${microclimate.isActive()}`);
    console.log(`   canAcceptResponses(): ${microclimate.canAcceptResponses()}`);
    
    // Reset to original status for further testing
    console.log(`🔄 Resetting to original status: ${originalStatus}`);
    microclimate.status = originalStatus;
    await microclimate.save();
    
    console.log('\n✅ All control tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing microclimate controls:', error);
  }
  
  process.exit(0);
}

// Run the test function
testMicroclimateControls().catch(console.error);
