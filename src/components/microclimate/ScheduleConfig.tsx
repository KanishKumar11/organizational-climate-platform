'use client';

import React, { useState, useEffect } from 'react';
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  isAfter,
  isBefore,
} from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, Bell, CheckCircle2, Globe } from 'lucide-react';
import { ReminderScheduler, ReminderConfig } from './ReminderScheduler';
import {
  DistributionTypeSelector,
  DistributionConfig,
} from './DistributionTypeSelector';
import {
  TIMEZONE_GROUPS,
  DEFAULT_TIMEZONE,
  getTimezoneDisplayName,
  formatScheduleDisplay,
  getBrowserTimezone,
} from '@/lib/timezone';

interface ScheduleConfigProps {
  onScheduleChange?: (schedule: ScheduleData) => void;
  defaultTimezone?: string; // Timezone from company settings
  companyId?: string; // For fetching company timezone
  language?: 'es' | 'en';
}

export interface ScheduleData {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  timezone: string;
  enableReminders: boolean;
  reminderFrequency?: 'daily' | 'weekly' | 'biweekly';
  reminderDaysBefore?: number;
  autoClose: boolean;
  reminders?: ReminderConfig;
  distribution?: DistributionConfig;
}

type QuickOption = '1week' | '2weeks' | '1month' | 'custom';

/**
 * Schedule Configuration Component
 *
 * Features:
 * - Date range selection (start/end)
 * - Time selection (optional)
 * - Timezone support
 * - Reminder configuration
 * - Auto-close option
 * - Quick date presets
 */
export function ScheduleConfig({
  onScheduleChange,
  defaultTimezone,
  companyId,
  language = 'es',
}: ScheduleConfigProps) {
  const today = new Date();
  const defaultEndDate = addWeeks(today, 2);

  const [startDate, setStartDate] = useState<string>(
    format(today, 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(defaultEndDate, 'yyyy-MM-dd')
  );
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('23:59');
  const [timezone, setTimezone] = useState<string>(
    defaultTimezone || DEFAULT_TIMEZONE
  );
  const [browserTimezone, setBrowserTimezone] = useState<string>('');
  const [enableReminders, setEnableReminders] = useState<boolean>(false);
  const [reminderFrequency, setReminderFrequency] = useState<
    'daily' | 'weekly' | 'biweekly'
  >('weekly');
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(3);
  const [autoClose, setAutoClose] = useState<boolean>(true);
  const [quickOption, setQuickOption] = useState<QuickOption>('2weeks');
  const [reminders, setReminders] = useState<ReminderConfig>({
    enabled: false,
    intervals: [],
    maxReminders: 3,
    emailTemplate: {
      subject_es: 'Recordatorio: Completa la encuesta {{encuesta}}',
      subject_en: 'Reminder: Complete the {{survey}} survey',
      body_es: `Hola {{nombre}},

Te recordamos que la encuesta "{{encuesta}}" cierra el {{fecha_limite}}.

Por favor, toma unos minutos para completarla. Tu opinión es muy importante para nosotros.

Gracias,
Equipo de Recursos Humanos`,
      body_en: `Hello {{name}},

This is a reminder that the "{{survey}}" survey closes on {{deadline}}.

Please take a few minutes to complete it. Your feedback is very important to us.

Thank you,
Human Resources Team`,
    },
  });
  const [distribution, setDistribution] = useState<DistributionConfig>({
    mode: 'tokenized', // Default to tokenized (most secure)
    securityAcknowledged: true, // Auto-acknowledged for tokenized
    allowAnonymous: false,
    generateQRCode: true,
  });

  // Translations
  const t =
    language === 'es'
      ? {
          title: 'Programación',
          description: 'Configura las fechas y horarios de la encuesta',
          startDate: 'Fecha de Inicio',
          endDate: 'Fecha de Finalización',
          startTime: 'Hora de Inicio',
          endTime: 'Hora de Finalización',
          timezone: 'Zona Horaria',
          quickOptions: 'Opciones Rápidas',
          oneWeek: '1 Semana',
          twoWeeks: '2 Semanas',
          oneMonth: '1 Mes',
          custom: 'Personalizado',
          reminders: 'Recordatorios',
          enableReminders: 'Habilitar Recordatorios',
          reminderFrequency: 'Frecuencia de Recordatorios',
          daily: 'Diario',
          weekly: 'Semanal',
          biweekly: 'Quincenal',
          reminderDaysBefore: 'Días Antes de Cierre',
          autoClose: 'Cierre Automático',
          autoCloseDesc: 'Cerrar automáticamente la encuesta cuando finalice',
          duration: 'Duración',
          days: 'días',
          validationError: 'Error de Validación',
          endBeforeStart:
            'La fecha de finalización debe ser posterior a la de inicio',
          surveySchedule: 'Horario de la Encuesta',
          active: 'Activa',
          scheduled: 'Programada',
        }
      : {
          title: 'Schedule',
          description: 'Configure survey dates and times',
          startDate: 'Start Date',
          endDate: 'End Date',
          startTime: 'Start Time',
          endTime: 'End Time',
          timezone: 'Timezone',
          quickOptions: 'Quick Options',
          oneWeek: '1 Week',
          twoWeeks: '2 Weeks',
          oneMonth: '1 Month',
          custom: 'Custom',
          reminders: 'Reminders',
          enableReminders: 'Enable Reminders',
          reminderFrequency: 'Reminder Frequency',
          daily: 'Daily',
          weekly: 'Weekly',
          biweekly: 'Biweekly',
          reminderDaysBefore: 'Days Before Close',
          autoClose: 'Auto Close',
          autoCloseDesc: 'Automatically close survey when it ends',
          duration: 'Duration',
          days: 'days',
          validationError: 'Validation Error',
          endBeforeStart: 'End date must be after start date',
          surveySchedule: 'Survey Schedule',
          active: 'Active',
          scheduled: 'Scheduled',
        };

  // Detect browser timezone on mount
  useEffect(() => {
    try {
      const detected = getBrowserTimezone();
      setBrowserTimezone(detected);
    } catch (error) {
      console.error('Error detecting browser timezone:', error);
    }
  }, []);

  // Calculate duration
  const calculateDuration = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle quick option change
  const handleQuickOptionChange = (option: QuickOption) => {
    setQuickOption(option);

    if (option !== 'custom') {
      const start = new Date();
      let end = new Date();

      switch (option) {
        case '1week':
          end = addWeeks(start, 1);
          break;
        case '2weeks':
          end = addWeeks(start, 2);
          break;
        case '1month':
          end = addMonths(start, 1);
          break;
      }

      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
    }
  };

  // Validate dates
  const validateDates = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return isAfter(end, start);
  };

  const isValid = validateDates();

  // Notify parent component
  useEffect(() => {
    if (!isValid) return;

    const scheduleData: ScheduleData = {
      startDate,
      endDate,
      startTime,
      endTime,
      timezone,
      enableReminders,
      reminderFrequency: enableReminders ? reminderFrequency : undefined,
      reminderDaysBefore: enableReminders ? reminderDaysBefore : undefined,
      autoClose,
      reminders,
      distribution,
    };

    onScheduleChange?.(scheduleData);
  }, [
    startDate,
    endDate,
    startTime,
    endTime,
    timezone,
    enableReminders,
    reminderFrequency,
    reminderDaysBefore,
    autoClose,
    reminders,
    distribution,
    isValid,
    onScheduleChange,
  ]);

  // Check if survey is currently active
  const isCurrentlyActive = () => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return isAfter(now, start) && isBefore(now, end);
  };

  return (
    <div className="space-y-6">
      {/* Schedule Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Options */}
          <div className="space-y-2">
            <Label>{t.quickOptions}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickOptionChange('1week')}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  quickOption === '1week'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {t.oneWeek}
              </button>
              <button
                onClick={() => handleQuickOptionChange('2weeks')}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  quickOption === '2weeks'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {t.twoWeeks}
              </button>
              <button
                onClick={() => handleQuickOptionChange('1month')}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  quickOption === '1month'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {t.oneMonth}
              </button>
              <button
                onClick={() => handleQuickOptionChange('custom')}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  quickOption === 'custom'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {t.custom}
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t.startDate}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setQuickOption('custom');
                }}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t.endDate}</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setQuickOption('custom');
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">
                <Clock className="w-4 h-4 inline mr-1" />
                {t.startTime}
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">
                <Clock className="w-4 h-4 inline mr-1" />
                {t.endTime}
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t.timezone}
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {/* Browser Timezone Suggestion */}
                {browserTimezone && browserTimezone !== timezone && (
                  <>
                    <SelectGroup>
                      <SelectLabel>
                        {language === 'es' ? 'Sugerencia' : 'Suggested'}
                      </SelectLabel>
                      <SelectItem value={browserTimezone}>
                        {getTimezoneDisplayName(browserTimezone)} (
                        {language === 'es' ? 'Tu navegador' : 'Your browser'})
                      </SelectItem>
                    </SelectGroup>
                  </>
                )}
                
                {/* Grouped Timezones */}
                {Object.entries(TIMEZONE_GROUPS).map(([group, timezones]) => (
                  <SelectGroup key={group}>
                    <SelectLabel>{group}</SelectLabel>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {defaultTimezone && timezone !== defaultTimezone && (
              <p className="text-xs text-amber-600">
                {language === 'es'
                  ? `Zona horaria de la empresa: ${getTimezoneDisplayName(defaultTimezone)}`
                  : `Company timezone: ${getTimezoneDisplayName(defaultTimezone)}`}
              </p>
            )}
          </div>

          {/* Duration Badge */}
          {isValid && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <Badge variant="outline" className="text-sm">
                {t.duration}: {calculateDuration()} {t.days}
              </Badge>
              <Badge
                variant={isCurrentlyActive() ? 'default' : 'secondary'}
                className="text-sm"
              >
                {isCurrentlyActive() ? t.active : t.scheduled}
              </Badge>
            </motion.div>
          )}

          {/* Validation Error */}
          {!isValid && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{t.endBeforeStart}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Reminders - Now using ReminderScheduler Component */}
      <ReminderScheduler
        endDate={endDate}
        config={reminders}
        onChange={setReminders}
        language={language}
      />

      {/* Distribution Type Selector */}
      <DistributionTypeSelector
        config={distribution}
        onChange={setDistribution}
        language={language}
      />

      {/* Other Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5" />
            {language === 'es'
              ? 'Configuración Adicional'
              : 'Additional Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto Close */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoClose">{t.autoClose}</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.autoCloseDesc}
              </p>
            </div>
            <Switch
              id="autoClose"
              checked={autoClose}
              onCheckedChange={setAutoClose}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
