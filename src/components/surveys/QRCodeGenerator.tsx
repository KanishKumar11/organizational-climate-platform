import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Copy,
  Check,
  QrCode as QrCodeIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QRCodeService } from '@/lib/qr-code-service';

/**
 * CLIMA-005: QR Code Generator Component
 *
 * Generates and displays QR codes for survey distribution
 * with download and print options
 */

interface QRCodeGeneratorProps {
  surveyId: string;
  surveyTitle: string;
  tokenType?: 'anonymous' | 'per_user';
}

export default function QRCodeGenerator({
  surveyId,
  surveyTitle,
  tokenType = 'anonymous',
}: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [surveyUrl, setSurveyUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateQR();
  }, [surveyId, tokenType]);

  const generateQR = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const result = await QRCodeService.generateSurveyQR(
        surveyId,
        baseUrl,
        tokenType
      );

      setQrDataUrl(result.dataUrl);
      setQrSvg(result.svg);
      setSurveyUrl(result.url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPNG = () => {
    QRCodeService.downloadQRCode(
      qrDataUrl,
      `${surveyTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr.png`
    );
  };

  const handleDownloadSVG = () => {
    QRCodeService.downloadQRCodeSVG(
      qrSvg,
      `${surveyTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr.svg`
    );
  };

  const handlePrint = () => {
    QRCodeService.printQRCode(qrDataUrl, surveyTitle);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">⏳</div>
        <span className="ml-2">Generating QR code...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5" />
            QR Code & Survey Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr">QR Code</TabsTrigger>
              <TabsTrigger value="link">Direct Link</TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-4">
              {/* QR Code Display */}
              <div className="flex justify-center p-6 bg-white dark:bg-gray-900 rounded-lg border">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Survey QR Code"
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-muted-foreground">
                    QR Code not available
                  </div>
                )}
              </div>

              {/* QR Code Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPNG}
                  disabled={!qrDataUrl}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSVG}
                  disabled={!qrSvg}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download SVG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={!qrDataUrl}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>

              {/* Token Type Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant={tokenType === 'anonymous' ? 'default' : 'secondary'}
                >
                  {tokenType === 'anonymous'
                    ? 'Anonymous Access'
                    : 'Tokenized Access'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {tokenType === 'anonymous'
                    ? 'Anyone with this QR code can access the survey'
                    : 'Each QR code is unique to a respondent'}
                </span>
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              {/* Survey URL */}
              <div className="space-y-2">
                <Label htmlFor="survey-url">Survey URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="survey-url"
                    value={surveyUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-sm text-green-600">
                    URL copied to clipboard!
                  </p>
                )}
              </div>

              {/* Distribution Instructions */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Distribution Options:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Share this link via email or messaging apps</li>
                  <li>Embed in your company intranet or portal</li>
                  <li>Include in newsletters or announcements</li>
                  <li>Print the QR code on posters or flyers</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          {/* Security Notice */}
          {tokenType === 'anonymous' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                <strong>Security Note:</strong> This is an anonymous link.
                Anyone with this URL or QR code can access the survey. For
                restricted access, use tokenized links instead.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
