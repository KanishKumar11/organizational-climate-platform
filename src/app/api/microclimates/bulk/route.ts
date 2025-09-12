import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import { validatePermissions } from '@/lib/permissions';

// Bulk operations on microclimates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!validatePermissions(session.user.role, 'leader')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { operation, microclimate_ids, data } = body;

    // Validate input
    if (!operation || !microclimate_ids || !Array.isArray(microclimate_ids)) {
      return NextResponse.json(
        { error: 'Operation and microclimate_ids array are required' },
        { status: 400 }
      );
    }

    if (microclimate_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one microclimate ID is required' },
        { status: 400 }
      );
    }

    // Get microclimates and verify ownership
    const microclimates = await Microclimate.find({
      _id: { $in: microclimate_ids },
      company_id: session.user.companyId,
    });

    if (microclimates.length !== microclimate_ids.length) {
      return NextResponse.json(
        { error: 'Some microclimates not found or access denied' },
        { status: 404 }
      );
    }

    let results: any[] = [];

    switch (operation) {
      case 'delete':
        // Only allow deletion of draft or cancelled microclimates
        const deletableMicroclimates = microclimates.filter(
          (m) => m.status === 'draft' || m.status === 'cancelled'
        );

        if (deletableMicroclimates.length !== microclimates.length) {
          return NextResponse.json(
            { error: 'Only draft or cancelled microclimates can be deleted' },
            { status: 400 }
          );
        }

        await Microclimate.deleteMany({
          _id: { $in: microclimate_ids },
          status: { $in: ['draft', 'cancelled'] },
          company_id: session.user.companyId,
        });

        results = microclimate_ids.map((id) => ({
          microclimate_id: id,
          success: true,
          action: 'deleted',
        }));
        break;

      case 'cancel':
        // Cancel active or scheduled microclimates
        const cancellableMicroclimates = microclimates.filter(
          (m) => m.status === 'scheduled' || m.status === 'active'
        );

        for (const microclimate of cancellableMicroclimates) {
          microclimate.status = 'cancelled';
          microclimate.updated_at = new Date();

          if (!(microclimate as any).status_history) {
            (microclimate as any).status_history = [];
          }

          (microclimate as any).status_history.push({
            from_status: microclimate.status,
            to_status: 'cancelled',
            changed_by: session.user.id,
            changed_at: new Date(),
            reason: data?.reason || 'Bulk cancellation',
          });

          await microclimate.save();
        }

        results = microclimate_ids.map((id) => {
          const microclimate = microclimates.find(
            (m) => m._id.toString() === id
          );
          const wasCancellable =
            microclimate &&
            (microclimate.status === 'scheduled' ||
              microclimate.status === 'active');

          return {
            microclimate_id: id,
            success: wasCancellable,
            action: wasCancellable ? 'cancelled' : 'not_cancellable',
            message: wasCancellable
              ? 'Cancelled successfully'
              : 'Cannot cancel microclimate in current status',
          };
        });
        break;

      case 'update_scheduling':
        if (!data?.scheduling) {
          return NextResponse.json(
            {
              error:
                'Scheduling data is required for update_scheduling operation',
            },
            { status: 400 }
          );
        }

        // Only update draft microclimates
        const updatableMicroclimates = microclimates.filter(
          (m) => m.status === 'draft'
        );

        for (const microclimate of updatableMicroclimates) {
          if (data.scheduling.start_time) {
            microclimate.scheduling.start_time = new Date(
              data.scheduling.start_time
            );
          }
          if (data.scheduling.duration_minutes) {
            microclimate.scheduling.duration_minutes =
              data.scheduling.duration_minutes;
          }
          if (data.scheduling.timezone) {
            microclimate.scheduling.timezone = data.scheduling.timezone;
          }
          if (data.scheduling.auto_close !== undefined) {
            microclimate.scheduling.auto_close = data.scheduling.auto_close;
          }

          microclimate.updated_at = new Date();
          await microclimate.save();
        }

        results = microclimate_ids.map((id) => {
          const microclimate = microclimates.find(
            (m) => m._id.toString() === id
          );
          const wasUpdatable = microclimate && microclimate.status === 'draft';

          return {
            microclimate_id: id,
            success: wasUpdatable,
            action: wasUpdatable ? 'scheduling_updated' : 'not_updatable',
            message: wasUpdatable
              ? 'Scheduling updated successfully'
              : 'Can only update draft microclimates',
          };
        });
        break;

      case 'update_targeting':
        if (!data?.targeting) {
          return NextResponse.json(
            {
              error:
                'Targeting data is required for update_targeting operation',
            },
            { status: 400 }
          );
        }

        // Only update draft microclimates
        const targetingUpdatableMicroclimates = microclimates.filter(
          (m) => m.status === 'draft'
        );

        for (const microclimate of targetingUpdatableMicroclimates) {
          if (data.targeting.department_ids) {
            microclimate.targeting.department_ids =
              data.targeting.department_ids;
          }
          if (data.targeting.role_filters) {
            microclimate.targeting.role_filters = data.targeting.role_filters;
          }
          if (data.targeting.max_participants) {
            microclimate.targeting.max_participants =
              data.targeting.max_participants;
          }
          if (data.targeting.include_managers !== undefined) {
            microclimate.targeting.include_managers =
              data.targeting.include_managers;
          }

          microclimate.updated_at = new Date();
          await microclimate.save();
        }

        results = microclimate_ids.map((id) => {
          const microclimate = microclimates.find(
            (m) => m._id.toString() === id
          );
          const wasUpdatable = microclimate && microclimate.status === 'draft';

          return {
            microclimate_id: id,
            success: wasUpdatable,
            action: wasUpdatable ? 'targeting_updated' : 'not_updatable',
            message: wasUpdatable
              ? 'Targeting updated successfully'
              : 'Can only update draft microclimates',
          };
        });
        break;

      case 'duplicate':
        const duplicateResults = [];

        for (const microclimate of microclimates) {
          try {
            const duplicateData = {
              title: `${microclimate.title} (Copy)`,
              description: microclimate.description,
              template_id: microclimate.template_id,
              company_id: microclimate.company_id,
              created_by: session.user.id,
              targeting: microclimate.targeting,
              scheduling: {
                ...microclimate.scheduling,
                start_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
              },
              real_time_settings: microclimate.real_time_settings,
              questions: microclimate.questions,
              status: 'draft',
            };

            const duplicateMicroclimate = new Microclimate(duplicateData);
            await duplicateMicroclimate.save();

            duplicateResults.push({
              original_id: microclimate._id,
              duplicate_id: duplicateMicroclimate._id,
              success: true,
              action: 'duplicated',
            });
          } catch (error) {
            duplicateResults.push({
              original_id: microclimate._id,
              success: false,
              action: 'duplicate_failed',
              error: 'Failed to create duplicate',
            });
          }
        }

        results = duplicateResults;
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
      processed_count: microclimate_ids.length,
      results,
    });
  } catch (error) {
    console.error('Error performing bulk microclimate operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
