import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Survey from '@/models/Survey';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get surveys assigned to the current user (for employees)
    const surveys = await Survey.find({
      $or: [
        { assigned_users: session.user.id },
        { target_departments: session.user.departmentId },
        { company_id: session.user.companyId, status: 'active' },
      ],
    })
      .populate('created_by', 'name email')
      .sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      surveys,
      total: surveys.length,
    });
  } catch (error) {
    console.error('Error fetching user surveys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    );
  }
}
