import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const testEmail = 'keenkanish@gmail.com';

    // Test 1: Direct MongoDB query
    const mongoose = require('mongoose');
    const directResult = await mongoose.connection.db
      .collection('users')
      .findOne({
        email: testEmail.toLowerCase(),
      });

    // Test 2: Mongoose query without skipPrivacy
    const mongooseResult = await User.findOne({
      email: testEmail.toLowerCase(),
    });

    // Test 3: Mongoose query with skipPrivacy
    const mongooseSkipPrivacyResult = await User.findOne(
      {
        email: testEmail.toLowerCase(),
      },
      null,
      { skipPrivacy: true }
    );

    return NextResponse.json({
      success: true,
      testEmail: testEmail.toLowerCase(),
      results: {
        direct: directResult
          ? {
              _id: directResult._id,
              email: directResult.email,
              name: directResult.name,
            }
          : null,
        mongoose: mongooseResult
          ? {
              _id: mongooseResult._id,
              email: mongooseResult.email,
              name: mongooseResult.name,
            }
          : null,
        mongooseSkipPrivacy: mongooseSkipPrivacyResult
          ? {
              _id: mongooseSkipPrivacyResult._id,
              email: mongooseSkipPrivacyResult.email,
              name: mongooseSkipPrivacyResult.name,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Test user query error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
