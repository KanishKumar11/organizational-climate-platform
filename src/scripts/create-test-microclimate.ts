#!/usr/bin/env tsx

/**
 * Create a test microclimate for debugging the live route
 */

import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import User from '@/models/User';
import Department from '@/models/Department';
import mongoose from 'mongoose';

async function createTestMicroclimate() {
  try {
    console.log('🔧 Creating test microclimate...\n');

    await connectDB();

    // Find a test user and company
    const testUser = await User.findOne().populate('company_id');
    if (!testUser) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`✅ Found test user: ${testUser.name} (${testUser.email})`);
    console.log(`✅ Company: ${testUser.company_id}`);

    // Find a department for targeting
    const department = await Department.findOne({ company_id: testUser.company_id });
    if (!department) {
      console.log('❌ No departments found. Creating a test department...');
      
      const testDepartment = new Department({
        name: 'Test Department',
        description: 'Test department for microclimate testing',
        company_id: testUser.company_id,
        hierarchy: {
          level: 0,
          path: 'test-department',
          parent_department_id: null
        },
        created_by: testUser._id
      });
      
      await testDepartment.save();
      console.log(`✅ Created test department: ${testDepartment.name}`);
    }

    const targetDepartment = department || await Department.findOne({ company_id: testUser.company_id });

    // Create test microclimate
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - 30); // Started 30 minutes ago

    const testMicroclimate = new Microclimate({
      title: 'Test Live Microclimate Dashboard',
      description: 'Test microclimate for debugging the live dashboard route',
      company_id: testUser.company_id,
      created_by: testUser._id,
      status: 'active',
      
      // Scheduling
      scheduling: {
        start_time: startTime,
        duration_minutes: 120, // 2 hours
        timezone: 'UTC'
      },

      // Targeting
      targeting: {
        department_ids: [targetDepartment._id.toString()],
        role_levels: ['employee', 'supervisor', 'leader'],
        include_subdepartments: true,
        max_participants: 50
      },

      // Questions
      questions: [
        {
          text: 'How would you describe the current team atmosphere?',
          type: 'multiple_choice',
          options: ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'],
          required: true
        },
        {
          text: 'What is your current stress level?',
          type: 'multiple_choice', 
          options: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
          required: true
        },
        {
          text: 'Any additional thoughts about the current work environment?',
          type: 'open_text',
          required: false
        }
      ],

      // Initial data
      response_count: 12,
      target_participant_count: 45,
      participation_rate: 27,

      // Live results with sample data
      live_results: {
        word_cloud_data: [
          { text: 'positive', value: 8 },
          { text: 'collaborative', value: 6 },
          { text: 'stressful', value: 4 },
          { text: 'productive', value: 7 },
          { text: 'supportive', value: 5 },
          { text: 'challenging', value: 3 },
          { text: 'innovative', value: 4 },
          { text: 'busy', value: 6 }
        ],
        sentiment_score: 0.3,
        sentiment_distribution: {
          positive: 58,
          neutral: 25,
          negative: 17
        },
        engagement_level: 'medium',
        response_distribution: {
          'q1_0': 3, // Very Positive
          'q1_1': 4, // Positive  
          'q1_2': 3, // Neutral
          'q1_3': 1, // Negative
          'q1_4': 1, // Very Negative
          'q2_0': 2, // Very Low stress
          'q2_1': 3, // Low stress
          'q2_2': 4, // Moderate stress
          'q2_3': 2, // High stress
          'q2_4': 1  // Very High stress
        },
        top_themes: ['collaboration', 'workload', 'team dynamics', 'communication']
      },

      // AI insights
      ai_insights: [
        {
          type: 'pattern',
          message: 'Team shows positive sentiment but moderate stress levels indicate potential workload concerns.',
          confidence: 0.85,
          timestamp: new Date(),
          priority: 'medium'
        },
        {
          type: 'recommendation', 
          message: 'Consider scheduling team check-ins to address workload distribution.',
          confidence: 0.78,
          timestamp: new Date(),
          priority: 'low'
        }
      ]
    });

    await testMicroclimate.save();

    console.log('\n🎉 Test microclimate created successfully!');
    console.log('=====================================');
    console.log(`ID: ${testMicroclimate._id}`);
    console.log(`Title: ${testMicroclimate.title}`);
    console.log(`Status: ${testMicroclimate.status}`);
    console.log(`Company: ${testUser.company_id}`);
    console.log(`Target Department: ${targetDepartment.name}`);
    console.log(`Response Count: ${testMicroclimate.response_count}`);
    console.log(`Participation Rate: ${testMicroclimate.participation_rate}%`);
    console.log('\n🔗 Live Dashboard URL:');
    console.log(`/microclimates/${testMicroclimate._id}/live`);
    
    console.log('\n✅ You can now test the live microclimate dashboard route!');

  } catch (error) {
    console.error('❌ Error creating test microclimate:', error);
  } finally {
    await mongoose.connection.close();
  }
}

createTestMicroclimate();
