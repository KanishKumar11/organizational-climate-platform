import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Direct MongoDB query to bypass all Mongoose middleware
    const mongoose = require('mongoose');
    const users = await mongoose.connection.db
      .collection('users')
      .find({})
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        _id: user._id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      })),
    });
  } catch (error) {
    console.error('Raw users query error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
