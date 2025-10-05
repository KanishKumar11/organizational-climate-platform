'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useDraftRecovery, useTimeUntilExpiry } from '@/hooks/useDraftRecovery';
import { useAutosave } from '@/hooks/useAutosave';
import { useWizardNavigation } from '@/hooks/useWizardNavigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DraftRecoveryBanner,
  DraftRecoveryContainer,
} from './DraftRecoveryBanner';
import { WizardStepper, CompactWizardStepper } from './WizardStepper';
import { AutosaveIndicator } from './AutosaveIndicator';
import { QuestionLibraryBrowser } from './QuestionLibraryBrowser';
import { QuickAddPanel } from './QuickAddPanel';
import { MultilingualQuestionEditor } from './MultilingualQuestionEditor';
import { CSVImporter } from './CSVImporter';
import { ColumnMapper, ColumnMapping } from './ColumnMapper';
import {
  ValidationPanel,
  ValidationResult,
  MappedEmployee,
} from './ValidationPanel';
import { AudiencePreviewCard, TargetEmployee } from './AudiencePreviewCard';
import { AudienceFilters, type AudienceFilterValues } from './AudienceFilters';
import { SortableQuestionList } from './SortableQuestionList';
import { QRCodeGenerator } from './QRCodeGenerator';
import { ScheduleConfig, ScheduleData } from './ScheduleConfig';
import { DistributionPreview } from './DistributionPreview';
import { ManualEmployeeEntry } from './ManualEmployeeEntry';
import { CompanySearchableDropdown } from '@/components/companies/CompanySearchableDropdown';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  GripVertical,
} from 'lucide-react';

// Sortable Question Item Component
interface SortableQuestionItemProps {
  id: string;
  index: number;
  text: string;
  onRemove?: () => void;
  isCustom?: boolean;
}

function SortableQuestionItem({
  id,
  index,
  text,
  onRemove,
  isCustom = false,
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-lg border ${
        isCustom
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded"
      >
        <GripVertical className="w-4 h-4 text-gray-500" />
      </div>
      <Badge variant="outline" className="shrink-0">
        {index + 1}
      </Badge>
      <span className="text-sm flex-1 min-w-0 truncate">{text}</span>
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

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
  companyId?: string; // Now optional - user selects in Step 1
  draftId?: string;
  onComplete?: (surveyId: string) => void;
  onCancel?: () => void;
  language?: 'es' | 'en';
}

// Step 1 data structure
interface Step1Data {
  title: string;
  description: string;
  companyId: string;
  surveyType: 'microclimate' | 'climate' | 'culture' | '';
  companyType?: string;
  language: 'es' | 'en' | 'both';
}

export function MicroclimateWizard({
  companyId: initialCompanyId,
  draftId: initialDraftId,
  onComplete,
  onCancel,
  language = 'es',
}: MicroclimateWizardProps) {
  const { data: session } = useSession();

  // State
  const [step1Data, setStep1Data] = useState<Step1Data>({
    title: '',
    description: '',
    companyId: initialCompanyId || '',
    surveyType: '',
    companyType: '',
    language: language,
  });
  const [step2Data, setStep2Data] = useState<{
    questionIds: string[];
    customQuestions: any[];
  }>({
    questionIds: [],
    customQuestions: [],
  });
  const [step3Data, setStep3Data] = useState<{
    targetEmployees: TargetEmployee[];
    uploadMethod: 'csv' | 'manual' | 'all';
    csvData?: { headers: string[]; rows: any[]; rowCount: number };
    mapping?: ColumnMapping;
    validationResult?: ValidationResult;
    availableDepartments?: any[];
    availableEmployees?: any[];
    demographics?: {
      locations: string[];
      roles: string[];
      seniority: string[];
    };
    activeFilters?: AudienceFilterValues;
    // Filter state
    selectedDepartments?: string[];
    selectedLocations?: string[];
    selectedRoles?: string[];
    csvUploadStage?: 'upload' | 'mapping' | 'validation' | 'review';
  }>({
    targetEmployees: [],
    uploadMethod: 'all',
    csvUploadStage: 'upload',
    activeFilters: {
      departments: [],
      locations: [],
      roles: [],
      seniority: [],
    },
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
  const [showCustomQuestionEditor, setShowCustomQuestionEditor] =
    useState(false);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);

  // Translations
  const t =
    language === 'es'
      ? {
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
          allEmployeesDesc:
            'La encuesta se enviará a todos los empleados de la empresa',
          csvUploadDesc:
            'Importa una lista de destinatarios desde un archivo CSV',
          manualDesc: 'Agrega destinatarios manualmente uno por uno',
        }
      : {
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
          allEmployeesDesc:
            'Survey will be sent to all employees in the company',
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
  } = useDraftRecovery(
    step1Data.companyId || 'pending',
    session?.user?.id || '',
    {
      onRecover: (draft) => {
        // Load all step data with type safety
        if (draft.step1_data)
          setStep1Data(draft.step1_data as unknown as Step1Data);
        if (draft.step2_data) setStep2Data(draft.step2_data as any);
        if (draft.step3_data) setStep3Data(draft.step3_data as any);
        if (draft.step4_data) setStep4Data(draft.step4_data as any);
        setDraftId(draft.id);

        toast.success(
          language === 'es' ? 'Borrador Recuperado' : 'Draft Recovered',
          {
            description:
              language === 'es'
                ? 'Continuando donde lo dejaste'
                : 'Continuing where you left off',
          }
        );
      },
      onDiscard: () => {
        toast.info(
          language === 'es' ? 'Borrador Descartado' : 'Draft Discarded',
          {
            description:
              language === 'es'
                ? 'Comenzando una nueva encuesta'
                : 'Starting a new survey',
          }
        );
      },
    }
  );

  const { timeRemaining, isExpiringSoon } = useTimeUntilExpiry(draft?.id || '');
  const draftAge = draft
    ? `${Math.floor((Date.now() - new Date(draft.created_at).getTime()) / 1000 / 60)} min`
    : '';

  // Wizard navigation
  const wizard = useWizardNavigation({
    steps: [
      {
        id: 'step1',
        title: t.step1,
        description: t.step1Desc,
        validate: async () => {
          // Validate all required Step 1 fields
          const errors = [];

          if (!step1Data.title.trim()) {
            errors.push(
              language === 'es' ? 'Título requerido' : 'Title required'
            );
          }
          if (!step1Data.companyId) {
            errors.push(
              language === 'es' ? 'Empresa requerida' : 'Company required'
            );
          }
          if (!step1Data.surveyType) {
            errors.push(
              language === 'es'
                ? 'Tipo de encuesta requerido'
                : 'Survey type required'
            );
          }

          if (errors.length > 0) {
            throw new Error(errors.join(', '));
          }

          return true;
        },
      },
      {
        id: 'step2',
        title: t.step2,
        description: t.step2Desc,
        validate: async () => {
          const totalQuestions =
            step2Data.questionIds.length + step2Data.customQuestions.length;
          return totalQuestions > 0;
        },
      },
      {
        id: 'step3',
        title: t.step3,
        description: t.step3Desc,
        validate: async () => {
          // Valid if targeting all employees OR has at least one target employee
          return (
            step3Data.uploadMethod === 'all' ||
            step3Data.targetEmployees.length > 0
          );
        },
      },
      {
        id: 'step4',
        title: t.step4,
        description: t.step4Desc,
        validate: async () => {
          // Check schedule dates exist
          if (!step4Data.schedule?.startDate || !step4Data.schedule?.endDate) {
            return false;
          }

          // Check distribution mode is selected
          if (!step4Data.schedule?.distribution?.mode) {
            throw new Error(
              language === 'es'
                ? 'Debes seleccionar un método de distribución'
                : 'You must select a distribution method'
            );
          }

          // If open mode, check security acknowledgment
          if (
            step4Data.schedule.distribution.mode === 'open' &&
            !step4Data.schedule.distribution.securityAcknowledged
          ) {
            throw new Error(
              language === 'es'
                ? 'Debes aceptar los riesgos de seguridad para usar enlace público'
                : 'You must accept the security risks to use public link'
            );
          }

          return true;
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

  // Drag-and-drop sensors for question reordering
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for question reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = step2Data.questionIds.findIndex(
        (id) => id === active.id
      );
      const newIndex = step2Data.questionIds.findIndex((id) => id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setStep2Data((prev) => ({
          ...prev,
          questionIds: arrayMove(prev.questionIds, oldIndex, newIndex),
        }));

        toast.success(
          language === 'es' ? 'Pregunta reordenada' : 'Question reordered'
        );
      }
    }
  };

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

    const currentStepData = [step1Data, step2Data, step3Data, step4Data][
      wizard.currentStep
    ];

    autosave.save({
      current_step: wizard.currentStep + 1,
      [`step${wizard.currentStep + 1}_data`]: currentStepData,
    });
  }, [step1Data, step2Data, step3Data, step4Data, wizard.currentStep]);

  // Pre-load company data when company is selected
  useEffect(() => {
    if (!step1Data.companyId) return;

    const loadCompanyTargetData = async () => {
      setIsLoadingCompanyData(true);
      try {
        const [deptsResponse, employeesResponse] = await Promise.all([
          fetch(`/api/companies/${step1Data.companyId}/departments`),
          fetch(`/api/companies/${step1Data.companyId}/users`),
        ]);

        const depts = deptsResponse.ok ? await deptsResponse.json() : [];
        const employees = employeesResponse.ok
          ? await employeesResponse.json()
          : [];

        setStep3Data((prev) => ({
          ...prev,
          availableDepartments: Array.isArray(depts)
            ? depts
            : depts.departments || [],
          availableEmployees: Array.isArray(employees)
            ? employees
            : employees.users || [],
        }));

        toast.success(
          language === 'es'
            ? 'Datos de empresa cargados'
            : 'Company data loaded',
          {
            description:
              language === 'es'
                ? `${depts.length || 0} departamentos, ${employees.length || 0} empleados`
                : `${depts.length || 0} departments, ${employees.length || 0} employees`,
          }
        );
      } catch (error) {
        console.error('Error loading company data:', error);
        toast.error(
          language === 'es'
            ? 'Error al cargar datos'
            : 'Failed to load company data',
          {
            description:
              error instanceof Error ? error.message : 'Unknown error',
          }
        );
      } finally {
        setIsLoadingCompanyData(false);
      }
    };

    loadCompanyTargetData();
  }, [step1Data.companyId, language]);

  // Fetch demographics for filtering when on Step 3
  useEffect(() => {
    if (!step1Data.companyId || wizard.currentStep !== 2) return;

    const fetchDemographics = async () => {
      try {
        const response = await fetch(
          `/api/companies/${step1Data.companyId}/demographics`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch demographics');
        }

        const data = await response.json();

        if (data.success && data.demographics) {
          setStep3Data((prev) => ({
            ...prev,
            demographics: data.demographics,
          }));
        }
      } catch (error) {
        console.error('Error fetching demographics:', error);
        // Silent fail - filters will just have empty options
        toast.error(
          language === 'es'
            ? 'No se pudieron cargar las opciones de filtro'
            : 'Failed to load filter options',
          {
            description:
              error instanceof Error ? error.message : 'Unknown error',
          }
        );
      }
    };

    fetchDemographics();
  }, [step1Data.companyId, wizard.currentStep, language]);

  // Handlers
  const handleNext = async () => {
    const success = await wizard.goNext();
    if (success && draftId) {
      const currentStepData = [step1Data, step2Data, step3Data, step4Data][
        wizard.currentStep
      ];
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
    const currentStepData = [step1Data, step2Data, step3Data, step4Data][
      wizard.currentStep
    ];
    autosave.forceSave({
      current_step: wizard.currentStep + 1,
      [`step${wizard.currentStep + 1}_data`]: currentStepData,
    });

    toast.success(t.draftSaved, {
      description: `Step ${wizard.currentStep + 1}`,
    });
  };

  // Helper function: Apply filters to employees
  const applyFiltersToEmployees = (
    employees: TargetEmployee[],
    filters: AudienceFilterValues
  ): TargetEmployee[] => {
    return employees.filter((emp) => {
      // Filter by department
      if (
        filters.departments.length > 0 &&
        !filters.departments.includes(emp.department || '')
      ) {
        return false;
      }

      // Filter by location
      if (
        filters.locations.length > 0 &&
        !filters.locations.includes(emp.location || '')
      ) {
        return false;
      }

      // Filter by role/position
      if (
        filters.roles.length > 0 &&
        !filters.roles.includes(emp.position || '')
      ) {
        return false;
      }

      // Filter by seniority (if available in employee data)
      if (filters.seniority.length > 0) {
        // Note: TargetEmployee might not have seniority field
        // This will be a no-op unless the field exists
        const empSeniority = (emp as any).seniority;
        if (empSeniority && !filters.seniority.includes(empSeniority)) {
          return false;
        }
      }

      return true;
    });
  };

  // Helper function: De-duplicate employees by email
  const deduplicateEmployees = (
    employees: TargetEmployee[]
  ): TargetEmployee[] => {
    const seen = new Set<string>();
    const unique: TargetEmployee[] = [];
    let duplicateCount = 0;

    employees.forEach((emp) => {
      const key = emp.email?.toLowerCase() || emp.employeeId || '';
      if (!key || seen.has(key)) {
        duplicateCount++;
      } else {
        seen.add(key);
        unique.push(emp);
      }
    });

    if (duplicateCount > 0) {
      toast.info(
        language === 'es' ? 'Duplicados Eliminados' : 'Duplicates Removed',
        {
          description:
            language === 'es'
              ? `${duplicateCount} entrada(s) duplicada(s) eliminada(s)`
              : `${duplicateCount} duplicate entry(ies) removed`,
        }
      );
    }

    return unique;
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
          // companyId is already in step1Data
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
    toast.success(language === 'es' ? 'Pregunta Agregada' : 'Question Added');
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
            {/* Survey Type */}
            <div>
              <Label htmlFor="surveyType">
                {language === 'es' ? 'Tipo de Encuesta' : 'Survey Type'} *
              </Label>
              <Select
                value={step1Data.surveyType}
                onValueChange={(
                  value: 'microclimate' | 'climate' | 'culture'
                ) => setStep1Data({ ...step1Data, surveyType: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue
                    placeholder={
                      language === 'es'
                        ? 'Seleccionar tipo...'
                        : 'Select type...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="microclimate">
                    {language === 'es' ? '🌤️ Micro-clima' : '🌤️ Micro-climate'}
                  </SelectItem>
                  <SelectItem value="climate">
                    {language === 'es' ? '☀️ Clima' : '☀️ Climate'}
                  </SelectItem>
                  <SelectItem value="culture">
                    {language === 'es' ? '🌍 Cultura' : '🌍 Culture'}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'es'
                  ? 'El tipo de encuesta determina las preguntas disponibles y la duración'
                  : 'Survey type determines available questions and duration'}
              </p>
            </div>

            {/* Company Selection */}
            <div>
              <Label htmlFor="company">
                {language === 'es' ? 'Empresa' : 'Company'} *
              </Label>
              <CompanySearchableDropdown
                value={step1Data.companyId}
                onChange={(companyId, company) => {
                  setStep1Data({
                    ...step1Data,
                    companyId,
                    companyType: company?.type || '',
                  });
                }}
                placeholder={
                  language === 'es'
                    ? 'Seleccionar empresa...'
                    : 'Select company...'
                }
                language={language}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'es'
                  ? 'La empresa determina los empleados y departamentos disponibles'
                  : 'Company determines available employees and departments'}
              </p>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">{t.titleLabel} *</Label>
              <Input
                id="title"
                value={step1Data.title}
                onChange={(e) =>
                  setStep1Data({ ...step1Data, title: e.target.value })
                }
                onBlur={() =>
                  autosave.forceSave({
                    current_step: 1,
                    step1_data: step1Data as unknown as Record<string, unknown>,
                  })
                }
                placeholder={t.titlePlaceholder}
                className="mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">{t.descriptionLabel}</Label>
              <Textarea
                id="description"
                value={step1Data.description}
                onChange={(e) =>
                  setStep1Data({ ...step1Data, description: e.target.value })
                }
                onBlur={() =>
                  autosave.forceSave({
                    current_step: 1,
                    step1_data: step1Data as unknown as Record<string, unknown>,
                  })
                }
                placeholder={t.descriptionPlaceholder}
                rows={4}
                className="mt-2"
              />
            </div>

            {/* Language Selection */}
            <div>
              <Label>
                {language === 'es'
                  ? 'Idioma de la Encuesta'
                  : 'Survey Language'}{' '}
                *
              </Label>
              <RadioGroup
                value={step1Data.language}
                onValueChange={(value: 'es' | 'en' | 'both') =>
                  setStep1Data({ ...step1Data, language: value })
                }
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="es" id="lang-es" />
                  <Label
                    htmlFor="lang-es"
                    className="font-normal cursor-pointer"
                  >
                    🇪🇸 {language === 'es' ? 'Solo Español' : 'Spanish Only'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="lang-en" />
                  <Label
                    htmlFor="lang-en"
                    className="font-normal cursor-pointer"
                  >
                    🇬🇧 {language === 'es' ? 'Solo Inglés' : 'English Only'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="lang-both" />
                  <Label
                    htmlFor="lang-both"
                    className="font-normal cursor-pointer"
                  >
                    🌎{' '}
                    {language === 'es'
                      ? 'Bilingüe (Español + Inglés)'
                      : 'Bilingual (Spanish + English)'}
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-2">
                {language === 'es'
                  ? 'Los encuestados verán las preguntas en el idioma seleccionado'
                  : 'Respondents will see questions in the selected language(s)'}
              </p>
            </div>

            {/* Company Type (read-only, auto-populated) */}
            {step1Data.companyType && (
              <Alert>
                <AlertDescription>
                  <strong>
                    {language === 'es' ? 'Tipo de Empresa:' : 'Company Type:'}
                  </strong>{' '}
                  {step1Data.companyType}
                </AlertDescription>
              </Alert>
            )}
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
                  <Button
                    onClick={() => setShowCustomQuestionEditor(true)}
                    className="w-full"
                  >
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
                  {step2Data.questionIds.length +
                    step2Data.customQuestions.length}{' '}
                  questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step2Data.questionIds.length === 0 &&
                step2Data.customQuestions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    {t.noQuestions}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* Questions List with Drag & Drop */}
                    <SortableQuestionList
                      questions={[
                        ...step2Data.questionIds.map((id) => ({
                          _id: id,
                          text_es: `Pregunta ${id}`,
                          text_en: `Question ${id}`,
                          type: 'likert',
                          category_name: 'general',
                          is_required: true,
                        })),
                        ...step2Data.customQuestions.map((q, idx) => ({
                          _id: `custom-${idx}`,
                          text_es: q.text_es || '',
                          text_en: q.text_en || '',
                          type: q.type || 'text',
                          category_name: (q as any).category || 'custom',
                          is_required: (q as any).isRequired ?? true,
                        })),
                      ]}
                      onReorder={(newOrder) => {
                        // Separate library questions from custom questions
                        const libraryQuestions = newOrder.filter(
                          (q) => !q._id.startsWith('custom-')
                        );
                        const customQuestions = newOrder.filter((q) =>
                          q._id.startsWith('custom-')
                        );

                        setStep2Data({
                          ...step2Data,
                          questionIds: libraryQuestions.map((q) => q._id),
                          customQuestions: customQuestions.map((q) => ({
                            text_es: q.text_es,
                            text_en: q.text_en,
                            type: q.type,
                          })),
                        });

                        // Autosave
                        autosave.save({
                          current_step: 2,
                          step2_data: {
                            questionIds: libraryQuestions.map((q) => q._id),
                            customQuestions: customQuestions.map((q) => ({
                              text_es: q.text_es,
                              text_en: q.text_en,
                              type: q.type,
                            })),
                          },
                        });
                      }}
                      onRemove={(questionId) => {
                        if (questionId.startsWith('custom-')) {
                          const customIndex = parseInt(
                            questionId.replace('custom-', '')
                          );
                          setStep2Data((prev) => ({
                            ...prev,
                            customQuestions: prev.customQuestions.filter(
                              (_, i) => i !== customIndex
                            ),
                          }));
                        } else {
                          setStep2Data((prev) => ({
                            ...prev,
                            questionIds: prev.questionIds.filter(
                              (id) => id !== questionId
                            ),
                          }));
                        }
                      }}
                      language={language}
                    />
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
              onValueChange={(value) =>
                setStep3Data({
                  ...step3Data,
                  uploadMethod: value as 'csv' | 'manual' | 'all',
                })
              }
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
                  <CardContent className="space-y-4">
                    <Alert>
                      <Users className="w-4 h-4" />
                      <AlertDescription>
                        {language === 'es'
                          ? 'La encuesta se enviará automáticamente a todos los empleados registrados en la empresa.'
                          : 'The survey will automatically be sent to all registered employees in the company.'}
                      </AlertDescription>
                    </Alert>

                    {/* Audience Filters */}
                    {step3Data.availableEmployees &&
                      step3Data.availableEmployees.length > 0 && (
                        <div className="mt-6">
                          <AudienceFilters
                            availableDepartments={
                              step3Data.availableDepartments || []
                            }
                            availableLocations={
                              step3Data.demographics?.locations || []
                            }
                            availableRoles={step3Data.demographics?.roles || []}
                            availableSeniority={
                              step3Data.demographics?.seniority || []
                            }
                            onFiltersChange={(filters) => {
                              // Apply filters to available employees
                              const allEmployees =
                                step3Data.availableEmployees || [];
                              const filtered = applyFiltersToEmployees(
                                allEmployees.map((emp: any) => ({
                                  name: emp.name || '',
                                  email: emp.email || '',
                                  department:
                                    emp.department?.name ||
                                    emp.department ||
                                    '',
                                  position: emp.position || emp.role || '',
                                  location: emp.location || '',
                                  employeeId: emp.employeeId || emp._id || '',
                                })),
                                filters
                              );

                              setStep3Data((prev) => ({
                                ...prev,
                                targetEmployees: filtered,
                                activeFilters: filters,
                              }));
                            }}
                            language={language}
                          />

                          {/* Preview filtered results */}
                          {step3Data.activeFilters &&
                            (step3Data.activeFilters.departments.length > 0 ||
                              step3Data.activeFilters.locations.length > 0 ||
                              step3Data.activeFilters.roles.length > 0 ||
                              step3Data.activeFilters.seniority.length > 0) && (
                              <div className="mt-4">
                                <AudiencePreviewCard
                                  employees={step3Data.targetEmployees}
                                  language={language}
                                />
                              </div>
                            )}
                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="csv" className="space-y-6">
                {/* Stage indicator */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        step3Data.csvUploadStage === 'upload'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      1. {t.uploadCSV}
                    </Badge>
                    <Badge
                      variant={
                        step3Data.csvUploadStage === 'mapping'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      2. {t.configureMapping}
                    </Badge>
                    <Badge
                      variant={
                        step3Data.csvUploadStage === 'validation'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      3. {t.validateData}
                    </Badge>
                    <Badge
                      variant={
                        step3Data.csvUploadStage === 'review'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      4. {t.reviewAudience}
                    </Badge>
                  </div>
                </div>

                {/* Step 1: CSV Upload */}
                {step3Data.csvUploadStage === 'upload' && (
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
                            csvUploadStage: 'mapping',
                          });
                          autosave.save({
                            current_step: 3,
                            step3_data: {
                              ...step3Data,
                              csvData: data,
                              csvUploadStage: 'mapping',
                            },
                          });
                        }}
                        language={language}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Column Mapping */}
                {step3Data.csvUploadStage === 'mapping' &&
                  step3Data.csvData && (
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
                                csvUploadStage: 'upload',
                              });
                            }}
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {language === 'es' ? 'Volver' : 'Back'}
                          </Button>
                          <Button
                            onClick={() => {
                              if (
                                step3Data.mapping?.email &&
                                step3Data.mapping?.name
                              ) {
                                // Process mapping
                                const mappedEmployees: MappedEmployee[] =
                                  step3Data.csvData!.rows.map((row, index) => ({
                                    email: row[step3Data.mapping!.email!] || '',
                                    name: row[step3Data.mapping!.name!] || '',
                                    department: step3Data.mapping!.department
                                      ? row[step3Data.mapping!.department]
                                      : undefined,
                                    location: step3Data.mapping!.location
                                      ? row[step3Data.mapping!.location]
                                      : undefined,
                                    position: step3Data.mapping!.position
                                      ? row[step3Data.mapping!.position]
                                      : undefined,
                                    employeeId: step3Data.mapping!.employeeId
                                      ? row[step3Data.mapping!.employeeId]
                                      : undefined,
                                    rowIndex: index + 1,
                                  }));

                                // De-duplicate employees
                                const deduplicated = deduplicateEmployees(
                                  mappedEmployees as TargetEmployee[]
                                );

                                // Store and move to validation
                                setStep3Data({
                                  ...step3Data,
                                  targetEmployees: deduplicated,
                                  csvUploadStage: 'validation',
                                });
                              }
                            }}
                            disabled={
                              !step3Data.mapping?.email ||
                              !step3Data.mapping?.name
                            }
                          >
                            {language === 'es' ? 'Continuar' : 'Continue'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Step 3: Validation */}
                {step3Data.csvUploadStage === 'validation' &&
                  step3Data.targetEmployees.length > 0 && (
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
                            // Filter to only valid employees (no errors)
                            const validEmployees =
                              step3Data.targetEmployees.filter(
                                (emp) =>
                                  emp.email &&
                                  emp.name &&
                                  !result.errors.some(
                                    (err) =>
                                      err.rowIndex ===
                                      step3Data.targetEmployees.indexOf(emp)
                                  )
                              );

                            setStep3Data({
                              ...step3Data,
                              validationResult: result,
                              targetEmployees: validEmployees,
                              csvUploadStage: 'review',
                            });

                            autosave.save({
                              current_step: 3,
                              step3_data: {
                                ...step3Data,
                                validationResult: result,
                                targetEmployees: validEmployees,
                                csvUploadStage: 'review',
                              },
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
                                csvUploadStage: 'mapping',
                                targetEmployees: [],
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
                {step3Data.csvUploadStage === 'review' &&
                  step3Data.validationResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t.reviewAudience}</CardTitle>
                        <CardDescription>
                          {language === 'es'
                            ? 'Revisa el resumen de tu audiencia objetivo'
                            : 'Review your target audience summary'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">
                              {step3Data.targetEmployees.length}
                            </div>
                            <div className="text-sm text-gray-600">
                              {language === 'es' ? 'Empleados' : 'Employees'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">
                              {
                                new Set(
                                  step3Data.targetEmployees
                                    .map((e) => e.department)
                                    .filter(Boolean)
                                ).size
                              }
                            </div>
                            <div className="text-sm text-gray-600">
                              {language === 'es'
                                ? 'Departamentos'
                                : 'Departments'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">
                              {
                                new Set(
                                  step3Data.targetEmployees
                                    .map((e) => e.location)
                                    .filter(Boolean)
                                ).size
                              }
                            </div>
                            <div className="text-sm text-gray-600">
                              {language === 'es' ? 'Ubicaciones' : 'Locations'}
                            </div>
                          </div>
                        </div>

                        {/* Validation Summary */}
                        {step3Data.validationResult && (
                          <Alert>
                            <CheckCircle className="w-4 h-4" />
                            <AlertDescription>
                              <strong>
                                {language === 'es'
                                  ? 'Validación Completada:'
                                  : 'Validation Complete:'}
                              </strong>{' '}
                              {step3Data.validationResult.validCount ||
                                step3Data.targetEmployees.length}{' '}
                              {language === 'es'
                                ? 'registros válidos'
                                : 'valid records'}
                              {step3Data.validationResult.invalidCount > 0 && (
                                <>
                                  {', '}
                                  {step3Data.validationResult.invalidCount}{' '}
                                  {language === 'es'
                                    ? 'registros con errores fueron excluidos'
                                    : 'records with errors were excluded'}
                                </>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Employee List */}
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
                                csvUploadStage: 'upload',
                              });
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {language === 'es'
                              ? 'Empezar de Nuevo'
                              : 'Start Over'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setStep3Data({
                                ...step3Data,
                                csvUploadStage: 'validation',
                              });
                            }}
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {language === 'es'
                              ? 'Volver a Validación'
                              : 'Back to Validation'}
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
        const baseUrl =
          typeof window !== 'undefined' ? window.location.origin : '';
        const surveyUrl =
          step4Data.surveyUrl || `${baseUrl}/survey/${surveyId}`;

        // Calculate target count
        const targetCount =
          step3Data.uploadMethod === 'all'
            ? 0 // Will be fetched from company employees
            : step3Data.targetEmployees.length;

        // Calculate question count
        const questionCount =
          step2Data.questionIds.length + step2Data.customQuestions.length;

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
            <CardDescription>
              {wizard.steps[wizard.currentStep].description}
            </CardDescription>
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
                  <Button
                    onClick={handleNext}
                    disabled={autosave.status === 'saving'}
                  >
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

// Also export as default for better compatibility
export default MicroclimateWizard;
