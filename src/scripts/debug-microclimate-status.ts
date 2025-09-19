/**
 * Debug script to check microclimate status issues
 */

import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';

async function debugMicroclimateStatus() {
  console.log('🔍 Debugging microclimate status issues...\n');
  
  try {
    await connectDB();
    
    // Find all microclimates
    const microclimates = await Microclimate.find({}).select('title status scheduling created_at updated_at');
    
    console.log(`📊 Found ${microclimates.length} microclimates:\n`);
    
    microclimates.forEach((microclimate, index) => {
      console.log(`${index + 1}. ${microclimate.title}`);
      console.log(`   ID: ${microclimate._id}`);
      console.log(`   Status: ${microclimate.status}`);
      console.log(`   Start Time: ${microclimate.scheduling?.start_time}`);
      console.log(`   Created: ${microclimate.created_at}`);
      console.log(`   Updated: ${microclimate.updated_at}`);
      
      // Check if it should be active based on timing
      if (microclimate.scheduling?.start_time) {
        const now = new Date();
        const startTime = new Date(microclimate.scheduling.start_time);
        const endTime = new Date(startTime.getTime() + (microclimate.scheduling.duration_minutes || 30) * 60 * 1000);
        
        console.log(`   Current Time: ${now.toISOString()}`);
        console.log(`   Start Time: ${startTime.toISOString()}`);
        console.log(`   End Time: ${endTime.toISOString()}`);
        console.log(`   Should be active: ${now >= startTime && now <= endTime && microclimate.status === 'active'}`);
        console.log(`   isActive() method: ${microclimate.isActive()}`);
      }
      
      console.log('');
    });
    
    // Check for specific test microclimate
    const testMicroclimate = await Microclimate.findOne({ title: /test.*live/i });
    if (testMicroclimate) {
      console.log('🧪 Test microclimate details:');
      console.log(`   Status in DB: ${testMicroclimate.status}`);
      console.log(`   isActive(): ${testMicroclimate.isActive()}`);
      console.log(`   canAcceptResponses(): ${testMicroclimate.canAcceptResponses()}`);
      console.log(`   Raw document:`, JSON.stringify(testMicroclimate.toObject(), null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error debugging microclimate status:', error);
  }
  
  process.exit(0);
}

// Run the debug function
debugMicroclimateStatus().catch(console.error);
