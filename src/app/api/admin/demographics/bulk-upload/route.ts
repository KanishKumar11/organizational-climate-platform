import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import DemographicField from '@/models/DemographicField';
import { connectToDatabase } from '@/lib/mongodb';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

// POST /api/admin/demographics/bulk-upload
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('companyId') as string;

    if (!file || !companyId) {
      return NextResponse.json(
        { error: 'File and companyId are required' },
        { status: 400 }
      );
    }

    // Check permissions
    const userRole = session.user.role;
    if (userRole !== 'super_admin' && session.user.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV and Excel files are allowed.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get demographic fields for the company
    const demographicFields = await DemographicField.findByCompany(companyId);
    const fieldMap = new Map(demographicFields.map((f) => [f.field, f]));

    // Parse file
    const fileBuffer = await file.arrayBuffer();
    let records: any[] = [];

    if (file.type === 'text/csv') {
      const csvText = new TextDecoder().decode(fileBuffer);
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json(worksheet);
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No data found in file' },
        { status: 400 }
      );
    }

    // Validate headers and data
    const firstRecord = records[0];
    const requiredHeaders = ['email']; // email is required to identify users

    for (const header of requiredHeaders) {
      if (!(header in firstRecord)) {
        return NextResponse.json(
          { error: `Required column '${header}' not found in file` },
          { status: 400 }
        );
      }
    }

    // Process records
    const results = {
      processed: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because of 0-index and header row

      try {
        const email = record.email?.toString().trim().toLowerCase();
        if (!email) {
          results.errors.push(`Row ${rowNumber}: Email is required`);
          continue;
        }

        // Find user
        const user = await User.findOne({
          email: email,
          company_id: companyId,
        });

        if (!user) {
          results.errors.push(
            `Row ${rowNumber}: User with email ${email} not found in company`
          );
          continue;
        }

        // Build demographics object
        const demographics: Record<string, any> = {};

        for (const [fieldName, fieldConfig] of fieldMap) {
          const value = record[fieldName];

          if (value !== undefined && value !== null && value !== '') {
            const stringValue = value.toString().trim();

            // Validate based on field type
            if (fieldConfig.type === 'select') {
              if (!fieldConfig.options?.includes(stringValue)) {
                results.errors.push(
                  `Row ${rowNumber}: Invalid value '${stringValue}' for field '${fieldName}'. Must be one of: ${fieldConfig.options?.join(', ')}`
                );
                continue;
              }
              demographics[fieldName] = stringValue;
            } else if (fieldConfig.type === 'number') {
              const numValue = parseFloat(stringValue);
              if (isNaN(numValue)) {
                results.errors.push(
                  `Row ${rowNumber}: Invalid number value '${stringValue}' for field '${fieldName}'`
                );
                continue;
              }
              demographics[fieldName] = numValue;
            } else if (fieldConfig.type === 'date') {
              const dateValue = new Date(stringValue);
              if (isNaN(dateValue.getTime())) {
                results.errors.push(
                  `Row ${rowNumber}: Invalid date value '${stringValue}' for field '${fieldName}'`
                );
                continue;
              }
              demographics[fieldName] = dateValue;
            } else {
              // text
              demographics[fieldName] = stringValue;
            }
          }
        }

        // Update user demographics
        user.demographics = { ...user.demographics, ...demographics };
        await user.save();

        results.processed++;
        results.updated++;
      } catch (error) {
        results.errors.push(
          `Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error processing bulk demographics upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
