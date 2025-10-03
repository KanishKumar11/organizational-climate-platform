'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useDraftRecovery, useTimeUntilExpiry } from '@/hooks/useDraftRecovery';
import { useAutosave } from '@/hooks/useAutosave';
import { useWizardNavigation } from '@/hooks/useWizardNavigation';
import { DraftRecoveryBanner, DraftRecoveryContainer } from './DraftRecoveryBanner';
import { WizardStepper, CompactWizardStepper } from './WizardStepper';
import { AutosaveIndicator } from './AutosaveIndicator';
import { QuestionLibraryBrowser } from './QuestionLibraryBrowser';
import { QuickAddPanel } from './QuickAddPanel';
import { MultilingualQuestionEditor } from './MultilingualQuestionEditor';
import { CSVImporter } from './CSVImporter';
import { ColumnMapper, ColumnMapping } from './ColumnMapper';
import { ValidationPanel, ValidationResult, MappedEmployee } from './ValidationPanel';
import { AudiencePreviewCard, TargetEmployee } from './AudiencePreviewCard';
import { QRCodeGenerator } from './QRCodeGenerator';
import { ScheduleConfig, ScheduleData } from './ScheduleConfig';
import { DistributionPreview } from './DistributionPreview';
import { ManualEmployeeEntry } from './ManualEmployeeEntry';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Save, 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Plus,
  FileWarning,
  X,
  Users,
  FileSpreadsheet,
  UserPlus,
  AlertCircle,
  RefreshCw,
  Calendar,
  QrCode as QrCodeIcon,
} from 'lucide-react';

/**
 * Microclimate Survey Wizard Component
 * 
 * Complete 4-step wizard for creating microclimate surveys with:
 * - Step 1: Basic Info (title, description)
 * - Step 2: Questions (library browser, quick-add, custom questions)
 * - Step 3: Targeting (coming in Phase 7)
 * - Step 4: Scheduling (coming in Phase 8)
 * 
 * Features:
 * - Auto-save every 5s
 * - Draft recovery
 * - Step validation
 * - Progress tracking
 * - Multilingual support
 */

interface MicroclimateWizardProps {
  companyId: string;
  draftId?: string;
  onComplete?: (surveyId: string) => void;
  onCancel?: () => void;
  language?: 'es' | 'en';
}

export function MicroclimateWizard({
  companyId,
  draftId: initialDraftId,
  onComplete,
  onCancel,
  language = 'es',
}: MicroclimateWizardProps) {
  const { data: session } = useSession();
  
  // State
  const [step1Data, setStep1Data] = useState({ title: '', description: '' });
  const [step2Data, setStep2Data] = useState<{ questionIds: string[]; customQuestions: any[] }>({
    questionIds: [],
    customQuestions: [],
  });
  const [step3Data, setStep3Data] = useState<{
    targetEmployees: TargetEmployee[];
    uploadMethod: 'csv' | 'manual' | 'all';
    csvData?: { headers: string[]; rows: any[]; rowCount: number };
    mapping?: ColumnMapping;
    validationResult?: ValidationResult;
  }>({
    targetEmployees: [],
    uploadMethod: 'all',
  });
  const [step4Data, setStep4Data] = useState<{
    schedule?: ScheduleData;
    qrCodeDataUrl?: string;
    surveyUrl: string;
  }>({
    surveyUrl: '',
  });
  const [draftId, setDraftId] = useState<string | null>(initialDraftId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomQuestionEditor, setShowCustomQuestionEditor] = useState(false);

  // Translations
  const t = language === 'es' ? {
    title: 'Crear Encuesta de Microclima',
    description: 'Crea una encuesta personalizada en 4 simples pasos',
    step1: 'Información Básica',
    step1Desc: 'Título y descripción de la encuesta',
    step2: 'Preguntas',
    step2Desc: 'Selecciona o crea preguntas',
    step3: 'Dirigir',
    step3Desc: 'Selecciona los destinatarios',
    step4: 'Programar',
    step4Desc: 'Configura fechas y distribución',
    cancel: 'Cancelar',
    saveDraft: 'Guardar Borrador',
    previous: 'Anterior',
    next: 'Siguiente',
    finish: 'Finalizar',
    validationError: 'Error de Validación',
    saveError: 'Error al Guardar',
    draftSaved: 'Borrador Guardado',
    surveyCreated: 'Encuesta Creada',
    draftExpiring: 'Este borrador expirará pronto',
    // Step 1
    titleLabel: 'Título de la Encuesta',
    titlePlaceholder: 'Ej: Encuesta de Satisfacción Q1 2025',
    descriptionLabel: 'Descripción',
    descriptionPlaceholder: 'Describe el propósito de esta encuesta...',
    // Step 2
    questionBrowser: 'Biblioteca de Preguntas',
    quickAdd: 'Agregar Rápido',
    customQuestion: 'Pregunta Personalizada',
    createCustom: 'Crear Pregunta Personalizada',
    selectedQuestions: 'Preguntas Seleccionadas',
    noQuestions: 'No hay preguntas seleccionadas',
    // Step 3
    targetAll: 'Todos los Empleados',
    csvUpload: 'Importar CSV',
    manual: 'Manual',
    uploadCSV: 'Cargar Archivo CSV',
    configureMapping: 'Configurar Mapeo de Columnas',
    validateData: 'Validar Datos',
    reviewAudience: 'Revisar Audiencia',
    allEmployeesDesc: 'La encuesta se enviará a todos los empleados de la empresa',
    csvUploadDesc: 'Importa una lista de destinatarios desde un archivo CSV',
    manualDesc: 'Agrega destinatarios manualmente uno por uno',
  } : {
    title: 'Create Microclimate Survey',
    description: 'Create a custom survey in 4 simple steps',
    step1: 'Basic Info',
    step1Desc: 'Survey title and description',
    step2: 'Questions',
    step2Desc: 'Select or create questions',
    step3: 'Target',
    step3Desc: 'Select recipients',
    step4: 'Schedule',
    step4Desc: 'Configure dates and distribution',
    cancel: 'Cancel',
    saveDraft: 'Save Draft',
    previous: 'Previous',
    next: 'Next',
    finish: 'Finish',
    validationError: 'Validation Error',
    saveError: 'Save Error',
    draftSaved: 'Draft Saved',
    surveyCreated: 'Survey Created',
    draftExpiring: 'This draft will expire soon',
    // Step 1
    titleLabel: 'Survey Title',
    titlePlaceholder: 'Ex: Q1 2025 Satisfaction Survey',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Describe the purpose of this survey...',
    // Step 2
    questionBrowser: 'Question Library',
    quickAdd: 'Quick Add',
    customQuestion: 'Custom Question',
    createCustom: 'Create Custom Question',
    selectedQuestions: 'Selected Questions',
    noQuestions: 'No questions selected',
    // Step 3
    targetAll: 'All Employees',
    csvUpload: 'Import CSV',
    manual: 'Manual',
    uploadCSV: 'Upload CSV File',
    configureMapping: 'Configure Column Mapping',
    validateData: 'Validate Data',
    reviewAudience: 'Review Audience',
    allEmployeesDesc: 'Survey will be sent to all employees in the company',
    csvUploadDesc: 'Import a list of recipients from a CSV file',
    manualDesc: 'Add recipients manually one by one',
  };

  // Draft recovery
  const {
    draft,
    isLoading: draftLoading,
    showBanner,
    hideBanner,
    recoverDraft,
    discardDraft,
    isRecovering,
    isDiscarding,
  } = useDraftRecovery(companyId, session?.user?.id || '', {
    onRecover: (draft) => {
      // Load all step data with type safety
      if (draft.step1_data) setStep1Data(draft.step1_data as any);
      if (draft.step2_data) setStep2Data(draft.step2_data as any);
      if (draft.step3_data) setStep3Data(draft.step3_data as any);
      if (draft.step4_data) setStep4Data(draft.step4_data as any);
      setDraftId(draft.id);
      
      toast.success(
        language === 'es' ? 'Borrador Recuperado' : 'Draft Recovered',
        {
          description: language === 'es' 
            ? 'Continuando donde lo dejaste' 
            : 'Continuing where you left off',
        }
      );
    },
    onDiscard: () => {
      toast.info(
        language === 'es' ? 'Borrador Descartado' : 'Draft Discarded',
        {
          description: language === 'es'
            ? 'Comenzando una nueva encuesta'
            : 'Starting a new survey',
        }
      );
    },
  });

  const { timeRemaining, isExpiringSoon } = useTimeUntilExpiry(draft?.id || '');
  const draftAge = draft ? `${Math.floor((Date.now() - new Date(draft.created_at).getTime()) / 1000 / 60)} min` : '';

  // Wizard navigation
  const wizard = useWizardNavigation({
    steps: [
      {
        id: 'step1',
        title: t.step1,
        description: t.step1Desc,
        validate: async () => {
          return !!step1Data.title.trim() && !!step1Data.description.trim();
        },
      },
      {
        id: 'step2',
        title: t.step2,
        description: t.step2Desc,
        validate: async () => {
          const totalQuestions = step2Data.questionIds.length + step2Data.customQuestions.length;
          return totalQuestions > 0;
        },
      },
      {
        id: 'step3',
        title: t.step3,
        description: t.step3Desc,
        validate: async () => {
          // Valid if targeting all employees OR has at least one target employee
          return step3Data.uploadMethod === 'all' || step3Data.targetEmployees.length > 0;
        },
      },
      {
        id: 'step4',
        title: t.step4,
        description: t.step4Desc,
        validate: async () => {
          return !!step4Data.schedule?.startDate && !!step4Data.schedule?.endDate;
        },
      },
    ],
    onStepChange: (newStep, oldStep) => {
      console.log(`Step changed: ${oldStep} -> ${newStep}`);
    },
    onValidationFailed: (step, error) => {
      toast.error(t.validationError, {
        description: error,
      });
    },
  });

  // Autosave
  const autosave = useAutosave(draftId, {
    debounceMs: 5000,
    onSuccess: (data) => {
      console.log('Autosave success:', data);
    },
    onError: (error) => {
      toast.error(t.saveError, {
        description: error.message,
      });
    },
  });

  // Auto-save on data change
  useEffect(() => {
    if (!session?.user?.id) return;

    const currentStepData = [step1Data, step2Data, step3Data, step4Data][wizard.currentStep];
    
    autosave.save({
      current_step: wizard.currentStep + 1,
      [`step${wizard.currentStep + 1}_data`]: currentStepData,
    });
  }, [step1Data, step2Data, step3Data, step4Data, wizard.currentStep]);

  // Handlers
  const handleNext = async () => {
    const success = await wizard.goNext();
    if (success && draftId) {
      const currentStepData = [step1Data, step2Data, step3Data, step4Data][wizard.currentStep];
      autosave.forceSave({
        current_step: wizard.currentStep + 1,
        [`step${wizard.currentStep + 1}_data`]: currentStepData,
      });
    }
  };

  const handlePrevious = () => {
    wizard.goPrevious();
  };

  const handleSaveDraft = () => {
    const currentStepData = [step1Data, step2Data, step3Data, step4Data][wizard.currentStep];
    autosave.forceSave({
      current_step: wizard.currentStep + 1,
      [`step${wizard.currentStep + 1}_data`]: currentStepData,
    });
    
    toast.success(t.draftSaved, {
      description: `Step ${wizard.currentStep + 1}`,
    });
  };

  const handleFinish = async () => {
    const isValid = await wizard.complete();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/microclimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...step1Data,
          ...step2Data,
          ...step3Data,
          ...step4Data,
          companyId,
        }),
      });

      const data = await response.json();

      toast.success(t.surveyCreated, {
        description: data.surveyId,
      });

      onComplete?.(data.surveyId);
    } catch (error) {
      toast.error(t.saveError, {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 handlers
  const handleQuestionSelection = (questionIds: string[]) => {
    setStep2Data({ ...step2Data, questionIds });
  };

  const handleQuickAddQuestion = (question: any) => {
    if (!step2Data.questionIds.includes(question._id)) {
      setStep2Data({
        ...step2Data,
        questionIds: [...step2Data.questionIds, question._id],
      });
    }
  };

  const handleSaveCustomQuestion = (question: any) => {
    setStep2Data({
      ...step2Data,
      customQuestions: [...step2Data.customQuestions, question],
    });
    setShowCustomQuestionEditor(false);
    toast.success(
      language === 'es' ? 'Pregunta Agregada' : 'Question Added'
    );
  };

  const handleRemoveCustomQuestion = (index: number) => {
    setStep2Data({
      ...step2Data,
      customQuestions: step2Data.customQuestions.filter((_, i) => i !== index),
    });
  };

  // Render step content
  const renderStepContent = () => {
    switch (wizard.currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">{t.titleLabel}</Label>
              <Input
                id="title"
                value={step1Data.title}
                onChange={(e) => setStep1Data({ ...step1Data, title: e.target.value })}
                placeholder={t.titlePlaceholder}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description">{t.descriptionLabel}</Label>
              <Textarea
                id="description"
                value={step1Data.description}
                onChange={(e) => setStep1Data({ ...step1Data, description: e.target.value })}
                placeholder={t.descriptionPlaceholder}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <Tabs defaultValue="library" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="library">{t.questionBrowser}</TabsTrigger>
                <TabsTrigger value="quick-add">{t.quickAdd}</TabsTrigger>
                <TabsTrigger value="custom">{t.customQuestion}</TabsTrigger>
              </TabsList>

              <TabsContent value="library" className="mt-6">
                <QuestionLibraryBrowser
                  selectedQuestions={step2Data.questionIds}
                  onSelectionChange={handleQuestionSelection}
                  language={language}
                />
              </TabsContent>

              <TabsContent value="quick-add" className="mt-6">
                <QuickAddPanel
                  onAddQuestion={handleQuickAddQuestion}
                  addedQuestions={step2Data.questionIds}
                  language={language}
                />
              </TabsContent>

              <TabsContent value="custom" className="mt-6">
                {!showCustomQuestionEditor ? (
                  <Button onClick={() => setShowCustomQuestionEditor(true)} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    {t.createCustom}
                  </Button>
                ) : (
                  <MultilingualQuestionEditor
                    onSave={handleSaveCustomQuestion}
                    onCancel={() => setShowCustomQuestionEditor(false)}
                    language={language}
                  />
                )}
              </TabsContent>
            </Tabs>

            {/* Selected Questions Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.selectedQuestions}</CardTitle>
                <CardDescription>
                  {step2Data.questionIds.length + step2Data.customQuestions.length} questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step2Data.questionIds.length === 0 && step2Data.customQuestions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">{t.noQuestions}</p>
                ) : (
                  <div className="space-y-2">
                    {step2Data.questionIds.map((id, idx) => (
                      <div key={id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <Badge variant="outline">{idx + 1}</Badge>
                        <span className="text-sm flex-1">Library Question: {id}</span>
                      </div>
                    ))}
                    {step2Data.customQuestions.map((q, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <Badge variant="outline">{step2Data.questionIds.length + idx + 1}</Badge>
                        <span className="text-sm flex-1">
                          {language === 'en' ? q.question_text_en : q.question_text_es}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCustomQuestion(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Tabs 
              value={step3Data.uploadMethod} 
              onValueChange={(value) => setStep3Data({ ...step3Data, uploadMethod: value as 'csv' | 'manual' | 'all' })}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  <Users className="w-4 h-4 mr-2" />
                  {t.targetAll}
                </TabsTrigger>
                <TabsTrigger value="csv">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {t.csvUpload}
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t.manual}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.targetAll}</CardTitle>
                    <CardDescription>{t.allEmployeesDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <Users className="w-4 h-4" />
                      <AlertDescription>
                        {language === 'es' 
                          ? 'La encuesta se enviará automáticamente a todos los empleados registrados en la empresa.' 
                          : 'The survey will automatically be sent to all registered employees in the company.'}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="csv" className="space-y-6">
                {/* Step 1: CSV Upload */}
                {!step3Data.csvData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.uploadCSV}</CardTitle>
                      <CardDescription>{t.csvUploadDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CSVImporter
                        onParsed={(data) => {
                          setStep3Data({
                            ...step3Data,
                            csvData: data,
                          });
                          autosave.save({
                            current_step: 3,
                            step3_data: { ...step3Data, csvData: data },
                          });
                        }}
                        language={language}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Column Mapping */}
                {step3Data.csvData && !step3Data.mapping && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.configureMapping}</CardTitle>
                      <CardDescription>
                        {language === 'es'
                          ? 'Mapea las columnas de tu CSV a los campos requeridos'
                          : 'Map your CSV columns to the required fields'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ColumnMapper
                        headers={step3Data.csvData.headers}
                        rows={step3Data.csvData.rows}
                        onMappingChange={(mapping) => {
                          setStep3Data({
                            ...step3Data,
                            mapping,
                          });
                          autosave.save({
                            current_step: 3,
                            step3_data: { ...step3Data, mapping },
                          });
                        }}
                        language={language}
                      />
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setStep3Data({
                              ...step3Data,
                              csvData: undefined,
                              mapping: undefined,
                            });
                          }}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          {language === 'es' ? 'Volver' : 'Back'}
                        </Button>
                        <Button
                          onClick={() => {
                            if (step3Data.mapping?.email && step3Data.mapping?.name) {
                              // Process mapping and trigger validation
                              const mappedEmployees: MappedEmployee[] = step3Data.csvData!.rows.map((row, index) => ({
                                email: row[step3Data.mapping!.email!] || '',
                                name: row[step3Data.mapping!.name!] || '',
                                department: step3Data.mapping!.department ? row[step3Data.mapping!.department] : undefined,
                                location: step3Data.mapping!.location ? row[step3Data.mapping!.location] : undefined,
                                position: step3Data.mapping!.position ? row[step3Data.mapping!.position] : undefined,
                                employeeId: step3Data.mapping!.employeeId ? row[step3Data.mapping!.employeeId] : undefined,
                                rowIndex: index + 1,
                              }));

                              // Store mapped data for validation
                              setStep3Data({
                                ...step3Data,
                                targetEmployees: mappedEmployees as TargetEmployee[],
                              });
                            }
                          }}
                          disabled={!step3Data.mapping?.email || !step3Data.mapping?.name}
                        >
                          {language === 'es' ? 'Continuar' : 'Continue'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Validation */}
                {step3Data.mapping && step3Data.targetEmployees.length > 0 && !step3Data.validationResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.validateData}</CardTitle>
                      <CardDescription>
                        {language === 'es'
                          ? 'Revisa y corrige cualquier error en los datos'
                          : 'Review and fix any errors in the data'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ValidationPanel
                        data={step3Data.targetEmployees as MappedEmployee[]}
                        onValidationComplete={(result) => {
                          setStep3Data({
                            ...step3Data,
                            validationResult: result,
                          });
                          autosave.save({
                            current_step: 3,
                            step3_data: { ...step3Data, validationResult: result },
                          });
                        }}
                        language={language}
                      />
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setStep3Data({
                              ...step3Data,
                              targetEmployees: [],
                              validationResult: undefined,
                            });
                          }}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          {language === 'es' ? 'Volver' : 'Back'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Audience Preview */}
                {step3Data.validationResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.reviewAudience}</CardTitle>
                      <CardDescription>
                        {language === 'es'
                          ? 'Revisa el resumen de tu audiencia objetivo'
                          : 'Review your target audience summary'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AudiencePreviewCard
                        employees={step3Data.targetEmployees}
                        language={language}
                      />
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setStep3Data({
                              targetEmployees: [],
                              uploadMethod: 'csv',
                              csvData: undefined,
                              mapping: undefined,
                              validationResult: undefined,
                            });
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {language === 'es' ? 'Empezar de Nuevo' : 'Start Over'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <ManualEmployeeEntry
                  employees={step3Data.targetEmployees}
                  onEmployeesChange={(employees) => {
                    setStep3Data({
                      ...step3Data,
                      targetEmployees: employees as TargetEmployee[],
                    });
                    autosave.save({
                      current_step: 3,
                      step3_data: { ...step3Data, targetEmployees: employees },
                    });
                  }}
                  language={language}
                />

                {/* Audience Preview for Manual Entry */}
                {step3Data.targetEmployees.length > 0 && (
                  <AudiencePreviewCard
                    employees={step3Data.targetEmployees}
                    language={language}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        );

      case 3:
        // Generate survey URL (mock for now, will be real after API creation)
        const surveyId = draftId || 'preview';
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const surveyUrl = step4Data.surveyUrl || `${baseUrl}/survey/${surveyId}`;

        // Calculate target count
        const targetCount = step3Data.uploadMethod === 'all' 
          ? 0  // Will be fetched from company employees
          : step3Data.targetEmployees.length;

        // Calculate question count
        const questionCount = step2Data.questionIds.length + step2Data.customQuestions.length;

        return (
          <div className="space-y-6">
            <Tabs defaultValue="schedule">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="schedule">
                  <Calendar className="w-4 h-4 mr-2" />
                  {language === 'es' ? 'Programación' : 'Schedule'}
                </TabsTrigger>
                <TabsTrigger value="qrcode">
                  <QrCodeIcon className="w-4 h-4 mr-2" />
                  {language === 'es' ? 'Código QR' : 'QR Code'}
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {language === 'es' ? 'Vista Previa' : 'Preview'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="space-y-6">
                <ScheduleConfig
                  onScheduleChange={(schedule) => {
                    setStep4Data({
                      ...step4Data,
                      schedule,
                      surveyUrl: surveyUrl,
                    });
                    autosave.save({
                      current_step: 4,
                      step4_data: { ...step4Data, schedule },
                    });
                  }}
                  language={language}
                />
              </TabsContent>

              <TabsContent value="qrcode" className="space-y-6">
                {step4Data.schedule ? (
                  <QRCodeGenerator
                    surveyUrl={surveyUrl}
                    surveyTitle={step1Data.title}
                    onGenerated={(qrCodeDataUrl) => {
                      setStep4Data({
                        ...step4Data,
                        qrCodeDataUrl,
                      });
                    }}
                    language={language}
                  />
                ) : (
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      {language === 'es'
                        ? 'Por favor configura la programación primero.'
                        : 'Please configure the schedule first.'}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                {step4Data.schedule ? (
                  <DistributionPreview
                    surveyTitle={step1Data.title}
                    surveyUrl={surveyUrl}
                    schedule={step4Data.schedule}
                    targetCount={targetCount}
                    questionCount={questionCount}
                    uploadMethod={step3Data.uploadMethod}
                    language={language}
                  />
                ) : (
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      {language === 'es'
                        ? 'Por favor configura la programación primero.'
                        : 'Please configure the schedule first.'}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8 px-4">
      {/* Draft Recovery Banner */}
      <DraftRecoveryContainer show={showBanner}>
        <DraftRecoveryBanner
          draftAge={draftAge}
          currentStep={draft?.current_step}
          saveCount={draft?.auto_save_count}
          timeUntilExpiry={timeRemaining}
          isExpiringSoon={isExpiringSoon}
          onRecover={recoverDraft}
          onDiscard={discardDraft}
          onDismiss={hideBanner}
          isRecovering={isRecovering}
          isDiscarding={isDiscarding}
          language={language}
        />
      </DraftRecoveryContainer>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-gray-600 text-lg">{t.description}</p>
        </div>

        {/* Expiring soon warning */}
        {isExpiringSoon && draft && (
          <Alert variant="destructive">
            <FileWarning className="h-4 w-4" />
            <AlertDescription>
              {t.draftExpiring} ({timeRemaining})
            </AlertDescription>
          </Alert>
        )}

        {/* Autosave Indicator */}
        <div className="flex justify-end">
          <AutosaveIndicator
            status={autosave.status}
            lastSavedAt={autosave.lastSavedAt}
            saveCount={autosave.saveCount}
            onRetry={autosave.retry}
            language={language}
          />
        </div>

        {/* Stepper - Desktop */}
        <Card className="hidden md:block">
          <CardContent className="p-6">
            <WizardStepper
              steps={wizard.steps}
              currentStep={wizard.currentStep}
              completedSteps={wizard.completedSteps}
              allowNavigation={true}
              onStepClick={wizard.goToStep}
              showProgress={true}
              language={language}
            />
          </CardContent>
        </Card>

        {/* Stepper - Mobile */}
        <Card className="md:hidden">
          <CardContent className="p-4">
            <CompactWizardStepper
              steps={wizard.steps}
              currentStep={wizard.currentStep}
              language={language}
            />
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{wizard.steps[wizard.currentStep].title}</CardTitle>
            <CardDescription>{wizard.steps[wizard.currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={wizard.currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation Footer */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    {t.cancel}
                  </Button>
                )}
                <Button variant="outline" onClick={handleSaveDraft}>
                  <Save className="w-4 h-4 mr-2" />
                  {t.saveDraft}
                </Button>
              </div>

              <div className="flex gap-2">
                {!wizard.isFirstStep && (
                  <Button variant="outline" onClick={handlePrevious}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t.previous}
                  </Button>
                )}
                
                {!wizard.isLastStep ? (
                  <Button onClick={handleNext} disabled={autosave.status === 'saving'}>
                    {t.next}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleFinish} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    {t.finish}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
