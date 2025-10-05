/**
 * PDF Export Service
 *
 * Comprehensive PDF generation for surveys, microclimates, action plans, and reports
 * Uses jsPDF with auto-table for structured data export
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Type definitions
export interface PDFExportOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  includeCharts?: boolean;
  includeRawData?: boolean;
  companyLogo?: string;
  companyName?: string;
  brandColor?: string;
}

export interface SurveyPDFData {
  survey: {
    title: string;
    description?: string;
    type: string;
    start_date: Date;
    end_date: Date;
    status: string;
    response_count: number;
    target_count?: number;
    completion_rate?: number;
  };
  questions: Array<{
    text: string;
    type: string;
    responses_count: number;
    average_score?: number;
    distribution?: Record<string, number>;
  }>;
  demographics?: Array<{
    field: string;
    distribution: Record<string, number>;
  }>;
  insights?: Array<{
    category: string;
    insight: string;
    confidence: number;
    priority: string;
  }>;
}

export interface MicroclimatePDFData {
  microclimate: {
    title: string;
    description?: string;
    status: string;
    response_count: number;
    participation_rate: number;
    sentiment_score: number;
    engagement_level: string;
  };
  wordCloud: Array<{ text: string; value: number }>;
  questions: Array<{
    question: string;
    type: string;
    responses: Array<{ option: string; count: number; percentage: number }>;
  }>;
  aiInsights: Array<{
    type: string;
    message: string;
    confidence: number;
    priority: string;
  }>;
}

export interface ActionPlanPDFData {
  actionPlan: {
    title: string;
    description?: string;
    status: string;
    priority: string;
    due_date: Date;
    progress_percentage: number;
  };
  kpis: Array<{
    name: string;
    current_value: number;
    target_value: number;
    unit: string;
    progress_percentage: number;
  }>;
  qualitativeObjectives: Array<{
    description: string;
    success_criteria: string;
    completion_percentage: number;
  }>;
  progressUpdates: Array<{
    date: Date;
    notes: string;
    updated_by: string;
  }>;
}

/**
 * PDF Export Service Class
 */
export class PDFExportService {
  private doc: jsPDF;
  private options: PDFExportOptions;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;
  private currentY: number = 20;

  constructor(options: PDFExportOptions = {}) {
    this.options = {
      orientation: options.orientation || 'portrait',
      format: options.format || 'a4',
      includeCharts: options.includeCharts !== false,
      includeRawData: options.includeRawData !== false,
      ...options,
    };

    this.doc = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.format,
    });

    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
  }

  /**
   * Export Survey Results to PDF
   */
  async exportSurveyResults(data: SurveyPDFData): Promise<Blob> {
    this.addHeader(data.survey.title, 'Survey Results Report');

    // Survey Overview
    this.addSection('Survey Overview');
    this.addKeyValue('Type', data.survey.type);
    this.addKeyValue('Status', data.survey.status);
    this.addKeyValue('Start Date', this.formatDate(data.survey.start_date));
    this.addKeyValue('End Date', this.formatDate(data.survey.end_date));
    this.addKeyValue(
      'Responses',
      `${data.survey.response_count}${data.survey.target_count ? ` / ${data.survey.target_count}` : ''}`
    );
    if (data.survey.completion_rate) {
      this.addKeyValue(
        'Completion Rate',
        `${data.survey.completion_rate.toFixed(1)}%`
      );
    }

    if (data.survey.description) {
      this.addSpacing(5);
      this.addText(data.survey.description, 10);
    }

    // Questions Summary
    this.addPageBreak();
    this.addSection('Questions Summary');

    const questionTableData = data.questions.map((q, index) => [
      (index + 1).toString(),
      this.truncate(q.text, 80),
      q.type,
      q.responses_count.toString(),
      q.average_score ? q.average_score.toFixed(2) : 'N/A',
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Question', 'Type', 'Responses', 'Avg Score']],
      body: questionTableData,
      theme: 'striped',
      headStyles: { fillColor: this.getBrandColor() },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor?.y || this.currentY;
      },
    });

    // Demographics (if available)
    if (data.demographics && data.demographics.length > 0) {
      this.addPageBreak();
      this.addSection('Demographics Breakdown');

      data.demographics.forEach((demo) => {
        this.addSubsection(demo.field);
        const demoData = Object.entries(demo.distribution).map(
          ([key, value]) => [
            key,
            value.toString(),
            `${((value / data.survey.response_count) * 100).toFixed(1)}%`,
          ]
        );

        autoTable(this.doc, {
          startY: this.currentY,
          head: [['Category', 'Count', 'Percentage']],
          body: demoData,
          theme: 'grid',
          headStyles: { fillColor: this.getBrandColor() },
          margin: { left: this.margin + 5, right: this.margin },
          didDrawPage: (data) => {
            this.currentY = data.cursor?.y || this.currentY;
          },
        });
        this.addSpacing(5);
      });
    }

    // AI Insights (if available)
    if (data.insights && data.insights.length > 0) {
      this.addPageBreak();
      this.addSection('AI-Powered Insights');

      data.insights.forEach((insight, index) => {
        this.addSpacing(3);
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(
          `${index + 1}. ${insight.category}`,
          this.margin,
          this.currentY
        );
        this.currentY += 5;

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        const lines = this.doc.splitTextToSize(
          insight.insight,
          this.pageWidth - 2 * this.margin
        );
        this.doc.text(lines, this.margin, this.currentY);
        this.currentY += lines.length * 5;

        this.doc.setFontSize(9);
        this.doc.setTextColor(100);
        this.doc.text(
          `Confidence: ${(insight.confidence * 100).toFixed(0)}% | Priority: ${insight.priority}`,
          this.margin,
          this.currentY
        );
        this.doc.setTextColor(0);
        this.currentY += 7;
      });
    }

    // Footer
    this.addFooter();

    return this.doc.output('blob');
  }

  /**
   * Export Microclimate Results to PDF
   */
  async exportMicroclimateResults(data: MicroclimatePDFData): Promise<Blob> {
    this.addHeader(data.microclimate.title, 'Microclimate Results Report');

    // Microclimate Overview
    this.addSection('Overview');
    this.addKeyValue('Status', data.microclimate.status);
    this.addKeyValue('Responses', data.microclimate.response_count.toString());
    this.addKeyValue(
      'Participation Rate',
      `${data.microclimate.participation_rate.toFixed(1)}%`
    );
    this.addKeyValue(
      'Sentiment Score',
      this.formatSentiment(data.microclimate.sentiment_score)
    );
    this.addKeyValue('Engagement Level', data.microclimate.engagement_level);

    // Word Cloud Data
    if (data.wordCloud && data.wordCloud.length > 0) {
      this.addSpacing(10);
      this.addSection('Top Themes');

      const wordCloudData = data.wordCloud
        .slice(0, 20)
        .map((word, index) => [
          (index + 1).toString(),
          word.text,
          word.value.toString(),
        ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Rank', 'Theme', 'Mentions']],
        body: wordCloudData,
        theme: 'striped',
        headStyles: { fillColor: this.getBrandColor() },
        margin: { left: this.margin, right: this.margin },
        didDrawPage: (data) => {
          this.currentY = data.cursor?.y || this.currentY;
        },
      });
    }

    // Question Responses
    if (data.questions && data.questions.length > 0) {
      this.addPageBreak();
      this.addSection('Question Responses');

      data.questions.forEach((q, qIndex) => {
        this.addSubsection(`Q${qIndex + 1}: ${this.truncate(q.question, 100)}`);

        const responseData = q.responses.map((r) => [
          r.option,
          r.count.toString(),
          `${r.percentage.toFixed(1)}%`,
          this.getProgressBar(r.percentage),
        ]);

        autoTable(this.doc, {
          startY: this.currentY,
          head: [['Option', 'Count', '%', 'Distribution']],
          body: responseData,
          theme: 'grid',
          headStyles: { fillColor: this.getBrandColor() },
          margin: { left: this.margin + 5, right: this.margin },
          didDrawPage: (data) => {
            this.currentY = data.cursor?.y || this.currentY;
          },
        });
        this.addSpacing(5);
      });
    }

    // AI Insights
    if (data.aiInsights && data.aiInsights.length > 0) {
      this.addPageBreak();
      this.addSection('Real-Time AI Insights');

      data.aiInsights.forEach((insight, index) => {
        this.addSpacing(3);

        // Priority badge
        this.doc.setFillColor(...this.getPriorityColor(insight.priority));
        this.doc.rect(this.margin, this.currentY - 3, 15, 5, 'F');
        this.doc.setTextColor(255);
        this.doc.setFontSize(8);
        this.doc.text(
          insight.priority.toUpperCase(),
          this.margin + 1,
          this.currentY
        );
        this.doc.setTextColor(0);

        // Insight text
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.currentY += 5;
        const lines = this.doc.splitTextToSize(
          insight.message,
          this.pageWidth - 2 * this.margin
        );
        this.doc.text(lines, this.margin, this.currentY);
        this.currentY += lines.length * 5 + 3;
      });
    }

    this.addFooter();
    return this.doc.output('blob');
  }

  /**
   * Export Action Plan to PDF
   */
  async exportActionPlan(data: ActionPlanPDFData): Promise<Blob> {
    this.addHeader(data.actionPlan.title, 'Action Plan Report');

    // Action Plan Overview
    this.addSection('Action Plan Overview');
    this.addKeyValue('Status', data.actionPlan.status);
    this.addKeyValue('Priority', data.actionPlan.priority);
    this.addKeyValue('Due Date', this.formatDate(data.actionPlan.due_date));
    this.addKeyValue(
      'Overall Progress',
      `${data.actionPlan.progress_percentage.toFixed(1)}%`
    );

    if (data.actionPlan.description) {
      this.addSpacing(5);
      this.addText(data.actionPlan.description, 10);
    }

    // KPIs
    if (data.kpis && data.kpis.length > 0) {
      this.addSpacing(10);
      this.addSection('Key Performance Indicators (KPIs)');

      const kpiData = data.kpis.map((kpi) => [
        kpi.name,
        `${kpi.current_value} ${kpi.unit}`,
        `${kpi.target_value} ${kpi.unit}`,
        `${kpi.progress_percentage.toFixed(1)}%`,
        this.getProgressBar(kpi.progress_percentage),
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['KPI', 'Current', 'Target', 'Progress', '']],
        body: kpiData,
        theme: 'striped',
        headStyles: { fillColor: this.getBrandColor() },
        margin: { left: this.margin, right: this.margin },
        didDrawPage: (data) => {
          this.currentY = data.cursor?.y || this.currentY;
        },
      });
    }

    // Qualitative Objectives
    if (data.qualitativeObjectives && data.qualitativeObjectives.length > 0) {
      this.addPageBreak();
      this.addSection('Qualitative Objectives');

      data.qualitativeObjectives.forEach((obj, index) => {
        this.addSpacing(3);
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(
          `${index + 1}. ${this.truncate(obj.description, 100)}`,
          this.margin,
          this.currentY
        );
        this.currentY += 5;

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(100);
        this.doc.text(
          `Success Criteria: ${obj.success_criteria}`,
          this.margin + 5,
          this.currentY
        );
        this.currentY += 5;

        this.doc.text(
          `Completion: ${obj.completion_percentage.toFixed(1)}%`,
          this.margin + 5,
          this.currentY
        );
        this.doc.setTextColor(0);
        this.currentY += 7;
      });
    }

    // Progress Updates
    if (data.progressUpdates && data.progressUpdates.length > 0) {
      this.addPageBreak();
      this.addSection('Progress Updates');

      const updateData = data.progressUpdates.map((update) => [
        this.formatDate(update.date),
        update.updated_by,
        this.truncate(update.notes, 100),
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Date', 'Updated By', 'Notes']],
        body: updateData,
        theme: 'grid',
        headStyles: { fillColor: this.getBrandColor() },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 'auto' },
        },
        didDrawPage: (data) => {
          this.currentY = data.cursor?.y || this.currentY;
        },
      });
    }

    this.addFooter();
    return this.doc.output('blob');
  }

  /**
   * Export HTML element to PDF (for charts/visualizations)
   */
  async exportHTMLElement(
    elementId: string,
    filename: string = 'export.pdf'
  ): Promise<Blob> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id '${elementId}' not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = this.pageWidth - 2 * this.margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    this.doc.addImage(
      imgData,
      'PNG',
      this.margin,
      this.margin,
      imgWidth,
      imgHeight
    );

    return this.doc.output('blob');
  }

  // ============ Helper Methods ============

  private addHeader(title: string, subtitle?: string): void {
    // Add logo if provided
    if (this.options.companyLogo) {
      // Logo placeholder - in production, use actual logo
      const brandColor = this.getBrandColor();
      this.doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
      this.doc.rect(this.margin, 10, 20, 10, 'F');
    }

    // Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 25, 15);

    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100);
      this.doc.text(subtitle, this.margin + 25, 21);
      this.doc.setTextColor(0);
    }

    // Divider line
    const brandColor = this.getBrandColor();
    this.doc.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 25, this.pageWidth - this.margin, 25);

    this.currentY = 32;
  }

  private addSection(title: string): void {
    if (this.currentY > this.pageHeight - 40) {
      this.addPage();
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    const brandColor = this.getBrandColor();
    this.doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    this.doc.text(title, this.margin, this.currentY);
    this.doc.setTextColor(0);
    this.currentY += 7;
  }

  private addSubsection(title: string): void {
    if (this.currentY > this.pageHeight - 30) {
      this.addPage();
    }

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 6;
  }

  private addKeyValue(key: string, value: string): void {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${key}:`, this.margin, this.currentY);

    this.doc.setFont('helvetica', 'normal');
    this.doc.text(value, this.margin + 50, this.currentY);
    this.currentY += 5;
  }

  private addText(text: string, fontSize: number = 10): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(
      text,
      this.pageWidth - 2 * this.margin
    );
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * 5;
  }

  private addSpacing(mm: number): void {
    this.currentY += mm;
  }

  private addPageBreak(): void {
    this.addPage();
  }

  private addPage(): void {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private addFooter(): void {
    const pageCount = (this.doc as any).internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      this.doc.setFontSize(8);
      this.doc.setTextColor(150);
      this.doc.setFont('helvetica', 'normal');

      // Page number
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );

      // Generated timestamp
      this.doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        this.margin,
        this.pageHeight - 10
      );

      // Company name
      if (this.options.companyName) {
        this.doc.text(
          this.options.companyName,
          this.pageWidth - this.margin,
          this.pageHeight - 10,
          { align: 'right' }
        );
      }
    }
  }

  private getBrandColor(): [number, number, number] {
    if (this.options.brandColor) {
      const hex = this.options.brandColor.replace('#', '');
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
      ];
    }
    return [79, 70, 229]; // Default indigo
  }

  private getPriorityColor(priority: string): [number, number, number] {
    switch (priority.toLowerCase()) {
      case 'critical':
        return [220, 38, 38]; // Red
      case 'high':
        return [234, 88, 12]; // Orange
      case 'medium':
        return [234, 179, 8]; // Yellow
      case 'low':
        return [34, 197, 94]; // Green
      default:
        return [107, 114, 128]; // Gray
    }
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private formatSentiment(score: number): string {
    if (score > 0.3) return `Positive (${score.toFixed(2)})`;
    if (score < -0.3) return `Negative (${score.toFixed(2)})`;
    return `Neutral (${score.toFixed(2)})`;
  }

  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  }

  private getProgressBar(percentage: number): string {
    const barLength = 20;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
}

// Export singleton instance
export const pdfExportService = new PDFExportService();

// Export utility functions
export async function exportSurveyToPDF(
  data: SurveyPDFData,
  options?: PDFExportOptions
): Promise<Blob> {
  const service = new PDFExportService(options);
  return service.exportSurveyResults(data);
}

export async function exportMicroclimateToPDF(
  data: MicroclimatePDFData,
  options?: PDFExportOptions
): Promise<Blob> {
  const service = new PDFExportService(options);
  return service.exportMicroclimateResults(data);
}

export async function exportActionPlanToPDF(
  data: ActionPlanPDFData,
  options?: PDFExportOptions
): Promise<Blob> {
  const service = new PDFExportService(options);
  return service.exportActionPlan(data);
}
