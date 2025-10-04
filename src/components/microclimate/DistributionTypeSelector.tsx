'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  ShieldAlert,
  Link2,
  Users,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export type DistributionMode = 'tokenized' | 'open' | '';

export interface DistributionConfig {
  mode: DistributionMode;
  securityAcknowledged: boolean;
  allowAnonymous?: boolean;
  generateQRCode?: boolean;
}

interface DistributionTypeSelectorProps {
  config: DistributionConfig;
  onChange: (config: DistributionConfig) => void;
  language?: 'es' | 'en';
}

/**
 * Distribution Type Selector Component
 *
 * Features:
 * - Tokenized distribution (recommended - secure unique links)
 * - Open distribution (single public link - less secure)
 * - Security warning system for open mode
 * - Checkbox acknowledgment required for open mode
 * - Visual indicators for security levels
 * - Bilingual support (ES/EN)
 * - QR code generation option
 * - Anonymous response toggle
 */
export function DistributionTypeSelector({
  config,
  onChange,
  language = 'es',
}: DistributionTypeSelectorProps) {
  const [localConfig, setLocalConfig] = useState<DistributionConfig>(config);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Translations
  const t =
    language === 'es'
      ? {
          title: 'Método de Distribución',
          description: 'Selecciona cómo se enviará la encuesta a los empleados',
          tokenized: 'Enlaces Tokenizados (Recomendado)',
          tokenizedDesc: 'Cada empleado recibe un enlace único y seguro',
          tokenizedBenefits: 'Beneficios:',
          tokenizedBenefit1: 'Previene que se compartan enlaces',
          tokenizedBenefit2: 'Rastrea quién completó la encuesta',
          tokenizedBenefit3: 'Permite enviar recordatorios personalizados',
          tokenizedBenefit4: 'Mayor seguridad de datos',
          tokenizedBenefit5: 'Auditabilidad completa',
          open: 'Enlace Público (No Recomendado)',
          openDesc: 'Un solo enlace público para todos los empleados',
          openWarnings: 'Advertencias:',
          openWarning1: 'Cualquiera con el enlace puede responder',
          openWarning2: 'No se puede rastrear quién completó la encuesta',
          openWarning3: 'Imposible enviar recordatorios personalizados',
          openWarning4: 'Riesgo de respuestas duplicadas o fraudulentas',
          openWarning5: 'Menor seguridad y auditabilidad',
          securityAck: 'Comprendo y acepto los riesgos de seguridad',
          securityAckRequired:
            'Debes aceptar los riesgos para usar enlace público',
          allowAnonymous: 'Permitir respuestas anónimas',
          allowAnonymousDesc: 'No recopilar información de identificación',
          generateQR: 'Generar código QR',
          generateQRDesc: 'Crear código QR para facilitar el acceso',
          recommended: 'Recomendado',
          notRecommended: 'No Recomendado',
          secure: 'Seguro',
          lessSecure: 'Menos Seguro',
          selectMode: 'Selecciona un método de distribución',
          modeChanged: 'Método de distribución actualizado',
          securityRiskWarning: '⚠️ Cambiando a modo menos seguro',
        }
      : {
          title: 'Distribution Method',
          description: 'Select how the survey will be sent to employees',
          tokenized: 'Tokenized Links (Recommended)',
          tokenizedDesc: 'Each employee receives a unique secure link',
          tokenizedBenefits: 'Benefits:',
          tokenizedBenefit1: 'Prevents link sharing',
          tokenizedBenefit2: 'Tracks who completed the survey',
          tokenizedBenefit3: 'Enables personalized reminders',
          tokenizedBenefit4: 'Higher data security',
          tokenizedBenefit5: 'Full auditability',
          open: 'Public Link (Not Recommended)',
          openDesc: 'Single public link for all employees',
          openWarnings: 'Warnings:',
          openWarning1: 'Anyone with the link can respond',
          openWarning2: 'Cannot track who completed the survey',
          openWarning3: 'Impossible to send personalized reminders',
          openWarning4: 'Risk of duplicate or fraudulent responses',
          openWarning5: 'Lower security and auditability',
          securityAck: 'I understand and accept the security risks',
          securityAckRequired: 'You must accept the risks to use public link',
          allowAnonymous: 'Allow anonymous responses',
          allowAnonymousDesc: 'Do not collect identifying information',
          generateQR: 'Generate QR code',
          generateQRDesc: 'Create QR code for easy access',
          recommended: 'Recommended',
          notRecommended: 'Not Recommended',
          secure: 'Secure',
          lessSecure: 'Less Secure',
          selectMode: 'Select a distribution method',
          modeChanged: 'Distribution method updated',
          securityRiskWarning: '⚠️ Switching to less secure mode',
        };

  // Update config and notify parent
  const updateConfig = (updates: Partial<DistributionConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  // Handle distribution mode change
  const handleModeChange = (mode: DistributionMode) => {
    // Warn if switching from tokenized to open
    if (localConfig.mode === 'tokenized' && mode === 'open') {
      toast.warning(t.securityRiskWarning, {
        description:
          language === 'es'
            ? 'Asegúrate de comprender los riesgos de seguridad'
            : 'Make sure you understand the security risks',
      });
    }

    // Reset security acknowledgment when switching modes
    updateConfig({
      mode,
      securityAcknowledged: mode === 'tokenized', // Auto-acknowledge for tokenized
    });

    toast.success(t.modeChanged);
  };

  // Handle security acknowledgment
  const handleSecurityAck = (checked: boolean) => {
    updateConfig({ securityAcknowledged: checked });

    if (checked) {
      toast.info(
        language === 'es'
          ? 'Riesgos de seguridad aceptados'
          : 'Security risks acknowledged'
      );
    }
  };

  // Determine if open mode is fully configured
  const isOpenModeValid =
    localConfig.mode !== 'open' || localConfig.securityAcknowledged;

  return (
    <Card className="border-t-4 border-t-purple-500">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-xl">{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <RadioGroup
          value={localConfig.mode}
          onValueChange={(value) => handleModeChange(value as DistributionMode)}
          className="space-y-4"
        >
          {/* Tokenized Distribution Option */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
              localConfig.mode === 'tokenized'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
            }`}
            onClick={() => handleModeChange('tokenized')}
          >
            <div className="flex items-start gap-4">
              <RadioGroupItem
                value="tokenized"
                id="tokenized"
                className="mt-1"
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="tokenized"
                    className="text-base font-semibold cursor-pointer"
                  >
                    {t.tokenized}
                  </Label>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t.recommended}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-green-600 text-green-600"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    {t.secure}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.tokenizedDesc}
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    {t.tokenizedBenefits}
                  </p>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      {t.tokenizedBenefit1}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      {t.tokenizedBenefit2}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      {t.tokenizedBenefit3}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      {t.tokenizedBenefit4}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      {t.tokenizedBenefit5}
                    </li>
                  </ul>
                </div>
              </div>
              <Users className="w-8 h-8 text-green-600 dark:text-green-400 shrink-0" />
            </div>
          </motion.div>

          {/* Open Distribution Option */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
              localConfig.mode === 'open'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
            }`}
            onClick={() => handleModeChange('open')}
          >
            <div className="flex items-start gap-4">
              <RadioGroupItem value="open" id="open" className="mt-1" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="open"
                    className="text-base font-semibold cursor-pointer"
                  >
                    {t.open}
                  </Label>
                  <Badge variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {t.notRecommended}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-orange-600 text-orange-600"
                  >
                    <Unlock className="w-3 h-3 mr-1" />
                    {t.lessSecure}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.openDesc}
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                    {t.openWarnings}
                  </p>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0" />
                      {t.openWarning1}
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0" />
                      {t.openWarning2}
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0" />
                      {t.openWarning3}
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0" />
                      {t.openWarning4}
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0" />
                      {t.openWarning5}
                    </li>
                  </ul>
                </div>

                {/* Security Acknowledgment (only show when open is selected) */}
                <AnimatePresence>
                  {localConfig.mode === 'open' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="pt-3 border-t border-orange-200 dark:border-orange-800"
                    >
                      <div className="flex items-start gap-3 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Checkbox
                          id="security-ack"
                          checked={localConfig.securityAcknowledged}
                          onCheckedChange={handleSecurityAck}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor="security-ack"
                          className="text-sm font-medium cursor-pointer text-orange-900 dark:text-orange-100"
                        >
                          {t.securityAck}
                        </Label>
                      </div>
                      {!localConfig.securityAcknowledged && (
                        <Alert className="mt-2 border-orange-300 bg-orange-50 dark:bg-orange-900/20">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <AlertDescription className="text-orange-800 dark:text-orange-200">
                            {t.securityAckRequired}
                          </AlertDescription>
                        </Alert>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link2 className="w-8 h-8 text-orange-600 dark:text-orange-400 shrink-0" />
            </div>
          </motion.div>
        </RadioGroup>

        {/* No Selection Warning */}
        {!localConfig.mode && (
          <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-900/20">
            <Info className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              {t.selectMode}
            </AlertDescription>
          </Alert>
        )}

        {/* Additional Options */}
        {localConfig.mode && (
          <>
            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">
                {language === 'es'
                  ? 'Opciones Adicionales'
                  : 'Additional Options'}
              </h4>

              {/* Anonymous Responses (only for open mode) */}
              {localConfig.mode === 'open' && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="anonymous" className="font-medium">
                      {t.allowAnonymous}
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t.allowAnonymousDesc}
                    </p>
                  </div>
                  <Checkbox
                    id="anonymous"
                    checked={localConfig.allowAnonymous || false}
                    onCheckedChange={(checked) =>
                      updateConfig({ allowAnonymous: checked as boolean })
                    }
                  />
                </div>
              )}

              {/* QR Code Generation */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="qrcode" className="font-medium">
                    {t.generateQR}
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t.generateQRDesc}
                  </p>
                </div>
                <Checkbox
                  id="qrcode"
                  checked={localConfig.generateQRCode || false}
                  onCheckedChange={(checked) =>
                    updateConfig({ generateQRCode: checked as boolean })
                  }
                />
              </div>
            </div>
          </>
        )}

        {/* Validation Status */}
        {localConfig.mode && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
            {isOpenModeValid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  {language === 'es'
                    ? 'Configuración de distribución válida'
                    : 'Distribution configuration is valid'}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="text-sm text-orange-700 dark:text-orange-400">
                  {t.securityAckRequired}
                </span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
