import { IQuestion } from '@/models/Survey';
import { IQuestionResponse } from '@/models/Response';

/**
 * Export utilities for Binary (Yes/No) questions with conditional comments
 *
 * Handles formatting of binary questions in exports with dedicated comment columns
 */

export interface BinaryQuestionExportColumn {
  questionId: string;
  questionText: string;
  responseColumn: string; // "Yes" or "No"
  commentColumn: string; // Comment text or empty
}

/**
 * Format binary question response for CSV/Excel export
 *
 * Returns two columns:
 * 1. Question response ("Yes" or "No")
 * 2. Comment (if Yes was selected and comment exists)
 *
 * @param question - The survey question
 * @param response - The user's response
 * @returns Formatted columns for export
 */
export function formatBinaryQuestionForExport(
  question: IQuestion,
  response: IQuestionResponse | undefined
): BinaryQuestionExportColumn {
  if (!response) {
    return {
      questionId: question.id,
      questionText: question.text,
      responseColumn: '',
      commentColumn: '',
    };
  }

  const responseValue = response.response_value === true ? 'Yes' : 'No';
  const commentValue =
    response.response_value === true && response.response_text
      ? response.response_text
      : '';

  return {
    questionId: question.id,
    questionText: question.text,
    responseColumn: responseValue,
    commentColumn: commentValue,
  };
}

/**
 * Get CSV headers for binary question
 *
 * @param question - The survey question
 * @returns Array of header strings
 */
export function getBinaryQuestionHeaders(question: IQuestion): string[] {
  const headers = [question.text];

  // Add comment column header if comment is enabled
  if (question.binary_comment_config?.enabled) {
    const commentLabel = question.binary_comment_config.label || 'Comment';
    headers.push(`${question.text} - ${commentLabel}`);
  }

  return headers;
}

/**
 * Get CSV row values for binary question response
 *
 * @param question - The survey question
 * @param response - The user's response
 * @returns Array of values matching the headers
 */
export function getBinaryQuestionRowValues(
  question: IQuestion,
  response: IQuestionResponse | undefined
): string[] {
  const formatted = formatBinaryQuestionForExport(question, response);
  const values = [formatted.responseColumn];

  // Add comment value if comment column exists
  if (question.binary_comment_config?.enabled) {
    values.push(formatted.commentColumn);
  }

  return values;
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
export function escapeCsvValue(value: string): string {
  if (!value) return '';

  // Check if value contains special characters that require quoting
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape double quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return value;
}

/**
 * Convert binary question responses to CSV format
 *
 * @param questions - Array of survey questions
 * @param responses - Array of user responses
 * @returns CSV string with headers and data rows
 */
export function exportBinaryQuestionsToCsv(
  questions: IQuestion[],
  responsesData: Array<{ responses: IQuestionResponse[]; user_email?: string }>
): string {
  const binaryQuestions = questions.filter((q) => q.type === 'yes_no');

  if (binaryQuestions.length === 0) {
    return '';
  }

  // Build headers
  const headers: string[] = ['User'];
  binaryQuestions.forEach((question) => {
    headers.push(...getBinaryQuestionHeaders(question));
  });

  // Build rows
  const rows: string[][] = [];
  responsesData.forEach((data) => {
    const row: string[] = [data.user_email || 'Anonymous'];

    binaryQuestions.forEach((question) => {
      const response = data.responses.find(
        (r) => r.question_id === question.id
      );
      row.push(...getBinaryQuestionRowValues(question, response));
    });

    rows.push(row);
  });

  // Convert to CSV string
  const csvLines: string[] = [];

  // Add header row
  csvLines.push(headers.map(escapeCsvValue).join(','));

  // Add data rows
  rows.forEach((row) => {
    csvLines.push(row.map(escapeCsvValue).join(','));
  });

  return csvLines.join('\n');
}

/**
 * Example usage in export API:
 *
 * ```typescript
 * // In /api/surveys/[id]/export/route.ts
 *
 * const survey = await Survey.findById(surveyId);
 * const responses = await Response.find({ survey_id: surveyId });
 *
 * const responsesWithUser = await Promise.all(
 *   responses.map(async (response) => {
 *     const user = response.user_id
 *       ? await User.findById(response.user_id)
 *       : null;
 *
 *     return {
 *       responses: response.responses,
 *       user_email: user?.email,
 *     };
 *   })
 * );
 *
 * const csvContent = exportBinaryQuestionsToCsv(
 *   survey.questions,
 *   responsesWithUser
 * );
 *
 * // Return CSV file
 * return new Response(csvContent, {
 *   headers: {
 *     'Content-Type': 'text/csv',
 *     'Content-Disposition': `attachment; filename="survey-${surveyId}.csv"`,
 *   },
 * });
 * ```
 */
