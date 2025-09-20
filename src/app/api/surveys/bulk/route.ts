import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import { hasPermission } from '@/lib/permissions';
import {
  validateDateRange,
  DATETIME_ERROR_MESSAGES,
} from '@/lib/datetime-utils';

// Bulk operations on surveys
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'company_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { operation, survey_ids, data } = body;

    // Validate input
    if (!operation || !survey_ids || !Array.isArray(survey_ids)) {
      return NextResponse.json(
        { error: 'Operation and survey_ids array are required' },
        { status: 400 }
      );
    }

    if (survey_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one survey ID is required' },
        { status: 400 }
      );
    }

    // Get surveys and verify ownership
    const surveys = await Survey.find({
      _id: { $in: survey_ids },
      company_id: session.user.companyId,
    });

    if (surveys.length !== survey_ids.length) {
      return NextResponse.json(
        { error: 'Some surveys not found or access denied' },
        { status: 404 }
      );
    }

    let results: any[] = [];

    switch (operation) {
      case 'delete':
        // Only allow deletion of draft surveys
        const draftSurveys = surveys.filter((s) => s.status === 'draft');
        if (draftSurveys.length !== surveys.length) {
          return NextResponse.json(
            { error: 'Only draft surveys can be deleted' },
            { status: 400 }
          );
        }

        await Survey.deleteMany({
          _id: { $in: survey_ids },
          status: 'draft',
          company_id: session.user.companyId,
        });

        results = survey_ids.map((id) => ({
          survey_id: id,
          success: true,
          action: 'deleted',
        }));
        break;

      case 'archive':
        await Survey.updateMany(
          {
            _id: { $in: survey_ids },
            company_id: session.user.companyId,
          },
          {
            $set: {
              status: 'archived',
              updated_at: new Date(),
            },
          }
        );

        results = survey_ids.map((id) => ({
          survey_id: id,
          success: true,
          action: 'archived',
        }));
        break;

      case 'update_status':
        if (!data?.status) {
          return NextResponse.json(
            { error: 'Status is required for update_status operation' },
            { status: 400 }
          );
        }

        const validStatuses = [
          'draft',
          'active',
          'paused',
          'completed',
          'archived',
        ];
        if (!validStatuses.includes(data.status)) {
          return NextResponse.json(
            { error: 'Invalid status' },
            { status: 400 }
          );
        }

        // Validate status transitions for each survey
        const updateResults = [];
        for (const survey of surveys) {
          const validTransitions: Record<string, string[]> = {
            draft: ['active', 'archived'],
            active: ['paused', 'completed', 'archived'],
            paused: ['active', 'completed', 'archived'],
            completed: ['archived'],
            archived: [],
          };

          if (validTransitions[survey.status]?.includes(data.status)) {
            survey.status = data.status;
            survey.updated_at = new Date();
            await survey.save();

            updateResults.push({
              survey_id: survey._id,
              success: true,
              action: 'status_updated',
              new_status: data.status,
            });
          } else {
            updateResults.push({
              survey_id: survey._id,
              success: false,
              action: 'status_update_failed',
              error: `Cannot transition from ${survey.status} to ${data.status}`,
            });
          }
        }

        results = updateResults;
        break;

      case 'update_dates':
        if (!data?.start_date || !data?.end_date) {
          return NextResponse.json(
            {
              error:
                'start_date and end_date are required for update_dates operation',
            },
            { status: 400 }
          );
        }

        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);

        // Use centralized date range validation
        const dateRangeValidation = validateDateRange(startDate, endDate);
        if (!dateRangeValidation.isValid) {
          return NextResponse.json(
            {
              error: 'Invalid date range',
              message: dateRangeValidation.error,
              errorCode: dateRangeValidation.errorCode,
            },
            { status: 400 }
          );
        }

        await Survey.updateMany(
          {
            _id: { $in: survey_ids },
            company_id: session.user.companyId,
            status: { $in: ['draft', 'active'] }, // Only update non-completed surveys
          },
          {
            $set: {
              start_date: startDate,
              end_date: endDate,
              updated_at: new Date(),
            },
          }
        );

        results = survey_ids.map((id) => ({
          survey_id: id,
          success: true,
          action: 'dates_updated',
          new_start_date: startDate,
          new_end_date: endDate,
        }));
        break;

      case 'assign_departments':
        if (!data?.department_ids || !Array.isArray(data.department_ids)) {
          return NextResponse.json(
            {
              error:
                'department_ids array is required for assign_departments operation',
            },
            { status: 400 }
          );
        }

        await Survey.updateMany(
          {
            _id: { $in: survey_ids },
            company_id: session.user.companyId,
          },
          {
            $set: {
              department_ids: data.department_ids,
              updated_at: new Date(),
            },
          }
        );

        results = survey_ids.map((id) => ({
          survey_id: id,
          success: true,
          action: 'departments_assigned',
          department_ids: data.department_ids,
        }));
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      processed_count: survey_ids.length,
      results,
    });
  } catch (error) {
    console.error('Error performing bulk survey operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
