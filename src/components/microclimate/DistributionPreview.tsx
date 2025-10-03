'use client';

import React from 'react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  Users,
  Calendar,
  Clock,
  Globe,
  Bell,
  Target,
  BarChart3,
  Info,
} from 'lucide-react';
import type { ScheduleData } from './ScheduleConfig';

interface DistributionPreviewProps {
  surveyTitle: string;
  surveyUrl: string;
  schedule: ScheduleData;
  targetCount: number;
  questionCount: number;
  uploadMethod?: 'all' | 'csv' | 'manual';
  language?: 'es' | 'en';
}

/**
 * Distribution Preview Component
 *
 * Displays a comprehensive summary of the survey before creation:
 * - Survey details
 * - Schedule information
 * - Target audience stats
 * - Distribution method
 */
export function DistributionPreview({
  surveyTitle,
  surveyUrl,
  schedule,
  targetCount,
  questionCount,
  uploadMethod = 'all',
  language = 'es',
}: DistributionPreviewProps) {
  // Translations
  const t =
    language === 'es'
      ? {
          title: 'Vista Previa de Distribución',
          description: 'Revisa todos los detalles antes de crear la encuesta',
          surveyDetails: 'Detalles de la Encuesta',
          surveyTitle: 'Título',
          surveyUrl: 'URL',
          questions: 'Preguntas',
          schedule: 'Programación',
          startDate: 'Fecha de Inicio',
          endDate: 'Fecha de Finalización',
          startTime: 'Hora de Inicio',
          endTime: 'Hora de Finalización',
          timezone: 'Zona Horaria',
          duration: 'Duración',
          days: 'días',
          targetAudience: 'Audiencia Objetivo',
          totalRecipients: 'Total de Destinatarios',
          distributionMethod: 'Método de Distribución',
          allEmployees: 'Todos los Empleados',
          csvImport: 'Importación CSV',
          manualEntry: 'Entrada Manual',
          reminders: 'Recordatorios',
          enabled: 'Habilitados',
          disabled: 'Deshabilitados',
          frequency: 'Frecuencia',
          daily: 'Diario',
          weekly: 'Semanal',
          biweekly: 'Quincenal',
          daysBefore: 'días antes del cierre',
          autoClose: 'Cierre Automático',
          yes: 'Sí',
          no: 'No',
          readyToLaunch: 'Todo listo para lanzar la encuesta',
          estimatedCompletion: 'Tiempo estimado de completado',
          minutes: 'minutos',
        }
      : {
          title: 'Distribution Preview',
          description: 'Review all details before creating the survey',
          surveyDetails: 'Survey Details',
          surveyTitle: 'Title',
          surveyUrl: 'URL',
          questions: 'Questions',
          schedule: 'Schedule',
          startDate: 'Start Date',
          endDate: 'End Date',
          startTime: 'Start Time',
          endTime: 'End Time',
          timezone: 'Timezone',
          duration: 'Duration',
          days: 'days',
          targetAudience: 'Target Audience',
          totalRecipients: 'Total Recipients',
          distributionMethod: 'Distribution Method',
          allEmployees: 'All Employees',
          csvImport: 'CSV Import',
          manualEntry: 'Manual Entry',
          reminders: 'Reminders',
          enabled: 'Enabled',
          disabled: 'Disabled',
          frequency: 'Frequency',
          daily: 'Daily',
          weekly: 'Weekly',
          biweekly: 'Biweekly',
          daysBefore: 'days before close',
          autoClose: 'Auto Close',
          yes: 'Yes',
          no: 'No',
          readyToLaunch: 'Ready to launch the survey',
          estimatedCompletion: 'Estimated completion time',
          minutes: 'minutes',
        };

  // Calculate duration
  const calculateDuration = () => {
    const start = new Date(schedule.startDate);
    const end = new Date(schedule.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPP', { locale: language === 'es' ? es : enUS });
  };

  // Get distribution method label
  const getDistributionMethodLabel = () => {
    switch (uploadMethod) {
      case 'all':
        return t.allEmployees;
      case 'csv':
        return t.csvImport;
      case 'manual':
        return t.manualEntry;
      default:
        return t.allEmployees;
    }
  };

  // Get reminder frequency label
  const getReminderFrequencyLabel = () => {
    switch (schedule.reminderFrequency) {
      case 'daily':
        return t.daily;
      case 'weekly':
        return t.weekly;
      case 'biweekly':
        return t.biweekly;
      default:
        return t.weekly;
    }
  };

  // Estimate completion time (rough estimate: 30 seconds per question)
  const estimatedCompletionTime = Math.ceil((questionCount * 30) / 60);

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-300">
          {t.readyToLaunch}
        </AlertDescription>
      </Alert>

      {/* Survey Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t.surveyDetails}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t.surveyTitle}
              </p>
              <p className="text-lg font-semibold">{surveyTitle}</p>
            </div>

            {/* Questions */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t.questions}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-base">
                  {questionCount} {t.questions.toLowerCase()}
                </Badge>
                <span className="text-sm text-gray-500">
                  (~{estimatedCompletionTime} {t.minutes})
                </span>
              </div>
            </div>
          </div>

          {/* URL */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t.surveyUrl}
            </p>
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
              <p className="text-sm font-mono text-blue-600 dark:text-blue-400 break-all">
                {surveyUrl}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t.schedule}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t.startDate}
              </p>
              <p className="text-base font-semibold">
                {formatDate(schedule.startDate)}
              </p>
              {schedule.startTime && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {schedule.startTime}
                </p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t.endDate}
              </p>
              <p className="text-base font-semibold">
                {formatDate(schedule.endDate)}
              </p>
              {schedule.endTime && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {schedule.endTime}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {/* Duration */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t.duration}
              </p>
              <Badge variant="secondary" className="text-base">
                {calculateDuration()} {t.days}
              </Badge>
            </div>

            {/* Timezone */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {t.timezone}
              </p>
              <p className="text-sm">{schedule.timezone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Audience Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {t.targetAudience}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Recipients */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Users className="w-4 h-4" />
                {t.totalRecipients}
              </p>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {targetCount.toLocaleString()}
                </p>
              </motion.div>
            </div>

            {/* Distribution Method */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t.distributionMethod}
              </p>
              <Badge variant="outline" className="text-base">
                {getDistributionMethodLabel()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminders & Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t.reminders}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Reminders Enabled */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t.reminders}
              </p>
              <Badge
                variant={schedule.enableReminders ? 'default' : 'secondary'}
              >
                {schedule.enableReminders ? t.enabled : t.disabled}
              </Badge>
            </div>

            {/* Frequency */}
            {schedule.enableReminders && (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t.frequency}
                  </p>
                  <p className="text-sm">{getReminderFrequencyLabel()}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t.daysBefore}
                  </p>
                  <p className="text-sm">
                    {schedule.reminderDaysBefore} {t.daysBefore}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t">
            {/* Auto Close */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t.autoClose}
              </p>
              <Badge variant={schedule.autoClose ? 'default' : 'secondary'}>
                {schedule.autoClose ? t.yes : t.no}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          {language === 'es'
            ? 'Al finalizar, se creará la encuesta y se enviará a los destinatarios según la programación configurada.'
            : 'Upon completion, the survey will be created and sent to recipients according to the configured schedule.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
