#!/usr/bin/env tsx

/**
 * Test script to verify microclimate data serialization
 * Identifies potential circular references or serialization issues
 */

import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import mongoose from 'mongoose';

// Helper function to sanitize data for serialization
function sanitizeForSerialization(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForSerialization);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && key !== '__v' && key !== '$__' && key !== '$isNew') {
        sanitized[key] = sanitizeForSerialization(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

async function testSerialization() {
  try {
    console.log('🧪 Testing Microclimate Data Serialization...\n');

    await connectDB();

    // Find the test microclimate
    const microclimate = await Microclimate.findOne({ status: 'active' });
    
    if (!microclimate) {
      console.log('❌ No active microclimate found');
      return;
    }

    console.log(`✅ Found microclimate: ${microclimate.title}`);

    // Test 1: Basic toObject conversion
    console.log('\n1. Testing toObject() conversion...');
    try {
      const plainObject = microclimate.toObject();
      console.log('✅ toObject() successful');
      console.log(`   Keys: ${Object.keys(plainObject).join(', ')}`);
    } catch (error) {
      console.log('❌ toObject() failed:', error.message);
    }

    // Test 2: JSON serialization of raw object
    console.log('\n2. Testing JSON serialization of raw object...');
    try {
      const jsonString = JSON.stringify(microclimate);
      console.log('✅ JSON.stringify() of raw object successful');
      console.log(`   Length: ${jsonString.length} characters`);
    } catch (error) {
      console.log('❌ JSON.stringify() of raw object failed:', error.message);
    }

    // Test 3: JSON serialization of plain object
    console.log('\n3. Testing JSON serialization of plain object...');
    try {
      const plainObject = microclimate.toObject();
      const jsonString = JSON.stringify(plainObject);
      console.log('✅ JSON.stringify() of plain object successful');
      console.log(`   Length: ${jsonString.length} characters`);
    } catch (error) {
      console.log('❌ JSON.stringify() of plain object failed:', error.message);
    }

    // Test 4: Custom sanitization
    console.log('\n4. Testing custom sanitization...');
    try {
      const plainObject = microclimate.toObject();
      const sanitized = sanitizeForSerialization(plainObject);
      const jsonString = JSON.stringify(sanitized);
      console.log('✅ Custom sanitization successful');
      console.log(`   Length: ${jsonString.length} characters`);
    } catch (error) {
      console.log('❌ Custom sanitization failed:', error.message);
    }

    // Test 5: Simulate the live route data transformation
    console.log('\n5. Testing live route data transformation...');
    try {
      const plainMicroclimate = microclimate.toObject();
      
      const transformedData = {
        id: plainMicroclimate._id.toString(),
        title: plainMicroclimate.title,
        status: plainMicroclimate.status,
        response_count: plainMicroclimate.response_count || 0,
        target_participant_count: plainMicroclimate.target_participant_count || 0,
        participation_rate: plainMicroclimate.participation_rate || 0,
        time_remaining: microclimate.isActive()
          ? Math.max(
              0,
              Math.floor(
                (plainMicroclimate.scheduling.start_time.getTime() +
                  plainMicroclimate.scheduling.duration_minutes * 60 * 1000 -
                  Date.now()) /
                  (1000 * 60)
              )
            )
          : undefined,
        live_results: plainMicroclimate.live_results || {
          word_cloud_data: [],
          sentiment_score: 0,
          sentiment_distribution: {
            positive: 0,
            neutral: 0,
            negative: 0,
          },
          engagement_level: 'low',
          response_distribution: {},
          top_themes: [],
        },
        ai_insights: (plainMicroclimate.ai_insights || []).map((insight: any) => ({
          type: insight.type,
          message: insight.message,
          confidence: insight.confidence,
          timestamp: insight.timestamp ? new Date(insight.timestamp) : new Date(),
          priority: insight.priority,
        })),
        questions:
          plainMicroclimate.questions?.map((q: any) => ({
            question: q.text,
            responses:
              q.options?.map((option: string, index: number) => ({
                option,
                count:
                  plainMicroclimate.live_results?.response_distribution?.[
                    `${q.id}_${index}`
                  ] || 0,
                percentage:
                  plainMicroclimate.response_count > 0
                    ? ((plainMicroclimate.live_results?.response_distribution?.[
                        `${q.id}_${index}`
                      ] || 0) /
                        plainMicroclimate.response_count) *
                      100
                    : 0,
              })) || [],
            total_responses: plainMicroclimate.response_count || 0,
          })) || [],
      };

      const sanitizedData = sanitizeForSerialization(transformedData);
      const jsonString = JSON.stringify(sanitizedData);
      
      console.log('✅ Live route transformation successful');
      console.log(`   Final data keys: ${Object.keys(sanitizedData).join(', ')}`);
      console.log(`   Questions count: ${sanitizedData.questions?.length || 0}`);
      console.log(`   AI insights count: ${sanitizedData.ai_insights?.length || 0}`);
      console.log(`   JSON length: ${jsonString.length} characters`);
      
      // Test parsing back
      const parsed = JSON.parse(jsonString);
      console.log('✅ JSON round-trip successful');
      
    } catch (error) {
      console.log('❌ Live route transformation failed:', error.message);
      console.log('   Stack:', error.stack);
    }

    console.log('\n📊 Serialization Test Summary:');
    console.log('==============================');
    console.log('All serialization tests completed. Check results above.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testSerialization();
