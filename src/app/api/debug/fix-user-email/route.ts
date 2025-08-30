import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { correctEmail } = await request.json();

    if (!correctEmail) {
      return NextResponse.json(
        { success: false, error: 'correctEmail is required' },
        { status: 400 }
      );
    }

    // Direct MongoDB update to fix the corrupted email
    const mongoose = require('mongoose');

    // Find the user with masked email pattern
    const maskedUser = await mongoose.connection.db
      .collection('users')
      .findOne({
        email: { $regex: /k\*+h@g\*+l\.com/ },
      });

    if (!maskedUser) {
      return NextResponse.json({
        success: false,
        error: 'No user found with masked email pattern',
      });
    }

    // Update the email to the correct value
    const result = await mongoose.connection.db
      .collection('users')
      .updateOne(
        { _id: maskedUser._id },
        { $set: { email: correctEmail.toLowerCase() } }
      );

    return NextResponse.json({
      success: true,
      message: 'User email fixed',
      userId: maskedUser._id,
      oldEmail: maskedUser.email,
      newEmail: correctEmail.toLowerCase(),
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Fix user email error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


