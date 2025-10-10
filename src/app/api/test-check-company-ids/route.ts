import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import Company from '@/models/Company';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all companies
    const companies = await Company.find({}).lean();

    // Get all surveys
    const surveys = await Survey.find({}).lean();

    // Get all responses
    const responses = await Response.find({}).lean();

    console.log(
      'Company IDs:',
      companies.map((c) => ({ id: c._id, name: c.name }))
    );
    console.log(
      'Survey company IDs:',
      surveys.map((s) => ({
        id: s._id,
        title: s.title,
        company_id: s.company_id,
      }))
    );
    console.log(
      'Response company IDs:',
      responses.map((r) => ({ id: r._id, company_id: r.company_id }))
    );

    return NextResponse.json({
      success: true,
      data: {
        companies: companies.map((c) => ({ id: c._id, name: c.name })),
        surveys: surveys.map((s) => ({
          id: s._id,
          title: s.title,
          company_id: s.company_id,
        })),
        responses: responses.map((r) => ({
          id: r._id,
          company_id: r.company_id,
        })),
      },
    });
  } catch (error) {
    console.error('Check company IDs error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check company IDs',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
