'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Copy, Check, QrCode as QrCodeIcon, FileImage, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
  surveyUrl: string;
  surveyTitle: string;
  language?: 'es' | 'en';
  onGenerated?: (qrCodeDataUrl: string) => void;
}

type QRSize = '128' | '256' | '512' | '1024';
type QRErrorLevel = 'L' | 'M' | 'Q' | 'H';
type QRFormat = 'png' | 'svg';

/**
 * QR Code Generator Component
 * 
 * Features:
 * - Generate QR codes for survey URLs
 * - Multiple export formats (PNG, SVG, PDF)
 * - Customizable size and error correction
 * - Copy URL to clipboard
 * - Real-time preview
 */
export function QRCodeGenerator({
  surveyUrl,
  surveyTitle,
  language = 'es',
  onGenerated,
}: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [size, setSize] = useState<QRSize>('256');
  const [errorLevel, setErrorLevel] = useState<QRErrorLevel>('M');
  const [format, setFormat] = useState<QRFormat>('png');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Translations
  const t = language === 'es' ? {
    title: 'Código QR',
    description: 'Genera un código QR para acceder fácilmente a la encuesta',
    surveyUrl: 'URL de la Encuesta',
    copyUrl: 'Copiar URL',
    urlCopied: 'URL Copiada',
    size: 'Tamaño',
    errorCorrection: 'Corrección de Errores',
    format: 'Formato',
    downloadPNG: 'Descargar PNG',
    downloadSVG: 'Descargar SVG',
    downloadPDF: 'Descargar PDF',
    preview: 'Vista Previa',
    errorLow: 'Baja (7%)',
    errorMedium: 'Media (15%)',
    errorQuartile: 'Alta (25%)',
    errorHigh: 'Muy Alta (30%)',
    generating: 'Generando...',
    scanInstructions: 'Los empleados pueden escanear este código QR con su teléfono para acceder a la encuesta.',
  } : {
    title: 'QR Code',
    description: 'Generate a QR code for easy survey access',
    surveyUrl: 'Survey URL',
    copyUrl: 'Copy URL',
    urlCopied: 'URL Copied',
    size: 'Size',
    errorCorrection: 'Error Correction',
    format: 'Format',
    downloadPNG: 'Download PNG',
    downloadSVG: 'Download SVG',
    downloadPDF: 'Download PDF',
    preview: 'Preview',
    errorLow: 'Low (7%)',
    errorMedium: 'Medium (15%)',
    errorQuartile: 'High (25%)',
    errorHigh: 'Very High (30%)',
    generating: 'Generating...',
    scanInstructions: 'Employees can scan this QR code with their phone to access the survey.',
  };

  // Generate QR code
  useEffect(() => {
    if (!surveyUrl) return;

    const generateQRCode = async () => {
      setGenerating(true);
      try {
        const dataUrl = await QRCode.toDataURL(surveyUrl, {
          width: parseInt(size),
          errorCorrectionLevel: errorLevel,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        setQrCodeDataUrl(dataUrl);
        onGenerated?.(dataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast.error(language === 'es' ? 'Error al generar código QR' : 'Error generating QR code');
      } finally {
        setGenerating(false);
      }
    };

    generateQRCode();
  }, [surveyUrl, size, errorLevel, onGenerated, language]);

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      toast.success(t.urlCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying URL:', error);
      toast.error(language === 'es' ? 'Error al copiar URL' : 'Error copying URL');
    }
  };

  // Download as PNG
  const handleDownloadPNG = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `qr-code-${surveyTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(language === 'es' ? 'PNG descargado' : 'PNG downloaded');
  };

  // Download as SVG
  const handleDownloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(surveyUrl, {
        type: 'svg',
        width: parseInt(size),
        errorCorrectionLevel: errorLevel,
        margin: 2,
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${surveyTitle.replace(/\s+/g, '-').toLowerCase()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(language === 'es' ? 'SVG descargado' : 'SVG downloaded');
    } catch (error) {
      console.error('Error generating SVG:', error);
      toast.error(language === 'es' ? 'Error al generar SVG' : 'Error generating SVG');
    }
  };

  // Download as PDF
  const handleDownloadPDF = () => {
    if (!qrCodeDataUrl) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add title
      pdf.setFontSize(20);
      pdf.text(surveyTitle, 105, 20, { align: 'center' });

      // Add instructions
      pdf.setFontSize(12);
      const instructions = language === 'es'
        ? 'Escanea este código QR para acceder a la encuesta'
        : 'Scan this QR code to access the survey';
      pdf.text(instructions, 105, 35, { align: 'center' });

      // Add QR code
      const qrSize = 80;
      const qrX = (210 - qrSize) / 2; // Center horizontally on A4 (210mm width)
      const qrY = 50;
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Add URL
      pdf.setFontSize(10);
      pdf.text(t.surveyUrl + ':', 105, qrY + qrSize + 15, { align: 'center' });
      pdf.setFontSize(8);
      pdf.text(surveyUrl, 105, qrY + qrSize + 22, { align: 'center', maxWidth: 180 });

      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      const footer = language === 'es'
        ? 'Generado por Plataforma de Clima Organizacional'
        : 'Generated by Organizational Climate Platform';
      pdf.text(footer, 105, 280, { align: 'center' });

      // Save PDF
      pdf.save(`qr-code-${surveyTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`);

      toast.success(language === 'es' ? 'PDF descargado' : 'PDF downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(language === 'es' ? 'Error al generar PDF' : 'Error generating PDF');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCodeIcon className="w-5 h-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Survey URL */}
        <div className="space-y-2">
          <Label>{t.surveyUrl}</Label>
          <div className="flex gap-2">
            <input
              type="text"
              value={surveyUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-gray-50 dark:bg-gray-900 font-mono"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t.urlCopied}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  {t.copyUrl}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Size */}
          <div className="space-y-2">
            <Label>{t.size}</Label>
            <Select value={size} onValueChange={(value) => setSize(value as QRSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="128">128 x 128</SelectItem>
                <SelectItem value="256">256 x 256</SelectItem>
                <SelectItem value="512">512 x 512</SelectItem>
                <SelectItem value="1024">1024 x 1024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Correction */}
          <div className="space-y-2">
            <Label>{t.errorCorrection}</Label>
            <Select value={errorLevel} onValueChange={(value) => setErrorLevel(value as QRErrorLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">{t.errorLow}</SelectItem>
                <SelectItem value="M">{t.errorMedium}</SelectItem>
                <SelectItem value="Q">{t.errorQuartile}</SelectItem>
                <SelectItem value="H">{t.errorHigh}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>{t.format}</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as QRFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* QR Code Preview */}
        <div className="space-y-2">
          <Label>{t.preview}</Label>
          <div className="flex justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800">
            {generating ? (
              <div className="flex flex-col items-center justify-center space-y-2" style={{ width: parseInt(size), height: parseInt(size) }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <QrCodeIcon className="w-12 h-12 text-blue-500" />
                </motion.div>
                <p className="text-sm text-gray-500">{t.generating}</p>
              </div>
            ) : qrCodeDataUrl ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={qrCodeDataUrl}
                alt="QR Code"
                className="rounded-lg shadow-lg"
                style={{ width: parseInt(size) / 2, height: parseInt(size) / 2 }}
              />
            ) : null}
          </div>
        </div>

        {/* Instructions */}
        <Alert>
          <QrCodeIcon className="w-4 h-4" />
          <AlertDescription>{t.scanInstructions}</AlertDescription>
        </Alert>

        {/* Download Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPNG}
            disabled={!qrCodeDataUrl || generating}
            className="w-full"
          >
            <FileImage className="w-4 h-4 mr-2" />
            {t.downloadPNG}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadSVG}
            disabled={!surveyUrl || generating}
            className="w-full"
          >
            <FileImage className="w-4 h-4 mr-2" />
            {t.downloadSVG}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={!qrCodeDataUrl || generating}
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            {t.downloadPDF}
          </Button>
        </div>

        {/* Hidden canvas for advanced rendering */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
