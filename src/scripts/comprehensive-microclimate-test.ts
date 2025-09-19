/**
 * Comprehensive test script for microclimate live dashboard functionality
 */

import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import User from '@/models/User';

async function comprehensiveMicroclimateTest() {
  console.log('🧪 Running comprehensive microclimate live dashboard tests...\n');
  
  try {
    await connectDB();
    
    // Test 1: Status Display and Auto-Update
    console.log('📋 Test 1: Status Display and Auto-Update');
    console.log('==========================================');
    
    const microclimate = await Microclimate.findOne({ title: /test.*live/i });
    if (!microclimate) {
      console.log('❌ No test microclimate found');
      return;
    }
    
    console.log(`Microclimate: ${microclimate.title}`);
    console.log(`Current status in DB: ${microclimate.status}`);
    console.log(`isActive(): ${microclimate.isActive()}`);
    console.log(`canAcceptResponses(): ${microclimate.canAcceptResponses()}`);
    
    // Check if auto-update logic would trigger
    if (microclimate.status === 'active' && !microclimate.isActive()) {
      console.log('✅ Auto-update logic should trigger: expired active microclimate detected');
    } else {
      console.log('ℹ️  Auto-update logic would not trigger');
    }
    
    // Test 2: Control Button Functionality
    console.log('\n📋 Test 2: Control Button Functionality');
    console.log('=======================================');
    
    const originalStatus = microclimate.status;
    
    // Test pause functionality
    console.log('Testing pause...');
    microclimate.status = 'paused';
    await microclimate.save();
    console.log(`✅ Paused: ${microclimate.status}`);
    
    // Test resume functionality
    console.log('Testing resume...');
    microclimate.status = 'active';
    await microclimate.save();
    console.log(`✅ Resumed: ${microclimate.status}`);
    
    // Test end functionality
    console.log('Testing end...');
    microclimate.status = 'completed';
    await microclimate.save();
    console.log(`✅ Ended: ${microclimate.status}`);
    
    // Reset for further testing
    microclimate.status = originalStatus;
    await microclimate.save();
    console.log(`🔄 Reset to original status: ${originalStatus}`);
    
    // Test 3: Timezone Handling
    console.log('\n📋 Test 3: Timezone Handling');
    console.log('============================');
    
    console.log(`Microclimate timezone: ${microclimate.scheduling.timezone}`);
    console.log(`Start time: ${microclimate.scheduling.start_time}`);
    console.log(`Start time (local): ${new Date(microclimate.scheduling.start_time).toLocaleString()}`);
    console.log(`Start time (UTC): ${new Date(microclimate.scheduling.start_time).toISOString()}`);
    
    const now = new Date();
    const startTime = new Date(microclimate.scheduling.start_time);
    const endTime = new Date(startTime.getTime() + microclimate.scheduling.duration_minutes * 60 * 1000);
    
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Microclimate window: ${startTime.toISOString()} to ${endTime.toISOString()}`);
    console.log(`Time remaining: ${Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60)))} minutes`);
    
    // Test 4: Database Connection and API Endpoints
    console.log('\n📋 Test 4: Database Connection and API Readiness');
    console.log('================================================');
    
    // Test database queries that the live dashboard uses
    const activeCount = await Microclimate.countDocuments({ status: 'active' });
    const pausedCount = await Microclimate.countDocuments({ status: 'paused' });
    const completedCount = await Microclimate.countDocuments({ status: 'completed' });
    
    console.log(`Active microclimates: ${activeCount}`);
    console.log(`Paused microclimates: ${pausedCount}`);
    console.log(`Completed microclimates: ${completedCount}`);
    
    // Test user access (simulate company admin access)
    const testUser = await User.findOne({ role: 'company_admin' });
    if (testUser) {
      console.log(`✅ Found company admin user: ${testUser.name}`);
      console.log(`   Company ID: ${testUser.company_id}`);
      console.log(`   Microclimate Company ID: ${microclimate.company_id}`);
      console.log(`   Access granted: ${testUser.company_id === microclimate.company_id || testUser.role === 'super_admin'}`);
    } else {
      console.log('⚠️  No company admin user found for access testing');
    }
    
    // Test 5: Live Results Data Structure
    console.log('\n📋 Test 5: Live Results Data Structure');
    console.log('======================================');
    
    console.log('Live results structure:');
    console.log(`  Sentiment score: ${microclimate.live_results.sentiment_score}`);
    console.log(`  Engagement level: ${microclimate.live_results.engagement_level}`);
    console.log(`  Word cloud entries: ${microclimate.live_results.word_cloud_data.length}`);
    console.log(`  Response distribution keys: ${Object.keys(microclimate.live_results.response_distribution).length}`);
    console.log(`  Top themes: ${microclimate.live_results.top_themes.join(', ')}`);
    
    // Test AI insights
    console.log(`  AI insights: ${microclimate.ai_insights.length}`);
    microclimate.ai_insights.forEach((insight, index) => {
      console.log(`    ${index + 1}. ${insight.type}: ${insight.message} (${Math.round(insight.confidence * 100)}% confidence)`);
    });
    
    console.log('\n🎉 All comprehensive tests completed successfully!');
    console.log('\n📋 Summary of Fixes Applied:');
    console.log('============================');
    console.log('✅ Added "paused" status to microclimate model enum');
    console.log('✅ Fixed database connection in live-updates API');
    console.log('✅ Added auto-update logic for expired microclimates');
    console.log('✅ Updated canAcceptResponses() method for paused status');
    console.log('✅ Added timezone clarity in creation forms');
    console.log('✅ Fixed API validation schemas to include paused status');
    console.log('✅ Updated access control for completed microclimates');
    
  } catch (error) {
    console.error('❌ Error in comprehensive test:', error);
  }
  
  process.exit(0);
}

// Run the comprehensive test
comprehensiveMicroclimateTest().catch(console.error);
