import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DemographicField from '@/models/DemographicField';
import Papa from 'papaparse';

interface ParsedRow {
  email: string;
  [key: string]: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only company admins and super admins can upload demographics
    if (!['company_admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const company_id = formData.get('company_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get available demographic fields for the company
    const demographicFields =
      await DemographicField.findActiveByCompany(company_id);
    const validFieldKeys = demographicFields.map((f: any) => f.field);

    // Read and parse CSV file
    const fileText = await file.text();

    return new Promise((resolve) => {
      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as ParsedRow[];
          const errors: string[] = [];
          const validRows: ParsedRow[] = [];
          const fieldsFound = new Set<string>();

          // Validate headers
          const headers = results.meta.fields || [];
          if (!headers.includes('email')) {
            resolve(
              NextResponse.json(
                { error: 'CSV must contain an "email" column' },
                { status: 400 }
              )
            );
            return;
          }

          // Track which demographic fields are present
          headers.forEach((header) => {
            if (header !== 'email' && validFieldKeys.includes(header)) {
              fieldsFound.add(header);
            }
          });

          if (fieldsFound.size === 0) {
            resolve(
              NextResponse.json(
                { error: 'No valid demographic fields found in CSV' },
                { status: 400 }
              )
            );
            return;
          }

          // Validate rows
          data.forEach((row, index) => {
            const rowNum = index + 2; // +2 for header and 1-based indexing

            // Check for email
            if (!row.email || !row.email.trim()) {
              errors.push(`Row ${rowNum}: Missing email`);
              return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row.email.trim())) {
              errors.push(`Row ${rowNum}: Invalid email format`);
              return;
            }

            // Validate demographic field values
            let hasError = false;
            fieldsFound.forEach((field) => {
              const value = row[field];
              const fieldConfig = demographicFields.find(
                (f: any) => f.field === field
              );

              if (
                fieldConfig &&
                fieldConfig.required &&
                (!value || !value.trim())
              ) {
                errors.push(`Row ${rowNum}: Missing required field "${field}"`);
                hasError = true;
              }

              if (
                fieldConfig &&
                fieldConfig.type === 'select' &&
                value &&
                value.trim()
              ) {
                if (!fieldConfig.options.includes(value.trim())) {
                  errors.push(
                    `Row ${rowNum}: Invalid value "${value}" for field "${field}". Must be one of: ${fieldConfig.options.join(', ')}`
                  );
                  hasError = true;
                }
              }
            });

            if (!hasError) {
              validRows.push(row);
            }
          });

          // Return preview
          resolve(
            NextResponse.json({
              success: true,
              totalRows: data.length,
              validRows: validRows.length,
              fieldsFound: Array.from(fieldsFound),
              errors: errors.slice(0, 50), // Limit to first 50 errors
              preview: validRows.slice(0, 5), // Show first 5 valid rows
            })
          );
        },
        error: (error) => {
          resolve(
            NextResponse.json(
              { error: `Failed to parse CSV: ${error.message}` },
              { status: 400 }
            )
          );
        },
      });
    });
  } catch (error) {
    console.error('Error previewing demographics upload:', error);
    return NextResponse.json(
      { error: 'Failed to preview demographics upload' },
      { status: 500 }
    );
  }
}
