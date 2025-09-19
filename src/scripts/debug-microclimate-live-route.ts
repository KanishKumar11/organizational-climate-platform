#!/usr/bin/env tsx

/**
 * Debug script for microclimate live route issues
 * Tests the route functionality and identifies potential problems
 */

import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import mongoose from 'mongoose';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string, data?: any) {
  results.push({ name, passed, message, data });
  console.log(`${passed ? '✅' : '❌'} ${name}: ${message}`);
  if (data && !passed) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

async function testDatabaseConnection() {
  try {
    await connectDB();
    addResult('Database Connection', true, 'Successfully connected to MongoDB');
    return true;
  } catch (error) {
    addResult('Database Connection', false, `Failed to connect: ${error}`, { error: error.message });
    return false;
  }
}

async function testMicroclimateModel() {
  try {
    const count = await Microclimate.countDocuments();
    addResult('Microclimate Model', true, `Found ${count} microclimates in database`);
    return true;
  } catch (error) {
    addResult('Microclimate Model', false, `Model error: ${error}`, { error: error.message });
    return false;
  }
}

async function findTestMicroclimate() {
  try {
    // Find an active or paused microclimate
    const microclimate = await Microclimate.findOne({
      status: { $in: ['active', 'paused'] }
    });

    if (microclimate) {
      addResult('Test Microclimate Found', true, `Found microclimate: ${microclimate.title}`, {
        id: microclimate._id.toString(),
        title: microclimate.title,
        status: microclimate.status,
        company_id: microclimate.company_id
      });
      return microclimate;
    } else {
      // If no active/paused, find any microclimate
      const anyMicroclimate = await Microclimate.findOne();
      if (anyMicroclimate) {
        addResult('Test Microclimate Found', false, `No active/paused microclimate found, but found: ${anyMicroclimate.title}`, {
          id: anyMicroclimate._id.toString(),
          title: anyMicroclimate.title,
          status: anyMicroclimate.status,
          company_id: anyMicroclimate.company_id
        });
        return anyMicroclimate;
      } else {
        addResult('Test Microclimate Found', false, 'No microclimates found in database');
        return null;
      }
    }
  } catch (error) {
    addResult('Test Microclimate Found', false, `Error finding microclimate: ${error}`, { error: error.message });
    return null;
  }
}

async function testMicroclimateDataStructure(microclimate: any) {
  try {
    const requiredFields = [
      'title', 'status', 'company_id', 'scheduling', 'targeting'
    ];

    const missingFields = requiredFields.filter(field => !microclimate[field]);
    
    if (missingFields.length === 0) {
      addResult('Microclimate Data Structure', true, 'All required fields present');
    } else {
      addResult('Microclimate Data Structure', false, `Missing fields: ${missingFields.join(', ')}`, {
        missingFields,
        availableFields: Object.keys(microclimate.toObject ? microclimate.toObject() : microclimate)
      });
    }

    // Test isActive method
    if (typeof microclimate.isActive === 'function') {
      const isActive = microclimate.isActive();
      addResult('isActive Method', true, `isActive() returns: ${isActive}`);
    } else {
      addResult('isActive Method', false, 'isActive method not available');
    }

    return true;
  } catch (error) {
    addResult('Microclimate Data Structure', false, `Error testing structure: ${error}`, { error: error.message });
    return false;
  }
}

async function testLiveRouteDataTransformation(microclimate: any) {
  try {
    // Simulate the data transformation from the live route
    const transformedData = {
      id: microclimate._id.toString(),
      title: microclimate.title,
      status: microclimate.status,
      response_count: microclimate.response_count || 0,
      target_participant_count: microclimate.target_participant_count || 0,
      participation_rate: microclimate.participation_rate || 0,
      time_remaining: microclimate.isActive && typeof microclimate.isActive === 'function' && microclimate.isActive()
        ? Math.max(
            0,
            Math.floor(
              (microclimate.scheduling.start_time.getTime() +
                microclimate.scheduling.duration_minutes * 60 * 1000 -
                Date.now()) /
                (1000 * 60)
            )
          )
        : undefined,
      live_results: microclimate.live_results || {
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
      ai_insights: microclimate.ai_insights || [],
      questions: microclimate.questions?.map((q: any) => ({
        question: q.text,
        responses: q.options?.map((option: string, index: number) => ({
          option,
          count: microclimate.live_results?.response_distribution?.[`${q._id}_${index}`] || 0,
          percentage: microclimate.response_count > 0
            ? ((microclimate.live_results?.response_distribution?.[`${q._id}_${index}`] || 0) / microclimate.response_count) * 100
            : 0,
        })) || [],
        total_responses: microclimate.response_count || 0,
      })) || [],
    };

    addResult('Data Transformation', true, 'Successfully transformed microclimate data', {
      transformedKeys: Object.keys(transformedData),
      hasQuestions: transformedData.questions.length > 0,
      hasLiveResults: !!transformedData.live_results,
      hasAIInsights: transformedData.ai_insights.length > 0
    });

    return transformedData;
  } catch (error) {
    addResult('Data Transformation', false, `Error transforming data: ${error}`, { error: error.message });
    return null;
  }
}

async function runDiagnostics() {
  console.log('🔍 Debugging Microclimate Live Route Issues...\n');

  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('\n❌ Cannot proceed without database connection');
    return;
  }

  // Test microclimate model
  const modelWorking = await testMicroclimateModel();
  if (!modelWorking) {
    console.log('\n❌ Cannot proceed without working model');
    return;
  }

  // Find test microclimate
  const microclimate = await findTestMicroclimate();
  if (!microclimate) {
    console.log('\n❌ Cannot proceed without test microclimate');
    return;
  }

  // Test microclimate data structure
  await testMicroclimateDataStructure(microclimate);

  // Test data transformation
  const transformedData = await testLiveRouteDataTransformation(microclimate);

  // Summary
  console.log('\n📊 Diagnostic Summary:');
  console.log('=====================');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (microclimate && transformedData) {
    console.log('\n🎯 Test Microclimate Details:');
    console.log(`ID: ${microclimate._id}`);
    console.log(`Title: ${microclimate.title}`);
    console.log(`Status: ${microclimate.status}`);
    console.log(`Company ID: ${microclimate.company_id}`);
    console.log(`Live Route URL: /microclimates/${microclimate._id}/live`);
  }

  if (percentage >= 80) {
    console.log('\n✅ Route should be working. Check server logs for specific error details.');
  } else {
    console.log('\n❌ Found issues that may be causing the route to fail.');
  }

  // Close database connection
  await mongoose.connection.close();
}

// Run diagnostics
runDiagnostics().catch(console.error);
