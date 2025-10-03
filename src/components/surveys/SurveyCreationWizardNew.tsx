import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Building,
  MessageSquare,
  Users,
  Calendar,
  Save,
  Send,
  FileUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAutosave } from '@/hooks/useAutosave';
import CompanySelector from './CompanySelector';
import QuestionLibraryBrowser from './QuestionLibraryBrowser';
import SurveyScheduler from './SurveyScheduler';
import QRCodeGenerator from './QRCodeGenerator';
import DraftRecoveryBanner from './DraftRecoveryBanner';
import SessionExpiryWarning from './SessionExpiryWarning';
import CSVImport from './CSVImport';

/**
 * Survey Creation Wizard
 *
 * Multi-step wizard integrating all P0 features:
 * - Step 1: Basic Info + Company Selection (CLIMA-001)
 * - Step 2: Questions + Library Browser (CLIMA-002)
 * - Step 3: Targeting (preloaded data)
 * - Step 4: Scheduling + Distribution (CLIMA-004, CLIMA-005)
 *
 * Features autosave (CLIMA-006) and draft recovery
 */

interface SurveyFormData {
  // Step 1: Basic Info
  title: string;
  description: string;
  company_id: string;
  company_name?: string;

  // Step 2: Questions
  questions: any[];

  // Step 3: Targeting
  target_type: 'all' | 'departments' | 'users' | 'csv_import';
  department_ids: string[];
  target_user_ids: string[];
  target_emails?: string[]; // For CSV import email-based targeting

  // Step 4: Scheduling & Distribution
  start_date: string;
  end_date: string;
  timezone: string;
  distribution_type: 'anonymous' | 'per_user';
}

const STEPS = [
  {
    number: 1,
    title: 'Basic Info',
    icon: Building,
    description: 'Survey details and company',
  },
  {
    number: 2,
    title: 'Questions',
    icon: MessageSquare,
    description: 'Add survey questions',
  },
  {
    number: 3,
    title: 'Targeting',
    icon: Users,
    description: 'Select respondents',
  },
  {
    number: 4,
    title: 'Schedule & Share',
    icon: Calendar,
    description: 'When and how to distribute',
  },
];

export default function SurveyCreationWizard() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [formData, setFormData] = useState<SurveyFormData>({
    title: '',
    description: '',
    company_id: '',
    questions: [],
    target_type: 'all',
    department_ids: [],
    target_user_ids: [],
    start_date: '',
    end_date: '',
    timezone: 'UTC',
    distribution_type: 'anonymous',
  });

  const [preloadedDepartments, setPreloadedDepartments] = useState<any[]>([]);
  const [preloadedUsers, setPreloadedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionExpiresIn, setSessionExpiresIn] = useState(300); // 5 minutes
  const [draftId, setDraftId] = useState<string | null>(null);

  // Autosave hook - Updated to match new useAutosave interface
  const { status, forceSave, save, isSaving, lastSavedAt } = useAutosave(
    draftId,
    {
      debounceMs: 8000, // 8 seconds
      enabled: true,
      onSuccess: (data) => {
        console.log('Draft saved successfully', data);
      },
      onError: (error) => {
        console.error('Draft save error:', error);
      },
    }
  );

  // Handle draft restoration
  const handleRestoreDraft = (draftData: any) => {
    setFormData(draftData.surveyData || draftData);
    setCurrentStep(draftData.currentStep || 1);
    toast({
      title: 'Draft Restored',
      description: 'Your previous work has been restored.',
    });
  };

  const handleDiscardDraft = () => {
    toast({
      title: 'Draft Discarded',
      description: 'Starting with a clean slate.',
    });
  };

  // Update form data
  const updateFormData = (updates: Partial<SurveyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Validation for each step
  const validateStep = (step: number): { valid: boolean; message?: string } => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          return { valid: false, message: 'Survey title is required' };
        }
        if (!formData.company_id) {
          return { valid: false, message: 'Company selection is required' };
        }
        return { valid: true };

      case 2:
        if (formData.questions.length === 0) {
          return { valid: false, message: 'At least one question is required' };
        }
        return { valid: true };

      case 3:
        if (
          formData.target_type === 'departments' &&
          formData.department_ids.length === 0
        ) {
          return { valid: false, message: 'Select at least one department' };
        }
        if (
          formData.target_type === 'users' &&
          formData.target_user_ids.length === 0
        ) {
          return { valid: false, message: 'Select at least one user' };
        }
        return { valid: true };

      case 4:
        if (!formData.start_date) {
          return { valid: false, message: 'Start date is required' };
        }
        if (!formData.end_date) {
          return { valid: false, message: 'End date is required' };
        }
        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
          return { valid: false, message: 'End date must be after start date' };
        }
        return { valid: true };

      default:
        return { valid: true };
    }
  };

  // Navigate to next step
  const goToNextStep = () => {
    const validation = validateStep(currentStep);
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.message,
      });
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Handle company selection and preload data
  const handleCompanySelect = async (
    companyId: string,
    companyName: string
  ) => {
    updateFormData({ company_id: companyId, company_name: companyName });

    // Preload departments and users for Steps 3-4
    try {
      const [deptResponse, userResponse] = await Promise.all([
        fetch(`/api/companies/${companyId}/departments`),
        fetch(`/api/companies/${companyId}/users?limit=1000`),
      ]);

      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setPreloadedDepartments(deptData.departments || []);
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setPreloadedUsers(userData.users || []);
      }
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  };

  // Add question from library
  const handleAddQuestion = (question: any) => {
    const newQuestion = {
      id: `q_${Date.now()}_${Math.random()}`,
      library_question_id: question._id,
      text: question.question_text_en,
      text_es: question.question_text_es,
      type: question.question_type,
      config: question.config || {},
      required: true,
    };

    updateFormData({
      questions: [...formData.questions, newQuestion],
    });

    toast({
      title: 'Question Added',
      description: 'Question has been added to your survey.',
    });
  };

  // Submit survey
  const handleSubmit = async () => {
    const validation = validateStep(4);
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.message,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'draft',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Survey Created',
          description: 'Your survey has been created successfully.',
        });
        router.push(`/surveys/${data.survey._id}`);
      } else {
        throw new Error('Failed to create survey');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create survey. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Draft Recovery Banner */}
      <DraftRecoveryBanner
        sessionKey={sessionId}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />

      {/* Session Expiry Warning */}
      <SessionExpiryWarning
        isOpen={showSessionWarning}
        expiresInSeconds={sessionExpiresIn}
        onExtendSession={() => setShowSessionWarning(false)}
        onSaveAndClose={async () => {
          if (draftId) {
            forceSave({
              current_step: currentStep,
              step1_data: {
                title: formData.title,
                description: formData.description,
                company_id: formData.company_id,
                company_name: formData.company_name,
              },
              step2_data: { questions: formData.questions },
              step3_data: {
                target_type: formData.target_type,
                department_ids: formData.department_ids,
                target_user_ids: formData.target_user_ids,
                target_emails: formData.target_emails,
              },
              step4_data: {
                start_date: formData.start_date,
                end_date: formData.end_date,
                timezone: formData.timezone,
                distribution_type: formData.distribution_type,
              },
            });
          }
          router.push('/surveys');
        }}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create New Survey</h1>
        <p className="text-muted-foreground">
          Follow the steps below to create your organizational climate survey
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin">⏳</span> Saving...
              </span>
            ) : lastSavedAt ? (
              `Saved ${lastSavedAt.toLocaleTimeString()}`
            ) : (
              'Not saved'
            )}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Navigation */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <button
              key={step.number}
              onClick={() => {
                if (step.number < currentStep) {
                  setCurrentStep(step.number);
                }
              }}
              disabled={step.number > currentStep}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                isActive
                  ? 'border-primary bg-primary/5'
                  : isCompleted
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20 cursor-pointer hover:bg-green-100'
                    : 'border-muted bg-muted/20 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`p-1.5 rounded-full ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(STEPS[currentStep - 1].icon, {
              className: 'h-5 w-5',
            })}
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            {STEPS[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="required">
                  Survey Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Q4 2024 Employee Engagement Survey"
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this survey..."
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="required">Company</Label>
                <CompanySelector
                  value={formData.company_id}
                  onChange={(companyId, company) =>
                    handleCompanySelect(companyId, company.name)
                  }
                />
                {formData.company_name && (
                  <Badge variant="secondary" className="mt-2">
                    <Building className="h-3 w-3 mr-1" />
                    {formData.company_name}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Selected Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.questions.length} question
                    {formData.questions.length !== 1 ? 's' : ''} added
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFormData({ questions: [] })}
                >
                  Clear All
                </Button>
              </div>

              {formData.questions.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.questions.map((q, index) => (
                    <Card key={q.id}>
                      <CardContent className="p-4 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{index + 1}</Badge>
                            <Badge variant="secondary">{q.type}</Badge>
                          </div>
                          <p className="text-sm">{q.text}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            updateFormData({
                              questions: formData.questions.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Separator className="my-4" />

              <QuestionLibraryBrowser
                onAddQuestion={handleAddQuestion}
                selectedQuestionIds={formData.questions.map(
                  (q) => q.library_question_id
                )}
              />
            </div>
          )}

          {/* Step 3: Targeting */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">
                  Who should receive this survey?
                </h3>
                <div className="space-y-2">
                  <Button
                    variant={
                      formData.target_type === 'all' ? 'default' : 'outline'
                    }
                    className="w-full justify-start"
                    onClick={() =>
                      updateFormData({
                        target_type: 'all',
                        department_ids: [],
                        target_user_ids: [],
                      })
                    }
                  >
                    <Users className="h-4 w-4 mr-2" />
                    All Employees ({preloadedUsers.length})
                  </Button>

                  <Button
                    variant={
                      formData.target_type === 'departments'
                        ? 'default'
                        : 'outline'
                    }
                    className="w-full justify-start"
                    onClick={() =>
                      updateFormData({
                        target_type: 'departments',
                        target_user_ids: [],
                      })
                    }
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Specific Departments ({preloadedDepartments.length}{' '}
                    available)
                  </Button>

                  <Button
                    variant={
                      formData.target_type === 'users' ? 'default' : 'outline'
                    }
                    className="w-full justify-start"
                    onClick={() =>
                      updateFormData({
                        target_type: 'users',
                        department_ids: [],
                      })
                    }
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Specific Users
                  </Button>

                  <Button
                    variant={
                      formData.target_type === 'csv_import'
                        ? 'default'
                        : 'outline'
                    }
                    className="w-full justify-start"
                    onClick={() =>
                      updateFormData({
                        target_type: 'csv_import',
                        department_ids: [],
                      })
                    }
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    Import from CSV/Excel
                  </Button>
                </div>
              </div>

              {formData.target_type === 'departments' && (
                <div className="space-y-2">
                  <Label>Select Departments</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {preloadedDepartments.map((dept) => {
                      const isSelected = formData.department_ids.includes(
                        dept._id
                      );
                      return (
                        <Card
                          key={dept._id}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => {
                            updateFormData({
                              department_ids: isSelected
                                ? formData.department_ids.filter(
                                    (id) => id !== dept._id
                                  )
                                : [...formData.department_ids, dept._id],
                            });
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">
                                  {dept.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {dept.employee_count || 0} employees
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.target_type === 'users' && (
                <div className="space-y-2">
                  <Label>Select Users</Label>
                  <Input placeholder="Search users..." className="mb-2" />
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {preloadedUsers.slice(0, 50).map((user) => {
                      const isSelected = formData.target_user_ids.includes(
                        user._id
                      );
                      return (
                        <div
                          key={user._id}
                          className={`p-2 rounded border cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-muted'
                          }`}
                          onClick={() => {
                            updateFormData({
                              target_user_ids: isSelected
                                ? formData.target_user_ids.filter(
                                    (id) => id !== user._id
                                  )
                                : [...formData.target_user_ids, user._id],
                            });
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.target_type === 'csv_import' && (
                <CSVImport
                  onImportComplete={(users) => {
                    // Convert imported users to emails for targeting
                    const emails = users.map((user) => user.email);
                    updateFormData({
                      target_user_ids: [], // Clear manual selections
                      target_emails: emails, // Use email-based targeting
                    });

                    toast({
                      title: 'Import Complete',
                      description: `Successfully imported ${users.length} users`,
                    });
                  }}
                  existingUsers={preloadedUsers.map((u) => ({
                    email: u.email,
                    employee_id: u.employee_id,
                  }))}
                  requireEmail={true}
                />
              )}
            </div>
          )}

          {/* Step 4: Schedule & Distribution */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <SurveyScheduler
                startDate={
                  formData.start_date
                    ? new Date(formData.start_date)
                    : undefined
                }
                endDate={
                  formData.end_date ? new Date(formData.end_date) : undefined
                }
                timezone={formData.timezone}
                onChange={(data) =>
                  updateFormData({
                    start_date: data.startDate.toISOString(),
                    end_date: data.endDate.toISOString(),
                    timezone: data.timezone,
                  })
                }
              />

              <Separator />

              {formData.start_date && formData.end_date && (
                <QRCodeGenerator
                  surveyId="preview"
                  surveyTitle={formData.title}
                  tokenType={formData.distribution_type}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (draftId) {
                forceSave({
                  current_step: currentStep,
                  step1_data: {
                    title: formData.title,
                    description: formData.description,
                    company_id: formData.company_id,
                    company_name: formData.company_name,
                  },
                  step2_data: { questions: formData.questions },
                  step3_data: {
                    target_type: formData.target_type,
                    department_ids: formData.department_ids,
                    target_user_ids: formData.target_user_ids,
                    target_emails: formData.target_emails,
                  },
                  step4_data: {
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    timezone: formData.timezone,
                    distribution_type: formData.distribution_type,
                  },
                });
              }
            }}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={goToNextStep}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Survey'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
