/**
 * CSV Export Service
 *
 * Comprehensive CSV generation for surveys, responses, users, and analytics data
 * Uses papaparse for robust CSV handling
 */

import Papa from 'papaparse';

// Type definitions
export interface CSVExportOptions {
  delimiter?: string;
  header?: boolean;
  quotes?: boolean;
  newline?: string;
}

export interface SurveyCSVData {
  surveyId: string;
  surveyTitle: string;
  surveyType: string;
  responses: Array<{
    responseId: string;
    userId: string;
    userName: string;
    userEmail: string;
    department?: string;
    position?: string;
    submittedAt: Date;
    timeToComplete?: number;
    answers: Array<{
      questionId: string;
      questionText: string;
      questionType: string;
      answer: any;
      answerText?: string;
      score?: number;
    }>;
    demographics?: Record<string, string>;
  }>;
}

export interface MicroclimateCSVData {
  microclimateId: string;
  microclimateTitle: string;
  responses: Array<{
    responseId: string;
    userId: string;
    userName: string;
    submittedAt: Date;
    answers: Array<{
      questionId: string;
      questionText: string;
      answer: any;
    }>;
  }>;
}

export interface UserCSVData {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    position?: string;
    employeeId?: string;
    phone?: string;
    status: string;
    createdAt: Date;
    lastLogin?: Date;
  }>;
}

/**
 * CSV Export Service Class
 */
export class CSVExportService {
  private options: CSVExportOptions;

  constructor(options: CSVExportOptions = {}) {
    this.options = {
      delimiter: options.delimiter || ',',
      header: options.header !== false,
      quotes: options.quotes !== false,
      newline: options.newline || '\r\n',
    };
  }

  /**
   * Export Survey Responses to CSV
   * Creates a flat structure with one row per response
   */
  exportSurveyResponses(data: SurveyCSVData): string {
    const flattenedData: any[] = [];

    data.responses.forEach((response) => {
      const baseRow = {
        'Response ID': response.responseId,
        'Survey ID': data.surveyId,
        'Survey Title': data.surveyTitle,
        'Survey Type': data.surveyType,
        'User ID': response.userId,
        'User Name': response.userName,
        'User Email': response.userEmail,
        Department: response.department || 'N/A',
        Position: response.position || 'N/A',
        'Submitted At': this.formatDate(response.submittedAt),
        'Time to Complete (min)': response.timeToComplete
          ? (response.timeToComplete / 60).toFixed(1)
          : 'N/A',
      };

      // Add demographics
      if (response.demographics) {
        Object.entries(response.demographics).forEach(([key, value]) => {
          baseRow[`Demo: ${key}`] = value;
        });
      }

      // Add answers
      response.answers.forEach((answer, index) => {
        baseRow[`Q${index + 1} ID`] = answer.questionId;
        baseRow[`Q${index + 1} Question`] = answer.questionText;
        baseRow[`Q${index + 1} Type`] = answer.questionType;
        baseRow[`Q${index + 1} Answer`] = this.formatAnswer(answer.answer);
        if (answer.score !== undefined) {
          baseRow[`Q${index + 1} Score`] = answer.score;
        }
      });

      flattenedData.push(baseRow);
    });

    return this.convertToCSV(flattenedData);
  }

  /**
   * Export Survey Responses (Wide Format)
   * One column per question for easier analysis
   */
  exportSurveyResponsesWide(data: SurveyCSVData): string {
    if (data.responses.length === 0) {
      return 'No responses to export';
    }

    // Get all unique questions
    const questions = data.responses[0].answers.map((a) => ({
      id: a.questionId,
      text: a.questionText,
      type: a.questionType,
    }));

    const flattenedData = data.responses.map((response) => {
      const row: any = {
        'Response ID': response.responseId,
        'User Name': response.userName,
        'User Email': response.userEmail,
        Department: response.department || 'N/A',
        Position: response.position || 'N/A',
        'Submitted At': this.formatDate(response.submittedAt),
      };

      // Add demographics
      if (response.demographics) {
        Object.entries(response.demographics).forEach(([key, value]) => {
          row[key] = value;
        });
      }

      // Add answers
      response.answers.forEach((answer) => {
        const questionIndex = questions.findIndex(
          (q) => q.id === answer.questionId
        );
        const qNum = questionIndex !== -1 ? questionIndex + 1 : '?';
        row[`Q${qNum}: ${this.truncate(answer.questionText, 50)}`] =
          this.formatAnswer(answer.answer);
      });

      return row;
    });

    return this.convertToCSV(flattenedData);
  }

  /**
   * Export Survey Summary Statistics
   */
  exportSurveySummary(data: SurveyCSVData): string {
    if (data.responses.length === 0) {
      return 'No responses to export';
    }

    const questions = data.responses[0].answers.map((a, index) => {
      const allAnswers = data.responses.map((r) => r.answers[index]);
      const scores = allAnswers
        .map((a) => a.score)
        .filter((s): s is number => s !== undefined);

      return {
        'Question #': index + 1,
        'Question ID': a.questionId,
        'Question Text': a.questionText,
        'Question Type': a.questionType,
        'Response Count': allAnswers.length,
        'Average Score':
          scores.length > 0 ? this.average(scores).toFixed(2) : 'N/A',
        'Min Score': scores.length > 0 ? Math.min(...scores) : 'N/A',
        'Max Score': scores.length > 0 ? Math.max(...scores) : 'N/A',
        'Std Dev': scores.length > 0 ? this.stdDev(scores).toFixed(2) : 'N/A',
      };
    });

    return this.convertToCSV(questions);
  }

  /**
   * Export Microclimate Responses to CSV
   */
  exportMicroclimateResponses(data: MicroclimateCSVData): string {
    const flattenedData = data.responses.map((response) => {
      const row: any = {
        'Response ID': response.responseId,
        'Microclimate ID': data.microclimateId,
        'Microclimate Title': data.microclimateTitle,
        'User ID': response.userId,
        'User Name': response.userName,
        'Submitted At': this.formatDate(response.submittedAt),
      };

      response.answers.forEach((answer, index) => {
        row[`Q${index + 1} ID`] = answer.questionId;
        row[`Q${index + 1} Question`] = answer.questionText;
        row[`Q${index + 1} Answer`] = this.formatAnswer(answer.answer);
      });

      return row;
    });

    return this.convertToCSV(flattenedData);
  }

  /**
   * Export Users to CSV
   */
  exportUsers(data: UserCSVData): string {
    const flattenedData = data.users.map((user) => ({
      'User ID': user.id,
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Department: user.department || 'N/A',
      Position: user.position || 'N/A',
      'Employee ID': user.employeeId || 'N/A',
      Phone: user.phone || 'N/A',
      Status: user.status,
      'Created At': this.formatDate(user.createdAt),
      'Last Login': user.lastLogin ? this.formatDate(user.lastLogin) : 'Never',
    }));

    return this.convertToCSV(flattenedData);
  }

  /**
   * Export Demographics Template
   */
  exportDemographicsTemplate(fields: string[]): string {
    const headers = ['Email', 'Name', ...fields];
    const exampleRow = [
      'user@example.com',
      'John Doe',
      ...fields.map(() => 'Example Value'),
    ];

    const data = [headers, exampleRow];

    return Papa.unparse(data, {
      delimiter: this.options.delimiter,
      newline: this.options.newline,
      quotes: this.options.quotes,
    });
  }

  /**
   * Export Action Plans to CSV
   */
  exportActionPlans(actionPlans: Array<any>): string {
    const flattenedData = actionPlans.map((plan) => ({
      'Action Plan ID': plan.id || plan._id,
      Title: plan.title,
      Description: plan.description || 'N/A',
      Status: plan.status,
      Priority: plan.priority,
      'Due Date': this.formatDate(plan.due_date),
      'Progress %': plan.progress_percentage?.toFixed(1) || '0.0',
      'Created By': plan.created_by?.name || 'Unknown',
      'Assigned To': plan.assigned_to?.name || 'Unassigned',
      Department: plan.department_id?.name || 'N/A',
      'KPI Count': plan.kpis?.length || 0,
      'Created At': this.formatDate(plan.created_at),
      'Updated At': this.formatDate(plan.updated_at),
    }));

    return this.convertToCSV(flattenedData);
  }

  /**
   * Generic CSV export from array of objects
   */
  exportGeneric(data: any[]): string {
    return this.convertToCSV(data);
  }

  // ============ Helper Methods ============

  private convertToCSV(data: any[]): string {
    return Papa.unparse(data, {
      delimiter: this.options.delimiter,
      header: this.options.header,
      newline: this.options.newline,
      quotes: this.options.quotes,
    });
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private formatAnswer(answer: any): string {
    if (answer === null || answer === undefined) {
      return '';
    }

    if (typeof answer === 'object') {
      if (Array.isArray(answer)) {
        return answer.join('; ');
      }
      return JSON.stringify(answer);
    }

    return String(answer);
  }

  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  }

  private average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private stdDev(numbers: number[]): number {
    const avg = this.average(numbers);
    const squareDiffs = numbers.map((n) => Math.pow(n - avg, 2));
    const avgSquareDiff = this.average(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }
}

// Export singleton instance
export const csvExportService = new CSVExportService();

// Export utility functions
export function exportSurveyToCSV(
  data: SurveyCSVData,
  format: 'long' | 'wide' | 'summary' = 'long',
  options?: CSVExportOptions
): string {
  const service = new CSVExportService(options);

  switch (format) {
    case 'wide':
      return service.exportSurveyResponsesWide(data);
    case 'summary':
      return service.exportSurveySummary(data);
    default:
      return service.exportSurveyResponses(data);
  }
}

export function exportMicroclimateToCSV(
  data: MicroclimateCSVData,
  options?: CSVExportOptions
): string {
  const service = new CSVExportService(options);
  return service.exportMicroclimateResponses(data);
}

export function exportUsersToCSV(
  data: UserCSVData,
  options?: CSVExportOptions
): string {
  const service = new CSVExportService(options);
  return service.exportUsers(data);
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadPDF(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
