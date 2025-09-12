import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';

// Search surveys
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const createdBy = searchParams.get('created_by');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery: any = {};

    // Company scoping
    if (session.user.companyId) {
      searchQuery.company_id = session.user.companyId;
    } else if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'User not associated with a company' },
        { status: 403 }
      );
    }

    // Department scoping for department admins
    if (session.user.role === 'department_admin' && session.user.departmentId) {
      searchQuery.department_ids = session.user.departmentId;
    }

    // Text search
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'questions.text': { $regex: query, $options: 'i' } },
      ];
    }

    // Filters
    if (type) {
      searchQuery.type = type;
    }

    if (status) {
      if (status.includes(',')) {
        searchQuery.status = { $in: status.split(',') };
      } else {
        searchQuery.status = status;
      }
    }

    if (department) {
      searchQuery.department_ids = department;
    }

    if (dateFrom || dateTo) {
      searchQuery.created_at = {};
      if (dateFrom) {
        searchQuery.created_at.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        searchQuery.created_at.$lte = new Date(dateTo);
      }
    }

    if (createdBy) {
      searchQuery.created_by = createdBy;
    }

    // Execute search
    const surveys = await Survey.find(searchQuery)
      .select(
        'title description type status start_date end_date created_by created_at response_count target_audience_count'
      )
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('created_by', 'name email');

    const total = await Survey.countDocuments(searchQuery);

    // Add computed fields
    const enrichedSurveys = surveys.map((survey) => {
      const surveyObj = survey.toObject();
      return {
        ...surveyObj,
        completion_rate:
          surveyObj.target_audience_count > 0
            ? Math.round(
                (surveyObj.response_count / surveyObj.target_audience_count) *
                  100
              )
            : 0,
        is_active:
          survey.status === 'active' &&
          new Date() >= survey.start_date &&
          new Date() <= survey.end_date,
        days_remaining:
          survey.status === 'active'
            ? Math.max(
                0,
                Math.ceil(
                  (survey.end_date.getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              )
            : null,
      };
    });

    // Search suggestions based on query
    let suggestions: string[] = [];
    if (query && query.length >= 2) {
      const suggestionQuery = { ...searchQuery };
      delete suggestionQuery.$or;

      const titleSuggestions = await Survey.find({
        ...suggestionQuery,
        title: { $regex: query, $options: 'i' },
      })
        .select('title')
        .limit(5);

      suggestions = titleSuggestions.map((s) => s.title);
    }

    return NextResponse.json({
      surveys: enrichedSurveys,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      search: {
        query,
        filters: {
          type,
          status,
          department,
          date_from: dateFrom,
          date_to: dateTo,
          created_by: createdBy,
        },
        suggestions,
      },
    });
  } catch (error) {
    console.error('Error searching surveys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
