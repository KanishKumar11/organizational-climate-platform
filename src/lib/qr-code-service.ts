import QRCode from 'qrcode';

/**
 * CLIMA-005: QR Code Generation Service
 *
 * Generates QR codes for survey distribution
 */

export interface QRCodeOptions {
  size?: number; // Width/height in pixels
  margin?: number; // Quiet zone in modules
  color?: {
    dark?: string; // Foreground color
    light?: string; // Background color
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Error correction level
}

export interface QRCodeResult {
  dataUrl: string; // Base64 data URL for <img> src
  svg: string; // SVG string
  url: string; // The URL that was encoded
}

export class QRCodeService {
  /**
   * Generate QR code for survey URL
   */
  static async generateSurveyQR(
    surveyId: string,
    baseUrl: string,
    tokenType: 'anonymous' | 'per_user' = 'anonymous',
    token?: string,
    options: QRCodeOptions = {}
  ): Promise<QRCodeResult> {
    // Build survey URL
    let url = `${baseUrl}/surveys/${surveyId}/respond`;

    if (tokenType === 'per_user' && token) {
      url += `?token=${token}`;
    }

    const qrOptions = {
      width: options.size || 300,
      margin: options.margin || 4,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    };

    try {
      // Generate PNG data URL
      const dataUrl = await QRCode.toDataURL(url, qrOptions);

      // Generate SVG
      const svg = await QRCode.toString(url, {
        type: 'svg',
        ...qrOptions,
      });

      return {
        dataUrl,
        svg,
        url,
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate batch QR codes for per-user tokens
   */
  static async generateBatchQR(
    surveyId: string,
    baseUrl: string,
    tokens: string[],
    options: QRCodeOptions = {}
  ): Promise<Array<{ token: string; qr: QRCodeResult }>> {
    const results = await Promise.all(
      tokens.map(async (token) => {
        const qr = await this.generateSurveyQR(
          surveyId,
          baseUrl,
          'per_user',
          token,
          options
        );
        return { token, qr };
      })
    );

    return results;
  }

  /**
   * Download QR code as PNG
   */
  static downloadQRCode(
    dataUrl: string,
    filename: string = 'survey-qr-code.png'
  ) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Download QR code as SVG
   */
  static downloadQRCodeSVG(
    svg: string,
    filename: string = 'survey-qr-code.svg'
  ) {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Print QR code
   */
  static printQRCode(dataUrl: string, surveyTitle: string = 'Survey') {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${surveyTitle}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            h1 {
              margin-bottom: 20px;
              font-size: 24px;
            }
            img {
              max-width: 400px;
              height: auto;
            }
            .instructions {
              margin-top: 20px;
              text-align: center;
              max-width: 500px;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <h1>${surveyTitle}</h1>
          <img src="${dataUrl}" alt="Survey QR Code" />
          <div class="instructions">
            <p>Scan this QR code with your mobile device to access the survey</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for image to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

export default QRCodeService;
