import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/demographics/template/csv
 * Download demographics CSV template for bulk import
 */
export async function GET() {
  try {
    // CSV template with headers and sample row
    const csvContent = `Name,Email,Department,Position,Employee ID,Age Range,Gender,Tenure,Education Level,Employment Type
John Doe,john.doe@example.com,Engineering,Senior Developer,EMP001,30-39,Male,3-5 years,Bachelor's Degree,Full-time
Jane Smith,jane.smith@example.com,Marketing,Marketing Manager,EMP002,40-49,Female,5+ years,Master's Degree,Full-time`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': 'attachment; filename="demographics-template.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating demographics template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
