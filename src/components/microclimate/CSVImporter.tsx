'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * CSV Importer Component
 *
 * Handles CSV file upload with drag-drop, parsing, and validation.
 *
 * Features:
 * - Drag & drop or click to upload
 * - File validation (size, format, encoding)
 * - CSV parsing with PapaParse
 * - Preview first 10 rows
 * - Error handling and feedback
 * - Encoding detection (UTF-8, Latin1)
 *
 * @param onParsed - Callback when CSV is successfully parsed
 * @param maxFileSize - Maximum file size in MB (default: 5)
 * @param language - Display language
 */

interface CSVImporterProps {
  onParsed: (data: {
    headers: string[];
    rows: any[];
    rowCount: number;
  }) => void;
  maxFileSize?: number;
  language?: 'es' | 'en';
}

export function CSVImporter({
  onParsed,
  maxFileSize = 5,
  language = 'es',
}: CSVImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    headers: string[];
    rows: any[];
  } | null>(null);

  const t =
    language === 'es'
      ? {
          title: 'Importar CSV',
          description: 'Sube un archivo CSV con la lista de empleados',
          dragDrop: 'Arrastra y suelta tu archivo CSV aquí',
          or: 'o',
          browse: 'Buscar archivo',
          parsing: 'Analizando archivo...',
          preview: 'Vista previa',
          rows: 'filas',
          remove: 'Eliminar',
          proceed: 'Continuar con estos datos',
          errors: {
            fileSize: `El archivo no debe exceder ${maxFileSize}MB`,
            fileType: 'Solo se permiten archivos CSV',
            parseError: 'Error al analizar el archivo CSV',
            emptyFile: 'El archivo está vacío',
            encoding:
              'Error de codificación - asegúrate de que el archivo esté en UTF-8',
          },
          tips: {
            title: 'Consejos para el CSV',
            format: 'El archivo debe tener encabezados en la primera fila',
            required: 'Incluye al menos: email, nombre',
            optional: 'Opcional: departamento, ubicación, puesto',
            encoding: 'Guarda el archivo como UTF-8',
          },
        }
      : {
          title: 'Import CSV',
          description: 'Upload a CSV file with employee list',
          dragDrop: 'Drag and drop your CSV file here',
          or: 'or',
          browse: 'Browse file',
          parsing: 'Parsing file...',
          preview: 'Preview',
          rows: 'rows',
          remove: 'Remove',
          proceed: 'Proceed with this data',
          errors: {
            fileSize: `File must not exceed ${maxFileSize}MB`,
            fileType: 'Only CSV files are allowed',
            parseError: 'Error parsing CSV file',
            emptyFile: 'File is empty',
            encoding: 'Encoding error - ensure file is UTF-8',
          },
          tips: {
            title: 'CSV Tips',
            format: 'File must have headers in first row',
            required: 'Include at least: email, name',
            optional: 'Optional: department, location, position',
            encoding: 'Save file as UTF-8',
          },
        };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      setPreview(null);

      if (acceptedFiles.length === 0) return;

      const selectedFile = acceptedFiles[0];

      // Validate file size
      if (selectedFile.size > maxFileSize * 1024 * 1024) {
        setError(t.errors.fileSize);
        return;
      }

      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setError(t.errors.fileType);
        return;
      }

      setFile(selectedFile);
      parseCSV(selectedFile);
    },
    [maxFileSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: false,
  });

  const parseCSV = (file: File) => {
    setParsing(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        setParsing(false);

        // Validate results
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(
            (e) => e.type === 'Quotes' || e.type === 'FieldMismatch'
          );
          if (criticalErrors.length > 0) {
            setError(`${t.errors.parseError}: ${criticalErrors[0].message}`);
            return;
          }
        }

        if (results.data.length === 0) {
          setError(t.errors.emptyFile);
          return;
        }

        const headers = results.meta.fields || [];
        const rows = results.data as any[];

        // Set preview (first 10 rows)
        setPreview({
          headers,
          rows: rows.slice(0, 10),
        });

        // Call onParsed with full data
        onParsed({
          headers,
          rows,
          rowCount: rows.length,
        });
      },
      error: (error) => {
        setParsing(false);
        setError(`${t.errors.parseError}: ${error.message}`);
      },
    });
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!file && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all',
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600',
                error && 'border-red-500 bg-red-50 dark:bg-red-900/20'
              )}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {t.dragDrop}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{t.or}</p>
                  <Button variant="outline" className="mt-3">
                    {t.browse}
                  </Button>
                </div>
              </motion.div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Tips */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                {t.tips.title}
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• {t.tips.format}</li>
                <li>• {t.tips.required}</li>
                <li>• {t.tips.optional}</li>
                <li>• {t.tips.encoding}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parsing State */}
      {parsing && (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">{t.parsing}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {preview && file && !parsing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <CardTitle>{file.name}</CardTitle>
                  <CardDescription>
                    {preview.rows.length}+ {t.rows} •{' '}
                    {(file.size / 1024).toFixed(1)} KB
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemove}>
                <X className="w-4 h-4 mr-2" />
                {t.remove}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Headers */}
            <div className="mb-3 flex gap-2 flex-wrap">
              {preview.headers.map((header, idx) => (
                <Badge key={idx} variant="outline">
                  {header}
                </Badge>
              ))}
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {preview.headers.map((header, idx) => (
                        <th
                          key={idx}
                          className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                      >
                        {preview.headers.map((header, colIdx) => (
                          <td
                            key={colIdx}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400"
                          >
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              {t.preview} ({preview.rows.length} {t.rows})
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
