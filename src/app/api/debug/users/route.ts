import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all users with their emails (for debugging)
    const users = await User.find({}, { email: 1, name: 1, _id: 1 }).limit(10);

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        id: user._id,
        email: user.email,
        name: user.name,
      })),
      count: users.length,
    });
  } catch (error) {
    console.error('Debug users error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
