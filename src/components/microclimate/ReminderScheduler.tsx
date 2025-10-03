'use client';

import React, { useState, useEffect } from 'react';
import { format, subHours, subDays, differenceInHours } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Plus,
  X,
  Clock,
  Mail,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ReminderInterval {
  id: string;
  value: number;
  unit: 'hours' | 'days';
}

export interface ReminderConfig {
  enabled: boolean;
  intervals: ReminderInterval[];
  maxReminders: number;
  emailTemplate: {
    subject_es: string;
    subject_en: string;
    body_es: string;
    body_en: string;
  };
}

interface ReminderSchedulerProps {
  endDate: string; // ISO date string
  config: ReminderConfig;
  onChange: (config: ReminderConfig) => void;
  language?: 'es' | 'en';
}

/**
 * Reminder Scheduler Component
 *
 * Features:
 * - Enable/disable reminder system
 * - Configure multiple reminder intervals (hours/days before end date)
 * - Set maximum number of reminders
 * - Bilingual email template editor (ES/EN)
 * - Preview of calculated reminder times
 * - Smart validation (no duplicates, within survey duration)
 * - Default templates with placeholders
 */
export function ReminderScheduler({
  endDate,
  config,
  onChange,
  language = 'es',
}: ReminderSchedulerProps) {
  const [localConfig, setLocalConfig] = useState<ReminderConfig>(config);
  const [previewLanguage, setPreviewLanguage] = useState<'es' | 'en'>(language);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Translations
  const t =
    language === 'es'
      ? {
          title: 'Recordatorios Automáticos',
          description: 'Configura recordatorios por email antes del cierre de la encuesta',
          enableReminders: 'Habilitar Recordatorios',
          reminderSchedule: 'Programación de Recordatorios',
          addReminder: 'Agregar Recordatorio',
          maxReminders: 'Máximo de Recordatorios',
          maxRemindersDesc: 'Límite de recordatorios que se enviarán a cada empleado',
          timeBefore: 'Tiempo Antes del Cierre',
          hours: 'Horas',
          days: 'Días',
          emailTemplate: 'Plantilla de Email',
          subject: 'Asunto',
          body: 'Cuerpo del Mensaje',
          preview: 'Vista Previa',
          previewSchedule: 'Calendario de Recordatorios',
          noReminders: 'No hay recordatorios configurados',
          addFirstReminder: 'Agrega tu primer recordatorio arriba',
          reminderWillSend: 'El recordatorio se enviará',
          beforeEnd: 'antes del cierre',
          placeholders: 'Marcadores Disponibles',
          placeholderName: '{{nombre}} - Nombre del empleado',
          placeholderSurvey: '{{encuesta}} - Nombre de la encuesta',
          placeholderDeadline: '{{fecha_limite}} - Fecha límite',
          placeholderDepartment: '{{departamento}} - Departamento',
          spanish: 'Español',
          english: 'Inglés',
          validateError: 'Error de Validación',
          duplicateInterval: 'Ya existe un recordatorio con este intervalo',
          intervalTooLarge: 'El intervalo excede la duración de la encuesta',
          save: 'Guardar Cambios',
        }
      : {
          title: 'Automatic Reminders',
          description: 'Configure email reminders before survey closure',
          enableReminders: 'Enable Reminders',
          reminderSchedule: 'Reminder Schedule',
          addReminder: 'Add Reminder',
          maxReminders: 'Maximum Reminders',
          maxRemindersDesc: 'Limit of reminders that will be sent to each employee',
          timeBefore: 'Time Before End',
          hours: 'Hours',
          days: 'Days',
          emailTemplate: 'Email Template',
          subject: 'Subject',
          body: 'Message Body',
          preview: 'Preview',
          previewSchedule: 'Reminder Schedule',
          noReminders: 'No reminders configured',
          addFirstReminder: 'Add your first reminder above',
          reminderWillSend: 'Reminder will be sent',
          beforeEnd: 'before end',
          placeholders: 'Available Placeholders',
          placeholderName: '{{name}} - Employee name',
          placeholderSurvey: '{{survey}} - Survey name',
          placeholderDeadline: '{{deadline}} - Deadline date',
          placeholderDepartment: '{{department}} - Department',
          spanish: 'Spanish',
          english: 'English',
          validateError: 'Validation Error',
          duplicateInterval: 'A reminder with this interval already exists',
          intervalTooLarge: 'Interval exceeds survey duration',
          save: 'Save Changes',
        };

  // Default email templates
  const defaultTemplates = {
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
  };

  // Update local config and notify parent
  const updateConfig = (updates: Partial<ReminderConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  // Toggle reminder system
  const toggleReminders = (enabled: boolean) => {
    updateConfig({ enabled });
    
    // Initialize with default template if enabling for first time
    if (enabled && localConfig.intervals.length === 0) {
      addReminder(24, 'hours');
    }
  };

  // Add a new reminder interval
  const addReminder = (value: number = 24, unit: 'hours' | 'days' = 'hours') => {
    const newInterval: ReminderInterval = {
      id: `reminder-${Date.now()}`,
      value,
      unit,
    };

    // Check for duplicates
    const normalizedValue = unit === 'days' ? value * 24 : value;
    const isDuplicate = localConfig.intervals.some((interval) => {
      const existingNormalized =
        interval.unit === 'days' ? interval.value * 24 : interval.value;
      return existingNormalized === normalizedValue;
    });

    if (isDuplicate) {
      toast.error(t.validateError, { description: t.duplicateInterval });
      return;
    }

    // Validate interval doesn't exceed survey duration (if we have endDate)
    if (endDate) {
      const endDateTime = new Date(endDate);
      const now = new Date();
      const surveyDurationHours = differenceInHours(endDateTime, now);
      
      if (normalizedValue > surveyDurationHours) {
        toast.warning(t.validateError, { description: t.intervalTooLarge });
        // Don't prevent adding, just warn
      }
    }

    updateConfig({
      intervals: [...localConfig.intervals, newInterval].sort((a, b) => {
        const aHours = a.unit === 'days' ? a.value * 24 : a.value;
        const bHours = b.unit === 'days' ? b.value * 24 : b.value;
        return bHours - aHours; // Sort descending (furthest first)
      }),
    });

    toast.success(
      language === 'es' ? 'Recordatorio agregado' : 'Reminder added'
    );
  };

  // Remove a reminder interval
  const removeReminder = (id: string) => {
    updateConfig({
      intervals: localConfig.intervals.filter((interval) => interval.id !== id),
    });
    
    toast.success(
      language === 'es' ? 'Recordatorio eliminado' : 'Reminder removed'
    );
  };

  // Update reminder interval value
  const updateReminderValue = (id: string, value: number) => {
    updateConfig({
      intervals: localConfig.intervals.map((interval) =>
        interval.id === id ? { ...interval, value } : interval
      ),
    });
  };

  // Update reminder interval unit
  const updateReminderUnit = (id: string, unit: 'hours' | 'days') => {
    updateConfig({
      intervals: localConfig.intervals.map((interval) =>
        interval.id === id ? { ...interval, unit } : interval
      ),
    });
  };

  // Update max reminders
  const updateMaxReminders = (max: number) => {
    updateConfig({ maxReminders: Math.max(1, Math.min(10, max)) });
  };

  // Update email template
  const updateTemplate = (
    field: keyof ReminderConfig['emailTemplate'],
    value: string
  ) => {
    updateConfig({
      emailTemplate: {
        ...localConfig.emailTemplate,
        [field]: value,
      },
    });
  };

  // Calculate reminder send times
  const calculateReminderTimes = () => {
    if (!endDate) return [];

    const endDateTime = new Date(endDate);
    return localConfig.intervals.map((interval) => {
      const sendTime =
        interval.unit === 'days'
          ? subDays(endDateTime, interval.value)
          : subHours(endDateTime, interval.value);

      return {
        id: interval.id,
        interval,
        sendTime,
        formatted: format(
          sendTime,
          language === 'es' ? "d 'de' MMMM, yyyy 'a las' HH:mm" : "MMMM d, yyyy 'at' HH:mm",
          { locale: language === 'es' ? es : enUS }
        ),
      };
    });
  };

  const reminderTimes = calculateReminderTimes();

  return (
    <Card className="border-t-4 border-t-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
          </div>
          <Switch
            checked={localConfig.enabled}
            onCheckedChange={toggleReminders}
            className="scale-110"
          />
        </div>
      </CardHeader>

      <AnimatePresence>
        {localConfig.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-6">
              {/* Reminder Schedule Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    {t.reminderSchedule}
                  </Label>
                  <Button
                    onClick={() => addReminder()}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t.addReminder}
                  </Button>
                </div>

                {/* Reminder Intervals */}
                <div className="space-y-2">
                  {localConfig.intervals.length === 0 ? (
                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertDescription>
                        {t.noReminders}. {t.addFirstReminder}.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    localConfig.intervals.map((interval) => (
                      <motion.div
                        key={interval.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900"
                      >
                        <Clock className="w-4 h-4 text-gray-500 shrink-0" />
                        <Input
                          type="number"
                          min="1"
                          value={interval.value}
                          onChange={(e) =>
                            updateReminderValue(
                              interval.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-20"
                        />
                        <Select
                          value={interval.unit}
                          onValueChange={(value: 'hours' | 'days') =>
                            updateReminderUnit(interval.id, value)
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hours">{t.hours}</SelectItem>
                            <SelectItem value="days">{t.days}</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                          {t.beforeEnd}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReminder(interval.id)}
                          className="shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Max Reminders Setting */}
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex-1">
                    <Label className="font-semibold">{t.maxReminders}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t.maxRemindersDesc}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={localConfig.maxReminders}
                    onChange={(e) => updateMaxReminders(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                </div>
              </div>

              <Separator />

              {/* Preview Schedule */}
              {reminderTimes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <Label className="text-base font-semibold">
                      {t.previewSchedule}
                    </Label>
                  </div>
                  <div className="space-y-2">
                    {reminderTimes.map((reminder, index) => (
                      <div
                        key={reminder.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20"
                      >
                        <Badge variant="outline" className="shrink-0">
                          #{index + 1}
                        </Badge>
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {reminder.interval.value} {reminder.interval.unit === 'days' ? t.days : t.hours} {t.beforeEnd}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {reminder.formatted}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Email Template Editor */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <Label className="text-base font-semibold">
                    {t.emailTemplate}
                  </Label>
                </div>

                {/* Language Tabs */}
                <Tabs
                  value={previewLanguage}
                  onValueChange={(value: string) =>
                    setPreviewLanguage(value as 'es' | 'en')
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="es">🇪🇸 {t.spanish}</TabsTrigger>
                    <TabsTrigger value="en">🇬🇧 {t.english}</TabsTrigger>
                  </TabsList>

                  {/* Spanish Template */}
                  <TabsContent value="es" className="space-y-3">
                    <div>
                      <Label>{t.subject}</Label>
                      <Input
                        value={localConfig.emailTemplate.subject_es}
                        onChange={(e) =>
                          updateTemplate('subject_es', e.target.value)
                        }
                        placeholder={defaultTemplates.subject_es}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>{t.body}</Label>
                      <Textarea
                        value={localConfig.emailTemplate.body_es}
                        onChange={(e) => updateTemplate('body_es', e.target.value)}
                        placeholder={defaultTemplates.body_es}
                        rows={8}
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                  </TabsContent>

                  {/* English Template */}
                  <TabsContent value="en" className="space-y-3">
                    <div>
                      <Label>{t.subject}</Label>
                      <Input
                        value={localConfig.emailTemplate.subject_en}
                        onChange={(e) =>
                          updateTemplate('subject_en', e.target.value)
                        }
                        placeholder={defaultTemplates.subject_en}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>{t.body}</Label>
                      <Textarea
                        value={localConfig.emailTemplate.body_en}
                        onChange={(e) => updateTemplate('body_en', e.target.value)}
                        placeholder={defaultTemplates.body_en}
                        rows={8}
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Placeholders Help */}
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">{t.placeholders}:</p>
                    <ul className="text-xs space-y-1 font-mono">
                      <li>{t.placeholderName}</li>
                      <li>{t.placeholderSurvey}</li>
                      <li>{t.placeholderDeadline}</li>
                      <li>{t.placeholderDepartment}</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
