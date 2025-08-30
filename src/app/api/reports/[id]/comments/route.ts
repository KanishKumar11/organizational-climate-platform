import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reportSharingService } from '@/lib/report-sharing';
import { reportService } from '@/lib/report-service';
import { connectDB } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const { content, section, position, parentId } = await request.json();

    // Validate input
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Comment too long' }, { status: 400 });
    }

    // Check if user has access to this report
    const report = await reportService.getReport(id, session.user.id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Add the comment
    const comment = await reportSharingService.addComment(
      id,
      session.user.id,
      content.trim(),
      section,
      position,
      parentId
    );

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
      },
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    // Check if user has access to this report
    const report = await reportService.getReport(id, session.user.id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get comments for this report
    const comments = await reportSharingService.getComments(id);

    // Group comments by parent (for threading)
    const commentTree = comments.reduce(
      (acc, comment) => {
        if (!comment.parentId) {
          acc[comment.id] = { ...comment, replies: [] };
        } else {
          if (acc[comment.parentId]) {
            acc[comment.parentId].replies.push(comment);
          }
        }
        return acc;
      },
      {} as Record<string, any>
    );

    return NextResponse.json({
      comments: Object.values(commentTree),
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Failed to get comments' },
      { status: 500 }
    );
  }
}
