import { NextRequest, NextResponse } from 'next/server';
import {
  createScopedHandler,
  applyScopingToQuery,
  ScopedRequest,
} from '../../../../middleware/data-scoping';
import { connectDB } from '../../../../lib/mongodb';
import Survey from '../../../../models/Survey';

// GET /api/surveys/scoped - Get surveys with automatic scoping
export const GET = createScopedHandler(
  'surveys',
  'read'
)(async (request: ScopedRequest) => {
  try {
    await connectDB();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const department = searchParams.get('department');

    // Build base query from request parameters
    const baseQuery: Record<string, any> = {};
    if (status) baseQuery.status = status;
    if (department) baseQuery.department_id = department;

    // Apply data scoping to the query
    const scopedResult = await applyScopingToQuery(
      request,
      'surveys',
      baseQuery,
      'read'
    );

    if (!scopedResult.allowed) {
      return NextResponse.json(
        { error: 'Access denied', reason: scopedResult.reason },
        { status: 403 }
      );
    }

    // Execute scoped query with pagination
    const skip = (page - 1) * limit;
    const surveys = await Survey.find(scopedResult.query)
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 })
      .lean();

    const total = await Survey.countDocuments(scopedResult.query);

    return NextResponse.json({
      surveys,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      scope_info: {
        user_role: request.scopeContext?.role,
        filters_applied: Object.keys(scopedResult.query).length,
        scoped_query: scopedResult.query,
      },
    });
  } catch (error) {
    console.error('Error fetching scoped surveys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/surveys/scoped - Create survey with scoping validation
export const POST = createScopedHandler(
  'surveys',
  'write'
)(async (request: ScopedRequest) => {
  try {
    await connectDB();

    const body = await request.json();

    // Validate that the user can create surveys in the specified scope
    const scopedResult = await applyScopingToQuery(
      request,
      'surveys',
      {},
      'write'
    );

    if (!scopedResult.allowed) {
      return NextResponse.json(
        { error: 'Access denied', reason: scopedResult.reason },
        { status: 403 }
      );
    }

    // Ensure the survey data complies with user's scope
    const surveyData = {
      ...body,
      company_id: request.scopeContext?.company_id,
      created_by: request.scopeContext?.user_id,
      created_at: new Date(),
    };

    // For department admins, ensure they can only create surveys for their department
    if (request.scopeContext?.role === 'department_admin') {
      surveyData.department_id = request.scopeContext.department_id;
    }

    const survey = new Survey(surveyData);
    await survey.save();

    return NextResponse.json(
      {
        message: 'Survey created successfully',
        survey: survey.toObject(),
        scope_info: {
          user_role: request.scopeContext?.role,
          enforced_scope: {
            company_id: surveyData.company_id,
            department_id: surveyData.department_id,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating scoped survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


