import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { IReport } from '@/models/Report';
import { AIInsight } from '@/models/AIInsight';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeExecutiveSummary: boolean;
  sections: string[];
  customBranding?: {
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

export interface ExecutiveSummary {
  overview: string;
  keyFindings: string[];
  recommendations: string[];
  riskAlerts: string[];
  nextSteps: string[];
  confidenceScore: number;
}

export class ExportService {
  /**
   * Export report to PDF with charts and executive summary
   */
  async exportToPDF(
    report: Report,
    options: ExportOptions,
    executiveSummary?: ExecutiveSummary
  ): Promise<Buffer> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Add custom branding if provided
    if (options.customBranding?.logo) {
      try {
        pdf.addImage(options.customBranding.logo, 'PNG', 20, 10, 30, 15);
        yPosition = 35;
      } catch (error) {
        console.warn('Failed to add logo to PDF:', error);
      }
    }

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(report.title, 20, yPosition);
    yPosition += 15;

    // Report metadata
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
    pdf.text(
      `Period: ${report.dateRange.start} - ${report.dateRange.end}`,
      20,
      yPosition + 5
    );
    yPosition += 20;

    // Executive Summary
    if (options.includeExecutiveSummary && executiveSummary) {
      yPosition = await this.addExecutiveSummaryToPDF(
        pdf,
        executiveSummary,
        yPosition,
        pageWidth,
        pageHeight
      );
    }

    // Report sections
    for (const sectionName of options.sections) {
      const section = report.sections.find((s) => s.name === sectionName);
      if (section) {
        yPosition = await this.addSectionToPDF(
          pdf,
          section,
          yPosition,
          pageWidth,
          pageHeight,
          options.includeCharts
        );
      }
    }

    return Buffer.from(pdf.output('arraybuffer'));
  }

  /**
   * Export report to Excel with multiple sheets
   */
  async exportToExcel(
    report: Report,
    options: ExportOptions,
    executiveSummary?: ExecutiveSummary
  ): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Executive Summary sheet
    if (options.includeExecutiveSummary && executiveSummary) {
      const summaryData = this.formatExecutiveSummaryForExcel(executiveSummary);
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
    }

    // Data sheets for each section
    for (const sectionName of options.sections) {
      const section = report.sections.find((s) => s.name === sectionName);
      if (section && section.data) {
        const worksheet = XLSX.utils.json_to_sheet(section.data);
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          sectionName.substring(0, 31)
        ); // Excel sheet name limit
      }
    }

    // Metadata sheet
    const metadataSheet = XLSX.utils.aoa_to_sheet([
      ['Report Title', report.title],
      ['Generated', new Date().toISOString()],
      ['Date Range', `${report.dateRange.start} - ${report.dateRange.end}`],
      ['Company', report.companyId],
      ['Created By', report.createdBy],
    ]);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');

    return Buffer.from(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    );
  }

  /**
   * Export report to CSV
   */
  async exportToCSV(report: Report, options: ExportOptions): Promise<Buffer> {
    let csvContent = '';

    // Header
    csvContent += `Report: ${report.title}\n`;
    csvContent += `Generated: ${new Date().toISOString()}\n`;
    csvContent += `Period: ${report.dateRange.start} - ${report.dateRange.end}\n\n`;

    // Data from each section
    for (const sectionName of options.sections) {
      const section = report.sections.find((s) => s.name === sectionName);
      if (section && section.data) {
        csvContent += `${sectionName}\n`;
        const worksheet = XLSX.utils.json_to_sheet(section.data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        csvContent += csv + '\n\n';
      }
    }

    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Generate AI-powered executive summary
   */
  async generateExecutiveSummary(
    report: any,
    insights: any[]
  ): Promise<ExecutiveSummary> {
    // Extract key metrics and patterns
    const keyMetrics = this.extractKeyMetrics(report);
    const patterns = this.identifyPatterns(insights);
    const risks = insights.filter(
      (i) => i.priority === 'high' || i.priority === 'critical'
    );

    // Generate summary sections
    const overview = this.generateOverview(report, keyMetrics);
    const keyFindings = this.generateKeyFindings(patterns, keyMetrics);
    const recommendations = this.generateRecommendations(insights);
    const riskAlerts = risks.map((r) => r.description);
    const nextSteps = this.generateNextSteps(insights);

    // Calculate confidence score based on data quality and insight confidence
    const confidenceScore = this.calculateConfidenceScore(report, insights);

    return {
      overview,
      keyFindings,
      recommendations,
      riskAlerts,
      nextSteps,
      confidenceScore,
    };
  }

  private async addExecutiveSummaryToPDF(
    pdf: jsPDF,
    summary: ExecutiveSummary,
    yPosition: number,
    pageWidth: number,
    pageHeight: number
  ): Promise<number> {
    // Executive Summary header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', 20, yPosition);
    yPosition += 10;

    // Overview
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const overviewLines = pdf.splitTextToSize(summary.overview, pageWidth - 40);
    pdf.text(overviewLines, 20, yPosition);
    yPosition += overviewLines.length * 5 + 10;

    // Key Findings
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Findings:', 20, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    for (const finding of summary.keyFindings) {
      const findingLines = pdf.splitTextToSize(`• ${finding}`, pageWidth - 40);
      pdf.text(findingLines, 25, yPosition);
      yPosition += findingLines.length * 5 + 3;
    }

    yPosition += 5;

    // Recommendations
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recommendations:', 20, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    for (const recommendation of summary.recommendations) {
      const recLines = pdf.splitTextToSize(
        `• ${recommendation}`,
        pageWidth - 40
      );
      pdf.text(recLines, 25, yPosition);
      yPosition += recLines.length * 5 + 3;
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = 20;
    }

    return yPosition + 10;
  }

  private async addSectionToPDF(
    pdf: jsPDF,
    section: any,
    yPosition: number,
    pageWidth: number,
    pageHeight: number,
    includeCharts: boolean
  ): Promise<number> {
    // Section header
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.name, 20, yPosition);
    yPosition += 10;

    // Section description
    if (section.description) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(
        section.description,
        pageWidth - 40
      );
      pdf.text(descLines, 20, yPosition);
      yPosition += descLines.length * 4 + 10;
    }

    // Add chart if available and requested
    if (includeCharts && section.chartElement) {
      try {
        const canvas = await html2canvas(section.chartElement);
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if chart fits on current page
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.warn('Failed to add chart to PDF:', error);
      }
    }

    return yPosition;
  }

  private formatExecutiveSummaryForExcel(summary: ExecutiveSummary): any[][] {
    const data: any[][] = [
      ['Executive Summary'],
      [''],
      ['Overview', summary.overview],
      [''],
      ['Key Findings'],
      ...summary.keyFindings.map((finding) => ['', finding]),
      [''],
      ['Recommendations'],
      ...summary.recommendations.map((rec) => ['', rec]),
      [''],
      ['Risk Alerts'],
      ...summary.riskAlerts.map((risk) => ['', risk]),
      [''],
      ['Next Steps'],
      ...summary.nextSteps.map((step) => ['', step]),
      [''],
      ['Confidence Score', `${summary.confidenceScore}%`],
    ];

    return data;
  }

  private extractKeyMetrics(report: Report): Record<string, any> {
    const metrics: Record<string, any> = {};

    for (const section of report.sections) {
      if (section.metrics) {
        Object.assign(metrics, section.metrics);
      }
    }

    return metrics;
  }

  private identifyPatterns(insights: AIInsight[]): string[] {
    const patterns: string[] = [];

    // Group insights by category
    const categories = insights.reduce(
      (acc, insight) => {
        if (!acc[insight.category]) {
          acc[insight.category] = [];
        }
        acc[insight.category].push(insight);
        return acc;
      },
      {} as Record<string, AIInsight[]>
    );

    // Identify patterns within categories
    for (const [category, categoryInsights] of Object.entries(categories)) {
      if (categoryInsights.length > 1) {
        patterns.push(
          `Multiple ${category} insights detected across different segments`
        );
      }
    }

    return patterns;
  }

  private generateOverview(
    report: Report,
    metrics: Record<string, any>
  ): string {
    const responseCount = metrics.totalResponses || 0;
    const engagementScore = metrics.averageEngagement || 0;

    return (
      `This report analyzes organizational climate data from ${report.dateRange.start} to ${report.dateRange.end}. ` +
      `Based on ${responseCount} responses, the overall engagement score is ${engagementScore.toFixed(1)}%. ` +
      `The analysis reveals key insights across multiple organizational dimensions including culture, ` +
      `communication, and leadership effectiveness.`
    );
  }

  private generateKeyFindings(
    patterns: string[],
    metrics: Record<string, any>
  ): string[] {
    const findings: string[] = [];

    // Add metric-based findings
    if (metrics.averageEngagement) {
      const score = metrics.averageEngagement;
      if (score >= 80) {
        findings.push(`High engagement levels detected (${score.toFixed(1)}%)`);
      } else if (score < 60) {
        findings.push(`Engagement concerns identified (${score.toFixed(1)}%)`);
      }
    }

    // Add pattern-based findings
    findings.push(...patterns);

    return findings.slice(0, 5); // Limit to top 5 findings
  }

  private generateRecommendations(insights: AIInsight[]): string[] {
    const recommendations: string[] = [];

    // Extract recommendations from high-priority insights
    const highPriorityInsights = insights.filter(
      (i) => i.priority === 'high' || i.priority === 'critical'
    );

    for (const insight of highPriorityInsights.slice(0, 5)) {
      if (insight.recommendedActions && insight.recommendedActions.length > 0) {
        recommendations.push(insight.recommendedActions[0]);
      }
    }

    return recommendations;
  }

  private generateNextSteps(insights: AIInsight[]): string[] {
    const nextSteps: string[] = [
      'Review and discuss findings with leadership team',
      'Prioritize action items based on impact and feasibility',
      'Develop implementation timeline for recommended actions',
      'Schedule follow-up assessment to measure progress',
    ];

    // Add specific next steps from insights
    const actionableInsights = insights.filter(
      (i) => i.recommendedActions && i.recommendedActions.length > 1
    );

    for (const insight of actionableInsights.slice(0, 2)) {
      if (insight.recommendedActions && insight.recommendedActions[1]) {
        nextSteps.push(insight.recommendedActions[1]);
      }
    }

    return nextSteps.slice(0, 6);
  }

  private calculateConfidenceScore(
    report: Report,
    insights: AIInsight[]
  ): number {
    let totalConfidence = 0;
    let count = 0;

    // Factor in insight confidence scores
    for (const insight of insights) {
      totalConfidence += insight.confidenceScore;
      count++;
    }

    // Factor in data quality (response rate, completeness)
    const responseRate = report.metadata?.responseRate || 0.5;
    const dataQualityScore = Math.min(responseRate * 100, 100);

    if (count === 0) return dataQualityScore;

    const avgInsightConfidence = totalConfidence / count;

    // Weighted average: 60% insight confidence, 40% data quality
    return Math.round(avgInsightConfidence * 0.6 + dataQualityScore * 0.4);
  }
}

export const exportService = new ExportService();
