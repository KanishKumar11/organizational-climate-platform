import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Create a simple test schema with Mixed types
    const TestSchema = new mongoose.Schema(
      {
        title: { type: String, required: true },
        metadata: { type: mongoose.Schema.Types.Mixed },
        metrics: { type: mongoose.Schema.Types.Mixed },
      },
      { timestamps: true }
    );

    const TestModel = mongoose.model('TestReport', TestSchema);

    // Create a new document
    const testDoc = new TestModel({
      title: 'Mixed Schema Test',
      metadata: {
        responseCount: 5,
        totalSurveys: 1,
        totalResponses: 5,
        averageCompletionTime: 300,
      },
      metrics: {
        engagementScore: 75.5,
        responseRate: 85.0,
        satisfaction: 8.2,
        completionRate: 95.0,
        participationRate: 80.0,
      },
    });

    console.log('Before save:', {
      title: testDoc.title,
      hasMetadata: !!testDoc.metadata,
      hasMetrics: !!testDoc.metrics,
      metadata: testDoc.metadata,
      metrics: testDoc.metrics,
    });

    const savedDoc = await testDoc.save();
    console.log('After save:', {
      id: savedDoc._id,
      title: savedDoc.title,
      hasMetadata: !!savedDoc.metadata,
      hasMetrics: !!savedDoc.metrics,
      metadata: savedDoc.metadata,
      metrics: savedDoc.metrics,
    });

    // Fetch again to verify
    const fetchedDoc = await TestModel.findById(savedDoc._id).lean();
    console.log('After fetch:', {
      id: fetchedDoc._id,
      title: fetchedDoc.title,
      hasMetadata: !!fetchedDoc.metadata,
      hasMetrics: !!fetchedDoc.metrics,
      metadata: fetchedDoc.metadata,
      metrics: fetchedDoc.metrics,
    });

    // Clean up
    await TestModel.deleteOne({ _id: savedDoc._id });

    return NextResponse.json({
      success: true,
      message: 'Mixed schema test completed',
      data: {
        reportId: fetchedDoc._id,
        title: fetchedDoc.title,
        hasMetadata: !!fetchedDoc.metadata,
        hasMetrics: !!fetchedDoc.metrics,
        metadata: fetchedDoc.metadata,
        metrics: fetchedDoc.metrics,
      },
    });
  } catch (error) {
    console.error('Mixed schema test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test mixed schema',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
