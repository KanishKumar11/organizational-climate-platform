import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { CSVExportService } from '@/lib/csv-export-service';

/**
 * GET /api/users/export/csv
 * Export users list as CSV
 *
 * Only accessible to super_admin and company_admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Check permissions - only admins can export users
    const currentUser = await (User as any).findById(session.user.id);
    if (
      currentUser.role !== 'super_admin' &&
      currentUser.role !== 'company_admin'
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build query based on role
    let query: any = {};
    if (currentUser.role === 'company_admin') {
      query.company_id = currentUser.company_id;
    }

    // Fetch users
    const users = await (User as any)
      .find(query)
      .select(
        'name email role department position employee_id phone status created_at last_login demographics'
      )
      .lean();

    // Prepare CSV data
    const csvData = {
      users: users.map((user: any) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.demographics?.department || user.department || 'N/A',
        position: user.demographics?.position || user.position || 'N/A',
        employeeId: user.demographics?.employee_id || user.employee_id || 'N/A',
        phone: user.phone || 'N/A',
        status: user.status || 'active',
        createdAt: user.created_at,
        lastLogin: user.last_login || null,
      })),
    };

    // Generate CSV
    const csvService = new CSVExportService();
    const csvContent = csvService.exportUsers(csvData);

    // Return CSV file
    const timestamp = Date.now();
    const companySlug =
      currentUser.company_id?.name?.replace(/[^a-z0-9]/gi, '-').toLowerCase() ||
      'users';
    const filename = `${companySlug}-users-export-${timestamp}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting users to CSV:', error);
    return NextResponse.json(
      {
        error: 'Failed to export users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
