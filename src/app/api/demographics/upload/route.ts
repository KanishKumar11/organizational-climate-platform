import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DemographicField from '@/models/DemographicField';
import User from '@/models/User';
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
        complete: async (results) => {
          try {
            const data = results.data as ParsedRow[];
            const errors: string[] = [];
            let updatedCount = 0;
            let notFoundCount = 0;

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
            const fieldsFound = headers.filter(
              (h) => h !== 'email' && validFieldKeys.includes(h)
            );

            if (fieldsFound.length === 0) {
              resolve(
                NextResponse.json(
                  { error: 'No valid demographic fields found in CSV' },
                  { status: 400 }
                )
              );
              return;
            }

            // Process each row
            for (let i = 0; i < data.length; i++) {
              const row = data[i];
              const rowNum = i + 2;

              // Validate email
              if (!row.email || !row.email.trim()) {
                errors.push(`Row ${rowNum}: Missing email`);
                continue;
              }

              const email = row.email.trim().toLowerCase();

              // Find user by email and company
              const user = await User.findOne({
                email,
                company_id,
              });

              if (!user) {
                notFoundCount++;
                errors.push(
                  `Row ${rowNum}: User not found with email "${email}" in this company`
                );
                continue;
              }

              // Build demographics object
              const demographics: Record<string, string> = {};
              let hasValidData = false;

              fieldsFound.forEach((field) => {
                const value = row[field];
                if (value && value.trim()) {
                  demographics[field] = value.trim();
                  hasValidData = true;
                }
              });

              if (!hasValidData) {
                errors.push(
                  `Row ${rowNum}: No valid demographic data to update`
                );
                continue;
              }

              // Update user demographics
              user.demographics = {
                ...user.demographics,
                ...demographics,
              };

              await user.save();
              updatedCount++;
            }

            resolve(
              NextResponse.json({
                success: true,
                updatedCount,
                notFoundCount,
                totalProcessed: data.length,
                fieldsUpdated: fieldsFound,
                errors: errors.slice(0, 50), // Limit to first 50 errors
              })
            );
          } catch (error) {
            console.error('Error processing demographics:', error);
            resolve(
              NextResponse.json(
                { error: 'Failed to process demographics data' },
                { status: 500 }
              )
            );
          }
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
    console.error('Error uploading demographics:', error);
    return NextResponse.json(
      { error: 'Failed to upload demographics' },
      { status: 500 }
    );
  }
}
